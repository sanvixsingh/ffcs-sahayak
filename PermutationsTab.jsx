import { useMemo, useState } from 'react';
import WeekGrid from './WeekGrid';
import { generateCombinations, rankCombinations, comboScore, hasAnyPriority } from '../lib/permute';
import { comboStats, matchesFilters } from '../lib/analysis';
import { buildWeekGrid } from '../lib/grid';
import { colorForIndex } from '../lib/colors';

const PAGE_SIZE = 12;

export default function PermutationsTab({ subjects }) {
  const [rankMode, setRankMode] = useState('best');
  const [pattern, setPattern] = useState('any');
  const [minFreeDays, setMinFreeDays] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { subjects: activeSubjects, combos, truncated, skipped } = useMemo(
    () => generateCombinations(subjects),
    [subjects]
  );

  const anyPriority = useMemo(() => combos.some(hasAnyPriority), [combos]);

  const shown = useMemo(() => {
    const filtered = combos.filter((c) => matchesFilters(c, { pattern, minFreeDays }));
    return rankMode === 'best' && anyPriority ? rankCombinations(filtered) : filtered;
  }, [combos, pattern, minFreeDays, rankMode, anyPriority]);

  const colorByName = useMemo(() => {
    const map = {};
    activeSubjects.forEach((s) => (map[s.name] = colorForIndex(s.colorIndex)));
    return map;
  }, [activeSubjects]);
  const colorOf = (name) => colorByName[name] || 'var(--line-1)';

  if (subjects.length === 0) {
    return (
      <div className="empty">
        <h3>Nothing to plan yet</h3>
        <p>Add your subjects and faculty options in Shortlist, and every clash-free timetable shows up here.</p>
      </div>
    );
  }
  if (activeSubjects.length === 0) {
    return (
      <div className="empty">
        <h3>Add at least one faculty option</h3>
        <p>Each subject needs at least one faculty member with their slots before timetables can be worked out.</p>
      </div>
    );
  }

  return (
    <div>
      {skipped > 0 && (
        <div className="note caution">
          {skipped} subject{skipped === 1 ? '' : 's'} with no faculty added yet {skipped === 1 ? 'is' : 'are'} left
          out of these timetables.
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-group">
          <span className="field-label" style={{ margin: 0 }}>
            Order
          </span>
          <div className="seg">
            <button
              className={rankMode === 'best' ? 'active' : ''}
              onClick={() => setRankMode('best')}
              disabled={!anyPriority}
              title={anyPriority ? '' : 'Set a preference rank on some faculty to use this'}
            >
              Best first
            </button>
            <button className={rankMode === 'all' ? 'active' : ''} onClick={() => setRankMode('all')}>
              Every option
            </button>
          </div>
        </div>

        <div className="filter-group">
          <span className="field-label" style={{ margin: 0 }}>
            Theory pattern
          </span>
          <div className="seg">
            {[
              ['any', 'Any'],
              ['morning', 'Morning'],
              ['evening', 'Evening'],
            ].map(([val, label]) => (
              <button key={val} className={pattern === val ? 'active' : ''} onClick={() => setPattern(val)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="field-label" style={{ margin: 0 }}>
            Free days
          </span>
          <div className="seg">
            {[0, 1, 2].map((n) => (
              <button key={n} className={minFreeDays === n ? 'active' : ''} onClick={() => setMinFreeDays(n)}>
                {n === 0 ? 'Any' : `${n}+`}
              </button>
            ))}
          </div>
        </div>

        <span className="panel-meta" style={{ marginLeft: 'auto' }}>
          {shown.length.toLocaleString()} of {combos.length.toLocaleString()}
          {truncated ? '+' : ''} clash-free
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <h3>{combos.length === 0 ? 'No clash-free timetable exists' : 'Nothing matches those filters'}</h3>
          <p>
            {combos.length === 0
              ? 'Every combination of your current faculty choices overlaps somewhere. Add another option for one of your subjects, or check the slots you entered.'
              : 'Loosen the pattern or free-day filter to see more of your valid timetables.'}
          </p>
        </div>
      ) : (
        <>
          <div className="combo-list">
            {shown.slice(0, visible).map((combo, i) => {
              const entries = activeSubjects.map((s, idx) => ({ subjectName: s.name, teacher: combo[idx] }));
              const stats = comboStats(combo);
              return (
                <article className="combo" key={combo.map((t) => t.id).join('-')}>
                  <div className="combo-head">
                    <span className="combo-rank">{String(i + 1).padStart(2, '0')}</span>
                    <div className="combo-tags">
                      {anyPriority && <span className="tag">score {comboScore(combo)}</span>}
                      <span className="tag">{stats.pattern} theory</span>
                      <span className="tag">
                        {stats.freeDayCount === 0
                          ? 'no free day'
                          : `free ${stats.freeDays.join(' + ')}`}
                      </span>
                    </div>
                  </div>
                  <div className="combo-body">
                    <WeekGrid grid={buildWeekGrid(entries)} colorOf={colorOf} />
                    <div className="combo-lines">
                      {activeSubjects.map((s, idx) => (
                        <div className="combo-line" key={s.id}>
                          <span className="line-dash" style={{ background: colorForIndex(s.colorIndex) }} />
                          <span className="cl-subject">{s.name}</span>
                          <span className="cl-teacher">{combo[idx].name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {visible < shown.length && (
            <div style={{ textAlign: 'center', marginTop: 22 }}>
              <button className="btn ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Show {Math.min(PAGE_SIZE, shown.length - visible)} more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
