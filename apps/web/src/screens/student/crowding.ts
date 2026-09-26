/* From the API's estimate and status to the CrowdingIndicator's props: level word, minutes, age,
   quality, and — when closed — the next opening instead of a stale number. */
import type { CrowdingCurrent, StatusResponse } from '@ubite/shared';
import { addDays, hoursSummary, localDate, weekdayOf } from '@ubite/shared';
import { formatTime, translate, weekdayName } from '../../i18n';

export interface CrowdingView {
  level: 'low' | 'moderate' | 'high' | 'closed';
  waitMinutes: number;
  quality: 'live' | 'degraded' | 'estimated';
  updatedSecondsAgo: number;
  opensAtLabel: string;
  hoursLabel: string;
  /** Open, but no source has produced a number yet. */
  noEstimate: boolean;
}

export function nextOpeningLabel(status: StatusResponse | null, lang: 'ro' | 'en'): string {
  if (!status?.nextOpening) return translate(lang, 'closed.unknown');
  const at = new Date(status.nextOpening);
  const day = localDate(at);
  const today = localDate();
  const time = formatTime(at, lang);
  if (day === today) return translate(lang, 'closed.today', { time });
  if (day === addDays(today, 1)) return translate(lang, 'closed.tomorrow', { time });
  return translate(lang, 'closed.weekday', { day: weekdayName(weekdayOf(day), lang), time });
}

export function crowdingView(c: CrowdingCurrent | null, fetchedAt: number | null, status: StatusResponse | null, lang: 'ro' | 'en', now = Date.now()): CrowdingView {
  const hoursLabel = status ? hoursSummary(status.schedule, lang) : lang === 'ro' ? 'L–V 11:30–17:00' : 'Mon–Fri 11:30–17:00';
  const opensAtLabel = nextOpeningLabel(status, lang);
  const base = { hoursLabel, opensAtLabel, waitMinutes: 0, quality: 'live' as const, updatedSecondsAgo: 0 };
  if (!c) return { ...base, level: status && !status.open ? 'closed' : 'moderate', noEstimate: !(status && !status.open) };
  if (!c.open) return { ...base, level: 'closed', noEstimate: false };
  if (!c.level || c.waitMinutes === null || !c.computedAt) return { ...base, level: 'moderate', noEstimate: true };
  // Age = time since the server computed it, plus time since we fetched it — correct offline too.
  const serverAge = new Date(c.serverTime).getTime() - new Date(c.computedAt).getTime();
  const localAge = fetchedAt ? now - fetchedAt : 0;
  return {
    ...base,
    level: c.level,
    waitMinutes: c.waitMinutes,
    quality: c.quality || 'degraded',
    updatedSecondsAgo: Math.max(0, Math.round((serverAge + localAge) / 1000)),
    noEstimate: false,
  };
}
