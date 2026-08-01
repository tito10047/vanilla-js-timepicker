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

  // Use visualViewport when available so the dropdown is positioned relative
  // to the visible area even when the virtual keyboard has resized the viewport.
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const viewportHeight = vv ? vv.height : window.innerHeight;
  const viewportWidth  = vv ? vv.width  : window.innerWidth;
  // pageLeft/pageTop give the visual viewport origin in page (document) coordinates.
  const scrollX = vv ? vv.pageLeft : window.scrollX;
  const scrollY = vv ? vv.pageTop  : window.scrollY;

  const spaceBelow = Math.min(cr.bottom, viewportHeight) - ar.bottom;
  const spaceAbove = ar.top - Math.max(cr.top, 0);

  let placement: Placement =
    preferred === 'auto'
      ? spaceBelow >= dr.height || spaceBelow >= spaceAbove
        ? 'bottom'
        : 'top'
      : (preferred as Placement);

  let top: number;
  let left = ar.left + scrollX;

  if (placement === 'bottom') {
    top = ar.bottom + scrollY + 4;
    if (top + dr.height > scrollY + viewportHeight) {
      placement = 'top';
    }
  }

  if (placement === 'top') {
    top = ar.top + scrollY - dr.height - 4;
    if (top < scrollY) top = ar.bottom + scrollY + 4;
  }

  top ??= ar.bottom + scrollY + 4;

  // Prevent horizontal overflow within the visual viewport
  if (left + dr.width > scrollX + viewportWidth) {
    left = scrollX + viewportWidth - dr.width - 8;
  }
  if (left < scrollX) left = scrollX + 8;

  return { top, left, placement };
}
