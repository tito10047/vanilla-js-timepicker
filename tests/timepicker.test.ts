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
