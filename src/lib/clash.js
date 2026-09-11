import { occupiedCells, cellsOverlap } from '../data/timetable';

/** All slot codes (theory + lab) a teacher occupies. */
export function teacherSlotCodes(teacher) {
  return [...(teacher.theorySlots || []), ...(teacher.labSlots || [])];
}

/** Cached occupied-cell set for a teacher. */
export function teacherCells(teacher) {
  return occupiedCells(teacherSlotCodes(teacher));
}

/** Do two teachers' schedules clash? */
export function teachersClash(a, b) {
  return cellsOverlap(teacherCells(a), teacherCells(b));
}

/** Does this teacher clash with a raw set of already-occupied cells? */
export function teacherClashesWithCells(teacher, occupied) {
  return cellsOverlap(teacherCells(teacher), occupied);
}

/** Union of occupied cells across a list of teachers (or manual slot-code lists). */
export function unionCells(items) {
  const codesLists = items.map((it) => (it.theorySlots || it.labSlots ? teacherSlotCodes(it) : it));
  const merged = new Set();
  for (const codes of codesLists) {
    for (const c of occupiedCells(codes)) merged.add(c);
  }
  return merged;
}
