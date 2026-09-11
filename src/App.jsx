import { useEffect, useMemo, useState } from 'react';
import SetupTab from './components/SetupTab';
import PermutationsTab from './components/PermutationsTab';
import LiveTab from './components/LiveTab';
import Odometer from './components/Odometer';
import { constrainSubjects, countCombinations } from './lib/permute';
import { describeLock } from './lib/liveLock';
import { SAMPLE_STATE } from './data/sample';

const STORAGE_KEY = 'ffcs-sahayak:v1';
const LEGACY_KEY = 'ffcs-inator:v2';

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

function loadState() {
  try {
    // Carry over anything saved under the old app name.
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const PHASES = [
  { id: 'setup', num: '01', name: 'Shortlist' },
  { id: 'explore', num: '02', name: 'Timetables' },
  { id: 'register', num: '03', name: 'Register' },
];

export default function App() {
  const saved = useMemo(loadState, []);
  const start = saved || { ...SAMPLE_STATE, demo: true };
  const [subjects, setSubjects] = useState(start.subjects || []);
  const [locks, setLocks] = useState(start.locks || {});
  const [colorCounter, setColorCounter] = useState(start.colorCounter || 0);
  const [demo, setDemo] = useState(!!start.demo);
  const [phase, setPhase] = useState('setup');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ subjects, locks, colorCounter, demo }));
    } catch {
      /* storage blocked — the app still works for this session */
    }
  }, [subjects, locks, colorCounter, demo]);

  const clearAll = () => {
    setSubjects([]);
    setLocks({});
    setColorCounter(0);
    setDemo(false);
    setPhase('setup');
    setConfirmClear(false);
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* nothing to clean up */
    }
  };

  const actions = {
    addSubject: (name) => {
      if (demo) {
        // First real subject replaces the example shortlist.
        setSubjects([{ id: newId(), name, colorIndex: 0, teachers: [] }]);
        setLocks({});
        setColorCounter(1);
        setDemo(false);
        return;
      }
      setSubjects((prev) => [...prev, { id: newId(), name, colorIndex: colorCounter, teachers: [] }]);
      setColorCounter((c) => c + 1);
    },
    renameSubject: (id, name) => setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s))),
    deleteSubject: (id) => {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      setLocks((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    addTeacher: (subjectId, data) =>
      setSubjects((prev) =>
        prev.map((s) => (s.id === subjectId ? { ...s, teachers: [...s.teachers, { id: newId(), ...data }] } : s))
      ),
    updateTeacher: (subjectId, teacherId, data) =>
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? { ...s, teachers: s.teachers.map((t) => (t.id === teacherId ? { ...t, ...data } : t)) }
            : s
        )
      ),
    deleteTeacher: (subjectId, teacherId) => {
      setSubjects((prev) =>
        prev.map((s) => (s.id === subjectId ? { ...s, teachers: s.teachers.filter((t) => t.id !== teacherId) } : s))
      );
      setLocks((prev) => {
        const lock = prev[subjectId];
        if (lock?.type === 'teacher' && lock.teacherId === teacherId) {
          const next = { ...prev };
          delete next[subjectId];
          return next;
        }
        return prev;
      });
    },
  };

  const activeSubjects = subjects.filter((s) => s.teachers.length > 0);
  const optionCount = subjects.reduce((n, s) => n + s.teachers.length, 0);
  const lockedCount = activeSubjects.filter((s) => locks[s.id]).length;

  // Live count of complete timetables still reachable given what's locked in.
  const { count: possible, truncated } = useMemo(() => {
    if (activeSubjects.length === 0) return { count: 0, truncated: false };
    const constrained = constrainSubjects(activeSubjects, (s) => describeLock(locks[s.id], s)?.teacher || null);
    return countCombinations(constrained, { limit: 9999 });
  }, [activeSubjects, locks]);

  return (
    <div className="board">
      <header className="board-head">
        <div>
          <h1 className="mark">
            FFCS <em>Sahayak</em>
          </h1>
          <div className="mark-sub">FFCS planner · live helper</div>
        </div>
        <div className="readout">
          <div className="readout-cell headline">
            <div className="readout-label">Possible timetables</div>
            <Odometer value={possible} suffix={truncated ? '+' : ''} />
          </div>
          <div className="readout-cell">
            <div className="readout-label">Subjects</div>
            <Odometer value={subjects.length} />
          </div>
          <div className="readout-cell">
            <div className="readout-label">Options</div>
            <Odometer value={optionCount} />
          </div>
          <div className="readout-cell">
            <div className="readout-label">Locked</div>
            <Odometer value={lockedCount} />
          </div>
        </div>
      </header>

      <nav className="phases">
        {PHASES.map((p) => (
          <button
            key={p.id}
            className={`phase-tab${phase === p.id ? ' active' : ''}`}
            onClick={() => setPhase(p.id)}
          >
            <span className="phase-num">{p.num}</span>
            <span className="phase-name">{p.name}</span>
          </button>
        ))}

        {!demo && subjects.length > 0 && (
          <div className="nav-actions">
            {confirmClear ? (
              <>
                <span className="confirm-text">Clear everything?</span>
                <button className="btn danger small" onClick={clearAll}>
                  Yes, clear it
                </button>
                <button className="link-btn" onClick={() => setConfirmClear(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="link-btn danger" onClick={() => setConfirmClear(true)}>
                Clear all
              </button>
            )}
          </div>
        )}
      </nav>

      {demo && (
        <div className="note demo-note">
          <span>
            This is an example shortlist so you can see how everything works — adding your first subject clears
            it. The faculty names and venues are made up.
          </span>
          <button className="btn ghost small" onClick={clearAll}>
            Clear example
          </button>
        </div>
      )}

      {phase === 'setup' && <SetupTab subjects={subjects} actions={actions} />}
      {phase === 'explore' && <PermutationsTab subjects={subjects} />}
      {phase === 'register' && <LiveTab subjects={subjects} locks={locks} setLocks={setLocks} />}
    </div>
  );
}
