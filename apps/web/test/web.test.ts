import { describe, expect, it } from 'vitest';
import type { CrowdingCurrent, StatusResponse } from '@ubite/shared';
import { DEFAULT_SCHEDULE } from '@ubite/shared';
import { en, ro } from '../src/i18n/strings';
import { minutesText, translate } from '../src/i18n';
import { crowdingView } from '../src/screens/student/crowding';

const status = (open: boolean, nextOpening: string | null = null): StatusResponse => ({
  serverTime: '2026-10-13T09:40:00Z', today: '2026-10-13', open, todayHours: { opensAt: '11:30', closesAt: '17:00' }, nextOpening,
  schedule: DEFAULT_SCHEDULE, exceptions: [], announcements: [], features: { camera: false, loyalty: true, waste: false, prediction: true },
  vapidPublicKey: null, publicUrl: 'https://ubite.unibuc.ro', privacy: { controller: null, contactEmail: null, dpoEmail: null, approved: false },
});

describe('copy', () => {
  it('has every Romanian string in English too, and no exclamation marks', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ro).sort());
    for (const s of [...Object.values(ro), ...Object.values(en)]) expect(s).not.toMatch(/!/);
  });
  it('fills variables', () => {
    expect(translate('ro', 'visit.recorded', { filled: 4 })).toBe('Vizită adăugată · 4 din 5');
  });
  it('counts minutes the Romanian way', () => {
    expect(minutesText(1, 'ro')).toBe('un minut');
    expect(minutesText(6, 'ro')).toBe('6 minute');
    expect(minutesText(20, 'ro')).toBe('20 de minute');
    expect(minutesText(1, 'en')).toBe('a minute');
  });
});

describe('the crowding hero', () => {
  const now = Date.parse('2026-10-13T09:40:30Z');
  const live: CrowdingCurrent = {
    serverTime: '2026-10-13T09:40:00Z', open: true, level: 'moderate', waitMinutes: 6, quality: 'live',
    computedAt: '2026-10-13T09:39:50Z', thresholds: { low: 3, high: 8 },
  };

  it('shows the level, minutes and the age including time since the fetch', () => {
    const v = crowdingView(live, now - 30_000, status(true), 'ro', now);
    expect(v).toMatchObject({ level: 'moderate', waitMinutes: 6, quality: 'live', noEstimate: false });
    expect(v.updatedSecondsAgo).toBe(40);
  });

  it('replaces the level with the next opening when closed — never a stale number', () => {
    const v = crowdingView({ ...live, open: false, level: null, waitMinutes: null, computedAt: null }, now, status(false, '2026-10-14T08:30:00Z'), 'ro', now);
    expect(v.level).toBe('closed');
    expect(v.opensAtLabel).toMatch(/la 11:30$/);
  });

  it('says there is no estimate instead of inventing one', () => {
    const v = crowdingView({ ...live, level: null, waitMinutes: null, computedAt: null, quality: null }, now, status(true), 'ro', now);
    expect(v.noEstimate).toBe(true);
  });
});
