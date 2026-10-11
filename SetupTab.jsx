import { useState } from 'react';
import SubjectCard from './SubjectCard';

export default function SetupTab({ subjects, actions }) {
  const [newName, setNewName] = useState('');

  const submit = () => {
    const name = newName.trim();
    if (!name) return;
    actions.addSubject(name);
    setNewName('');
  };

  return (
    <div>
      <div className="note">
        Add every subject you're registering for, then list the faculty offering each one with their theory and
        lab slots. Nothing is assumed about your branch or year — whatever slots you enter is what gets planned
        around.
      </div>

      <div className="add-bar">
        <input
          className="input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Subject name — e.g. Data Structures and Algorithms"
          aria-label="Subject name"
        />
        <button className="btn primary" onClick={submit}>
          Add subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="empty">
          <h3>Start with your subject list</h3>
          <p>
            Add the subjects you plan to take this semester. Under each one you'll add the faculty offering it,
            along with their theory slots, lab slots, venue, and how badly you want them.
          </p>
        </div>
      ) : (
        subjects.map((s) => (
          <SubjectCard
            key={s.id}
            subject={s}
            onRename={(name) => actions.renameSubject(s.id, name)}
            onDelete={() => actions.deleteSubject(s.id)}
            onAddTeacher={(data) => actions.addTeacher(s.id, data)}
            onUpdateTeacher={(teacherId, data) => actions.updateTeacher(s.id, teacherId, data)}
            onDeleteTeacher={(teacherId) => actions.deleteTeacher(s.id, teacherId)}
          />
        ))
      )}
    </div>
  );
}
