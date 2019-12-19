import emit from 'share/core/emit';

export function selectGroup(selected?: string): Promise<string> {
  return new Promise(resolve => {
    emit.emit(emit.ACTION_SELECT_GROUP, selected);
    emit.once(emit.INNER_GROUP_SELECTED, resolve);
  });
}
