import type {
  TimepickerOptions,
  TimepickerEventName,
  TimepickerChangeEvent,
  TimepickerError,
  CloseReason,
  ParsedTime,
} from './types';
import { EventEmitter } from './EventEmitter';
import { State } from './State';
import { parseRightFill, parseLeftFill, parseSmart } from '../parser/parse';
import { formatTime, tokenize, parsedToDate } from '../parser/format';
import { dispatch, on } from '../utils/dom';
import { runGuard, runValidate } from '../utils/async';
import { Dropdown } from '../view/Dropdown';

interface TimepickerState extends Record<string, unknown> {
  hour: number;
  minute: number;
  second: number;
  isOpen: boolean;
  view: 'picker' | 'hours' | 'minutes' | 'seconds';
  rawValue: string;
}

const DEFAULTS: Required<Omit<TimepickerOptions,
  'value' | 'defaultValue' | 'container' | 'disabledTimes' | 'renderCell' |
  'onBeforeOpen' | 'onBeforeChange' | 'validate' |
  'onOpen' | 'onClose' | 'onChange' | 'onInput' | 'onInvalid' | 'onViewChange'
>> = {
  format: 'HH:mm',
  locale: 'en',
  minTime: '',
  maxTime: '',
  hourStep: 1,
  minuteStep: 5,
  secondStep: 1,
  theme: 'auto',
  position: 'auto',
  zIndex: 1000,
  animation: 'fade',
  showClearButton: false,
  showNowButton: false,
  showConfirmButton: false,
  showToggleIcon: true,
  openOnFocus: true,
  closeOnSelect: true,
  readonlyInput: false,
  allowManualInput: true,
  parseStrategy: 'right-fill',
  autofill: true,
  emptyOk: true,
  strictMode: false,
};

export class Timepicker {
  private input: HTMLInputElement;
  private opts: TimepickerOptions;
  private emitter = new EventEmitter();
  private state: State<TimepickerState>;
  private dropdown: Dropdown | null = null;
  private cleanupFns: (() => void)[] = [];
  private destroyed = false;
  private addedInputMode = false;
  private static defaults: Partial<TimepickerOptions> = {};
  private static registry = new WeakMap<HTMLInputElement, Timepicker>();

