import { formatModifier } from '@/utils/dndCalculations';

export default function SkillRow({ skill, value, profLevel, onProfChange }) {
  return (
    <div className="stat-row">
      <div
        className={`proficiency-circle ${profLevel > 0 ? 'filled' : ''}`}
        style={profLevel === 2 ? { background: 'var(--ink-gold)', borderColor: 'var(--ink-gold)' } : {}}
        onClick={() => onProfChange && onProfChange((profLevel + 1) % 3)}
        title={profLevel === 0 ? 'Click to add proficiency' : profLevel === 1 ? 'Click for expertise' : 'Click to remove'}
      />
      <span style={{ flex: 1, fontSize: '0.82rem' }}>{skill.name}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', marginRight: 4 }}>({skill.ability})</span>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', minWidth: 28, textAlign: 'right' }}>
        {formatModifier(value)}
      </span>
    </div>
  );
}