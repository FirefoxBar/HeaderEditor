// 将 temp/new-locale 下的语言文件（除 all-in-one.json 外）通过 Transifex REST API 上传为译文。
//
// 流程（使用 Transifex REST API v3 的 Resource Translations 接口）：
//   1. GET /resource_translations?filter[resource]=...&filter[language]=...&include=resource_string
//      拉取该资源在目标语言下的全部译文条目，建立 key -> string_hash 的映射
//   2. 对每条本地译文，PATCH /resource_translations/{resource_translation_id}
//      写入 strings（内容有变化或远端未翻译时才更新，避免无意义请求）
//
// 用法：
//   node scripts/locale/upload-to-transifex.mjs                 # 同步全部语言
//   node scripts/locale/upload-to-transifex.mjs --lang ja,ko    # 只同步指定语言
//   node scripts/locale/upload-to-transifex.mjs --dry-run       # 只打印将要上传的内容，不实际请求
//
// 需要的环境变量：
//   TRANSIFEX_TOKEN  Transifex API v3 的 Token（在 User Settings -> API token 生成，
//                    需要对资源的读写权限）
//
// ⚠️ 使用前请先填写下方 CONFIG 区域留空的信息（项目/组织、资源 slug、语言代码映射等）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'temp', 'new-locale');

// ============================================================================
// CONFIG：以下信息需要按实际情况填写
// ============================================================================

// Transifex REST API（新版）地址，一般无需修改
const API_BASE = 'https://rest.api.transifex.com';

// 组织 slug 与项目 slug（可在 Transifex 项目页面 URL 中看到）
// 例如项目地址为 https://app.transifex.com/acme/he-dashboard 则填 'acme' 和 'he-dashboard'
const ORG_SLUG = 'sytec'; // 填写组织 slug
const PROJECT_SLUG = 'header-editor'; // 填写项目 slug

// 完整的项目 ID，格式为 o:{org}:p:{project}，一般无需修改
const PROJECT_ID = `o:${ORG_SLUG}:p:${PROJECT_SLUG}`;

// 语言代码映射：本地文件名（去掉 .json）-> Transifex 语言代码。
// Transifex 的语言代码形如 zh_Hans、zh_Hant、pt_BR、ru 等，与本地目录名不一定一致。
// 未在映射中出现的语言会直接使用本地文件名作为 Transifex 语言代码。
const LANG_CODE_MAP = {
  // 'zh_CN': 'zh_Hans',
  // 'zh_TW': 'zh_Hant',
  // 'ru_RU': 'ru',
  // 'pt_BR': 'pt_BR',
};

// Transifex 项目中唯一的资源（resource）slug。
// 所有语言文件都是这同一个 resource 的不同语言译文，仅靠语言 ID 区分。
// 可在资源页面 URL 中看到，例如 https://app.transifex.com/acme/he-dashboard/... 中的资源标识。
const RESOURCE_SLUG = '90db07b707e6d9bb1f2f4211b478f3bf'; // 填写资源 slug

// 每次请求之间的间隔（毫秒），避免触发限流（官方限制 500 次/分钟）
const REQUEST_INTERVAL_MS = 300;

// 不同步的文件（小写比较）
const SKIP_FILES = new Set(['all-in-one.json']);

// ============================================================================
// 以下为实现，一般无需修改
// ============================================================================

const TOKEN = process.env.TRANSIFEX_TOKEN;

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toLangId(localLang) {
  return `l:${LANG_CODE_MAP[localLang] ?? localLang}`;
}

function toResourceId() {
  return `${PROJECT_ID}:r:${RESOURCE_SLUG}`;
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.api+json',
      ...(options.body ? { 'Content-Type': 'application/vnd.api+json' } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const detail =
      json?.errors?.map(
        e => `${e.status}: ${e.title ?? ''} ${e.detail ?? ''}`,
      ) ?? text;
    throw new Error(`HTTP ${res.status} ${url}\n${detail}`);
  }
  return json;
}

// 校验项目下的唯一资源是否存在
async function checkResource() {
  try {
    await request(`${API_BASE}/resources/${toResourceId()}`);
    return true;
  } catch {
    return false;
  }
}

