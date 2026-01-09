import { get } from 'lodash-es';
import { getValidTaskRun } from '../core/task';

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

export function parseJSONPath(text: string) {
  if (!text.includes('{$TASK.')) {
    return text;
  }

  // 形似 {$TASK.task_key.PATH}
  const matches = text.match(/\{\$TASK\.([^}]+)\}/g);
  if (!matches) {
    return text;
  }

  let result = text;

  matches.forEach(match => {
    const path = match.substring(7, match.length - 1);
    const key = path.substring(0, path.indexOf('.'));
    const restPath = path.substring(path.indexOf('.') + 1);

    const run = getValidTaskRun(key);
    if (run?.status !== 'done') {
      result = result.replaceAll(match, '');
      return;
    }

    if (typeof run.result === 'string') {
      result = result.replaceAll(match, run.result);
    } else {
      const value = get(run.result, restPath);
      result = result.replaceAll(
        match,
        typeof value === 'undefined' || value === null ? '' : value,
      );
    }
  });

  return result;
}
