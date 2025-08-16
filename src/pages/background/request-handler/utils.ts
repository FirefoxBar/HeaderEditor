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
