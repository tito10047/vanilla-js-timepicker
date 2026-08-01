import '../styles/timepicker.css';
import { el, SVG_CLOCK } from './templates';
import { PickerView } from './PickerView';
import { GridView } from './HourGridView';
import { computePosition } from '../utils/position';
import { createFocusTrap } from '../a11y/focusTrap';
import { createLiveRegion } from '../a11y/aria';
import { resolveKeyAction } from '../a11y/keyboard';
import { resolveLocale } from '../i18n/i18n';
import { formatTime, tokenize } from '../parser/format';
import type { TimepickerOptions, TimeView, ParsedTime } from '../core/types';

export interface DropdownCallbacks {
  onChange: (parsed: ParsedTime) => void;
  onClose: () => void;
}

export class Dropdown {
  private container: HTMLElement;
  private pickerView!: PickerView;
  private pickerHeader!: HTMLElement;
  private pickerFooter: HTMLElement | null = null;
  private currentView: TimeView = 'picker';
  private parsed: ParsedTime = { h: 0, m: 0, s: 0 };
  private ampm: 'AM' | 'PM' = 'AM';
  private focusTrap: ReturnType<typeof createFocusTrap>;
  private liveRegion: ReturnType<typeof createLiveRegion>;
  private outsideClickCleanup?: () => void;

