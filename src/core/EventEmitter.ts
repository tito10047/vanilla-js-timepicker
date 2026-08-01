import type { TimepickerEventName } from './types';

type Handler<T = unknown> = (detail: T) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<Handler>>();

  on<T = unknown>(event: TimepickerEventName, handler: Handler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Handler);
    return () => this.off(event, handler);
  }

  once<T = unknown>(event: TimepickerEventName, handler: Handler<T>): () => void {
    const wrapper: Handler = (detail) => {
      (handler as Handler)(detail);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper as Handler<T>);
  }

  off<T = unknown>(event: TimepickerEventName, handler: Handler<T>): void {
    this.listeners.get(event)?.delete(handler as Handler);
  }

  emit<T = unknown>(event: TimepickerEventName, detail: T): void {
    this.listeners.get(event)?.forEach((h) => h(detail));
  }

  removeAllListeners(event?: TimepickerEventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
