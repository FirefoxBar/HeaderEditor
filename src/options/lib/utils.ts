import emitter from 'share/core/emitter';

emitter.on(emitter.INNER_GROUP_CANCEL, () => emitter.removeAllListeners(emitter.INNER_GROUP_SELECTED));

export function selectGroup(selected?: string): Promise<string> {
  return new Promise(resolve => {
    emitter.emit(emitter.ACTION_SELECT_GROUP, selected);
    emitter.once(emitter.INNER_GROUP_SELECTED, resolve);
  });
}
