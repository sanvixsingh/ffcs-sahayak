import { DAYS, PERIOD_LABELS } from '../data/timetable';

const PERIOD_COUNT = PERIOD_LABELS.length;
const HOURS = ['8', '9', '10', '11', '12', '1', '2', '3', '4', '5', '6', '7'];

/** Weekly board for one set of choices. `grid` comes from lib/grid.js. */
export default function WeekGrid({ grid, colorOf }) {
  return (
    <div className="board-grid-wrap">
      <table className="board-grid">
        <colgroup>
          <col style={{ width: 40 }} />
          {HOURS.map((_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th />
            {HOURS.map((h, p) => (
              <th key={p} className={p === 5 ? 'bg-break' : undefined} title={PERIOD_LABELS[p]}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => {
            const cells = [];
            let p = 0;
            while (p < PERIOD_COUNT) {
              const info = grid[day]?.[p];
              if (info && info.isSpanStart) {
                cells.push(
                  <td key={p} colSpan={info.spanLength}>
                    <div
                      className="bg-block"
                      style={{ background: colorOf(info.subjectName) }}
                      title={`${info.subjectName} — ${info.teacherName}${info.venue ? ` · ${info.venue}` : ''} · ${info.code}`}
                    >
                      <span className="bb-name">{info.subjectName}</span>
                      <span className="bb-code">{info.code}</span>
                    </div>
                  </td>
                );
                p += info.spanLength;
              } else if (info) {
                p += 1;
              } else {
                cells.push(<td key={p} className={p === 5 ? 'bg-break' : undefined} />);
                p += 1;
              }
            }
            return (
              <tr key={day}>
                <td className="bg-day">{day}</td>
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
