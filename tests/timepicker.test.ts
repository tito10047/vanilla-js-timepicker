import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timepicker } from '../src/core/Timepicker';

function makeInput(value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  document.body.appendChild(input);
  return input;
}

let tp: Timepicker;
let input: HTMLInputElement;

beforeEach(() => {
  input = makeInput();
  tp = new Timepicker(input, { format: 'HH:mm', minuteStep: 5 });
});

afterEach(() => {
  tp.destroy();
  document.body.innerHTML = '';
});

// ─── Constructor ──────────────────────────────────────────────────────────────

describe('constructor', () => {
  it('accepts HTMLInputElement', () => {
    expect(tp).toBeInstanceOf(Timepicker);
  });

  it('accepts CSS selector string', () => {
    input.id = 'tp-test';
    const tp2 = new Timepicker('#tp-test');
    expect(tp2).toBeInstanceOf(Timepicker);
    tp2.destroy();
  });

  it('throws when selector not found', () => {
    expect(() => new Timepicker('#does-not-exist')).toThrow();
  });

  it('applies defaultValue to input', () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { defaultValue: '09:30' });
    expect(inp.value).toBe('09:30');
    tp2.destroy();
  });

  it('applies value option over defaultValue', () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { defaultValue: '09:30', value: '11:00' });
    expect(inp.value).toBe('11:00');
    tp2.destroy();
  });
});

// ─── getValue / setValue ──────────────────────────────────────────────────────

describe('getValue / setValue', () => {
  it('getValue returns empty string initially', () => {
    expect(tp.getValue()).toBe('');
  });

  it('setValue updates input and getValue', async () => {
    await tp.setValue('14:30');
    expect(tp.getValue()).toBe('14:30');
    expect(input.value).toBe('14:30');
  });

  it('setValue null clears input', async () => {
    await tp.setValue('10:00');
    await tp.setValue(null);
    expect(tp.getValue()).toBe('');
  });

  it('setValue fires vtp:change CustomEvent on input', async () => {
    const handler = vi.fn();
    input.addEventListener('vtp:change', handler);
    await tp.setValue('08:00');
    expect(handler).toHaveBeenCalledOnce();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.value).toBe('08:00');
    expect(detail.prev).toBe('');
  });

  it('setValue calls onChange callback', async () => {
    const onChange = vi.fn();
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { onChange });
    await tp2.setValue('11:11');
    expect(onChange).toHaveBeenCalledWith('11:11', expect.objectContaining({ value: '11:11' }));
    tp2.destroy();
  });

  it('setValue with invalid time fires vtp:invalid', async () => {
    const handler = vi.fn();
    input.addEventListener('vtp:invalid', handler);
    await tp.setValue('25:00');
    expect(handler).toHaveBeenCalledOnce();
    expect(tp.getValue()).toBe('');
  });
});

// ─── clear / setNow ──────────────────────────────────────────────────────────

describe('clear', () => {
  it('clears input value', async () => {
    await tp.setValue('12:00');
    await tp.clear();
    expect(tp.getValue()).toBe('');
  });
});

describe('setNow', () => {
  it('sets current time in HH:mm format', async () => {
    await tp.setNow();
    expect(tp.getValue()).toMatch(/^\d{2}:\d{2}$/);
  });
});

// ─── open / close ─────────────────────────────────────────────────────────────

