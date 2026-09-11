import { DAYS, SLOT_MAP } from '../data/timetable';
import { teacherSlotCodes } from './clash';

const MORNING_PERIODS = new Set([0, 1, 2, 3, 4]);

/**
 * Descriptive stats for a combination — used only for optional filtering and
 * display. Nothing here constrains what the generator produces: a student who
 * ends up with a mixed morning/evening pattern still gets their timetable.
 */
export function comboStats(combo) {
  const dayUse = new Map(DAYS.map((d) => [d, 0]));
  let theoryMorning = 0;
  let theoryEvening = 0;

  for (const teacher of combo) {
    for (const code of teacherSlotCodes(teacher)) {
      const entry = SLOT_MAP[code];
      if (!entry) continue;
      for (const occ of entry.occurrences) {
        dayUse.set(occ.day, (dayUse.get(occ.day) || 0) + occ.periods.length);
        if (entry.kind === 'theory') {
          if (MORNING_PERIODS.has(occ.periods[0])) theoryMorning += 1;
          else theoryEvening += 1;
        }
      }
    }
  }

  const freeDays = DAYS.filter((d) => (dayUse.get(d) || 0) === 0);
  let pattern = 'mixed';
  if (theoryEvening === 0 && theoryMorning > 0) pattern = 'morning';
  else if (theoryMorning === 0 && theoryEvening > 0) pattern = 'evening';

  return { freeDays, freeDayCount: freeDays.length, pattern, theoryMorning, theoryEvening };
}

export function matchesFilters(combo, { pattern = 'any', minFreeDays = 0 }) {
  const stats = comboStats(combo);
  if (pattern !== 'any' && stats.pattern !== pattern) return false;
  if (stats.freeDayCount < minFreeDays) return false;
  return true;
}
