/**
 * Moving a shortlist between devices.
 *
 * localStorage is tied to one browser on one machine, so a shortlist built on
 * your laptop is invisible to anyone else. These helpers pack the whole thing
 * into a short string that travels in a link or a file.
 *
 * Ids are deliberately dropped — they're UUIDs, they'd dominate the payload,
 * and fresh ones are generated on the way back in.
 */

const FORMAT = 1;

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Subjects -> compact array form -> base64url string. */
export function encodeShortlist(subjects) {
  const compact = {
    v: FORMAT,
    s: subjects.map((subject) => [
      subject.name,
      subject.colorIndex ?? 0,
      (subject.teachers || []).map((t) => [
        t.name,
        t.theorySlots || [],
        t.labSlots || [],
        t.venue || '',
        Number.isFinite(t.priority) ? t.priority : null,
      ]),
    ]),
  };
  return toBase64Url(JSON.stringify(compact));
}

/** base64url string -> subjects, with fresh ids. Throws if the string is not ours. */
export function decodeShortlist(encoded) {
  const parsed = JSON.parse(fromBase64Url(encoded));
  if (!parsed || parsed.v !== FORMAT || !Array.isArray(parsed.s)) {
    throw new Error('Not a FFCS Sahayak backup');
  }
  return parsed.s.map(([name, colorIndex, teachers]) => ({
    id: newId(),
    name: String(name || 'Untitled subject'),
    colorIndex: Number(colorIndex) || 0,
    teachers: (teachers || []).map(([tName, theorySlots, labSlots, venue, priority]) => ({
      id: newId(),
      name: String(tName || ''),
      theorySlots: Array.isArray(theorySlots) ? theorySlots : [],
      labSlots: Array.isArray(labSlots) ? labSlots : [],
      venue: venue || '',
      priority: Number.isFinite(priority) ? priority : null,
    })),
  }));
}

/** The full link to hand to someone else. State rides in the hash, so it never hits a server. */
export function buildShareLink(subjects) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#shortlist=${encodeShortlist(subjects)}`;
}

/** Reads a shared shortlist out of the current URL, if there is one. */
export function readShareLink() {
  const match = /#shortlist=([A-Za-z0-9\-_]+)/.exec(window.location.hash || '');
  if (!match) return null;
  try {
    return decodeShortlist(match[1]);
  } catch {
    return null;
  }
}

export function clearShareLink() {
  if (window.history?.replaceState) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

/** Download the shortlist as a .json file. */
export function downloadBackup(subjects) {
  const payload = {
    app: 'ffcs-sahayak',
    v: FORMAT,
    savedAt: new Date().toISOString(),
    data: encodeShortlist(subjects),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ffcs-shortlist-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Parse a .json backup file's text back into subjects. */
export function parseBackupFile(text) {
  const parsed = JSON.parse(text);
  if (!parsed?.data) throw new Error('That file is missing its shortlist data');
  return decodeShortlist(parsed.data);
}