describe('open / close', () => {
  it('isOpen() is false initially', () => {
    expect(tp.isOpen()).toBe(false);
  });

  it('open() sets isOpen true and dispatches vtp:open', async () => {
    const handler = vi.fn();
    input.addEventListener('vtp:open', handler);
    await tp.open();
    expect(tp.isOpen()).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('close() sets isOpen false and dispatches vtp:close', async () => {
    await tp.open();
    const handler = vi.fn();
    input.addEventListener('vtp:close', handler);
    await tp.close();
    expect(tp.isOpen()).toBe(false);
    expect(handler).toHaveBeenCalledOnce();
    expect((handler.mock.calls[0][0] as CustomEvent).detail.reason).toBe('api');
  });

  it('toggle opens when closed', async () => {
    await tp.toggle();
    expect(tp.isOpen()).toBe(true);
  });

  it('toggle closes when open', async () => {
    await tp.open();
    await tp.toggle();
    expect(tp.isOpen()).toBe(false);
  });

  it('double open does not dispatch vtp:open twice', async () => {
    const handler = vi.fn();
    input.addEventListener('vtp:open', handler);
    await tp.open();
    await tp.open();
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ─── Async guards ─────────────────────────────────────────────────────────────

describe('async onBeforeOpen guard', () => {
  it('prevents open when guard returns false', async () => {
    const tp2 = new Timepicker(makeInput(), {
      onBeforeOpen: async () => false,
    });
    await tp2.open();
    expect(tp2.isOpen()).toBe(false);
    tp2.destroy();
  });

  it('allows open when guard returns true', async () => {
    const tp2 = new Timepicker(makeInput(), {
      onBeforeOpen: async () => true,
    });
    await tp2.open();
    expect(tp2.isOpen()).toBe(true);
    tp2.destroy();
  });
});

describe('async onBeforeChange guard', () => {
  it('prevents setValue when guard returns false', async () => {
    const tp2 = new Timepicker(makeInput(), {
      onBeforeChange: async () => false,
    });
    await tp2.setValue('09:00');
    expect(tp2.getValue()).toBe('');
    tp2.destroy();
  });

  it('allows setValue when guard returns true', async () => {
    const tp2 = new Timepicker(makeInput(), {
      onBeforeChange: async () => true,
    });
    await tp2.setValue('09:00');
    expect(tp2.getValue()).toBe('09:00');
    tp2.destroy();
  });
});

describe('async validate', () => {
  it('rejects value when validate returns string error', async () => {
    const tp2 = new Timepicker(makeInput(), {
      validate: async (v) => v === '00:00' ? 'midnight not allowed' : true,
    });
    const onInvalid = vi.fn();
    tp2.on('vtp:invalid', onInvalid);
    await tp2.setValue('00:00');
    expect(tp2.getValue()).toBe('');
    expect(onInvalid).toHaveBeenCalledOnce();
    tp2.destroy();
  });

  it('accepts valid value when validate returns true', async () => {
    const tp2 = new Timepicker(makeInput(), {
      validate: async () => true,
    });
    await tp2.setValue('08:00');
    expect(tp2.getValue()).toBe('08:00');
    tp2.destroy();
  });
});

// ─── minTime / maxTime ────────────────────────────────────────────────────────

describe('minTime / maxTime', () => {
  it('rejects value below minTime', async () => {
    const tp2 = new Timepicker(makeInput(), { minTime: '08:00' });
    await tp2.setValue('07:59');
    expect(tp2.getValue()).toBe('');
  });

  it('rejects value above maxTime', async () => {
    const tp2 = new Timepicker(makeInput(), { maxTime: '17:00' });
    await tp2.setValue('17:01');
    expect(tp2.getValue()).toBe('');
  });

  it('accepts boundary values', async () => {
    const tp2 = new Timepicker(makeInput(), { minTime: '08:00', maxTime: '17:00' });
    await tp2.setValue('08:00');
    expect(tp2.getValue()).toBe('08:00');
    await tp2.setValue('17:00');
    expect(tp2.getValue()).toBe('17:00');
  });
});

// ─── vtp-invalid class lifecycle ──────────────────────────────────────────────

describe('vtp-invalid class is removed when value becomes valid', () => {
  it('adds vtp-invalid on out-of-range setValue', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { minTime: '09:00', maxTime: '14:00' });
    await tp2.setValue('08:00');
    expect(inp.classList.contains('vtp-invalid')).toBe(true);
    tp2.destroy();
  });

  it('removes vtp-invalid when setValue succeeds after a prior rejection', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { minTime: '09:00', maxTime: '14:00' });
    await tp2.setValue('08:00'); // rejected → class added
    await tp2.setValue('10:00'); // accepted → class must be removed
    expect(inp.classList.contains('vtp-invalid')).toBe(false);
    tp2.destroy();
  });

  it('removes vtp-invalid when clear() is called after a prior rejection', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { minTime: '09:00' });
    await tp2.setValue('08:00');
    expect(inp.classList.contains('vtp-invalid')).toBe(true);
    await tp2.clear();
    expect(inp.classList.contains('vtp-invalid')).toBe(false);
    tp2.destroy();
  });

  it('removes vtp-invalid when validate passes after rejection', async () => {
    const inp = makeInput();
    let block = true;
    const tp2 = new Timepicker(inp, {
      validate: (v) => (block ? 'blocked' : true),
    });
    await tp2.setValue('10:00'); // rejected by validate
    expect(inp.classList.contains('vtp-invalid')).toBe(true);
    block = false;
    await tp2.setValue('10:00'); // now passes
    expect(inp.classList.contains('vtp-invalid')).toBe(false);
    tp2.destroy();
  });
});

