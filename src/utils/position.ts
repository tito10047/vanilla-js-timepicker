export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface PositionResult {
  top: number;
  left: number;
  placement: Placement;
}

export function computePosition(
  anchor: HTMLElement,
  dropdown: HTMLElement,
  preferred: Placement | 'auto' = 'auto',
  container: HTMLElement = document.body,
): PositionResult {
  const ar = anchor.getBoundingClientRect();
  const dr = dropdown.getBoundingClientRect();
  const cr = container.getBoundingClientRect?.() ?? { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth };

  const spaceBelow = cr.bottom - ar.bottom;
  const spaceAbove = ar.top - cr.top;

  let placement: Placement =
    preferred === 'auto'
      ? spaceBelow >= dr.height || spaceBelow >= spaceAbove
        ? 'bottom'
        : 'top'
      : (preferred as Placement);

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let top: number;
  let left = ar.left + scrollX;

  if (placement === 'bottom') {
    top = ar.bottom + scrollY + 4;
    if (top + dr.height > scrollY + window.innerHeight) {
      placement = 'top';
    }
  }

  if (placement === 'top') {
    top = ar.top + scrollY - dr.height - 4;
    if (top < scrollY) top = ar.bottom + scrollY + 4;
  }

  top ??= ar.bottom + scrollY + 4;

  // Prevent horizontal overflow
  if (left + dr.width > scrollX + window.innerWidth) {
    left = scrollX + window.innerWidth - dr.width - 8;
  }
  if (left < scrollX) left = scrollX + 8;

  return { top, left, placement };
}
