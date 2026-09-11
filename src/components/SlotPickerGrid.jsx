import { Fragment } from 'react';
import {
  DAYS,
  THEORY_MORNING,
  THEORY_EVENING,
  LAB_MORNING,
  LAB_EVENING,
} from '../data/timetable';

const HOUR_LABELS = ['8', '9', '10', '11', '12', '1', '2', '3', '4', '5', '6', '7'];

/**
 * The real VIT grid, made clickable. Tapping a theory cell or a lab block toggles
 * that slot code — so a student who doesn't know slot codes by heart can just
 * point at when the class actually happens. Because a theory code appears twice
 * a week, selecting one lights up both of its cells, which is exactly the mental
 * model people need.
 */
export default function SlotPickerGrid({ theorySlots, labSlots, onToggleTheory, onToggleLab }) {
  const theorySet = new Set(theorySlots);
  const labSet = new Set(labSlots);

  return (
    <div className="picker-wrap">
      <table className="picker-grid">
        <colgroup>
          <col className="pg-col-day" />
          <col className="pg-col-kind" />
          {HOUR_LABELS.map((_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="pg-corner" />
            <th className="pg-corner" />
            {HOUR_LABELS.map((h, i) => (
              <th key={i} className={i === 5 ? 'pg-break' : ''}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <Fragment key={day}>
              <tr>
                <td className="pg-day" rowSpan={2}>
                  {day}
                </td>
                <td className="pg-kind">TH</td>
                {THEORY_MORNING[day].map((code, i) => (
                  <td key={`tm${i}`} className="pg-cell">
                    {code && (
                      <button
                        type="button"
                        className={`pg-slot theory${theorySet.has(code) ? ' on' : ''}`}
                        onClick={() => onToggleTheory(code)}
                      >
                        {code}
                      </button>
                    )}
                  </td>
                ))}
                <td className="pg-cell pg-break" />
                {THEORY_EVENING[day].map((code, i) => (
                  <td key={`te${i}`} className="pg-cell">
                    {code && (
                      <button
                        type="button"
                        className={`pg-slot theory${theorySet.has(code) ? ' on' : ''}`}
                        onClick={() => onToggleTheory(code)}
                      >
                        {code}
                      </button>
                    )}
                  </td>
                ))}
                <td className="pg-cell" />
              </tr>
              <tr>
                <td className="pg-kind">LAB</td>
                {LAB_MORNING[day].map((code, i) => (
                  <td key={`lm${i}`} className="pg-cell" colSpan={2}>
                    <button
                      type="button"
                      className={`pg-slot lab${labSet.has(code) ? ' on' : ''}`}
                      onClick={() => onToggleLab(code)}
                    >
                      {code}
                    </button>
                  </td>
                ))}
                {LAB_EVENING[day].map((code, i) => (
                  <td key={`le${i}`} className="pg-cell" colSpan={2}>
                    <button
                      type="button"
                      className={`pg-slot lab${labSet.has(code) ? ' on' : ''}`}
                      onClick={() => onToggleLab(code)}
                    >
                      {code}
                    </button>
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
