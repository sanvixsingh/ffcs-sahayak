import { teacherCells, teacherSlotCodes } from './clash';
import { cellsOverlap } from '../data/timetable';

const DEFAULT_PRIORITY = 999; // teachers with no priority set rank behind prioritized ones

function priorityOf(teacher) {
  return Number.isFinite(teacher.priority) ? teacher.priority : DEFAULT_PRIORITY;
}

/**
 * Generates every clash-free way to pick exactly one teacher per subject.
 * Subjects with zero teachers are skipped (nothing to choose yet).
 * Backtracks with pruning, so it stays fast for realistic FFCS sizes
 * (a handful of subjects, a handful of teacher options each). `limit`
 * caps runaway combinatorics if someone adds an unusually large number
 * of options.
 */
export function generateCombinations(subjects, { limit = 3000 } = {}) {
  const activeSubjects = subjects.filter((s) => (s.teachers || []).length > 0);
  const n = activeSubjects.length;
  const choice = new Array(n);
  const combos = [];
  let truncated = false;

  // Precompute each teacher's occupied cells once.
  const cellsByTeacher = new Map();
  for (const subject of activeSubjects) {
    for (const teacher of subject.teachers) {
      cellsByTeacher.set(teacher.id, teacherCells(teacher));
    }
  }

  function backtrack(i, occupiedSoFar) {
    if (combos.length >= limit) {
      truncated = true;
      return;
    }
    if (i === n) {
      combos.push(choice.slice());
      return;
    }
    for (const teacher of activeSubjects[i].teachers) {
      const tCells = cellsByTeacher.get(teacher.id);
      if (!cellsOverlap(tCells, occupiedSoFar)) {
        choice[i] = teacher;
        const merged = new Set(occupiedSoFar);
        for (const c of tCells) merged.add(c);
        backtrack(i + 1, merged);
        if (combos.length >= limit) return;
      }
    }
  }

  backtrack(0, new Set());

  return { subjects: activeSubjects, combos, truncated, skipped: subjects.length - activeSubjects.length };
}

/**
 * Rebuilds the subject list with any locked choice collapsed to a single option,
 * so the same generator can answer "what's still possible from here?".
 * `lockedTeacherFor(subject)` returns a teacher-shaped object or null.
 */
export function constrainSubjects(subjects, lockedTeacherFor) {
  return subjects.map((s) => {
    const locked = lockedTeacherFor(s);
    return locked ? { ...s, teachers: [locked] } : s;
  });
}

/** How many complete clash-free timetables are still reachable. Capped by `limit`. */
export function countCombinations(subjects, { limit = 5000 } = {}) {
  const { combos, truncated } = generateCombinations(subjects, { limit });
  return { count: combos.length, truncated };
}

/** Fast yes/no: does at least one complete clash-free timetable exist? */
export function isFeasible(subjects) {
  return generateCombinations(subjects, { limit: 1 }).combos.length > 0;
}

/** Total priority score for a combo — lower is "better" (more preferred teachers). */
export function comboScore(combo) {
  return combo.reduce((sum, teacher) => sum + priorityOf(teacher), 0);
}

/** Combos sorted best-first by priority score (stable: ties keep original order). */
export function rankCombinations(combos) {
  return combos
    .map((combo, idx) => ({ combo, idx, score: comboScore(combo) }))
    .sort((a, b) => a.score - b.score || a.idx - b.idx)
    .map((x) => x.combo);
}

/** True if any teacher in the combo has an explicit priority set. */
export function hasAnyPriority(combo) {
  return combo.some((t) => Number.isFinite(t.priority));
}

export { teacherSlotCodes };
