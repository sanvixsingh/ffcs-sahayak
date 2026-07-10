import { useState, useMemo } from "react";

// All possible theory slots (morning only, ending in 1)
const ALL_THEORY_SLOTS = ["A1","TA1","B1","TB1","C1","TC1","D1","TD1","E1","TE1","F1","TF1","G1","TG1","TAA1","TBB1","TCC1","TDD1"];
// All morning lab slots L31-L60
const ALL_LAB_SLOTS = Array.from({length: 30}, (_, i) => `L${i+31}`);

const LAB_DAY = (lab) => {
  const n = parseInt(lab.replace("L",""));
  if (n >= 31 && n <= 36) return "Mon";
  if (n >= 37 && n <= 42) return "Tue";
  if (n >= 43 && n <= 48) return "Wed";
  if (n >= 49 && n <= 54) return "Thu";
  if (n >= 55 && n <= 60) return "Fri";
  return "?";
};

const SUBJECTS = {
  qualitative: {
    name: "Qualitative", color: "#6366f1", emoji: "📊",
    options: [
      { id: "q2", label: "D1+TD1", teacher: null, theorySlots: ["D1","TD1"], labs: [], rec: 0 },
    ],
  },
  hsm: {
    name: "HSM", color: "#f59e0b", emoji: "🧠",
    options: [
      { id: "h1", label: "Balamurugan — Sociology", teacher: "Balamurugan", theorySlots: ["G1","TG1"], labs: [], rec: 4 },
      { id: "h2", label: "Nilavathy/Salman — Micro Econ", teacher: "Nilavathy/Salman", theorySlots: ["G1","TG1"], labs: [], rec: 3 },
      { id: "h3", label: "Tony/Mohd Owais — Intro Psych", teacher: "Tony/Mohd Owais", theorySlots: ["G1","TG1"], labs: [], rec: 2 },
      { id: "h4", label: "Rizwan — Indian", teacher: "Rizwan", theorySlots: ["G1","TG1"], labs: [], rec: 2 },
      { id: "h5", label: "Aquib/Adil Ahmad — Macro Econ", teacher: "Aquib/Adil Ahmad", theorySlots: ["G1","TG1"], labs: [], rec: 1 },
      { id: "h6", label: "Aquib — Macro Econ (C1)", teacher: "Aquib", theorySlots: ["C1","TG1"], labs: [], rec: 1 },
    ],
  },
  probstat: {
    name: "Prob & Stats", color: "#10b981", emoji: "📈",
    options: [
      { id: "p1", label: "Juhi ⭐", teacher: "Juhi", theorySlots: ["F1","TF1"], labs: ["L49","L50"], rec: 1 },
      { id: "p5", label: "Balaji S ⭐", teacher: "Balaji S", theorySlots: ["F1","TF1"], labs: ["L41","L42"], rec: 1 },
      { id: "p6", label: "Priya Das ⭐", teacher: "Priya Das", theorySlots: ["F1","TF1"], labs: ["L51","L52"], rec: 1 },
      { id: "p2", label: "Clement", teacher: "Clement", theorySlots: ["F1","TF1"], labs: ["L53","L54"], rec: 0 },
      { id: "p3", label: "Abdul Haq", teacher: "Abdul Haq", theorySlots: ["F1","TF1"], labs: ["L39","L40"], rec: 0 },
      { id: "p4", label: "Mushabir", teacher: "Mushabir", theorySlots: ["G1","TG1"], labs: ["L37","L38"], rec: 0 },
    ],
  },
  java: {
    name: "Java", color: "#ef4444", emoji: "☕",
    options: [
      { id: "j1", label: "Rajarajan ⭐", teacher: "Rajarajan", theorySlots: [], labs: ["L45","L46","L55","L56"], rec: 1 },
      { id: "j2", label: "Somasudram", teacher: "Somasudram", theorySlots: [], labs: ["L37","L38","L55","L56"], rec: 0 },
      { id: "j3", label: "Kalaivani", teacher: "Kalaivani", theorySlots: [], labs: ["L45","L46","L55","L56"], rec: 0 },
      { id: "j4", label: "Sivakumar", teacher: "Sivakumar", theorySlots: [], labs: ["L31","L32","L53","L54"], rec: 0 },
      { id: "j5", label: "Vinila Jenny", teacher: "Vinila Jenny", theorySlots: [], labs: ["L31","L32","L43","L44"], rec: 0 },
    ],
  },
  language: {
    name: "Language", color: "#8b5cf6", emoji: "🌍",
    options: [
      { id: "l1", label: "Adaikalam ⭐ (German) TCC1", teacher: "Adaikalam", theorySlots: ["TCC1"], labs: ["L39","L40"], langPref: 1, rec: 1 },
      { id: "l2", label: "Adaikalam ⭐ (German) TAA1", teacher: "Adaikalam", theorySlots: ["TAA1"], labs: ["L55","L56"], langPref: 1, rec: 1 },
      { id: "l3", label: "Abhijit (German) TCC1", teacher: "Abhijit", theorySlots: ["TCC1"], labs: ["L35","L36"], langPref: 1, rec: 0 },
      { id: "l4", label: "Amit Kumar (German) TCC1", teacher: "Amit Kumar", theorySlots: ["TCC1"], labs: ["L41","L42"], langPref: 1, rec: 0 },
      { id: "l5", label: "Amit Kumar (German) TE1", teacher: "Amit Kumar", theorySlots: ["TE1"], labs: ["L47","L48"], langPref: 1, rec: 0 },
      { id: "l6", label: "Malathy (French) TAA1", teacher: "Malathy", theorySlots: ["TAA1"], labs: ["L33","L34"], langPref: 2, rec: 0 },
      { id: "l7", label: "Coumaran (French) TCC1", teacher: "Coumaran", theorySlots: ["TCC1"], labs: ["L31","L32"], langPref: 2, rec: 0 },
      { id: "l8", label: "Antoinette (French) TAA1", teacher: "Antoinette", theorySlots: ["TAA1"], labs: ["L49","L50"], langPref: 2, rec: 0 },
      { id: "l9", label: "Visalakshi (French) TAA1", teacher: "Visalakshi", theorySlots: ["TAA1"], labs: ["L37","L38"], langPref: 2, rec: 0 },
    ],
  },
  dbsys: {
    name: "DB Systems", color: "#3b82f6", emoji: "🗄️",
    options: [
      { id: "d1", label: "Manohar Kumar ⭐", teacher: "Manohar Kumar", theorySlots: ["A1","TA1"], labs: ["L37","L38"], rec: 1 },
      { id: "d2", label: "Saritha Murali ⭐", teacher: "Saritha Murali", theorySlots: ["A1","TA1"], labs: ["L49","L50"], rec: 1 },
      { id: "d3", label: "Pooja Chaudhary ⭐", teacher: "Pooja Chaudhary", theorySlots: ["A1","TA1"], labs: ["L51","L52"], rec: 1 },
      { id: "d4", label: "Konatham Sumalatha", teacher: "Konatham Sumalatha", theorySlots: ["A1","TA1"], labs: ["L41","L42"], rec: 0 },
      { id: "d5", label: "Diviya M", teacher: "Diviya M", theorySlots: ["A1","TA1"], labs: ["L51","L52"], rec: 0 },
    ],
  },
  compnet: {
    name: "Comp Networks", color: "#ec4899", emoji: "🌐",
    options: [
      { id: "c1", label: "Ilantheral", teacher: "Ilantheral", theorySlots: ["B1","TB1"], labs: ["L49","L50"], rec: 0 },
      { id: "c2", label: "Jim Solomon", teacher: "Jim Solomon", theorySlots: ["B1","TB1"], labs: ["L53","L54"], rec: 0 },
      { id: "c3", label: "Gopinath", teacher: "Gopinath", theorySlots: ["B1","TB1"], labs: ["L31","L32"], rec: 0 },
      { id: "c4", label: "Rakhi Mol", teacher: "Rakhi Mol", theorySlots: ["B1","TB1"], labs: ["L55","L56"], rec: 0 },
      { id: "c5", label: "Vimala Devi", teacher: "Vimala Devi", theorySlots: ["B1","TB1"], labs: ["L33","L34"], rec: 0 },
    ],
  },
  sysarch: {
    name: "Sys Architecture", color: "#14b8a6", emoji: "🏗️",
    options: [
      { id: "s1", label: "Vivek Rajpoot", teacher: "Vivek Rajpoot", theorySlots: ["E1","TE1"], labs: ["L33","L34"], rec: 0 },
      { id: "s2", label: "Muthu Raja", teacher: "Muthu Raja", theorySlots: ["E1","TE1"], labs: ["L51","L52"], rec: 0 },
      { id: "s3", label: "Jaffino", teacher: "Jaffino", theorySlots: ["E1","TE1"], labs: ["L57","L58"], rec: 0 },
      { id: "s4", label: "Debashish", teacher: "Debashish", theorySlots: ["E1","TE1"], labs: ["L45","L46"], rec: 0 },
    ],
  },
};

