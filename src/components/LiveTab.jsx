import { useMemo, useState } from 'react';
import WeekGrid from './WeekGrid';
import { teacherCells } from '../lib/clash';
import { occupiedByOthers, findClashOwner, describeLock } from '../lib/liveLock';
import { buildWeekGrid } from '../lib/grid';
import { colorForIndex } from '../lib/colors';
import { constrainSubjects, isFeasible } from '../lib/permute';
import { cellsOverlap, occupiedCells, THEORY_SLOT_CODES, LAB_SLOT_CODES } from '../data/timetable';

/**
 * What you do when the seat you wanted is gone: type the slots you were
 * actually allotted, or tap them from the full slot bank. Either way they
 * feed the same clash filtering as a normal pick.
 */
function ManualOverride({ onSet, owners }) {
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState([]);
  const [text, setText] = useState('');

  // Slots already ruled out by what's locked in elsewhere. Same clash rule the
  // faculty options use, so the bank can't offer you something impossible.
  const blockedBy = useMemo(() => {
    const map = {};
    for (const code of [...THEORY_SLOT_CODES, ...LAB_SLOT_CODES]) {
      const owner = findClashOwner(occupiedCells([code]), owners);
      if (owner) map[code] = owner;
    }
    return map;
  }, [owners]);

  const toggle = (code) => {
    if (blockedBy[code]) return;
    setCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const commitTyped = () => {
    const typed = text.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (!typed.length) return;
    setCodes((prev) => [...prev, ...typed.filter((c) => !prev.includes(c))]);
    setText('');
  };

  const conflicting = codes.filter((c) => blockedBy[c]);
  const blockedCount = Object.keys(blockedBy).length;

  if (!open) {
    return (
      <div className="manual">
        <button className="btn ghost small" onClick={() => setOpen(true)}>
          Didn't get any of these? Enter the slot you actually got
        </button>
      </div>
    );
  }

  return (
    <div className="manual open">
      <div className="manual-head">
        <span className="field-label" style={{ margin: 0 }}>
          Slots you were allotted
        </span>
        <button className="link-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="manual-body">
        <input
          className="input"
          placeholder="Type them — e.g. B1, L9+L10"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitTyped()}
          onBlur={commitTyped}
        />
        <button className="btn small" onClick={commitTyped} disabled={!text.trim()}>
          Add
        </button>
      </div>

      <div className="slot-bank">
        {[
          ['Theory', THEORY_SLOT_CODES, ''],
          ['Lab', LAB_SLOT_CODES, ' lab'],
        ].map(([label, list, kindClass]) => (
          <div key={label}>
            <div className="slot-bank-label">{label}</div>
            <div className="slot-bank-row">
              {list.map((c) => {
                const blocker = blockedBy[c];
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={!!blocker}
                    title={blocker ? `Taken — clashes with ${blocker.subjectName} (${blocker.label})` : undefined}
                    className={`code code-btn${kindClass}${codes.includes(c) ? ' on' : ''}${blocker ? ' taken' : ''}`}
                    onClick={() => toggle(c)}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {blockedCount > 0 && (
          <p className="slot-bank-note">
            {blockedCount} slot{blockedCount === 1 ? '' : 's'} greyed out — they clash with what you've already
            locked in.
          </p>
        )}
      </div>

      <div className="manual-foot">
        <span className="panel-meta">
          {codes.length ? `Selected: ${codes.join(', ')}` : 'Nothing selected yet'}
          {conflicting.length > 0 && (
            <span className="reason" style={{ display: 'block' }}>
              {conflicting.join(', ')} clash{conflicting.length === 1 ? 'es' : ''} with{' '}
              {blockedBy[conflicting[0]].subjectName}. Remove {conflicting.length === 1 ? 'it' : 'them'} or change
              that subject first.
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn ghost small" onClick={() => setCodes([])} disabled={!codes.length}>
            Clear
          </button>
          <button
            className="btn primary small"
            onClick={() => onSet(codes)}
            disabled={!codes.length || conflicting.length > 0}
          >
            Lock it in
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Best-effort name of the subject a hypothetical pick would strand, so the
 * warning can say which one. Falls back to null when the infeasibility is
 * deeper than one subject running out of options.
 */
function findStrandedSubject(constrained) {
  const fixed = new Set();
  for (const s of constrained) {
    if (s.teachers.length === 1) for (const c of teacherCells(s.teachers[0])) fixed.add(c);
  }
  for (const s of constrained) {
    if (s.teachers.length === 1) continue;
    const anyFree = s.teachers.some((t) => !cellsOverlap(teacherCells(t), fixed));
    if (!anyFree) return s.name;
  }
  return null;
}

export default function LiveTab({ subjects, locks, setLocks }) {
  const activeSubjects = subjects.filter((s) => s.teachers.length > 0);
  const colorByName = Object.fromEntries(activeSubjects.map((s) => [s.name, colorForIndex(s.colorIndex)]));

  const lockTeacher = (subjectId, teacherId) =>
    setLocks((prev) => ({ ...prev, [subjectId]: { type: 'teacher', teacherId } }));
  const lockManual = (subjectId, codes) =>
    setLocks((prev) => ({ ...prev, [subjectId]: { type: 'manual', codes } }));
  const unlock = (subjectId) =>
    setLocks((prev) => {
      const next = { ...prev };
      delete next[subjectId];
      return next;
    });

  /**
   * An option can be legal right now yet still be a trap: taking it may leave
   * some other subject with no surviving option at all. We test that by asking
   * whether a complete timetable still exists after the hypothetical pick.
   */
  const { deadEnds, alreadyStuck } = useMemo(() => {
    const lockedTeacherFor = (s) => describeLock(locks[s.id], s)?.teacher || null;
    const current = constrainSubjects(activeSubjects, lockedTeacherFor);
    // If what's already locked has no complete solution, flagging every remaining
    // option as a dead end is just noise — one banner says it better.
    if (activeSubjects.length > 0 && !isFeasible(current)) {
      return { deadEnds: {}, alreadyStuck: true };
    }
    const flags = {};
    for (const subject of activeSubjects) {
      if (locks[subject.id]) continue;
      for (const teacher of subject.teachers) {
        const hypothetical = constrainSubjects(activeSubjects, (s) =>
          s.id === subject.id ? teacher : lockedTeacherFor(s)
        );
        if (!isFeasible(hypothetical)) {
          flags[teacher.id] = findStrandedSubject(hypothetical) || true;
        }
      }
    }
    return { deadEnds: flags, alreadyStuck: false };
  }, [activeSubjects, locks]);

  if (subjects.length === 0) {
    return (
      <div className="empty">
        <h3>Nothing to register with yet</h3>
        <p>Add your subjects and faculty options in Shortlist, then come back here when registration opens.</p>
      </div>
    );
  }

  const lockedEntries = activeSubjects
    .filter((s) => locks[s.id])
    .map((s) => ({ subjectName: s.name, teacher: describeLock(locks[s.id], s)?.teacher }))
    .filter((e) => e.teacher);
  const lockedCount = lockedEntries.length;

  return (
    <div className="register-layout">
      <div>
        {alreadyStuck && (
          <div className="note caution">
            What you've locked in no longer leaves a complete timetable. Change one of those choices, or record
            the slots you were actually allotted for the subjects still open.
          </div>
        )}
        <div className="note">
          Lock in each subject as you get it. Every option that would clash with what you've already secured is
          struck off immediately — and anything that would leave another subject with no options left is flagged
          before you take it.
        </div>

        {activeSubjects.map((subject) => {
          const lock = locks[subject.id];
          const { owners } = occupiedByOthers(activeSubjects, locks, subject.id);

          return (
            <section className="panel" style={{ marginBottom: 18 }} key={subject.id}>
              <div className="panel-head">
                <span className="line-bullet" style={{ background: colorForIndex(subject.colorIndex) }} />
                <span className="panel-title">{subject.name}</span>
                {lock ? (
                  <>
                    <span className="stamp locked">Locked</span>
                    <button className="link-btn" onClick={() => unlock(subject.id)}>
                      Change
                    </button>
                  </>
                ) : (
                  <span className="panel-meta">
                    {subject.teachers.filter((t) => !findClashOwner(teacherCells(t), owners)).length} still open
                  </span>
                )}
              </div>

              {subject.teachers.map((teacher) => {
                const isSelected = lock?.type === 'teacher' && lock.teacherId === teacher.id;
                const clashOwner = isSelected ? null : findClashOwner(teacherCells(teacher), owners);
                const deadEnd = !clashOwner && !isSelected && deadEnds[teacher.id];
                const blocked = !!clashOwner;

                return (
                  <button
                    type="button"
                    key={teacher.id}
                    className={`option${isSelected ? ' selected' : ''}${blocked ? ' blocked' : ''}`}
                    disabled={blocked || (!!lock && !isSelected)}
                    onClick={() => (isSelected ? unlock(subject.id) : lockTeacher(subject.id, teacher.id))}
                  >
                    <div className="entry-main">
                      <div className="entry-name">
                        {teacher.name}
                        {Number.isFinite(teacher.priority) && <span className="priority">P{teacher.priority}</span>}
                        {blocked && <span className="stamp clash">Clash</span>}
                        {deadEnd && <span className="stamp deadend">Dead end</span>}
                      </div>
                      <div className="entry-sub">
                        {teacher.theorySlots.map((c) => (
                          <span className="code" key={c}>
                            {c}
                          </span>
                        ))}
                        {teacher.labSlots.map((c) => (
                          <span className="code lab" key={c}>
                            {c}
                          </span>
                        ))}
                        {teacher.venue && <span className="venue">{teacher.venue}</span>}
                      </div>
                      {blocked && (
                        <div className="reason">
                          Overlaps {clashOwner.subjectName} — {clashOwner.label}
                        </div>
                      )}
                      {deadEnd && (
                        <div className="reason caution">
                          Free right now, but taking it leaves{' '}
                          {typeof deadEnd === 'string' ? deadEnd : 'another subject'} with no option left.
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {!lock && <ManualOverride owners={owners} onSet={(codes) => lockManual(subject.id, codes)} />}
              {lock?.type === 'manual' && (
                <div className="entry">
                  <div className="entry-main">
                    <div className="entry-name">Allotted slot recorded</div>
                    <div className="entry-sub">
                      {lock.codes.map((c) => (
                        <span className="code" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="side">
        <section className="panel">
          <div className="panel-head">
            <span className="panel-title" style={{ fontSize: 15 }}>
              Your timetable
            </span>
            <span className="panel-meta">
              {lockedCount}/{activeSubjects.length} locked
            </span>
          </div>
          <div style={{ padding: 12 }}>
            {lockedCount === 0 ? (
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>
                Lock a subject in and it appears on the board here.
              </p>
            ) : (
              <WeekGrid grid={buildWeekGrid(lockedEntries)} colorOf={(n) => colorByName[n] || 'var(--line-1)'} />
            )}
          </div>
          {lockedCount > 0 && (
            <div className="legend">
              {lockedEntries.map((e) => (
                <span className="legend-item" key={e.subjectName}>
                  <span className="line-dash" style={{ background: colorByName[e.subjectName] }} />
                  {e.subjectName} — {e.teacher.name}
                </span>
              ))}
              <button className="link-btn danger" style={{ marginLeft: 'auto' }} onClick={() => setLocks({})}>
                Reset all
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
