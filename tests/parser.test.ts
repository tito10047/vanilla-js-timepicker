import { describe, it, expect } from 'vitest';
import { parseRightFill, parseSmart, parseLeftFill } from '../src/parser/parse';
import { formatTime, tokenize } from '../src/parser/format';

// ─── parseRightFill ───────────────────────────────────────────────────────────

describe('parseRightFill – 24h without seconds', () => {
  const opts = { hasSeconds: false };

  it('1  → 00:01', () => expect(parseRightFill('1', opts)).toEqual({ h: 0, m: 1, s: 0 }));
  it('10 → 00:10', () => expect(parseRightFill('10', opts)).toEqual({ h: 0, m: 10, s: 0 }));
  it('100 → 01:00', () => expect(parseRightFill('100', opts)).toEqual({ h: 1, m: 0, s: 0 }));
  it('1000 → 10:00', () => expect(parseRightFill('1000', opts)).toEqual({ h: 10, m: 0, s: 0 }));
  it('0100 → 01:00', () => expect(parseRightFill('0100', opts)).toEqual({ h: 1, m: 0, s: 0 }));
  it('0001 → 00:01', () => expect(parseRightFill('0001', opts)).toEqual({ h: 0, m: 1, s: 0 }));
  it('2359 → 23:59', () => expect(parseRightFill('2359', opts)).toEqual({ h: 23, m: 59, s: 0 }));
  it('2400 → null (hour overflow)', () => expect(parseRightFill('2400', opts)).toBeNull());
  it('6099 → null (minute overflow)', () => expect(parseRightFill('6099', opts)).toBeNull());
  it('non-digit chars filtered: "12ab34" → 12:34', () =>
    expect(parseRightFill('12ab34', opts)).toEqual({ h: 12, m: 34, s: 0 }));
  it('empty string → null', () => expect(parseRightFill('', opts)).toBeNull());
  it('only letters → null', () => expect(parseRightFill('abc', opts)).toBeNull());
  it('colon format "11:35" → 11:35', () =>
    expect(parseRightFill('11:35', opts)).toEqual({ h: 11, m: 35, s: 0 }));
});

describe('parseRightFill – 24h with seconds', () => {
  const opts = { hasSeconds: true };

  it('1 → 00:00:01', () => expect(parseRightFill('1', opts)).toEqual({ h: 0, m: 0, s: 1 }));
  it('100 → 00:01:00', () => expect(parseRightFill('100', opts)).toEqual({ h: 0, m: 1, s: 0 }));
  it('235959 → 23:59:59', () =>
    expect(parseRightFill('235959', opts)).toEqual({ h: 23, m: 59, s: 59 }));
  it('240000 → null', () => expect(parseRightFill('240000', opts)).toBeNull());
  it('000060 → null (seconds overflow)', () => expect(parseRightFill('000060', opts)).toBeNull());
});

// ─── parseLeftFill ────────────────────────────────────────────────────────────

describe('parseLeftFill – 24h without seconds', () => {
  const opts = { hasSeconds: false };

  it('1 → 01:00', () => expect(parseLeftFill('1', opts)).toEqual({ h: 1, m: 0, s: 0 }));
  it('12 → 12:00', () => expect(parseLeftFill('12', opts)).toEqual({ h: 12, m: 0, s: 0 }));
  it('123 → 01:23', () => expect(parseLeftFill('123', opts)).toEqual({ h: 1, m: 23, s: 0 }));
  it('1234 → 12:34', () => expect(parseLeftFill('1234', opts)).toEqual({ h: 12, m: 34, s: 0 }));
  it('2400 → null', () => expect(parseLeftFill('2400', opts)).toBeNull());
});

// ─── parseSmart ───────────────────────────────────────────────────────────────

describe('parseSmart – 24h without seconds', () => {
  const opts = { hasSeconds: false };

  it('1 → 01:00  (1-2 digits = hours)', () =>
    expect(parseSmart('1', opts)).toEqual({ h: 1, m: 0, s: 0 }));
  it('12 → 12:00', () => expect(parseSmart('12', opts)).toEqual({ h: 12, m: 0, s: 0 }));
  it('123 → 01:23  (3-4 digits = HH:MM)', () =>
    expect(parseSmart('123', opts)).toEqual({ h: 1, m: 23, s: 0 }));
  it('1234 → 12:34', () => expect(parseSmart('1234', opts)).toEqual({ h: 12, m: 34, s: 0 }));
});

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('HH:mm 24h', () => expect(formatTime({ h: 9, m: 5, s: 0 }, 'HH:mm')).toBe('09:05'));
  it('HH:mm:ss with seconds', () =>
    expect(formatTime({ h: 23, m: 59, s: 7 }, 'HH:mm:ss')).toBe('23:59:07'));
  it('hh:mm a  AM', () => expect(formatTime({ h: 9, m: 0, s: 0 }, 'hh:mm a')).toBe('09:00 AM'));
  it('hh:mm a  PM', () => expect(formatTime({ h: 14, m: 30, s: 0 }, 'hh:mm a')).toBe('02:30 PM'));
  it('hh:mm a  noon = 12:00 PM', () =>
    expect(formatTime({ h: 12, m: 0, s: 0 }, 'hh:mm a')).toBe('12:00 PM'));
  it('hh:mm a  midnight = 12:00 AM', () =>
    expect(formatTime({ h: 0, m: 0, s: 0 }, 'hh:mm a')).toBe('12:00 AM'));
  it('custom separator H-m', () =>
    expect(formatTime({ h: 8, m: 30, s: 0 }, 'HH-mm')).toBe('08-30'));
});

// ─── tokenize ─────────────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('detects HH token', () => {
    const t = tokenize('HH:mm');
    expect(t.hasHours).toBe(true);
    expect(t.hasMinutes).toBe(true);
    expect(t.hasSeconds).toBe(false);
    expect(t.is12h).toBe(false);
  });

  it('detects seconds token', () => {
    const t = tokenize('HH:mm:ss');
    expect(t.hasSeconds).toBe(true);
  });

  it('detects 12h token hh + a', () => {
    const t = tokenize('hh:mm a');
    expect(t.is12h).toBe(true);
  });
});
