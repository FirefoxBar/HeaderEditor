import dayjs from 'dayjs';
import emitter from '@/share/core/emitter';

export function getExportName(additional?: string) {
  const date = dayjs().format('YYYYMMDD_HHmmss');
  return `HE_${date}${additional ? '_' + additional : ''}.json`;
}

emitter.on(emitter.INNER_GROUP_CANCEL, () => emitter.removeAllListeners(emitter.INNER_GROUP_SELECTED));
export function selectGroup(selected?: string): Promise<string> {
  return new Promise(resolve => {
    emitter.emit(emitter.ACTION_SELECT_GROUP, selected);
    emitter.once(emitter.INNER_GROUP_SELECTED, resolve);
  });
}
