import { el } from './templates';
import type { LocaleConfig } from '../core/types';

export interface CellData {
  className?: string | string[];
  clickable?: boolean;
  title?: string;
}

export interface GridViewOptions {
  locale: LocaleConfig;
  items: number[];
  selected: number;
  disabled?: number[];
  cellData?: CellData[];
  onSelect: (value: number) => void;
  onBack: () => void;
  label: string;
  pad?: boolean;
}

export class GridView {
  readonly root: HTMLElement;
  private cells: HTMLButtonElement[] = [];

  constructor(private opts: GridViewOptions) {
    this.root = this.build();
  }

  private build(): HTMLElement {
    const wrap = el('div', {});

    const header = el('div', { class: 'vtp-header' });
    const backBtn = el('button', { class: 'vtp-back-btn', type: 'button', 'aria-label': 'Back' }, '‹');
    backBtn.addEventListener('click', () => this.opts.onBack());
    const title = el('span', { class: 'vtp-title' }, this.opts.label);
    header.append(backBtn, title);

    const isHours = this.opts.label.toLowerCase().includes('hod') || this.opts.items.length === 24;
    const gridClass = isHours ? 'vtp-grid-hours' : 'vtp-grid-minutes';

    const grid = el('div', {
      class: `vtp-grid ${gridClass}`,
      role: 'grid',
      'aria-label': this.opts.label,
    });

    this.cells = this.opts.items.map((val, idx) => {
      const data = this.opts.cellData?.[idx];
      const isDisabledByList = this.opts.disabled?.includes(val) ?? false;
      const isDisabledByData = data?.clickable === false;
      const isDisabled = isDisabledByList || isDisabledByData;
      const isSelected = val === this.opts.selected;
      const display = this.opts.pad !== false ? String(val).padStart(2, '0') : String(val);

      const cell = el('button', {
        class: 'vtp-cell',
        type: 'button',
        role: 'gridcell',
        'aria-selected': String(isSelected),
        'aria-disabled': String(isDisabled),
        'aria-label': data?.title ?? display,
        tabindex: isSelected ? '0' : '-1',
      }, display);

      if (data?.title) cell.title = data.title;

      if (data?.className) {
        const classes = Array.isArray(data.className) ? data.className : [data.className];
        cell.classList.add(...classes);
      }

      cell.addEventListener('click', () => {
        if (!isDisabled) this.opts.onSelect(val);
      });

      return cell;
    });

    // cells are direct children of grid — CSS grid layout requires this
    grid.append(...this.cells);
    wrap.append(header, grid);
    return wrap;
  }

  updateSelected(value: number): void {
    this.cells.forEach((cell, i) => {
      const isSelected = this.opts.items[i] === value;
      cell.setAttribute('aria-selected', String(isSelected));
      cell.tabIndex = isSelected ? 0 : -1;
    });
    this.opts.selected = value;
  }

  focus(): void {
    const selected = this.cells.find((c) => c.getAttribute('aria-selected') === 'true');
    (selected ?? this.cells[0])?.focus();
  }
}
