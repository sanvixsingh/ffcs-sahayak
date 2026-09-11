import { useState } from 'react';
import ChipInput from './ChipInput';
import SlotPickerGrid from './SlotPickerGrid';
import { THEORY_SLOT_CODES, LAB_SLOT_CODES } from '../data/timetable';

export default function TeacherForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [theorySlots, setTheorySlots] = useState(initial?.theorySlots || []);
  const [labSlots, setLabSlots] = useState(initial?.labSlots || []);
  const [venue, setVenue] = useState(initial?.venue || '');
  const [priority, setPriority] = useState(
    Number.isFinite(initial?.priority) ? String(initial.priority) : ''
  );
  const [mode, setMode] = useState('grid');

  const canSave = name.trim().length > 0 && (theorySlots.length > 0 || labSlots.length > 0);

  const toggle = (list, setList) => (code) =>
    setList(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);

  const submit = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      theorySlots,
      labSlots,
      venue: venue.trim(),
      priority: priority.trim() === '' ? null : Number(priority),
    });
  };

  return (
    <div className="form">
      <div className="span-2">
        <label className="field-label" htmlFor="tf-name">
          Faculty name
        </label>
        <input
          id="tf-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dr. Priya Menon"
          autoFocus
        />
      </div>

      <div>
        <label className="field-label" htmlFor="tf-venue">
          Venue
        </label>
        <input
          id="tf-venue"
          className="input"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. AB1-201"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="tf-priority">
          Your preference rank (optional)
        </label>
        <input
          id="tf-priority"
          className="input"
          type="number"
          min="1"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          placeholder="1 = want this one most"
        />
      </div>

      <div className="span-2">
        <label className="field-label">Slots</label>
        <div className="input-mode">
          <button type="button" className={mode === 'grid' ? 'active' : ''} onClick={() => setMode('grid')}>
            Pick on timetable
          </button>
          <button type="button" className={mode === 'type' ? 'active' : ''} onClick={() => setMode('type')}>
            Type codes
          </button>
        </div>

        {mode === 'grid' ? (
          <SlotPickerGrid
            theorySlots={theorySlots}
            labSlots={labSlots}
            onToggleTheory={toggle(theorySlots, setTheorySlots)}
            onToggleLab={toggle(labSlots, setLabSlots)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">Theory slots</label>
              <ChipInput
                value={theorySlots}
                onChange={setTheorySlots}
                suggestions={THEORY_SLOT_CODES}
                listId="theory-codes"
                placeholder="A1, TA1…"
              />
            </div>
            <div>
              <label className="field-label">Lab slots</label>
              <ChipInput
                value={labSlots}
                onChange={setLabSlots}
                suggestions={LAB_SLOT_CODES}
                listId="lab-codes"
                placeholder="L1+L2…"
              />
            </div>
          </div>
        )}

        {(theorySlots.length > 0 || labSlots.length > 0) && (
          <div className="entry-sub" style={{ marginTop: 10 }}>
            {theorySlots.map((c) => (
              <span className="code" key={c}>
                {c}
              </span>
            ))}
            {labSlots.map((c) => (
              <span className="code lab" key={c}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" type="button" disabled={!canSave} onClick={submit}>
          Save faculty
        </button>
      </div>
    </div>
  );
}
