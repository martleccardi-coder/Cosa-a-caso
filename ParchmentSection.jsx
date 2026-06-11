export default function DeathSaves({ successes = 0, failures = 0, onChange }) {
  return (
    <div className="parchment-box p-2">
      <div className="section-header mb-2">Death Saves</div>
      <div className="flex gap-4 justify-center">
        <div>
          <div className="sheet-label text-center mb-1">Successes</div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`proficiency-circle ${i < successes ? 'filled' : ''}`}
                style={{ width: 14, height: 14, borderColor: '#2d6a2d', ...(i < successes ? { background: '#2d6a2d' } : {}) }}
                onClick={() => onChange && onChange({ successes: i < successes ? i : i + 1, failures })}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="sheet-label text-center mb-1">Failures</div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`proficiency-circle ${i < failures ? 'filled' : ''}`}
                style={{ width: 14, height: 14, borderColor: '#8B1A1A', ...(i < failures ? { background: '#8B1A1A' } : {}) }}
                onClick={() => onChange && onChange({ successes, failures: i < failures ? i : i + 1 })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}