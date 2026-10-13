interface Point {
  x: number;
  y: number;
}
interface Size {
  width: number;
  height: number;
}

/** Flip at the pointer, then clamp so rapid movement cannot leave the viewport. */
export function clampMenuPreview(
  pointer: Point,
  size: Size,
  viewport: Size,
): Point {
  const gutter = 16;
  const offset = 24;
  const preferredX =
    pointer.x + offset + size.width > viewport.width - gutter
      ? pointer.x - size.width - offset
      : pointer.x + offset;
  const preferredY =
    pointer.y + offset + size.height > viewport.height - gutter
      ? pointer.y - size.height - offset
      : pointer.y + offset;
  return {
    x: Math.max(
      gutter,
      Math.min(preferredX, viewport.width - size.width - gutter),
    ),
    y: Math.max(
      gutter,
      Math.min(preferredY, viewport.height - size.height - gutter),
    ),
  };
}

/** The last heading above the sticky bar remains active until the next arrives. */
export function findActiveCategory(
  sections: { id: string; top: number }[],
  navigationBottom: number,
  anchorOffset?: { scrollMarginTop: number; scrollPaddingTop: number },
): string | null {
  // Native anchors combine both CSS offsets. Include a small reveal grace so
  // a heading entering with a transform already identifies its own category.
  const threshold = Math.max(
    navigationBottom,
    anchorOffset
      ? anchorOffset.scrollMarginTop + anchorOffset.scrollPaddingTop + 16
      : navigationBottom,
  );
  let active = sections[0]?.id ?? null;
  let nearestTop = -Infinity;
  for (const section of sections) {
    if (section.top <= threshold && section.top > nearestTop) {
      nearestTop = section.top;
      active = section.id;
    }
  }
  return active;
}
