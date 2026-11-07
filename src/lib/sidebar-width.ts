export const defaultSidebarWidth = 240;
export const minSidebarWidth = 200;
export const maxSidebarWidth = 420;
export const keyboardStep = 16;

export function clampSidebarWidth(width: number, viewportWidth: number): number {
  const ceiling = Math.max(minSidebarWidth, Math.min(maxSidebarWidth, Math.floor(viewportWidth * 0.45)));
  if (!Number.isFinite(width)) {
    return defaultSidebarWidth;
  }
  return Math.min(ceiling, Math.max(minSidebarWidth, Math.round(width)));
}