  constructor(input: HTMLInputElement | string, options: TimepickerOptions = {}) {
    const el =
      typeof input === 'string'
        ? document.querySelector<HTMLInputElement>(input)
        : input;
    if (!el) throw new Error(`Timepicker: element not found for "${input}"`);

    this.input = el;
    this.opts = { ...DEFAULTS, ...Timepicker.defaults, ...options };
    Timepicker.registry.set(el, this);

    this.state = new State<TimepickerState>({
      hour: 0,
      minute: 0,
      second: 0,
      isOpen: false,
      view: 'picker',
      rawValue: '',
    });

    this.init();
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  private init(): void {
    this.input.classList.add('vtp-input');
    // Suppress browser autocomplete/autofill on all browsers and devices.
    // 'off' alone is ignored by Chrome/Safari; the combination below covers all known cases.
    // 'new-password' is the most reliable value to suppress Chrome/Safari autofill;
    // 'off' alone is ignored by those browsers.
    this.input.setAttribute('autocomplete', 'new-password');
    this.input.setAttribute('autocorrect', 'off');
    this.input.setAttribute('autocapitalize', 'off');
    this.input.setAttribute('spellcheck', 'false');
    this.input.setAttribute('data-form-type', 'other');   // Dashlane / password managers
    this.input.setAttribute('data-lpignore', 'true');     // LastPass
    this.input.setAttribute('data-1p-ignore', '');        // 1Password
    this.input.setAttribute('role', 'combobox');
    this.input.setAttribute('aria-haspopup', 'dialog');
    this.input.setAttribute('aria-expanded', 'false');

    // Show a numeric keyboard on mobile when the user hasn't specified their own inputmode.
    if (!this.input.hasAttribute('inputmode')) {
      this.input.setAttribute('inputmode', 'numeric');
      this.addedInputMode = true;
    }

    const initialValue = this.opts.value ?? this.opts.defaultValue;
    if (initialValue != null) {
      const strVal = initialValue instanceof Date
        ? formatTime({ h: initialValue.getHours(), m: initialValue.getMinutes(), s: initialValue.getSeconds() }, this.opts.format!)
        : String(initialValue);
      this.input.value = strVal;
      const parsed = this.doParse(strVal);
      if (parsed) this.state.patch({ hour: parsed.h, minute: parsed.m, second: parsed.s, rawValue: strVal });
    }

    if (this.opts.openOnFocus) {
      this.cleanupFns.push(on(this.input, 'focus', () => this.open()));
    }

    if (this.opts.allowManualInput) {
      this.cleanupFns.push(
        on(this.input, 'input', (e) => this.onRawInput((e.target as HTMLInputElement).value)),
        on(this.input, 'blur', () => this.onBlur()),
        on(this.input, 'keydown', (e) => this.onInputKeydown(e)),
      );
    } else {
      this.input.setAttribute('readonly', 'readonly');
    }

    if (this.opts.onOpen) this.emitter.on('vtp:open', this.opts.onOpen);
    if (this.opts.onClose) this.emitter.on('vtp:close', ({ reason }: { reason: CloseReason }) => this.opts.onClose!(reason));
    if (this.opts.onChange) this.emitter.on('vtp:change', (e: TimepickerChangeEvent) => this.opts.onChange!(e.value, e));
    if (this.opts.onInput) this.emitter.on('vtp:input', ({ raw }: { raw: string }) => this.opts.onInput!(raw));
    if (this.opts.onInvalid) this.emitter.on('vtp:invalid', (e: TimepickerError) => this.opts.onInvalid!(e));
    if (this.opts.onViewChange) this.emitter.on('vtp:viewchange', ({ to }: { to: TimepickerState['view'] }) => this.opts.onViewChange!(to));
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async open(): Promise<void> {
    if (this.state.get('isOpen') || this.destroyed) return;
    const allowed = await runGuard(this.opts.onBeforeOpen);
    if (!allowed) return;
    if (!dispatch(this.input, 'vtp:beforeopen', {}, true)) return;

    this.state.set('isOpen', true);
    this.input.setAttribute('aria-expanded', 'true');

    const current = this.state.get('rawValue')
      ? this.doParse(this.state.get('rawValue')) ?? { h: 0, m: 0, s: 0 }
      : { h: this.state.get('hour'), m: this.state.get('minute'), s: this.state.get('second') };

    this.dropdown = new Dropdown(this.input, this.opts, {
      onChange: async (parsed) => {
        if (parsed.h === -1) { await this.clear(); return; }
        const formatted = formatTime(parsed, this.opts.format!);
        await this.setValue(formatted);
      },
      onClose: () => this.close('select'),
    });
    this.dropdown.show(current);

    this.emitter.emit('vtp:open', { view: this.state.get('view') });
    dispatch(this.input, 'vtp:open', { view: this.state.get('view') });
  }

  async close(reason: CloseReason = 'api'): Promise<void> {
    if (!this.state.get('isOpen')) return;
    this.state.set('isOpen', false);
    this.input.setAttribute('aria-expanded', 'false');
    this.dropdown?.hide();
    this.dropdown = null;
    this.emitter.emit('vtp:close', { reason });
    dispatch(this.input, 'vtp:close', { reason });
  }

  async toggle(): Promise<void> {
    if (this.state.get('isOpen')) {
      await this.close('api');
    } else {
      await this.open();
    }
  }

  async setValue(value: string | Date | null): Promise<void> {
    if (this.destroyed) return;

    if (value === null || value === '') {
      if (this.opts.emptyOk) {
        await this.applyValue('', null);
      }
      return;
    }

    const strVal =
      value instanceof Date
        ? formatTime({ h: value.getHours(), m: value.getMinutes(), s: value.getSeconds() }, this.opts.format!)
        : String(value);

    const parsed = this.doParse(strVal);
    if (!parsed) {
      this.fireInvalid('INVALID_TIME', `"${strVal}" is not a valid time`, strVal);
      return;
    }

    const formatted = formatTime(parsed, this.opts.format!);

    if (!this.checkRange(parsed, formatted)) return;

    const validation = await runValidate(this.opts.validate, formatted);
    if (!validation.ok) {
      this.fireInvalid('INVALID_TIME', validation.message ?? 'Validation failed', formatted);
      return;
    }

    const allowed = await runGuard(() => this.opts.onBeforeChange?.(formatted, this.state.get('rawValue')) ?? true);
    if (!allowed) return;

    if (!dispatch(this.input, 'vtp:beforechange', { next: formatted, prev: this.state.get('rawValue') }, true)) return;

    await this.applyValue(formatted, parsed);
  }

  async clear(): Promise<void> {
    await this.applyValue('', null);
  }

  async setNow(): Promise<void> {
    await this.setValue(new Date());
  }

  getValue(): string {
    return this.state.get('rawValue');
  }

  getDate(): Date | null {
    const v = this.state.get('rawValue');
    if (!v) return null;
    const parsed = this.doParse(v);
    if (!parsed) return null;
    return parsedToDate(parsed);
  }

  isOpen(): boolean {
    return this.state.get('isOpen');
  }

  async isValid(): Promise<boolean> {
    const v = this.state.get('rawValue');
    if (!v) return this.opts.emptyOk ?? true;
    const parsed = this.doParse(v);
    if (!parsed) return false;
    const formatted = formatTime(parsed, this.opts.format!);
    const result = await runValidate(this.opts.validate, formatted);
    return result.ok;
  }

  on<T = unknown>(event: TimepickerEventName, handler: (detail: T) => void): () => void {
    return this.emitter.on(event, handler);
  }

  off<T = unknown>(event: TimepickerEventName, handler: (detail: T) => void): void {
    this.emitter.off(event, handler);
  }

  setOptions(partial: Partial<TimepickerOptions>): void {
    this.opts = { ...this.opts, ...partial };
  }

  focus(): void {
    this.input.focus();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.state.get('isOpen')) this.close('api');
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.emitter.removeAllListeners();
    this.input.classList.remove('vtp-input');
    this.input.removeAttribute('autocomplete');
    this.input.removeAttribute('autocorrect');
    this.input.removeAttribute('autocapitalize');
    this.input.removeAttribute('spellcheck');
    this.input.removeAttribute('data-form-type');
    this.input.removeAttribute('data-lpignore');
    this.input.removeAttribute('data-1p-ignore');
    this.input.removeAttribute('role');
    this.input.removeAttribute('aria-haspopup');
    this.input.removeAttribute('aria-expanded');
    if (this.addedInputMode) this.input.removeAttribute('inputmode');
    Timepicker.registry.delete(this.input);
    dispatch(this.input, 'vtp:destroy', {});
  }

  // ─── Static API ───────────────────────────────────────────────────────────

  static setDefaults(partial: Partial<TimepickerOptions>): void {
    Timepicker.defaults = { ...Timepicker.defaults, ...partial };
  }

  static autoInit(selector = '[data-timepicker]'): Timepicker[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>(selector)).map(
      (el) => new Timepicker(el, JSON.parse(el.dataset.timepickerOptions ?? '{}')),
    );
  }

