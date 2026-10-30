import { useRef, useState } from 'react';
import { buildShareLink, downloadBackup, parseBackupFile } from '../lib/transfer';

/**
 * Getting a shortlist onto another machine. The link is the quick path —
 * send it, they open it, their copy fills in. The file is the belt-and-braces
 * version for when a link is too unwieldy to paste around.
 */
export default function BackupPanel({ subjects, onImport }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [linkLength, setLinkLength] = useState(0);
  const fileRef = useRef(null);

  const hasData = subjects.length > 0;

  const copyLink = async () => {
    setError('');
    try {
      const link = buildShareLink(subjects);
      setLinkLength(link.length);
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Your browser blocked the copy. Use the backup file instead.");
    }
  };

  const loadFile = async (event) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const subjectsFromFile = parseBackupFile(await file.text());
      onImport(subjectsFromFile);
    } catch {
      setError("That file didn't look like a FFCS Sahayak backup.");
    }
    event.target.value = '';
  };

  return (
    <section className="panel" style={{ marginTop: 24 }}>
      <div className="panel-head">
        <span className="panel-title" style={{ fontSize: 15 }}>
          Move this to another device
        </span>
      </div>

      <div className="backup-body">
        <p className="backup-note">
          Your shortlist is saved in this browser only. To use it on another laptop or phone — or to hand it to
          someone registering on your behalf — send them the link, or save a file and send that.
        </p>

        <div className="backup-actions">
          <button className="btn primary small" onClick={copyLink} disabled={!hasData}>
            {copied ? 'Link copied' : 'Copy share link'}
          </button>
          <button className="btn small" onClick={() => downloadBackup(subjects)} disabled={!hasData}>
            Save backup file
          </button>
          <button className="btn ghost small" onClick={() => fileRef.current?.click()}>
            Load from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={loadFile}
            style={{ display: 'none' }}
          />
        </div>

        {copied && (
          <p className="backup-status">
            Paste it into WhatsApp and whoever opens it gets your exact shortlist. Nothing is uploaded anywhere —
            the whole list travels inside the link.
            {linkLength > 7000 && (
              <strong> This link is very long, so send the backup file instead if it gets cut off.</strong>
            )}
          </p>
        )}
        {error && <p className="reason">{error}</p>}
      </div>
    </section>
  );
}
