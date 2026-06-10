import { formatModifier } from '@/utils/dndCalculations';

export default function SkillRow({ skill, value, profLevel, onProfChange }) {
  return (
    <div className="stat-row">
      <button
        type="button"
        className={`proficiency-circle ${profLevel > 0 ? 'filled' : ''}`}
        style={profLevel === 2 ? { background: 'var(--ink-gold)', borderColor: 'var(--ink-gold)' } : {}}
        onClick={() => onProfChange && onProfChange((profLevel + 1) % 3)}
        title={profLevel === 0 ? 'Click to add proficiency' : profLevel === 1 ? 'Click for expertise' : 'Click to remove'}
      />
      <span className="flex-1 text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>
        {skill.name}
        <span className="opacity-50 ml-1" style={{ fontSize: '0.7rem' }}>({skill.ability})</span>
      </span>
      <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-mid)', minWidth: 28, textAlign: 'right' }}>
        {formatModifier(value)}
      </span>
    </div>
  );
}