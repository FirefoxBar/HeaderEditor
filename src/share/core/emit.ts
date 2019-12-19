import EventEmitter from 'eventemitter3';

class Emit extends EventEmitter {
  EVENT_GROUP_UPDATE = 'a1';
  ACTION_SELECT_GROUP = 'a2';
  INNER_GROUP_SELECTED = 'a3';

  EVENT_RULE_UPDATE = 'b1';
}
const emit = new Emit();

export default emit;
