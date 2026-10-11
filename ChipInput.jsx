import { useState } from 'react';

/**
 * Freeform multi-value input for slot codes. Accepts any typed code (kept
 * flexible per spec) but offers known codes as autocomplete suggestions via
 * a native <datalist>. Enter, comma, or blur commits the current text as a chip.
 */
export default function ChipInput({ value, onChange, suggestions = [], placeholder, listId }) {
  const [draft, setDraft] = useState('');

  const commit = (raw) => {
    const pieces = raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (!pieces.length) return;
    const next = [...value];
    for (const p of pieces) if (!next.includes(p)) next.push(p);
    onChange(next);
    setDraft('');
  };

  const remove = (code) => onChange(value.filter((c) => c !== code));

  return (
    <div className="chip-box">
      {value.map((code) => (
        <span className="chip" key={code}>
          {code}
          <button type="button" onClick={() => remove(code)} aria-label={`Remove ${code}`}>
            ×
          </button>
        </span>
      ))}
      <input
        list={listId}
        value={draft}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(',')) commit(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => draft && commit(draft)}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option value={s} key={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}
