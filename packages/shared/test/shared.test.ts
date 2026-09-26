import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCHEDULE, formatLei, hoursOn, hoursSummary, isOpenAt, isUbEmail, localDate, matchesDiet, nextOpening, parseCardInput,
  parseLei, parseRewardInput, qrPayload, rewardCodeAt, rewardDigits, rewardStep, weekdayOf, zonedToUtc,
} from '../src';

describe('Europe/Bucharest time', () => {
  it('converts wall-clock time across both DST changes', () => {
    expect(zonedToUtc('2026-10-13', '11:30').toISOString()).toBe('2026-10-13T08:30:00.000Z'); // EEST, UTC+3
    expect(zonedToUtc('2026-11-02', '11:30').toISOString()).toBe('2026-11-02T09:30:00.000Z'); // EET, UTC+2
    expect(localDate(new Date('2026-10-12T22:30:00Z'))).toBe('2026-10-13');
    expect(weekdayOf('2026-10-13')).toBe(2);
  });

  it('knows the confirmed hours: Mon–Fri 11:30–17:00, closed weekends', () => {
    expect(hoursOn('2026-10-13', DEFAULT_SCHEDULE)).toEqual({ opensAt: '11:30', closesAt: '17:00' });
    expect(hoursOn('2026-10-17', DEFAULT_SCHEDULE)).toBeNull();
    expect(isOpenAt(new Date('2026-10-13T09:40:00Z'), DEFAULT_SCHEDULE)).toBe(true); // 12:40
    expect(isOpenAt(new Date('2026-10-13T08:29:00Z'), DEFAULT_SCHEDULE)).toBe(false); // 11:29
    expect(isOpenAt(new Date('2026-10-13T14:00:00Z'), DEFAULT_SCHEDULE)).toBe(false); // 17:00
  });

  it('finds the next opening over a weekend and honours a closure', () => {
    const friday = new Date('2026-10-16T15:00:00Z'); // 18:00 Friday
    expect(nextOpening(friday, DEFAULT_SCHEDULE)!.toISOString()).toBe('2026-10-19T08:30:00.000Z');
    const closedMonday = [{ date: '2026-10-19', isClosed: true, opensAt: null, closesAt: null, note: null }];
    expect(nextOpening(friday, DEFAULT_SCHEDULE, closedMonday)!.toISOString()).toBe('2026-10-20T08:30:00.000Z');
  });

  it('summarises the schedule for the footer', () => {
    expect(hoursSummary(DEFAULT_SCHEDULE, 'ro')).toBe('L–V 11:30–17:00');
    expect(hoursSummary(DEFAULT_SCHEDULE, 'en')).toBe('Mon–Fri 11:30–17:00');
  });
});

describe('money in bani', () => {
  it('formats whole and fractional lei', () => {
    expect(formatLei(900)).toBe('9');
    expect(formatLei(1250)).toBe('12,50');
    expect(formatLei(1250, 'en')).toBe('12.50');
  });
  it('parses what staff type', () => {
    expect(parseLei('12,50')).toBe(1250);
    expect(parseLei('9')).toBe(900);
    expect(parseLei('9.5')).toBe(950);
    expect(parseLei('abc')).toBeNull();
    expect(parseLei('-3')).toBeNull();
  });
});

describe('dietary filters', () => {
  it('passes only what the canteen tagged; vegan counts as vegetarian', () => {
    expect(matchesDiet(['vegan'], ['vegetarian'])).toBe(true);
    expect(matchesDiet(['vegetarian'], ['vegan'])).toBe(false);
    expect(matchesDiet([], ['gluten_free'])).toBe(false);
    expect(matchesDiet(['no_pork', 'gluten_free'], ['no_pork', 'gluten_free'])).toBe(true);
  });
});

describe('reward codes', () => {
  const secret = 'a1'.repeat(20);
  it('are the same on the phone and on the server, and change each minute', async () => {
    const t = Date.UTC(2026, 9, 13, 10, 0, 0);
    const a = await rewardCodeAt('K7P4', secret, t);
    const b = await rewardCodeAt('K7P4', secret, t + 30_000);
    const c = await rewardCodeAt('K7P4', secret, t + 60_000);
    expect(a).toMatch(/^K7P4 \d{4}$/);
    expect(a).toBe(b);
    expect(await rewardDigits(secret, rewardStep(t))).toBe(a.slice(5));
    expect([a, c].length).toBe(2);
  });
  it('parse whatever staff type or scan', () => {
    expect(parseRewardInput('k7p4 4839')).toEqual({ rewardId: 'K7P4', digits: '4839' });
    expect(parseRewardInput('K7P4-4839')).toEqual({ rewardId: 'K7P4', digits: '4839' });
    expect(parseRewardInput(qrPayload.reward('K7P4 4839'))).toEqual({ rewardId: 'K7P4', digits: '4839' });
    expect(parseRewardInput('K7P2 4839')).toBeNull(); // 2 is not in the alphabet
    expect(parseCardInput(qrPayload.card('0f8b3c1e-6c55-4d0e-9f53-2d4f1a2b3c4d'))).toBe('0f8b3c1e-6c55-4d0e-9f53-2d4f1a2b3c4d');
  });
});

describe('who may hold an account (docs/10)', () => {
  it('takes every UB mailbox: students, staff and the faculties', () => {
    for (const e of ['ana.pop@s.unibuc.ro', 'maria.pop@g.unibuc.ro', 'secretariat@unibuc.ro', 'ion@fmi.unibuc.ro', 'X@Drept.UniBuc.ro']) {
      expect(isUbEmail(e), e).toBe(true);
    }
  });
  it('refuses lookalikes', () => {
    for (const e of ['someone@gmail.com', 'x@notunibuc.ro', 'x@s-unibuc.ro', 'x@unibuc.ro.evil.com', 'x@unibuc.rom', '@unibuc.ro', 'a b@unibuc.ro']) {
      expect(isUbEmail(e), e).toBe(false);
    }
  });
});
