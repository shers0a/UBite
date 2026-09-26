import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { Role } from '@ubite/shared';
import { HttpError } from './context';
import type { SessionUser } from './services/auth';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser | null;
      sessionToken?: string | null;
    }
  }
}

export const SESSION_COOKIE = 'ubite_session';

/** Role checks are enforced here, on every endpoint, never inferred from the client (docs/10).
 *  tech_admin can do everything. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'sign_in_required'));
    if (req.user.role !== 'tech_admin' && !roles.includes(req.user.role)) return next(new HttpError(403, 'forbidden'));
    next();
  };
}

export function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const r = schema.safeParse(value);
  if (!r.success) {
    throw new HttpError(422, 'invalid_request', r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
  }
  return r.data;
}

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const uuid = z.string().uuid();

/** Rate limits on authentication, wait reports and receipt uploads (docs/04 Security). */
export const limits = {
  auth: rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'rate_limited' } }),
  report: rateLimit({ windowMs: 60 * 60_000, limit: 6, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'rate_limited' } }),
  upload: rateLimit({ windowMs: 60 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'rate_limited' } }),
  feedback: rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'rate_limited' } }),
  analytics: rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'rate_limited' } }),
  redeem: rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'rate_limited' } }),
};

export function langOf(req: Request): 'ro' | 'en' {
  if (req.user?.locale) return req.user.locale;
  const h = String(req.headers['accept-language'] || '');
  return /^en/i.test(h) ? 'en' : 'ro';
}
