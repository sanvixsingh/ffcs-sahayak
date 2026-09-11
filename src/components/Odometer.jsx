/**
 * Split-flap style counter. Each digit is a strip of 0-9 that slides to the
 * right number, so the "possible timetables" figure visibly collapses as a
 * student locks choices in — which is the whole feeling of registration day.
 */
export default function Odometer({ value, suffix = '' }) {
  const digits = String(value).split('');
  return (
    <span className="readout-value" aria-label={`${value}${suffix}`}>
      {digits.map((d, i) =>
        /\d/.test(d) ? (
          <span className="odo-digit" key={i} aria-hidden="true">
            <span className="odo-strip" style={{ transform: `translateY(-${Number(d) * 1.15}em)` }}>
              {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true">
            {d}
          </span>
        )
      )}
      {suffix && <span aria-hidden="true">{suffix}</span>}
    </span>
  );
}
