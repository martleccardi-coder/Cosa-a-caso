import { getSpellSlots } from '@/utils/dndCalculations';

export default function SpellSlotsPanel({ className, level, slotsUsed = {}, onSlotToggle }) {
  const slots = getSpellSlots(className, level);
  if (!slots) return null;

  return (
    <div className="parchment-box p-3 mb-3">
      <div className="section-header mb-2">Spell Slots</div>
      <div className="space-y-2">
        {slots.map((total, idx) => {
          if (total === 0) return null;
          const spellLevel = idx + 1;
          const used = slotsUsed[spellLevel] || 0;
          return (
            <div key={spellLevel} className="flex items-center gap-2">
              <span className="sheet-label w-14">Lvl {spellLevel}</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: total }).map((_, i) => (
                  <div
                    key={i}
                    className={`proficiency-circle ${i < used ? 'filled' : ''}`}
                    style={{
                      width: 14, height: 14,
                      cursor: 'pointer',
                      background: i < used ? 'var(--ink-mid)' : '',
                    }}
                    onClick={() => onSlotToggle && onSlotToggle(spellLevel, i < used ? i : i + 1)}
                    title={i < used ? 'Slot used' : 'Slot available'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', marginLeft: 'auto' }}>
                {total - used}/{total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}