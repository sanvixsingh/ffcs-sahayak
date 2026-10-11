import { useState } from 'react';
import TeacherForm from './TeacherForm';
import { colorForIndex } from '../lib/colors';

export default function SubjectCard({
  subject,
  onRename,
  onDelete,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const color = colorForIndex(subject.colorIndex);

  return (
    <section className="panel" style={{ marginBottom: 18 }}>
      <div className="panel-head">
        <span className="line-bullet" style={{ background: color }} />
        <span
          className="panel-title"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => onRename(e.target.textContent.trim() || subject.name)}
        >
          {subject.name}
        </span>
        <span className="panel-meta">
          {subject.teachers.length} option{subject.teachers.length === 1 ? '' : 's'}
        </span>
        <button className="link-btn danger" onClick={onDelete}>
          Remove
        </button>
      </div>

      {subject.teachers.map((t) =>
        editingId === t.id ? (
          <TeacherForm
            key={t.id}
            initial={t}
            onCancel={() => setEditingId(null)}
            onSave={(data) => {
              onUpdateTeacher(t.id, data);
              setEditingId(null);
            }}
          />
        ) : (
          <div className="entry" key={t.id}>
            <div className="entry-main">
              <div className="entry-name">
                {t.name}
                {Number.isFinite(t.priority) && <span className="priority">P{t.priority}</span>}
              </div>
              <div className="entry-sub">
                {t.theorySlots.map((c) => (
                  <span className="code" key={c}>
                    {c}
                  </span>
                ))}
                {t.labSlots.map((c) => (
                  <span className="code lab" key={c}>
                    {c}
                  </span>
                ))}
                {t.venue && <span className="venue">{t.venue}</span>}
              </div>
            </div>
            <div className="entry-actions">
              <button className="link-btn" onClick={() => setEditingId(t.id)}>
                Edit
              </button>
              <button className="link-btn danger" onClick={() => onDeleteTeacher(t.id)}>
                Delete
              </button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <TeacherForm
          onCancel={() => setAdding(false)}
          onSave={(data) => {
            onAddTeacher(data);
            setAdding(false);
          }}
        />
      ) : (
        <div style={{ padding: '11px 16px' }}>
          <button className="btn ghost small" onClick={() => setAdding(true)}>
            + Add faculty option
          </button>
        </div>
      )}
    </section>
  );
}
