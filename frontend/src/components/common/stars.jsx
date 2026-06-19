/** Display-only star rating */
export function Stars({ score = 0, max = 5 }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(score) ? "star-filled" : "star-empty"}>
          ★
        </span>
      ))}
    </span>
  );
}
 
/** Interactive star picker */
export function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`text-4xl transition-transform active:scale-110
                      ${v <= value ? "star-filled" : "star-empty"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}