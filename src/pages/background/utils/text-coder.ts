const textDecoder: Map<string, TextDecoder> = new Map();

const CHUNK = 4096;

export function textDecode(encoding: string, buffer: Uint8Array) {
  let encoder = textDecoder.get(encoding);
  if (!encoder) {
    try {
      encoder = new TextDecoder(encoding);
    } catch (e) {
      console.error(e);
      return undefined;
    }
    textDecoder.set(encoding, encoder);
  }
  // 防止解码失败导致整体错误
  try {
    return encoder.decode(buffer);
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

let textEncoder: TextEncoder;
export function textEncode(text: string) {
  if (!textEncoder) {
    textEncoder = new TextEncoder();
  }
  return textEncoder.encode(text);
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: false
const ASCII_RE = /^[\x00-\x7F]*$/;
export function safeBtoa(str: string) {
  // 快路径：绝大多数场景（token / id / JSON / URL）都是纯 ASCII，
  // 此时 str 的每个 charCode 就是 Latin-1 字节，可直接进 btoa，完全跳过编解码往返
  if (ASCII_RE.test(str)) return btoa(str);

  const bytes = textEncode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(
        i,
        Math.min(i + CHUNK, bytes.length),
      ) as unknown as number[],
    );
  }
  return btoa(binary);
}

// 只有“0x00-0x7F 与 Unicode 一一对应”的编码才能走快路径
// 注意：utf-16le/be、iso-2022-jp、shift_jis 等绝不能加进来
const ASCII_SAFE_ENCODINGS = new Set([
  'utf-8',
  'utf8',
  'unicode-1-1-utf-8',
  'ascii',
  'us-ascii',
  'latin1',
  'iso-8859-1',
  'windows-1252',
]);
const HAS_HIGH_BYTE = /[\x80-\xFF]/;
export function safeAtob(encoding: string, base64: string) {
  const binary = atob(base64);

  // 快路径：纯 ASCII 内容（JWT / 大部分 token 的场景）下 binary 串 === 解码结果
  if (
    !HAS_HIGH_BYTE.test(binary) &&
    ASCII_SAFE_ENCODINGS.has(encoding.trim().toLowerCase())
  ) {
    return binary;
  }

  // Uint8Array.from(fn) 的回调开销极大，手写循环填数组最快
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

  return textDecode(encoding, bytes);
}

export function uint8ArrayToBase64(bytes: Uint8Array) {
  const len = bytes.length;

  // 小数组：单块一次 apply，省掉累加开销
  if (len <= CHUNK) {
    const block = new Array<number>(len);
    for (let i = 0; i < len; i++) block[i] = bytes[i];
    return btoa(String.fromCharCode.apply(null, block));
  }

  // 大数组：分块，规避调用栈上限
  let binary = '';
  for (let i = 0; i < len; i += CHUNK) {
    const end = Math.min(i + CHUNK, len);
    const block = new Array<number>(end - i);
    for (let j = i; j < end; j++) block[j - i] = bytes[j];
    binary += String.fromCharCode.apply(null, block);
  }
  return btoa(binary);
}
