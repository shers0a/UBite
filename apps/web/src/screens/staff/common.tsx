/* Shared frame for the staff, dashboard and admin surfaces: role gate, header, sign-in. The staff
   and DCCAS copy stays neutral but plain (design system CONTENT FUNDAMENTALS), in both languages. */
import React from 'react';
import { useLocation } from 'wouter';
import type { Role } from '@ubite/shared';
import { Button, Chip, EmptyState, Wordmark } from '@ds';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app';
import { SignInSheet } from '../../components/Sheets';
import { Toaster } from '../../components/Chrome';
import '../../styles/staff.css';

export function useL() {
  const { lang } = useI18n();
  return React.useCallback((ro: string, en: string) => (lang === 'ro' ? ro : en), [lang]);
}

export function Gate({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { me, requireSignIn } = useApp();
  const L = useL();
  const [, navigate] = useLocation();
  const allowed = !!me && (me.role === 'tech_admin' || roles.includes(me.role));
  return (
    <>
      {allowed ? children : (
        <div className="ub-gate">
          <div style={{ marginBottom: 'var(--space-5)' }}><Wordmark size={28} /></div>
          <EmptyState icon="log-in"
            title={me ? L('Contul tău nu are acces aici', 'Your account has no access here') : L('Intră în cont', 'Sign in')}
            body={me ? L('Pagina e pentru contul cantinei, DCCAS sau echipa UBite. Dacă ar trebui să ai acces, scrie echipei.', 'This page is for the canteen account, DCCAS or the UBite team. If you should have access, write to the team.')
              : L('Folosește adresa contului creat pentru tine. Îți trimitem un cod de șase cifre.', 'Use the address of the account set up for you. We will send a six-digit code.')}
            action={me ? L('Înapoi la aplicație', 'Back to the app') : L('Intră în cont', 'Sign in')}
            onAction={() => (me ? navigate('/') : requireSignIn('staff'))} />
        </div>
      )}
      <SignInSheet />
      <Toaster />
    </>
  );
}

export function ThemeChip() {
  const { theme, setTheme } = useApp();
  const L = useL();
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return <Chip size="sm" selected={dark} onClick={() => setTheme(dark ? 'light' : 'dark')}>{L('Noapte', 'Night')}</Chip>;
}

export function LangChip() {
  const { lang, setLang } = useI18n();
  return <Chip size="sm" onClick={() => setLang(lang === 'ro' ? 'en' : 'ro')}>{lang === 'ro' ? 'EN' : 'RO'}</Chip>;
}

export function SignOutButton() {
  const { signOut } = useApp();
  const L = useL();
  const [, navigate] = useLocation();
  return <Button size="sm" variant="quiet" iconLeft="log-out" onClick={async () => { await signOut(); navigate('/'); }}>{L('Ieși', 'Sign out')}</Button>;
}
