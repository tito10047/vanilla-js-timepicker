import type { ParsedTime } from '../core/types';

export interface ParseOptions {
  hasSeconds: boolean;
}

function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

function validate(h: number, m: number, s: number): ParsedTime | null {
  if (h > 23 || m > 59 || s > 59) return null;
  return { h, m, s };
}

export function parseRightFill(input: string, opts: ParseOptions): ParsedTime | null {
  const digits = digitsOnly(input).slice(-6);
  if (!digits) return null;

  const width = opts.hasSeconds ? 6 : 4;
  const padded = digits.padStart(width, '0');

  const h = parseInt(padded.slice(0, 2), 10);
  const m = parseInt(padded.slice(2, 4), 10);
  const s = opts.hasSeconds ? parseInt(padded.slice(4, 6), 10) : 0;

  return validate(h, m, s);
}

export function parseLeftFill(input: string, opts: ParseOptions): ParsedTime | null {
  const digits = digitsOnly(input);
  if (!digits) return null;

  let h: number, m: number, s = 0;

  if (digits.length <= 2) {
    // 1-2 digits = hours only
    h = parseInt(digits, 10);
    m = 0;
  } else if (!opts.hasSeconds) {
    // 3 digits → H:MM, 4 digits → HH:MM
    const hPart = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
    const mPart = digits.length === 3 ? digits.slice(1, 3) : digits.slice(2, 4);
    h = parseInt(hPart, 10);
    m = parseInt(mPart, 10);
  } else {
    // With seconds: 5 digits → H:MM:SS, 6 digits → HH:MM:SS
    const hPart = digits.length <= 5 ? digits.slice(0, 1) : digits.slice(0, 2);
    const rest = digits.slice(hPart.length);
    h = parseInt(hPart, 10);
    m = parseInt(rest.slice(0, 2), 10);
    s = parseInt((rest.slice(2, 4) || '0').padEnd(2, '0'), 10);
  }

  return validate(h, m, s);
}

export function parseSmart(input: string, opts: ParseOptions): ParsedTime | null {
  // Smart: 1-2 digits = hours (same as left-fill), 3-4 = HHMM
  return parseLeftFill(input, opts);
}

export function parseAny(input: string, opts: ParseOptions, strategy: 'right-fill' | 'left-fill' | 'smart' = 'right-fill'): ParsedTime | null {
  switch (strategy) {
    case 'right-fill': return parseRightFill(input, opts);
    case 'left-fill':  return parseLeftFill(input, opts);
    case 'smart':      return parseSmart(input, opts);
  }
}
