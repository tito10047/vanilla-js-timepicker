import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from '../src/core/EventEmitter';
import { State } from '../src/core/State';

// ─── EventEmitter ─────────────────────────────────────────────────────────────

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => { emitter = new EventEmitter(); });

  it('on + emit calls handler with detail', () => {
    const handler = vi.fn();
    emitter.on('vtp:change', handler);
    emitter.emit('vtp:change', { value: '12:00' });
    expect(handler).toHaveBeenCalledWith({ value: '12:00' });
  });

  it('off removes handler', () => {
    const handler = vi.fn();
    emitter.on('vtp:change', handler);
    emitter.off('vtp:change', handler);
    emitter.emit('vtp:change', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('on returns unsubscribe function', () => {
    const handler = vi.fn();
    const unsub = emitter.on('vtp:open', handler);
    unsub();
    emitter.emit('vtp:open', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('multiple handlers for same event all called', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on('vtp:close', h1);
    emitter.on('vtp:close', h2);
    emitter.emit('vtp:close', { reason: 'escape' });
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('once fires exactly one time', () => {
    const handler = vi.fn();
    emitter.once('vtp:open', handler);
    emitter.emit('vtp:open', {});
    emitter.emit('vtp:open', {});
    expect(handler).toHaveBeenCalledOnce();
  });

  it('removeAllListeners clears all handlers for event', () => {
    const handler = vi.fn();
    emitter.on('vtp:change', handler);
    emitter.removeAllListeners('vtp:change');
    emitter.emit('vtp:change', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('emitting unknown event does not throw', () => {
    expect(() => emitter.emit('vtp:destroy', {})).not.toThrow();
  });
});

// ─── State ────────────────────────────────────────────────────────────────────

describe('State', () => {
  it('get returns initial value', () => {
    const state = new State({ hour: 0, minute: 0 });
    expect(state.get('hour')).toBe(0);
  });

  it('set updates value', () => {
    const state = new State({ hour: 0, minute: 0 });
    state.set('hour', 12);
    expect(state.get('hour')).toBe(12);
  });

  it('subscribe notified on change', () => {
    const state = new State({ hour: 0, minute: 0 });
    const cb = vi.fn();
    state.subscribe('hour', cb);
    state.set('hour', 5);
    expect(cb).toHaveBeenCalledWith(5, 0);
  });

  it('subscribe NOT notified when value unchanged', () => {
    const state = new State({ hour: 10 });
    const cb = vi.fn();
    state.subscribe('hour', cb);
    state.set('hour', 10);
    expect(cb).not.toHaveBeenCalled();
  });

  it('unsubscribe stops notifications', () => {
    const state = new State({ hour: 0 });
    const cb = vi.fn();
    const unsub = state.subscribe('hour', cb);
    unsub();
    state.set('hour', 3);
    expect(cb).not.toHaveBeenCalled();
  });

  it('patch updates multiple keys', () => {
    const state = new State({ hour: 0, minute: 0, second: 0 });
    state.patch({ hour: 11, minute: 30 });
    expect(state.get('hour')).toBe(11);
    expect(state.get('minute')).toBe(30);
    expect(state.get('second')).toBe(0);
  });

  it('getAll returns snapshot', () => {
    const state = new State({ hour: 1, minute: 2 });
    state.set('hour', 9);
    expect(state.getAll()).toEqual({ hour: 9, minute: 2 });
  });
});
