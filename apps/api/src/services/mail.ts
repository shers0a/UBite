/* Transactional email: sign-in codes and operational alerts. Any SMTP provider works through
   SMTP_URL (docs/10: test delivery to @s.unibuc.ro early — institutional servers are strict). */
import nodemailer from 'nodemailer';
import type { Logger } from 'pino';
import type { Config } from '../config';

export interface Mailer {
  readonly enabled: boolean;
  send(to: string, subject: string, text: string): Promise<void>;
}

export function createMailer(cfg: Config, log: Logger): Mailer {
  if (cfg.SMTP_URL) {
    const transport = nodemailer.createTransport(cfg.SMTP_URL);
    return {
      enabled: true,
      async send(to, subject, text) {
        await transport.sendMail({ from: cfg.MAIL_FROM, to, subject, text });
      },
    };
  }
  return {
    // Without SMTP, development can still sign in: the code goes to the log, nowhere else. A demo
    // deployment shows it on screen instead (DEMO_SHOW_CODES).
    enabled: cfg.DEV_LOG_CODES || cfg.DEMO_SHOW_CODES,
    async send(to, subject, text) {
      if (cfg.DEV_LOG_CODES) log.info({ to, subject }, `[dev mail] ${text.split('\n')[0]}`);
      else log.warn({ subject }, 'mail not sent: SMTP_URL is not configured');
    },
  };
}

export function codeEmail(code: string, lang: 'ro' | 'en') {
  return lang === 'en'
    ? {
        subject: `${code} is your UBite code`,
        text: `${code}\n\nThis is your UBite sign-in code. It expires in ten minutes and works once.\nIf you did not ask for it, ignore this email.`,
      }
    : {
        subject: `${code} e codul tău UBite`,
        text: `${code}\n\nAcesta e codul tău de intrare în UBite. Expiră în zece minute și merge o singură dată.\nDacă nu l-ai cerut tu, ignoră mesajul.`,
      };
}