const SUBJECT_KEYS = Object.keys(SUBJECTS);
const ALL_OPTIONS = SUBJECT_KEYS.flatMap(k => SUBJECTS[k].options.map(o => ({ ...o, subjectKey: k })));

function slotsOf(opt) { return [...(opt.theorySlots||[]), ...(opt.labs||[])]; }

// ── CUSTOM OPTION BUILDER ─────────────────────────────────────────────────────
function CustomOptionBuilder({ subjectKey, lockedSlots, onAdd, isJava }) {
  const [selectedTheory, setSelectedTheory] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [open, setOpen] = useState(false);

  const toggleSlot = (slot, list, setList) => {
    setList(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  const canAdd = selectedTheory.length > 0 || selectedLabs.length > 0;
  const previewClashes = [...selectedTheory, ...selectedLabs].filter(s => lockedSlots.includes(s));

  const handleAdd = () => {
    if (!canAdd) return;
    const label = [...selectedTheory, ...selectedLabs].join("+");
    onAdd({
      id: `custom_${subjectKey}_${Date.now()}`,
      label: label + " (custom)",
      teacher: label,
      theorySlots: selectedTheory,
      labs: selectedLabs,
      rec: 0,
      isCustom: true,
    });
    setSelectedTheory([]); setSelectedLabs([]); setOpen(false);
  };

  const slotBg = (slot, selected) => {
    if (lockedSlots.includes(slot)) return { bg: "#2d0a0a", border: "#ef444466", color: "#f87171", cursor: "not-allowed" };
    if (selected) return { bg: "#1e3a5f", border: "#3b82f6", color: "#93c5fd", cursor: "pointer" };
    return { bg: "#0f0f1a", border: "#1e1e30", color: "#64748b", cursor: "pointer" };
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px dashed #2d2d44",
        background: "transparent", color: "#475569", cursor: "pointer", fontSize: 12, marginTop: 4 }}>
      + Add unlisted faculty
    </button>
  );

  return (
    <div style={{ background: "#0a0a14", border: "1px dashed #3b82f655", borderRadius: 10, padding: "14px", marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#93c5fd" }}>+ Add unlisted faculty</span>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 }}>✕</button>
      </div>

      {/* Name input */}
      {/* Theory slots */}
      {!isJava && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>📚 THEORY SLOTS — tap to select</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {ALL_THEORY_SLOTS.map(slot => {
              const s = slotBg(slot, selectedTheory.includes(slot));
              return (
                <button key={slot} onClick={() => !lockedSlots.includes(slot) && toggleSlot(slot, selectedTheory, setSelectedTheory)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${s.border}`,
                    background: s.bg, color: s.color, fontSize: 11, cursor: s.cursor, fontWeight: selectedTheory.includes(slot) ? 700 : 400 }}>
                  {slot}
                  {lockedSlots.includes(slot) && " ⚡"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lab slots — grouped by day */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>
          🔬 LAB SLOTS — tap to select {isJava ? "(pick 4 for Java's 2 labs)" : "(pick 2)"}
        </div>
        {["Mon","Tue","Wed","Thu","Fri"].map(day => {
          const dayLabs = ALL_LAB_SLOTS.filter(l => LAB_DAY(l) === day);
          return (
            <div key={day} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: "#334155", width: 28, flexShrink: 0 }}>{day}</span>
              {dayLabs.map(slot => {
                const s = slotBg(slot, selectedLabs.includes(slot));
                return (
                  <button key={slot} onClick={() => !lockedSlots.includes(slot) && toggleSlot(slot, selectedLabs, setSelectedLabs)}
                    style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${s.border}`,
                      background: s.bg, color: s.color, fontSize: 10, cursor: s.cursor, fontWeight: selectedLabs.includes(slot) ? 700 : 400 }}>
                    {slot.replace("L","")}
                    {lockedSlots.includes(slot) && "⚡"}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Preview */}
      {(selectedTheory.length > 0 || selectedLabs.length > 0) && (
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 10 }}>
          Selected: {[...selectedTheory, ...selectedLabs].join(", ")}
          {previewClashes.length > 0 && <span style={{ color: "#f97316" }}> ⚡ clashes: {previewClashes.join(", ")}</span>}
        </div>
      )}

      <button onClick={handleAdd} disabled={!canAdd || previewClashes.length > 0}
        style={{ padding: "7px 18px", borderRadius: 7, border: "none",
          background: canAdd && previewClashes.length === 0 ? "#3b82f6" : "#1e1e30",
          color: canAdd && previewClashes.length === 0 ? "#fff" : "#475569",
          cursor: canAdd && previewClashes.length === 0 ? "pointer" : "not-allowed",
          fontSize: 12, fontWeight: 600 }}>
        {previewClashes.length > 0 ? "⚡ Clashes with locked subjects" : "Add & Lock In →"}
      </button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [locked, setLocked] = useState({});
  const [manualTaken, setManualTaken] = useState([]);
  const [customOptions, setCustomOptions] = useState({}); // subjectKey -> [opt]

  const lockedIds = Object.values(locked);

  const lockedSlots = useMemo(() => {
    return lockedIds.flatMap(id => {
      const opt = [...ALL_OPTIONS, ...Object.values(customOptions).flat()].find(o => o.id === id);
      return opt ? slotsOf(opt) : [];
    });
  }, [lockedIds, customOptions]);

  const getAllOptions = (key) => [...(SUBJECTS[key]?.options || []), ...(customOptions[key] || [])];

  const getStatus = (opt) => {
    if (manualTaken.includes(opt.id)) return "taken";
    if (locked[opt.subjectKey || Object.keys(SUBJECTS).find(k => getAllOptions(k).some(o => o.id === opt.id))] === opt.id) return "locked";
    const subjKey = opt.subjectKey || SUBJECT_KEYS.find(k => getAllOptions(k).some(o => o.id === opt.id));
    if (locked[subjKey] && locked[subjKey] !== opt.id) return "sibling";
    const clashes = slotsOf(opt).filter(s => lockedSlots.includes(s));
    if (clashes.length > 0) return "clashed";
    return "available";
  };

  const lockOption = (subjectKey, optId) => {
    setLocked(prev => {
      if (prev[subjectKey] === optId) { const n = {...prev}; delete n[subjectKey]; return n; }
      return { ...prev, [subjectKey]: optId };
    });
  };

  const toggleTaken = (optId) => {
    if (lockedIds.includes(optId)) return;
    setManualTaken(prev => prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]);
  };

  const addCustomOption = (subjectKey, opt) => {
    const withKey = { ...opt, subjectKey };
    setCustomOptions(prev => ({ ...prev, [subjectKey]: [...(prev[subjectKey]||[]), withKey] }));
    lockOption(subjectKey, opt.id);
  };

  const reset = () => { setLocked({}); setManualTaken([]); setCustomOptions({}); };

  const doneCount = Object.keys(locked).length;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#08080f", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "#0f0f1a", borderBottom: "1px solid #1a1a2e", padding: "14px 20px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>⚡ FFCS Live Picker</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{doneCount}/{SUBJECT_KEYS.length} locked in</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {SUBJECT_KEYS.map(k => (
                <div key={k} title={SUBJECTS[k].name} style={{ width: 8, height: 8, borderRadius: "50%",
                  background: locked[k] ? SUBJECTS[k].color : "#1e1e30", border: `1px solid ${locked[k] ? SUBJECTS[k].color : "#2d2d44"}` }} />
              ))}
            </div>
            <button onClick={reset} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #2d2d44", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 12 }}>Reset</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { color: "#22c55e", label: "✓ Locked" },
            { color: "#ef4444", label: "✕ Taken/Gone" },
            { color: "#f97316", label: "⚡ Clashes" },
            { color: "#3b82f6", label: "+ Custom added" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color + "33", border: `1.5px solid ${color}` }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Subject cards */}
        {SUBJECT_KEYS.map(key => {
          const subj = SUBJECTS[key];
          const isComplete = !!locked[key];
          const isJava = key === "java";
          const allOpts = getAllOptions(key);

          return (
            <div key={key} style={{ marginBottom: 14, borderRadius: 14, overflow: "hidden",
              border: `1px solid ${isComplete ? subj.color + "55" : "#1a1a2e"}`, background: "#0f0f1a" }}>
              <div style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1a1a2e" }}>
                <span style={{ fontSize: 15 }}>{subj.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: isComplete ? subj.color : "#94a3b8" }}>{subj.name}</span>
                {isComplete && (
                  <span style={{ fontSize: 11, color: "#22c55e", marginLeft: "auto" }}>
                    ✓ {allOpts.find(o => o.id === locked[key])?.label}
                  </span>
                )}
              </div>

              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                {allOpts.map(opt => {
                  const status = getStatus(opt);
                  const clashSlots = slotsOf(opt).filter(s => lockedSlots.includes(s));
                  const styles = {
                    locked:    { bg: "#052e16", border: "#22c55e", text: "#86efac" },
                    taken:     { bg: "#1a0808", border: "#ef444466", text: "#6b7280" },
                    clashed:   { bg: "#1a0e08", border: "#f9731644", text: "#6b7280" },
                    sibling:   { bg: "#0f0f1a", border: "#1e1e30", text: "#374151" },
                    available: { bg: "#0f0f1a", border: "#1e1e30", text: "#cbd5e1" },
                  }[status];

                  return (
                    <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px",
                      borderRadius: 8, background: styles.bg, border: `1px solid ${styles.border}`,
                      opacity: status === "sibling" ? 0.3 : 1, transition: "all 0.15s" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: styles.text, display: "flex", alignItems: "center", gap: 6 }}>
                          {opt.label}
                          {opt.isCustom && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#1e3a5f", color: "#93c5fd" }}>CUSTOM</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#334155", marginTop: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {opt.theorySlots?.length > 0 && <span>📚 {opt.theorySlots.join("+")}</span>}
                          {opt.labs?.length > 0 && <span>🔬 {opt.labs.join(", ")}</span>}
                          {status === "clashed" && <span style={{ color: "#f97316" }}>⚡ {clashSlots.join(", ")}</span>}
                        </div>
                      </div>

                      {status === "available" && (
                        <>
                          <button onClick={() => toggleTaken(opt.id)}
                            style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #1e1e30", background: "transparent", color: "#475569", cursor: "pointer", fontSize: 11 }}>
                            Gone?
                          </button>
                          <button onClick={() => lockOption(key, opt.id)}
                            style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #22c55e44", background: "#052e1633", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                            Lock →
                          </button>
                        </>
                      )}
                      {status === "locked" && (
                        <button onClick={() => lockOption(key, opt.id)}
                          style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #1e1e3044", background: "transparent", color: "#475569", cursor: "pointer", fontSize: 11 }}>
                          Undo
                        </button>
                      )}
                      {status === "taken" && (
                        <button onClick={() => toggleTaken(opt.id)}
                          style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #ef444433", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>
                          Undo
                        </button>
                      )}
                      {status === "clashed" && (
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#f9731622", color: "#f97316", whiteSpace: "nowrap" }}>⚡ clash</span>
                      )}
                    </div>
                  );
                })}

                {/* Custom option builder — only show if subject not yet locked */}
                {!locked[key] && (
                  <CustomOptionBuilder
                    subjectKey={key}
                    lockedSlots={lockedSlots}
                    isJava={isJava}
                    onAdd={(opt) => addCustomOption(key, opt)}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Final summary */}
        {doneCount === SUBJECT_KEYS.length && (
          <div style={{ marginTop: 20, padding: "20px", borderRadius: 14, background: "#052e1622", border: "1px solid #22c55e44" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#22c55e", marginBottom: 12 }}>🎉 All subjects locked!</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))", gap: 8 }}>
              {SUBJECT_KEYS.map(key => {
                const allOpts = getAllOptions(key);
                const opt = allOpts.find(o => o.id === locked[key]);
                const subj = SUBJECTS[key];
                return (
                  <div key={key} style={{ padding: "10px 12px", borderRadius: 9, background: "#0a0a0f", borderLeft: `3px solid ${subj.color}` }}>
                    <div style={{ fontSize: 10, color: subj.color, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{subj.name}</div>
                    <div style={{ fontSize: 12, color: "#cbd5e1" }}>{opt?.label}</div>
                    {opt?.theorySlots?.length > 0 && <div style={{ fontSize: 11, color: "#475569" }}>{opt.theorySlots.join("+")}</div>}
                    {opt?.labs?.length > 0 && <div style={{ fontSize: 11, color: "#475569" }}>{opt.labs.join(", ")}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}