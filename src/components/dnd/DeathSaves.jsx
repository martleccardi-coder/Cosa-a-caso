export default function DeathSaves({ successes = 0, failures = 0, onChange }) {
  return (
    <div className="parchment-box p-2">
      <div className="section-header mb-2">Death Saves</div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="sheet-label w-16">Successes</span>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <button
                key={i}
                type="button"
                className={`proficiency-circle ${i < successes ? 'filled' : ''}`}
                style={i < successes ? { background: '#2d6a2d', borderColor: '#2d6a2d' } : {}}
                onClick={() => onChange && onChange({ successes: i < successes ? i : i + 1, failures })}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="sheet-label w-16">Failures</span>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <button
                key={i}
                type="button"
                className={`proficiency-circle ${i < failures ? 'filled' : ''}`}
                style={i < failures ? { background: 'var(--ink-red)', borderColor: 'var(--ink-red)' } : {}}
                onClick={() => onChange && onChange({ successes, failures: i < failures ? i : i + 1 })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}