import { DAYS, SLOT_MAP } from '../data/timetable';
import { teacherSlotCodes } from './clash';

/**
 * Builds a day -> period -> cell-info map for a set of {subjectName, teacher}
 * entries, so a weekly grid can be rendered. A period spanned by a 2-hour lab
 * gets the same cell repeated with `span` marking the first period of the block.
 */
export function buildWeekGrid(entries) {
  // entries: [{ subjectName, teacher }]
  const grid = {};
  for (const day of DAYS) grid[day] = {};

  for (const { subjectName, teacher } of entries) {
    if (!teacher) continue;
    for (const code of teacherSlotCodes(teacher)) {
      const entry = SLOT_MAP[code];
      if (!entry) continue;
      for (const occ of entry.occurrences) {
        occ.periods.forEach((p, i) => {
          grid[occ.day][p] = {
            subjectName,
            teacherName: teacher.name,
            code,
            venue: teacher.venue,
            isSpanStart: i === 0,
            spanLength: occ.periods.length,
          };
        });
      }
    }
  }
  return grid;
}
