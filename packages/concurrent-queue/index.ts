export type AsyncFunction<T, Args extends any[]> = (...args: Args) => Promise<T>;
export type Options = {
  concurrency?: number;
  timeout?: number;
}

function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject('Timeout'), ms);
  });
}

const DEFAULT_CONCURRENCY = 10;
const DEFAULT_TIMEOUT = 3000;

class ConcurrentQueue {
  private concurrency: number = DEFAULT_CONCURRENCY;
  private timeout: number = DEFAULT_TIMEOUT;
  private runningQueue: number = 0;
  private queue: [
    AsyncFunction<any, any>, 
    (value: any | PromiseLike<any>) => void,
    (reason?: any) => void,
    ...args: any[]
  ][] = [];

  config({concurrency = DEFAULT_CONCURRENCY, timeout = DEFAULT_TIMEOUT}: Options) {
    this.concurrency = concurrency;
    this.timeout = timeout;
  }

  add<T, Args extends any[]>(func: AsyncFunction<T, Args>,...args: Args) {
    return new Promise<T>((resolve, reject) => {
      this.queue.push([func, resolve, reject,...args]);
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0) {
      return;
    }
    // 获取当前正在运行中的任务数量，保证永远只运行 concurrency 个任务
    while (this.runningQueue < this.concurrency && this.queue.length > 0) {
      const [func, resolve, reject,...args] = this.queue.shift()!;
      this.runningQueue++;
      Promise.race([
        func(...args).then(resolve, reject),
        timeout(this.timeout),
      ]).catch(reject).finally(() => {
        this.runningQueue--;
        this.processQueue();
      });
    }
  }
}

const queue = new ConcurrentQueue();
export default queue;