// ─── destroy ─────────────────────────────────────────────────────────────────

describe('destroy', () => {
  it('fires vtp:destroy event', () => {
    const handler = vi.fn();
    input.addEventListener('vtp:destroy', handler);
    tp.destroy();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('closes picker if open', async () => {
    await tp.open();
    tp.destroy();
    expect(tp.isOpen()).toBe(false);
  });
});

// ─── on / off ─────────────────────────────────────────────────────────────────

describe('on / off instance methods', () => {
  it('on subscribes to internal event', async () => {
    const handler = vi.fn();
    tp.on('vtp:change', handler);
    await tp.setValue('13:00');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('off unsubscribes', async () => {
    const handler = vi.fn();
    tp.on('vtp:change', handler);
    tp.off('vtp:change', handler);
    await tp.setValue('13:00');
    expect(handler).not.toHaveBeenCalled();
  });

  it('on returns unsubscribe', async () => {
    const handler = vi.fn();
    const unsub = tp.on('vtp:change', handler);
    unsub();
    await tp.setValue('13:00');
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── getDate ─────────────────────────────────────────────────────────────────

describe('getDate', () => {
  it('returns null when no value', () => {
    expect(tp.getDate()).toBeNull();
  });

  it('returns Date with correct hours/minutes after setValue', async () => {
    await tp.setValue('14:30');
    const d = tp.getDate();
    expect(d).toBeInstanceOf(Date);
    expect(d!.getHours()).toBe(14);
    expect(d!.getMinutes()).toBe(30);
  });
});

// ─── renderCell in picker (spinner) view ─────────────────────────────────────

/** Flush all pending microtasks so async applyRenderCell finishes. */
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('renderCell in picker (spinner) view', () => {
  it('is called with the formatted time when the picker opens', async () => {
    const renderCell = vi.fn().mockResolvedValue({});
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', renderCell });
    await tp2.setValue('09:30');
    await tp2.open();
    await flush();
    expect(renderCell).toHaveBeenCalledWith('09:30');
    tp2.destroy();
  });

  it('applies className to all vtp-time-value buttons', async () => {
    const renderCell = vi.fn().mockResolvedValue({ className: 'slot-busy' });
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', renderCell });
    await tp2.setValue('14:00');
    await tp2.open();
    await flush();
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.vtp-time-value'));
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.classList.contains('slot-busy'))).toBe(true);
    tp2.destroy();
  });

  it('applies multiple classes passed as an array', async () => {
    const renderCell = vi.fn().mockResolvedValue({ className: ['class-a', 'class-b'] });
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', renderCell });
    await tp2.setValue('10:00');
    await tp2.open();
    await flush();
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.vtp-time-value'));
    expect(buttons.every((b) => b.classList.contains('class-a') && b.classList.contains('class-b'))).toBe(true);
    tp2.destroy();
  });

  it('applies title to all vtp-time-value buttons', async () => {
    const renderCell = vi.fn().mockResolvedValue({ title: 'This slot is occupied' });
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', renderCell });
    await tp2.setValue('09:00');
    await tp2.open();
    await flush();
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.vtp-time-value'));
    expect(buttons.every((b) => b.title === 'This slot is occupied')).toBe(true);
    tp2.destroy();
  });

  it('removes previous class when value changes while picker is open', async () => {
    let call = 0;
    const renderCell = vi.fn().mockImplementation(async () => {
      call++;
      return call === 1 ? { className: 'first-class' } : { className: 'second-class' };
    });
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', renderCell });
    await tp2.setValue('09:00');
    await tp2.open();
    await flush();

    await tp2.setValue('10:00');
    await flush();

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.vtp-time-value'));
    expect(buttons.every((b) => !b.classList.contains('first-class'))).toBe(true);
    expect(buttons.every((b) => b.classList.contains('second-class'))).toBe(true);
    tp2.destroy();
  });

  it('discards stale result when a newer update arrives before the first resolves', async () => {
    let resolveFirst!: (v: { className: string }) => void;
    const slowFirst = new Promise<{ className: string }>((r) => { resolveFirst = r; });
    let call = 0;

    const renderCell = vi.fn().mockImplementation(() => {
      call++;
      return call === 1 ? slowFirst : Promise.resolve({ className: 'second-class' });
    });

    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', renderCell });
    await tp2.setValue('09:00');
    await tp2.open();      // triggers call #1 (slow)
    await tp2.setValue('10:00'); // triggers call #2 (fast)
    await flush();         // call #2 resolves, 'second-class' applied

    resolveFirst({ className: 'stale-class' }); // call #1 resolves late
    await flush();         // stale result must be discarded

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.vtp-time-value'));
    expect(buttons.every((b) => b.classList.contains('second-class'))).toBe(true);
    expect(buttons.every((b) => !b.classList.contains('stale-class'))).toBe(true);
    tp2.destroy();
  });

  it('does not apply anything when renderCell returns empty result', async () => {
    const renderCell = vi.fn().mockResolvedValue({});
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', renderCell });
    await tp2.setValue('12:00');
    await tp2.open();
    await flush();
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.vtp-time-value'));
    expect(buttons.every((b) => b.classList.length === 1)).toBe(true); // only 'vtp-time-value'
    tp2.destroy();
  });
});

// ─── helpers shared by the two bug-fix suites ────────────────────────────────

function hourValueBtn(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>('.vtp-time-value')!;
}
function gridCells(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('.vtp-cell'));
}
function cellWithText(text: string): HTMLButtonElement {
  return gridCells().find((c) => c.textContent?.trim() === text)!;
}

// ─── Bug 1: 12h hours grid must show 1–12, not 0–23 ─────────────────────────

describe('12h mode — hours grid shows 1–12 not 0–23', () => {
  it('renders 12 cells valued 1–12 for hh:mm a format', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'hh:mm a' });
    await tp2.open();
    hourValueBtn().click();
    await flush();
    const cells = gridCells();
    expect(cells.length).toBe(12);
    expect(cells.map((c) => Number(c.textContent?.trim()))).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
    tp2.destroy();
  });

  it('renders 24 cells valued 0–23 for HH:mm format', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm' });
    await tp2.open();
    hourValueBtn().click();
    await flush();
    expect(gridCells().length).toBe(24);
    tp2.destroy();
  });

  it('selecting "03" while AM sets internal hour to 3', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'hh:mm a' });
    await tp2.setValue('03:00'); // 3 AM — parser strips non-digits → h=3
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('03').click();
    await flush();
    expect(tp2.getDate()!.getHours()).toBe(3);
    tp2.destroy();
  });

  it('selecting "03" while PM sets internal hour to 15', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'hh:mm a' });
    await tp2.setValue('15:00'); // 3 PM in 24h → displayed as 03:00 PM
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('03').click();
    await flush();
    expect(tp2.getDate()!.getHours()).toBe(15);
    tp2.destroy();
  });

  it('selecting "12" while AM sets internal hour to 0 (midnight)', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'hh:mm a' });
    await tp2.setValue('00:00'); // midnight
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('12').click();
    await flush();
    expect(tp2.getDate()!.getHours()).toBe(0);
    tp2.destroy();
  });

  it('selecting "12" while PM sets internal hour to 12 (noon)', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'hh:mm a' });
    await tp2.setValue('12:00'); // noon
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('12').click();
    await flush();
    expect(tp2.getDate()!.getHours()).toBe(12);
    tp2.destroy();
  });
});

