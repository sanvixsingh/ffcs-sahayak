// VIT master FFCS slot timetable, transcribed from the official grid.
//
// Day timeline is modeled as 12 hourly "periods" (index 0-11):
//   0: 8-9   1: 9-10   2: 10-11   3: 11-12   4: 12-1   5: 1-2 (lunch break, theory never sits here)
//   6: 2-3   7: 3-4    8: 4-5     9: 5-6    10: 6-7   11: 7-8 (only ever used by the tail of an evening lab)
//
// Theory slots occupy exactly one period. Lab slots ("Lx+Ly") are always a single
// 2-hour block, occupying two consecutive periods. This file is plain data on purpose —
// new/unusual slot codes can be added here without touching any logic elsewhere.

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// 5 one-hour columns per half-day, per day. `null` = no theory scheduled in that column.
export const THEORY_MORNING = {
  Mon: ['A1', 'F1', 'D1', 'TB1', 'TG1'],
  Tue: ['B1', 'G1', 'E1', 'TC1', 'TAA1'],
  Wed: ['C1', 'A1', 'F1', null, null],
  Thu: ['D1', 'B1', 'G1', 'TE1', 'TCC1'],
  Fri: ['E1', 'C1', 'TA1', 'TF1', 'TD1'],
};

export const THEORY_EVENING = {
  Mon: ['A2', 'F2', 'D2', 'TB2', 'TG2'],
  Tue: ['B2', 'G2', 'E2', 'TC2', 'TAA2'],
  Wed: ['C2', 'A2', 'F2', 'TD2', 'TBB2'],
  Thu: ['D2', 'B2', 'G2', 'TE2', 'TCC2'],
  Fri: ['E2', 'C2', 'TA2', 'TF2', 'TDD2'],
};

// 3 two-hour lab blocks per half-day, per day.
export const LAB_MORNING = {
  Mon: ['L1+L2', 'L3+L4', 'L5+L6'],
  Tue: ['L7+L8', 'L9+L10', 'L11+L12'],
  Wed: ['L13+L14', 'L15+L16', 'L17+L18'],
  Thu: ['L19+L20', 'L21+L22', 'L23+L24'],
  Fri: ['L25+L26', 'L27+L28', 'L29+L30'],
};

export const LAB_EVENING = {
  Mon: ['L31+L32', 'L33+L34', 'L35+L36'],
  Tue: ['L37+L38', 'L39+L40', 'L41+L42'],
  Wed: ['L43+L44', 'L45+L46', 'L47+L48'],
  Thu: ['L49+L50', 'L51+L52', 'L53+L54'],
  Fri: ['L55+L56', 'L57+L58', 'L59+L60'],
};

// Human-readable label per period index, used for grid headers.
export const PERIOD_LABELS = [
  '8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 1:00',
  '1:00 - 2:00 (Lunch)',
  '2:00 - 3:00', '3:00 - 4:00', '4:00 - 5:00', '5:00 - 6:00', '6:00 - 7:00', '7:00 - 8:00',
];

function buildSlotMap() {
  const map = {};

  const addOccurrence = (code, day, periods) => {
    if (!code) return;
    if (!map[code]) map[code] = { code, kind: code.startsWith('L') ? 'lab' : 'theory', occurrences: [] };
    map[code].occurrences.push({ day, periods });
  };

  for (const day of DAYS) {
    THEORY_MORNING[day].forEach((code, i) => addOccurrence(code, day, [i]));
    THEORY_EVENING[day].forEach((code, i) => addOccurrence(code, day, [6 + i]));
    LAB_MORNING[day].forEach((code, j) => addOccurrence(code, day, [2 * j, 2 * j + 1]));
    LAB_EVENING[day].forEach((code, j) => addOccurrence(code, day, [6 + 2 * j, 7 + 2 * j]));
  }

  return map;
}

// code -> { code, kind: 'theory'|'lab', occurrences: [{day, periods:[...]}] }
export const SLOT_MAP = buildSlotMap();

/**
 * Ascending order the way a person reads slot codes: letters first, then the
 * number as a number — so L9+L10 sorts before L11+L12, and A1 before TA1.
 */
export function compareSlotCodes(a, b) {
  const parse = (code) => {
    const m = /^([A-Z]*)(\d+)/.exec(code);
    return m ? { alpha: m[1], num: Number(m[2]) } : { alpha: code, num: 0 };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.alpha !== pb.alpha) return pa.alpha.length - pb.alpha.length || pa.alpha.localeCompare(pb.alpha);
  return pa.num - pb.num;
}

export const ALL_SLOT_CODES = Object.keys(SLOT_MAP).sort(compareSlotCodes);
export const THEORY_SLOT_CODES = ALL_SLOT_CODES.filter((c) => SLOT_MAP[c].kind === 'theory');
export const LAB_SLOT_CODES = ALL_SLOT_CODES.filter((c) => SLOT_MAP[c].kind === 'lab');

/**
 * Returns the set of "day|period" cell keys a list of slot codes occupies.
 * Unknown codes are silently ignored (kept flexible for future custom codes
 * a user types in that aren't in SLOT_MAP yet — see resolveCustomCode below).
 */
export function occupiedCells(codes, customSlotMap = {}) {
  const cells = new Set();
  for (const raw of codes || []) {
    const code = String(raw).trim();
    if (!code) continue;
    const entry = SLOT_MAP[code] || customSlotMap[code];
    if (!entry) continue;
    for (const occ of entry.occurrences) {
      for (const p of occ.periods) cells.add(`${occ.day}|${p}`);
    }
  }
  return cells;
}

export function cellsOverlap(cellsA, cellsB) {
  for (const c of cellsA) {
    if (cellsB.has(c)) return true;
  }
  return false;
}
