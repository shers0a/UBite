import type { NextFunction, Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
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

/* Who a limit counts. UB students share very few public addresses (eduroam, the faculties' NAT),
   so an IP is a whole lecture hall: wherever a session exists the limit is the account's own, and
   only anonymous requests are counted by IP (an IPv6 /56, ipKeyGenerator). */
const byIp = (req: Request) => `ip:${ipKeyGenerator(req.ip ?? '')}`;
export const accountOrIp = (req: Request) => (req.user ? `user:${req.user.id}` : byIp(req));
/** Sign-in has no session yet: one address from one IP, so a student retrying never uses up
 *  the attempts of the others behind the same NAT. The database caps each address on its own. */
export const addressOnIp = (req: Request) =>
  `${byIp(req)}|${String((req.body as { email?: unknown } | undefined)?.email ?? '').trim().toLowerCase().slice(0, 200)}`;

const limiter = (windowMs: number, limit: number, keyGenerator: (req: Request) => string) =>
  rateLimit({ windowMs, limit, keyGenerator, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'rate_limited' } });

/** Rate limits on authentication, wait reports and receipt uploads (docs/04 Security). */
export const limits = {
  authAddress: limiter(15 * 60_000, 20, addressOnIp),
  /** A NAT full of students signing in at lunch fits; one machine trying address after address does not. */
  authIp: limiter(15 * 60_000, 200, byIp),
  report: limiter(60 * 60_000, 6, accountOrIp),
  feedback: limiter(60 * 60_000, 10, accountOrIp),
  pushTest: limiter(60 * 60_000, 10, accountOrIp),
  /** Photographing a receipt: each scan decodes a photo and runs OCR (ctx.images). */
  scan: limiter(60 * 60_000, 20, accountOrIp),
  /** Confirming a draft, or typing a receipt. */
  confirm: limiter(60 * 60_000, 30, accountOrIp),
  staffPhoto: limiter(60 * 60_000, 60, accountOrIp),
  /** Anonymous by design (a beacon without a cookie): per IP. */
  analytics: limiter(60_000, 120, byIp),
  redeem: limiter(60_000, 30, accountOrIp),
};

export function langOf(req: Request): 'ro' | 'en' {
  if (req.user?.locale) return req.user.locale;
  const h = String(req.headers['accept-language'] || '');
  return /^en/i.test(h) ? 'en' : 'ro';
}