// ─── Bug 2: grid hour selection must update the input immediately ─────────────

describe('grid hour selection updates the input immediately', () => {
  it('getValue() returns new value after clicking hour cell', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', minuteStep: 5 });
    await tp2.setValue('09:30');
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('14').click();
    await flush();
    expect(tp2.getValue()).toBe('14:30');
    tp2.destroy();
  });

  it('native input.value is updated after clicking hour cell', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm' });
    await tp2.setValue('08:00');
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('11').click();
    await flush();
    expect(inp.value).toBe('11:00');
    tp2.destroy();
  });

  it('onChange fires when hour is picked from the grid', async () => {
    const onChange = vi.fn();
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm', onChange });
    await tp2.setValue('09:00');
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('10').click();
    await flush();
    expect(onChange).toHaveBeenCalledWith(
      '10:00',
      expect.objectContaining({ value: '10:00' }),
    );
    tp2.destroy();
  });

  it('dropdown stays open after hour selection so user can pick minutes', async () => {
    const inp = makeInput();
    const tp2 = new Timepicker(inp, { format: 'HH:mm' });
    await tp2.setValue('09:00');
    await tp2.open();
    hourValueBtn().click();
    await flush();
    cellWithText('14').click();
    await flush();
    expect(tp2.isOpen()).toBe(true);
    tp2.destroy();
  });
});
