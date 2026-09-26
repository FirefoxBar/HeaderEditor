const textDecoder: Map<string, TextDecoder> = new Map();

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

export function safeBtoa(str: string) {
  const bytes = textEncode(str);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binary);
}

export function safeAtob(encoding: string, base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return textDecode(encoding, bytes);
}

export function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
