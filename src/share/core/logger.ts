import emitter from './emitter';

export interface LogItem {
  time: Date;
  message: string;
  data?: any[];
}

class Logger {
  d(message: string, ...data: any[]) {
    const d: LogItem = {
      time: new Date(),
      message,
      data,
    };
    emitter.emit(emitter.INNER_LOG, d);
  }

  on(handler: (it: LogItem) => void) {
    emitter.on(emitter.INNER_LOG, handler);
  }

  off(handler: (it: LogItem) => void) {
    emitter.off(emitter.INNER_LOG, handler);
  }
}

const logger = new Logger();
export default logger;
