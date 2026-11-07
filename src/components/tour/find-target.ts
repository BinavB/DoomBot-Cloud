import type { Box } from "@/lib/tour/placement";

const holePadding = 6;

function isOnScreen(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
}

export function findTargetBox(names: string[]): Box | null {
  for (const name of names) {
    for (const element of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
      const rect = element.getBoundingClientRect();
      if (isOnScreen(rect)) {
        return {
          top: rect.top - holePadding,
          left: rect.left - holePadding,
          width: rect.width + holePadding * 2,
          height: rect.height + holePadding * 2,
        };
      }
    }
  }
  return null;
}
