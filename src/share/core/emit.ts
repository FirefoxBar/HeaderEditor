import EventEmitter from 'eventemitter3';

class Emit extends EventEmitter {
  EVENT_GROUP_UPDATE = 'EVENT_GROUP_UPDATE';
  ACTION_SELECT_GROUP = 'ACTION_SELECT_GROUP';
  INNER_GROUP_SELECTED = 'INNER_GROUP_SELECTED';
}
const emit = new Emit();

export default emit;
