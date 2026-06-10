import { getModifier, formatModifier } from '@/utils/dndCalculations';

export default function AbilityScoreBox({ ability, score, baseScore, onChange }) {
  const mod = getModifier(score);
  const bonus = score - baseScore;

  return (
    <div className="ability-box flex flex-col items-center">
      <div className="sheet-label mb-1">{ability}</div>
      <div
        className="ability-modifier mb-1"
        style={{ fontSize: '1.1rem', width: 40, height: 40 }}
      >
        {formatModifier(mod)}
      </div>
      <input
        type="number"
        min="1"
        max="30"
        value={baseScore || ''}
        onChange={e => onChange && onChange(parseInt(e.target.value) || 10)}
        className="ability-score parchment-input text-center"
        style={{ maxWidth: 48, fontSize: '1.1rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}
      />
      {bonus !== 0 && (
        <div className="text-xs mt-0.5" style={{ color: bonus > 0 ? '#2d6a2d' : '#8B1A1A', fontFamily: 'var(--font-heading)' }}>
          ({bonus > 0 ? '+' : ''}{bonus})
        </div>
      )}
    </div>
  );
}