import type { Logger } from 'pino';
import type { Config } from './config';
import type { Db } from './db/index';
import type { Mailer } from './services/mail';
import type { JobLimiter } from './services/pool';
import type { Pusher } from './services/push';
import type { ReceiptReader } from './services/receipt';

/** Everything a route or a job needs, passed explicitly so tests can swap any part of it. */
export interface Ctx {
  db: Db;
  cfg: Config;
  log: Logger;
  mail: Mailer;
  push: Pusher;
  receipts: ReceiptReader;
  /** Photo decoding and OCR: at most two at once, a short queue, then 503 (services/pool.ts). */
  images: JobLimiter;
  /** The clock, injectable so tests can stand at 12:40 on a Tuesday. */
  now: () => Date;
  /** Work that may finish after the response: serverless hosts keep the instance alive for it. */
  defer: (work: Promise<unknown>) => void;
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string, public extra?: Record<string, unknown>) {
    super(message || code);
  }
}