// 拉取某语言下该资源的全部译文条目，返回 { key -> { translationId, strings } }
// 翻页依赖响应中的 links.next（每页 150 条）
async function fetchTranslations(localLang) {
  const url = new URL(`${API_BASE}/resource_translations`);
  url.searchParams.append('filter[resource]', toResourceId());
  url.searchParams.append('filter[language]', toLangId(localLang));
  url.searchParams.append('include', 'resource_string');

  const byKey = new Map();
  let next = url.toString();
  while (next) {
    const json = await request(next);
    // resource_string 的 key 通过 include 返回
    const stringKeyById = new Map();
    for (const item of json.included ?? []) {
      stringKeyById.set(item.id, item.attributes?.key);
    }
    for (const item of json.data ?? []) {
      const stringId = item.relationships?.resource_string?.data?.id;
      const key = stringKeyById.get(stringId);
      if (key === undefined) {
        continue;
      }
      byKey.set(key, {
        translationId: item.id,
        strings: item.attributes?.strings ?? null,
      });
    }
    next = json.links?.next ?? null;
    if (next && !next.startsWith('http')) {
      next = `${API_BASE}${next}`;
    }
  }
  return byKey;
}

// 本地语言文件 -> { key -> 译文字符串 }
function parseMessages(messages) {
  const map = new Map();
  for (const [key, value] of Object.entries(messages)) {
    const message =
      value !== null && typeof value === 'object' ? value.message : value;
    if (typeof message !== 'string') {
      continue;
    }
    map.set(key, message);
  }
  return map;
}

// 更新单条译文：PATCH /resource_translations/{id}
async function patchTranslation(translationId, text) {
  const payload = {
    data: {
      type: 'resource_translations',
      id: translationId,
      attributes: {
        reviewed: true,
        // 非复数字符串使用默认复数规则 'other'
        strings: { other: text },
      },
    },
  };
  await request(`${API_BASE}/resource_translations/${translationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

async function syncLang(localLang, dryRun) {
  const file = path.join(SOURCE_DIR, `${localLang}.json`);
  const local = parseMessages(readJSON(file));

  const remote = await fetchTranslations(localLang);
  if (remote.size === 0) {
    console.warn(
      `[${localLang}] 警告: 该语言在 Transifex 上没有任何译文条目，请确认语言代码与资源 slug 是否正确`,
    );
  }

  let updated = 0;
  let missing = 0;
  let unchanged = 0;
  for (const [key, text] of local) {
    const entry = remote.get(key);
    if (!entry) {
      // Transifex 上不存在该 key（资源里没有这个字符串），跳过
      console.warn(`[${localLang}] 跳过（资源中不存在该 key）: ${key}`);
      missing += 1;
      continue;
    }
    const current = entry.strings?.other;
    if (current === text) {
      unchanged += 1;
      continue;
    }
    if (dryRun) {
      console.log(
        `[dry-run] patch translation ${key}: ${JSON.stringify(text)} - ${entry.translationId}`,
      );
    } else {
      await patchTranslation(entry.translationId, text);
    }
    updated += 1;
    await sleep(REQUEST_INTERVAL_MS);
  }

  console.log(
    `[${localLang}] done: total=${local.size}, updated=${updated}, unchanged=${unchanged}, missing=${missing}`,
  );
  return { total: local.size, updated, missing };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const langArgIndex = argv.findIndex(x => x === '--lang');
  const onlyLangs =
    langArgIndex >= 0 && argv[langArgIndex + 1]
      ? new Set(argv[langArgIndex + 1].split(','))
      : null;

  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`目录不存在: ${path.relative(ROOT, SOURCE_DIR)}`);
  }
  if (!TOKEN) {
    throw new Error(
      '缺少环境变量 TRANSIFEX_TOKEN，请先在 Transifex 生成 API Token 并设置到环境变量中',
    );
  }
  if (!ORG_SLUG || !PROJECT_SLUG) {
    throw new Error('请先在脚本顶部 CONFIG 区域填写 ORG_SLUG 与 PROJECT_SLUG');
  }
  if (!RESOURCE_SLUG) {
    throw new Error('请先在脚本顶部 CONFIG 区域填写 RESOURCE_SLUG');
  }

  const langs = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(name => name.endsWith('.json'))
    .filter(name => !SKIP_FILES.has(name.toLowerCase()))
    .map(name => name.slice(0, -'.json'.length))
    .filter(lang => !onlyLangs || onlyLangs.has(lang))
    .sort();

  if (langs.length === 0) {
    console.log('没有可同步的语言文件');
    return;
  }

  const exists = await checkResource();
  if (!exists) {
    console.warn(
      `警告: Transifex 项目中找不到资源 "${RESOURCE_SLUG}"，同步可能失败`,
    );
  }

  let totalUpdated = 0;
  let totalMissing = 0;
  for (const lang of langs) {
    const { updated, missing } = await syncLang(lang, dryRun);
    totalUpdated += updated ?? 0;
    totalMissing += missing ?? 0;
    await sleep(REQUEST_INTERVAL_MS);
  }

  console.log(
    `done: langs=${langs.length}, updated=${totalUpdated}, missing=${totalMissing}, srcDir=${path.relative(ROOT, SOURCE_DIR)}`,
  );
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
