export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Placement {
  top: number;
  left: number;
  width: number;
}

export const compactBreakpoint = 640;
const gap = 16;
const margin = 16;
const cardWidth = 360;

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), Math.max(low, high));
}

export function placeCard(target: Box | null, cardHeight: number, viewport: Size): Placement {
  if (viewport.width < compactBreakpoint) {
    const width = viewport.width - margin * 2;
    const nearBottom = target !== null && target.top + target.height / 2 > viewport.height / 2;
    return { top: nearBottom ? margin : viewport.height - cardHeight - margin, left: margin, width };
  }
  const width = Math.min(cardWidth, viewport.width - margin * 2);
  if (target === null) {
    return { top: (viewport.height - cardHeight) / 2, left: (viewport.width - width) / 2, width };
  }
  const left = clamp(target.left + target.width / 2 - width / 2, margin, viewport.width - width - margin);
  const below = target.top + target.height + gap;
  if (below + cardHeight <= viewport.height - margin) {
    return { top: below, left, width };
  }
  const above = target.top - gap - cardHeight;
  if (above >= margin) {
    return { top: above, left, width };
  }
  const beside = target.left + target.width + gap;
  if (beside + width <= viewport.width - margin) {
    return { top: clamp(target.top, margin, viewport.height - cardHeight - margin), left: beside, width };
  }
  return { top: clamp(viewport.height - cardHeight - margin, margin, viewport.height), left, width };
}
