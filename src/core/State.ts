type Callback<T> = (next: T, prev: T) => void;

export class State<T extends Record<string, unknown> = Record<string, unknown>> {
  private data: T;
  private subs = new Map<keyof T, Set<Callback<unknown>>>();

  constructor(initial: T) {
    this.data = { ...initial };
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    if (this.data[key] === value) return;
    const prev = this.data[key];
    this.data[key] = value;
    this.subs.get(key)?.forEach((cb) => cb(value, prev));
  }

  patch(partial: Partial<T>): void {
    for (const key of Object.keys(partial) as (keyof T)[]) {
      if (partial[key] !== undefined) {
        this.set(key, partial[key] as T[typeof key]);
      }
    }
  }

  getAll(): T {
    return { ...this.data };
  }

  subscribe<K extends keyof T>(key: K, cb: Callback<T[K]>): () => void {
    if (!this.subs.has(key)) this.subs.set(key, new Set());
    this.subs.get(key)!.add(cb as Callback<unknown>);
    return () => this.subs.get(key)?.delete(cb as Callback<unknown>);
  }
}
