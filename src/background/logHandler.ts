import dayjs from 'dayjs';
import clone from 'lodash.clonedeep';
import emitter from 'share/core/emitter';
import logger, { LogItem } from 'share/core/logger';
import { prefs } from 'share/core/storage';

function handleMessage(it: LogItem) {
  console.log(
    ['%cHeader Editor%c [', dayjs(it.time).format('YYYY-MM-DD HH:mm:SS'), ']%c', it.message].join(''),
    'color:#5584ff;',
    'color:#ff9300;',
  );
  if (it.data) {
    console.log(clone(it.data));
  }
}

export default function createLogHandler() {
  prefs.ready(() => {
    if (prefs.get('is-debug')) {
      logger.on(handleMessage);
      handleMessage({
        time: new Date(),
        message: 'Enable debug',
      });
    }
    emitter.on(emitter.EVENT_PREFS_UPDATE, (key: string, val: any) => {
      if (key === 'is-debug') {
        if (val) {
          logger.on(handleMessage);
          handleMessage({
            time: new Date(),
            message: 'Enable debug',
          });
        } else {
          logger.off(handleMessage);
          handleMessage({
            time: new Date(),
            message: 'Disable debug',
          });
        }
      }
    });
  });
}
