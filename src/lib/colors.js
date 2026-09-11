const LINE_COUNT = 8;

/** Subject colors, assigned in fixed creation order (never re-cycled on delete). */
export function colorForIndex(idx) {
  const slot = ((idx % LINE_COUNT) + LINE_COUNT) % LINE_COUNT;
  return `var(--line-${slot + 1})`;
}
