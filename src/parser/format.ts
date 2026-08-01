import type { ParsedTime } from '../core/types';

export interface FormatTokens {
  hasHours: boolean;
  hasMinutes: boolean;
  hasSeconds: boolean;
  is12h: boolean;
}

export function tokenize(format: string): FormatTokens {
  return {
    hasHours: /HH|hh/.test(format),
    hasMinutes: /mm/.test(format),
    hasSeconds: /ss/.test(format),
    is12h: /hh/.test(format) || /\ba\b/.test(format),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatTime(time: ParsedTime, format: string): string {
  let { h, m, s } = time;
  let result = format;

  const is12h = /hh/.test(format) || /\ba\b/.test(format);

  if (is12h) {
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    result = result
      .replace('hh', pad2(h12))
      .replace(/\ba\b/, ampm);
  } else {
    result = result.replace('HH', pad2(h));
  }

  result = result
    .replace('mm', pad2(m))
    .replace('ss', pad2(s));

  return result;
}

export function parsedToDate(time: ParsedTime): Date {
  const d = new Date();
  d.setHours(time.h, time.m, time.s, 0);
  return d;
}
