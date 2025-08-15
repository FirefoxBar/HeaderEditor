import { TextDecoder } from 'text-encoding';
import { getGlobal } from '@/share/core/utils';

const textDecoder: Map<string, TextDecoder> = new Map();

export function textDecode(encoding: string, buffer: Uint8Array) {
  let encoder = textDecoder.get(encoding);
  if (!encoder) {
    // 如果原生支持的话，优先使用原生
    if (getGlobal().TextDecoder) {
      try {
        encoder = new (getGlobal().TextDecoder)(encoding);
      } catch (e) {
        encoder = new TextDecoder(encoding);
      }
    } else {
      encoder = new TextDecoder(encoding);
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
