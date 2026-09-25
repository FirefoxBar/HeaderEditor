import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const ORIGINAL_FILE = path.join(ROOT, 'locale', 'original', 'messages.json');
const LOCALES_DIR = path.join(ROOT, 'public', '_locales');
const ZH_FILE = path.join(LOCALES_DIR, 'zh_CN', 'messages.json');
const EN_FILE = path.join(LOCALES_DIR, 'en', 'messages.json');
const OUT_DIR = path.join(ROOT, 'temp', 'locale');

// 除英语（en）和简体中文（zh_CN）外，其他语言都需要检查
const SKIP_LANGS = new Set(['en', 'zh_CN']);
const SKIP_KEYS = new Set([
  'extButtonTitle',
  'extName',
  'resourceType_websocket',
  'resourceType_xmlhttprequest',
  'run_mode_dnr',
  'run_mode_web_request',
]);

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

function getMessage(entry) {
  if (
    entry !== null &&
    typeof entry === 'object' &&
    typeof entry.message === 'string'
  ) {
    return entry.message;
  }
  return undefined;
}

// TSV 字段转义，保证每个 key 只占一行：转义反斜杠、制表符、换行
function escapeField(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function main() {
  const original = readJSON(ORIGINAL_FILE);
  const zhMap = fs.existsSync(ZH_FILE) ? readJSON(ZH_FILE) : {};
  // 英文文案以原始语言文件为准，public/_locales/en 仅作回退
  let enMap = original;
  if (fs.existsSync(EN_FILE)) {
    try {
      enMap = readJSON(EN_FILE);
    } catch {
      enMap = original;
    }
  }

  const originalKeys = Object.keys(original);
  const originalMessages = new Map();
  for (const key of originalKeys) {
    originalMessages.set(key, getMessage(original[key]));
  }

  const entries = fs.readdirSync(LOCALES_DIR, { withFileTypes: true });
  const langs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => !name.startsWith('.') && !SKIP_LANGS.has(name))
    .filter(name =>
      fs.existsSync(path.join(LOCALES_DIR, name, 'messages.json')),
    )
    .sort();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalLangs = 0;
  for (const lang of langs) {
    const localeFile = path.join(LOCALES_DIR, lang, 'messages.json');
    const current = readJSON(localeFile);

    // 未翻译判断：
    // 1. 原始语言 key 存在但翻译文件中 key 不存在
    // 2. 原始语言的 message 与翻译文件的 message 完全相同
    const untranslated = [];
    const translated = [];
    for (const key of originalKeys) {
      const originMessage = originalMessages.get(key);
      if (typeof originMessage !== 'string') {
        continue;
      }
      if (SKIP_KEYS.has(key) || key.startsWith('url_')) {
        continue;
      }
      if (!(key in current)) {
        untranslated.push({ key, reason: 'missing' });
      } else if (getMessage(current[key]) === originMessage) {
        untranslated.push({ key, reason: 'same' });
      } else if (getMessage(current[key]) === undefined) {
        // 翻译条目存在但没有合法的 message 字段，同样视为未翻译
        untranslated.push({ key, reason: 'missing' });
      } else {
        translated.push(key);
      }
    }
    translated.sort();
    untranslated.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

    const lines = [];
    if (translated.length > 0) {
      lines.push('已翻译文案');
      for (const key of translated) {
        lines.push(
          `key:${escapeField(key)}\t英文:${escapeField(getMessage(enMap[key]))}\t中文:${escapeField(getMessage(zhMap[key]))}\t译文:${escapeField(getMessage(current[key]))}`,
        );
      }
      lines.push('');
    }
    if (untranslated.length > 0) {
      lines.push('待翻译文案');
      for (const { key } of untranslated) {
        const en = getMessage(enMap[key]) ?? getMessage(original[key]) ?? '';
        const zh = getMessage(zhMap[key]) ?? '';
        lines.push(
          `key:${escapeField(key)}\t英文:${escapeField(en)}\t中文:${escapeField(zh)}`,
        );
      }
    }

    const outFile = path.join(OUT_DIR, `${lang}.txt`);
    if (lines.length > 0) {
      fs.writeFileSync(outFile, `${lines.join('\n')}\n`, {
        encoding: 'utf8',
      });
    }
    totalLangs += 1;
    console.log(
      `[${lang}] untranslated=${untranslated.length} -> ${path.relative(ROOT, outFile)}`,
    );
  }

  // output new
  fs.writeFileSync(
    path.join(OUT_DIR, '_new.txt'),
    Object.keys(original)
      .filter(x => !SKIP_KEYS.has(x) && !x.startsWith('url_'))
      .map(
        key =>
          `key:${escapeField(key)}\t英文:${escapeField(getMessage(enMap[key]))}\t中文:${escapeField(getMessage(zhMap[key]))}`,
      )
      .join('\n'),
    {
      encoding: 'utf8',
    },
  );

  console.log(
    `done: langs=${totalLangs}, outDir=${path.relative(ROOT, OUT_DIR)}`,
  );
}

main();
