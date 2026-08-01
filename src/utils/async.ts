export async function runGuard(
  guard: (() => boolean | Promise<boolean>) | undefined,
): Promise<boolean> {
  if (!guard) return true;
  return Boolean(await guard());
}

export async function runValidate(
  validate: ((v: string) => boolean | string | Promise<boolean | string>) | undefined,
  value: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!validate) return { ok: true };
  const result = await validate(value);
  if (result === true) return { ok: true };
  if (result === false) return { ok: false };
  return { ok: false, message: result as string };
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}
