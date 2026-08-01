import { el, SVG_ARROW_UP, SVG_ARROW_DOWN } from './templates';
import type { LocaleConfig, CellRenderer } from '../core/types';
import { throttle } from '../utils/async';
import { formatTime } from '../parser/format';

export interface PickerViewOptions {
  locale: LocaleConfig;
  is12h: boolean;
  hasSeconds: boolean;
  hourStep: number;
  minuteStep: number;
  secondStep: number;
  onHourClick: () => void;
  onMinuteClick: () => void;
  onSecondClick?: () => void;
  onHourChange: (delta: number) => void;
  onMinuteChange: (delta: number) => void;
  onSecondChange?: (delta: number) => void;
  onAmPmToggle?: (ampm: 'AM' | 'PM') => void;
  renderCell?: CellRenderer;
  format?: string;
}

export class PickerView {
  readonly root: HTMLElement;
  private hourVal!: HTMLButtonElement;
  private minuteVal!: HTMLButtonElement;
  private secondVal?: HTMLButtonElement;
  private amBtn?: HTMLButtonElement;
  private pmBtn?: HTMLButtonElement;
  private renderSeq = 0;
  private prevCellClasses: string[] = [];

  constructor(private opts: PickerViewOptions) {
    this.root = this.build();
  }

  private build(): HTMLElement {
    const wrap = el('div', { class: 'vtp-picker', role: 'group' });

    wrap.append(this.buildColumn('hour'));
    wrap.append(el('span', { class: 'vtp-colon', 'aria-hidden': 'true' }, ':'));
    wrap.append(this.buildColumn('minute'));

    if (this.opts.hasSeconds) {
      wrap.append(el('span', { class: 'vtp-colon', 'aria-hidden': 'true' }, ':'));
      wrap.append(this.buildColumn('second'));
    }

    if (this.opts.is12h) {
      const ampm = el('div', { class: 'vtp-ampm' });
      this.amBtn = el('button', { class: 'vtp-ampm-btn', type: 'button', 'aria-label': this.opts.locale.amLabel }, this.opts.locale.amLabel);
      this.pmBtn = el('button', { class: 'vtp-ampm-btn', type: 'button', 'aria-label': this.opts.locale.pmLabel }, this.opts.locale.pmLabel);
      this.amBtn.addEventListener('click', () => this.opts.onAmPmToggle?.('AM'));
      this.pmBtn.addEventListener('click', () => this.opts.onAmPmToggle?.('PM'));
      ampm.append(this.amBtn, this.pmBtn);
      wrap.append(ampm);
    }

    return wrap;
  }

  private buildColumn(unit: 'hour' | 'minute' | 'second'): HTMLElement {
    const col = el('div', { class: 'vtp-column', role: 'spinbutton', 'aria-label': this.opts.locale[`${unit}sLabel` as keyof LocaleConfig] as string });

    const upBtn = el('button', { class: 'vtp-arrow vtp-arrow-up', type: 'button', 'aria-label': `Increase ${unit}` });
    upBtn.innerHTML = SVG_ARROW_UP;

    const valueBtn = el('button', { class: 'vtp-time-value', type: 'button', tabindex: '0' }, '00');
    valueBtn.setAttribute('aria-label', `${unit}, click to select from list`);

    const downBtn = el('button', { class: 'vtp-arrow vtp-arrow-down', type: 'button', 'aria-label': `Decrease ${unit}` });
    downBtn.innerHTML = SVG_ARROW_DOWN;

    const step = unit === 'hour' ? this.opts.hourStep
      : unit === 'minute' ? this.opts.minuteStep
      : (this.opts.secondStep ?? 1);

    const onChange = unit === 'hour' ? this.opts.onHourChange
      : unit === 'minute' ? this.opts.onMinuteChange
      : this.opts.onSecondChange ?? (() => {});

    const onClick = unit === 'hour' ? this.opts.onHourClick
      : unit === 'minute' ? this.opts.onMinuteClick
      : this.opts.onSecondClick ?? (() => {});

    const up = throttle(() => onChange(step), 100);
    const down = throttle(() => onChange(-step), 100);

    upBtn.addEventListener('click', up);
    downBtn.addEventListener('click', down);

    let pressTimer: ReturnType<typeof setInterval> | undefined;
    const startPress = (fn: () => void) => {
      fn();
      const timeout = setTimeout(() => {
        pressTimer = setInterval(fn, 80);
      }, 400);
      const stop = () => { clearTimeout(timeout); clearInterval(pressTimer); };
      upBtn.addEventListener('mouseup', stop, { once: true });
      upBtn.addEventListener('mouseleave', stop, { once: true });
      downBtn.addEventListener('mouseup', stop, { once: true });
      downBtn.addEventListener('mouseleave', stop, { once: true });
    };

    upBtn.addEventListener('mousedown', () => startPress(up));
    downBtn.addEventListener('mousedown', () => startPress(down));

    valueBtn.addEventListener('click', onClick);

    if (unit === 'hour') this.hourVal = valueBtn;
    else if (unit === 'minute') this.minuteVal = valueBtn;
    else this.secondVal = valueBtn;

    col.append(upBtn, valueBtn, downBtn);
    return col;
  }

  update(h: number, m: number, s: number, ampm?: 'AM' | 'PM'): void {
    this.hourVal.textContent = String(this.opts.is12h ? (h % 12 || 12) : h).padStart(2, '0');
    this.hourVal.setAttribute('aria-valuenow', String(h));
    this.minuteVal.textContent = String(m).padStart(2, '0');
    this.minuteVal.setAttribute('aria-valuenow', String(m));
    if (this.secondVal) {
      this.secondVal.textContent = String(s).padStart(2, '0');
      this.secondVal.setAttribute('aria-valuenow', String(s));
    }
    if (this.amBtn && this.pmBtn && ampm) {
      this.amBtn.classList.toggle('vtp-active', ampm === 'AM');
      this.pmBtn.classList.toggle('vtp-active', ampm === 'PM');
    }
    if (this.opts.renderCell && this.opts.format) {
      this.applyRenderCell({ h, m, s }, this.opts.format);
    }
  }

  private async applyRenderCell(parsed: { h: number; m: number; s: number }, format: string): Promise<void> {
    const seq = ++this.renderSeq;
    const timeStr = formatTime(parsed, format);
    let result: Awaited<ReturnType<NonNullable<PickerViewOptions['renderCell']>>>;
    try {
      result = await Promise.resolve(this.opts.renderCell!(timeStr));
    } catch {
      return;
    }
    if (this.renderSeq !== seq) return;

    const buttons = ([this.hourVal, this.minuteVal, this.secondVal] as Array<HTMLButtonElement | undefined>)
      .filter((b): b is HTMLButtonElement => Boolean(b));

    // Remove classes applied by the previous render
    if (this.prevCellClasses.length) {
      buttons.forEach((btn) => btn.classList.remove(...this.prevCellClasses));
    }

    const newClasses = result.className
      ? (Array.isArray(result.className) ? result.className : [result.className]).filter(Boolean)
      : [];

    buttons.forEach((btn) => {
      if (newClasses.length) btn.classList.add(...newClasses);
      if (result.title !== undefined) btn.title = result.title;
      else btn.removeAttribute('title');
    });

    this.prevCellClasses = newClasses;
  }
}