  constructor(
    private anchor: HTMLInputElement,
    private opts: TimepickerOptions,
    private callbacks: DropdownCallbacks,
  ) {
    this.container = this.buildContainer();
    this.focusTrap = createFocusTrap(this.container);
    this.liveRegion = createLiveRegion();
    this.showPickerView();
    this.attachKeyboard();
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  show(parsed: ParsedTime): void {
    this.parsed = { ...parsed };
    this.ampm = parsed.h < 12 ? 'AM' : 'PM';

    const target = (this.opts.container ?? document.body);
    target.appendChild(this.container);

    this.position();
    this.pickerView.update(this.parsed.h, this.parsed.m, this.parsed.s, this.ampm);
    this.focusTrap.activate();

    this.outsideClickCleanup = this.attachOutsideClick();
  }

  hide(): void {
    this.container.remove();
    this.liveRegion.el.remove();
    this.focusTrap.deactivate();
    this.outsideClickCleanup?.();
  }

  update(parsed: ParsedTime): void {
    this.parsed = { ...parsed };
    this.ampm = parsed.h < 12 ? 'AM' : 'PM';
    if (this.currentView === 'picker') {
      this.pickerView.update(this.parsed.h, this.parsed.m, this.parsed.s, this.ampm);
    }
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  private buildContainer(): HTMLElement {
    const tokens = tokenize(this.opts.format ?? 'HH:mm');
    const is12h = tokens.is12h;
    const locale = resolveLocale(this.opts.locale);
    const uniqueId = `vtp-${Math.random().toString(36).slice(2, 8)}`;

    const container = el('div', {
      class: 'vtp-dropdown',
      role: 'dialog',
      'aria-modal': 'false',
      'aria-label': locale.title,
      id: uniqueId,
      'data-vtp-theme': this.opts.theme ?? 'auto',
      'data-animation': this.opts.animation ?? 'fade',
    });
    container.style.setProperty('--vtp-z', String(this.opts.zIndex ?? 1000));

    this.anchor.setAttribute('aria-controls', uniqueId);

    // Header (picker mode only)
    this.pickerHeader = el('div', { class: 'vtp-header' });
    const title = el('span', { class: 'vtp-title' }, locale.title);
    this.pickerHeader.append(title);
    container.append(this.pickerHeader);

    // PickerView
    this.pickerView = new PickerView({
      locale,
      is12h,
      hasSeconds: tokens.hasSeconds,
      hourStep: this.opts.hourStep ?? 1,
      minuteStep: this.opts.minuteStep ?? 5,
      secondStep: this.opts.secondStep ?? 1,
      onHourClick: () => this.switchView('hours'),
      onMinuteClick: () => this.switchView('minutes'),
      onSecondClick: tokens.hasSeconds ? () => this.switchView('seconds') : undefined,
      onHourChange: (delta) => this.changeUnit('hour', delta),
      onMinuteChange: (delta) => this.changeUnit('minute', delta),
      onSecondChange: tokens.hasSeconds ? (delta) => this.changeUnit('second', delta) : undefined,
      onAmPmToggle: is12h ? (ap) => this.toggleAmPm(ap) : undefined,
    });
    container.append(this.pickerView.root);

    // Footer
    this.pickerFooter = this.buildFooter(locale);
    if (this.pickerFooter) container.append(this.pickerFooter);

    return container;
  }

  private buildFooter(locale: ReturnType<typeof resolveLocale>): HTMLElement | null {
    const showNow = this.opts.showNowButton;
    const showClear = this.opts.showClearButton;
    const showConfirm = this.opts.showConfirmButton;
    if (!showNow && !showClear && !showConfirm) return null;

    const footer = el('div', { class: 'vtp-footer' });

    if (showNow) {
      const nowBtn = el('button', { class: 'vtp-btn vtp-btn-now', type: 'button' }, locale.nowLabel);
      nowBtn.addEventListener('click', () => {
        const now = new Date();
        this.parsed = { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() };
        this.pickerView.update(this.parsed.h, this.parsed.m, this.parsed.s, this.parsed.h < 12 ? 'AM' : 'PM');
        if (!this.opts.showConfirmButton) this.commit();
      });
      footer.append(nowBtn);
    }

    if (showClear) {
      const clearBtn = el('button', { class: 'vtp-btn vtp-btn-clear', type: 'button' }, locale.clearLabel);
      clearBtn.addEventListener('click', () => {
        this.parsed = { h: 0, m: 0, s: 0 };
        this.pickerView.update(0, 0, 0, 'AM');
        if (!this.opts.showConfirmButton) {
          this.callbacks.onChange({ h: -1, m: -1, s: -1 }); // sentinel for clear
          this.callbacks.onClose();
        }
      });
      footer.append(clearBtn);
    }

    if (showConfirm) {
      const confirmBtn = el('button', { class: 'vtp-btn vtp-btn-confirm', type: 'button' }, locale.confirmLabel);
      confirmBtn.addEventListener('click', () => this.commit());
      footer.append(confirmBtn);
    }

    return footer;
  }

  // ─── Views ────────────────────────────────────────────────────────────────

  private showPickerView(): void {
    this.currentView = 'picker';
  }

  private switchView(view: TimeView): void {
    this.currentView = view;
    // Remove old grid if present
    const existing = this.container.querySelector('.vtp-grid-wrap');
    existing?.remove();

    const locale = resolveLocale(this.opts.locale);
    const tokens = tokenize(this.opts.format ?? 'HH:mm');

    const items = view === 'hours'
      ? Array.from({ length: 24 }, (_, i) => i)
      : view === 'minutes'
      ? Array.from({ length: Math.ceil(60 / (this.opts.minuteStep ?? 5)) }, (_, i) => i * (this.opts.minuteStep ?? 5))
      : Array.from({ length: Math.ceil(60 / (this.opts.secondStep ?? 1)) }, (_, i) => i * (this.opts.secondStep ?? 1));

    const selected = view === 'hours' ? this.parsed.h
      : view === 'minutes' ? this.parsed.m
      : this.parsed.s;

    const label = view === 'hours' ? locale.hoursLabel
      : view === 'minutes' ? locale.minutesLabel
      : locale.secondsLabel;

    const grid = new GridView({
      locale,
      items,
      selected,
      onSelect: (val) => this.onGridSelect(view, val),
      onBack: () => this.dismissGrid(),
      label,
    });

    const wrap = el('div', { class: 'vtp-grid-wrap' });
    wrap.append(grid.root);

    // Hide picker chrome, show grid
    this.pickerHeader.style.display = 'none';
    (this.pickerView.root as HTMLElement).style.display = 'none';
    if (this.pickerFooter) this.pickerFooter.style.display = 'none';
    this.container.appendChild(wrap);
    grid.focus();
  }

  private dismissGrid(): void {
    this.container.querySelector('.vtp-grid-wrap')?.remove();
    this.pickerHeader.style.display = '';
    (this.pickerView.root as HTMLElement).style.display = '';
    if (this.pickerFooter) this.pickerFooter.style.display = '';
    this.currentView = 'picker';
  }

  private onGridSelect(view: TimeView, val: number): void {
    if (view === 'hours') this.parsed.h = val;
    else if (view === 'minutes') this.parsed.m = val;
    else this.parsed.s = val;

    this.dismissGrid();
    this.pickerView.update(this.parsed.h, this.parsed.m, this.parsed.s, this.parsed.h < 12 ? 'AM' : 'PM');

    if (!this.opts.showConfirmButton && (this.opts.closeOnSelect ?? true) && view === 'hours') {
      // After hour selection, allow minute pick
    } else if (!this.opts.showConfirmButton) {
      this.commit();
    }
  }

  // ─── Units ────────────────────────────────────────────────────────────────

  private changeUnit(unit: 'hour' | 'minute' | 'second', delta: number): void {
    if (unit === 'hour') {
      this.parsed.h = ((this.parsed.h + delta) % 24 + 24) % 24;
    } else if (unit === 'minute') {
      this.parsed.m = ((this.parsed.m + delta) % 60 + 60) % 60;
    } else {
      this.parsed.s = ((this.parsed.s + delta) % 60 + 60) % 60;
    }
    this.pickerView.update(this.parsed.h, this.parsed.m, this.parsed.s, this.parsed.h < 12 ? 'AM' : 'PM');
    this.announce();

    if (!this.opts.showConfirmButton) {
      this.commit(false);
    }
  }

  private toggleAmPm(ampm: 'AM' | 'PM'): void {
    this.ampm = ampm;
    if (ampm === 'AM' && this.parsed.h >= 12) this.parsed.h -= 12;
    if (ampm === 'PM' && this.parsed.h < 12) this.parsed.h += 12;
    this.pickerView.update(this.parsed.h, this.parsed.m, this.parsed.s, this.ampm);
    if (!this.opts.showConfirmButton) this.commit(false);
  }

  private commit(close = true): void {
    this.callbacks.onChange(this.parsed);
    if (close && (this.opts.closeOnSelect ?? true)) {
      this.callbacks.onClose();
    }
  }

  private announce(): void {
    const format = this.opts.format ?? 'HH:mm';
    this.liveRegion.announce(formatTime(this.parsed, format));
  }

  // ─── Position ─────────────────────────────────────────────────────────────

  private position(): void {
    const result = computePosition(
      this.anchor,
      this.container,
      this.opts.position ?? 'auto',
      this.opts.container,
    );
    this.container.style.top = `${result.top}px`;
    this.container.style.left = `${result.left}px`;
    this.container.setAttribute('data-placement', result.placement);
  }

  // ─── Keyboard ─────────────────────────────────────────────────────────────

  private attachKeyboard(): void {
    this.container.addEventListener('keydown', (e) => {
      const action = resolveKeyAction(e);
      if (!action) return;

      switch (action) {
        case 'close': e.preventDefault(); this.callbacks.onClose(); break;
        case 'confirm': e.preventDefault(); this.commit(); break;
        case 'increment': e.preventDefault(); this.changeUnit('hour', this.opts.hourStep ?? 1); break;
        case 'decrement': e.preventDefault(); this.changeUnit('hour', -(this.opts.hourStep ?? 1)); break;
        case 'next-col': e.preventDefault(); this.changeUnit('minute', this.opts.minuteStep ?? 5); break;
        case 'prev-col': e.preventDefault(); this.changeUnit('minute', -(this.opts.minuteStep ?? 5)); break;
        case 'min': e.preventDefault(); this.parsed.h = 0; this.parsed.m = 0; this.pickerView.update(0, 0, 0); break;
        case 'max': e.preventDefault(); this.parsed.h = 23; this.parsed.m = 59; this.pickerView.update(23, 59, 59); break;
      }
    });
  }

  // ─── Outside click ────────────────────────────────────────────────────────

  private attachOutsideClick(): () => void {
    const handler = (e: MouseEvent) => {
      if (!this.container.contains(e.target as Node) && e.target !== this.anchor) {
        this.callbacks.onClose();
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }
}
