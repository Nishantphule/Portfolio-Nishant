export type Box = { x: number; y: number; w: number; h: number };

export function placeNear(
  anchor: Box,
  size: { w: number; h: number },
  bounds: Box,
  margin = 12,
): { x: number; y: number } {
  let x = anchor.x + anchor.w + 12;
  let y = anchor.y + anchor.h / 2 - size.h / 2;

  if (x + size.w > bounds.x + bounds.w - margin) x = anchor.x - size.w - 12;
  if (x < bounds.x + margin) x = anchor.x + anchor.w + 12;

  if (y < bounds.y + margin) y = anchor.y + anchor.h + 10;
  if (y + size.h > bounds.y + bounds.h - margin) y = anchor.y - size.h - 10;

  x = Math.min(bounds.x + bounds.w - margin - size.w, Math.max(bounds.x + margin, x));
  y = Math.min(bounds.y + bounds.h - margin - size.h, Math.max(bounds.y + margin, y));
  return { x, y };
}
