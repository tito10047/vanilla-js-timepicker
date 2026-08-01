export type KeyAction = 'increment' | 'decrement' | 'increment-large' | 'decrement-large' | 'min' | 'max' | 'close' | 'confirm' | 'next-col' | 'prev-col';

const KEY_MAP: Record<string, KeyAction> = {
  ArrowUp: 'increment',
  ArrowDown: 'decrement',
  PageUp: 'increment-large',
  PageDown: 'decrement-large',
  Home: 'min',
  End: 'max',
  Escape: 'close',
  Enter: 'confirm',
  ArrowRight: 'next-col',
  ArrowLeft: 'prev-col',
};

export function resolveKeyAction(e: KeyboardEvent): KeyAction | null {
  return KEY_MAP[e.key] ?? null;
}
