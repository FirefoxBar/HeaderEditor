export class Timer<T> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private gap: number;
  private cb: (data: Array<T>) => void;
  private data: Array<T> = [];

  constructor(gap: number = 10000, cb: (data: Array<T>) => void) {
    this.gap = gap;
    this.cb = cb;
  }

  private startQueue() {
    this.timer = setTimeout(() => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = null;
      this.cb(this.data);
      if (this.data.length > 0) {
        this.startQueue();
      }
    }, this.gap);
  }

  public push(task: T) {
    this.data.push(task);
    if (this.timer !== null) {
      return;
    }
    this.startQueue();
  }
}
