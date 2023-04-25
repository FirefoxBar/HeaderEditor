import dayjs from 'dayjs';
import { prefs } from './prefs';

export interface LogItem {
  time: Date;
  message: string;
  data?: any[];
}

class Logger {
  debug(message: string, ...data: any[]) {
    if (!prefs.get('is-debug')) {
      return;
    }
    console.log(
      ['%cHeader Editor%c [', dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'), ']%c ', message].join(''),
      'color:#5584ff;',
      'color:#ff9300;',
      '',
    );
    if (data && data.length > 0) {
      console.log(data);
    }
  }
}

const logger = new Logger();
export default logger;
