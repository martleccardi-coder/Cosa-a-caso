import { getModifier, formatModifier } from '@/utils/dndCalculations';

export default function AbilityScoreBox({ ability, score, baseScore, onChange }) {
  const mod = getModifier(score);
  const bonus = score - baseScore;

  return (
    <div className="ability-box">
      <div className="sheet-label">{ability}</div>
      <div className="ability-modifier">{formatModifier(mod)}</div>
      <input
        type="number"
        value={baseScore}
        onChange={e => onChange && onChange(parseInt(e.target.value) || 10)}
        className="ability-score parchment-input text-center"
        style={{ maxWidth: 48, fontSize: '1.1rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}
        min={1}
        max={30}
      />
      {bonus !== 0 && (
        <div style={{ fontSize: '0.65rem', color: bonus > 0 ? '#2d6a2d' : '#8B1A1A', fontFamily: 'var(--font-heading)' }}>
          ({bonus > 0 ? '+' : ''}{bonus})
        </div>
      )}
    </div>
  );
}