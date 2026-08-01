const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function createFocusTrap(container: HTMLElement): { activate: () => void; deactivate: () => void } {
  let enabled = false;

  function handleKeydown(e: KeyboardEvent) {
    if (!enabled || e.key !== 'Tab') return;
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  document.addEventListener('keydown', handleKeydown);

  return {
    activate() { enabled = true; },
    deactivate() {
      enabled = false;
      document.removeEventListener('keydown', handleKeydown);
    },
  };
}