  static parse(text: string, opts: { strategy?: 'right-fill' | 'left-fill' | 'smart'; hasSeconds?: boolean } = {}): string | null {
    const { strategy = 'right-fill', hasSeconds = false } = opts;
    const parseOpts = { hasSeconds };
    const parsed =
      strategy === 'left-fill' ? parseLeftFill(text, parseOpts)
      : strategy === 'smart'   ? parseSmart(text, parseOpts)
      :                          parseRightFill(text, parseOpts);
    if (!parsed) return null;
    return formatTime(parsed, hasSeconds ? 'HH:mm:ss' : 'HH:mm');
  }

  static getInstance(el: HTMLInputElement | string): Timepicker | null {
    const input = typeof el === 'string'
      ? document.querySelector<HTMLInputElement>(el)
      : el;
    return input ? Timepicker.registry.get(input) ?? null : null;
  }

  static format(date: Date, format = 'HH:mm'): string {
    return formatTime({ h: date.getHours(), m: date.getMinutes(), s: date.getSeconds() }, format);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private doParse(raw: string): ParsedTime | null {
    const tokens = tokenize(this.opts.format!);
    const parseOpts = { hasSeconds: tokens.hasSeconds };
    const strategy = this.opts.parseStrategy ?? 'right-fill';
    const parsed = strategy === 'left-fill' ? parseLeftFill(raw, parseOpts)
      : strategy === 'smart'                ? parseSmart(raw, parseOpts)
      :                                       parseRightFill(raw, parseOpts);

    if (!parsed || !tokens.is12h) return parsed;

    // Apply AM/PM from the raw string when the format is 12-hour.
    // The digit-only parse returns hours in the 1-12 range; we convert to 0-23 here.
    const isPm = /pm/i.test(raw);
    const isAm = /am/i.test(raw);
    if (isPm && parsed.h < 12) parsed.h += 12;   // 3 PM → 15, 12 PM stays 12
    else if (isAm && parsed.h === 12) parsed.h = 0; // 12 AM → 0 (midnight)

    return parsed;
  }

  private async applyValue(formatted: string, parsed: ParsedTime | null): Promise<void> {
    const prev = this.state.get('rawValue');
    this.input.value = formatted;
    this.input.classList.remove('vtp-invalid');
    this.state.patch({
      rawValue: formatted,
      hour: parsed?.h ?? 0,
      minute: parsed?.m ?? 0,
      second: parsed?.s ?? 0,
    });
    if (parsed) this.dropdown?.update(parsed);

    const changeEvent: TimepickerChangeEvent = {
      value: formatted,
      date: parsed ? parsedToDate(parsed) : null,
      formatted,
      prev,
    };
    this.emitter.emit('vtp:change', changeEvent);
    dispatch(this.input, 'vtp:change', changeEvent);
  }

  private checkRange(parsed: ParsedTime, formatted: string): boolean {
    const { minTime, maxTime } = this.opts;
    if (minTime && formatted < minTime) {
      this.fireInvalid('BELOW_MIN', `${formatted} is before minTime ${minTime}`, formatted);
      return false;
    }
    if (maxTime && formatted > maxTime) {
      this.fireInvalid('ABOVE_MAX', `${formatted} is after maxTime ${maxTime}`, formatted);
      return false;
    }
    return true;
  }

  private fireInvalid(code: TimepickerError['code'], message: string, value: string): void {
    const err: TimepickerError = { code, message, value };
    this.emitter.emit('vtp:invalid', err);
    dispatch(this.input, 'vtp:invalid', err);
    this.input.classList.add('vtp-invalid');
  }

  private onRawInput(raw: string): void {
    this.input.classList.remove('vtp-invalid');
    this.emitter.emit('vtp:input', { raw });
    dispatch(this.input, 'vtp:input', { raw });
  }

  private async onBlur(): Promise<void> {
    if (!this.opts.autofill) return;
    const raw = this.input.value;
    if (!raw && this.opts.emptyOk) return;
    const parsed = this.doParse(raw);
    if (parsed) {
      await this.setValue(formatTime(parsed, this.opts.format!));
    }
  }

  private onInputKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close('escape');
    if (e.key === 'Enter') this.onBlur();
  }
}
