/* Two small concurrency tools for the work a 2-vCPU VM can do only a little of at once: decoding
   photos and reading receipts. Both are in process, which is right for the one instance the pilot
   runs; a second instance would get its own. */
import { HttpError } from '../context';

/** At most `max` jobs at once. Up to `queue` more wait their turn, in order; past that the request
 *  is refused with 503 and a Retry-After, instead of piling decoded photos up in memory. */
export class JobLimiter {
  private running = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(readonly max: number, readonly queue: number) {}

  get active() { return this.running; }
  get queued() { return this.waiting.length; }

  async run<T>(job: () => Promise<T>): Promise<T> {
    if (this.running < this.max) this.running++;
    else if (this.waiting.length < this.queue) await new Promise<void>((resolve) => this.waiting.push(resolve));
    else throw new HttpError(503, 'busy', 'Too many photos at once. Try again in a few seconds.', { retryAfterSeconds: 5 });
    try {
      return await job();
    } finally {
      // The slot passes straight to the next in line, so a newcomer cannot jump the queue.
      const next = this.waiting.shift();
      if (next) next();
      else this.running--;
    }
  }
}

export interface Pool<T> {
  /** Runs `job` with a resource of its own, created on first need, up to the pool's size. */
  use<R>(job: (resource: T) => Promise<R>): Promise<R>;
  readonly created: number;
}

/** A pool that grows lazily to `size` resources (OCR workers) and reuses them. A resource that
 *  fails to be created frees its place, and whoever waits for one tries again. */
export function createPool<T>(size: number, create: () => Promise<T>): Pool<T> {
  const idle: T[] = [];
  const waiting: Array<() => void> = [];
  let made = 0;
  const wake = () => waiting.shift()?.();

  async function acquire(): Promise<T> {
    for (;;) {
      if (idle.length) return idle.pop()!;
      if (made < size) {
        made++;
        try {
          return await create();
        } catch (e) {
          made--;
          wake();
          throw e;
        }
      }
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
  }

  return {
    get created() { return made; },
    async use(job) {
      const resource = await acquire();
      try {
        return await job(resource);
      } finally {
        idle.push(resource);
        wake();
      }
    },
  };
}
