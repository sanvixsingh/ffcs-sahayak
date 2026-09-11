import { occupiedCells, cellsOverlap, SLOT_MAP } from '../data/timetable';
import { teacherSlotCodes } from './clash';

/** Turns a lock record into a { cells, label, teacher } descriptor for grid/clash use. */
export function describeLock(lock, subject) {
  if (!lock) return null;
  if (lock.type === 'teacher') {
    const teacher = subject.teachers.find((t) => t.id === lock.teacherId);
    if (!teacher) return null;
    return { cells: occupiedCells(teacherSlotCodes(teacher)), label: teacher.name, teacher };
  }
  if (lock.type === 'manual') {
    const codes = lock.codes || [];
    const theorySlots = codes.filter((c) => SLOT_MAP[c]?.kind === 'theory');
    const labSlots = codes.filter((c) => SLOT_MAP[c]?.kind === 'lab' || (!SLOT_MAP[c] && c.startsWith('L')));
    const pseudoTeacher = { id: 'manual', name: 'Actual slot taken', theorySlots, labSlots, venue: '' };
    return { cells: occupiedCells(codes), label: 'the slot you actually took', teacher: pseudoTeacher };
  }
  return null;
}

/** Union of cells from every locked subject except `excludeSubjectId`, plus a lookup of which subject/label owns each cell. */
export function occupiedByOthers(subjects, locks, excludeSubjectId) {
  const cells = new Set();
  const owners = []; // { subjectName, label, cells }
  for (const s of subjects) {
    if (s.id === excludeSubjectId) continue;
    const lock = locks[s.id];
    if (!lock) continue;
    const desc = describeLock(lock, s);
    if (!desc) continue;
    owners.push({ subjectName: s.name, label: desc.label, cells: desc.cells });
    for (const c of desc.cells) cells.add(c);
  }
  return { cells, owners };
}

/** Which locked subject (if any) clashes with the given cell set — for a helpful message. */
export function findClashOwner(cells, owners) {
  for (const owner of owners) {
    if (cellsOverlap(cells, owner.cells)) return owner;
  }
  return null;
}
