import { getSpellSlots } from '@/utils/dndCalculations';

export default function SpellSlotsPanel({ className, level, slotsUsed = {}, onSlotToggle }) {
  const slots = getSpellSlots(className, level);
  if (!slots) return null;

  return (
    <div className="parchment-box p-2">
      <div className="section-header mb-2">Spell Slots</div>
      <div className="flex flex-col gap-1">
        {slots.map((total, idx) => {
          if (total === 0) return null;
          const spellLevel = idx + 1;
          const used = slotsUsed[spellLevel] || 0;
          return (
            <div key={spellLevel} className="flex items-center gap-2">
              <span className="sheet-label" style={{ minWidth: 48 }}>Level {spellLevel}</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`proficiency-circle ${i < used ? 'filled' : ''}`}
                    style={{ width: 12, height: 12, cursor: 'pointer' }}
                    onClick={() => onSlotToggle && onSlotToggle(spellLevel, i < used ? i : i + 1)}
                    title={i < used ? 'Slot used' : 'Slot available'}
                  />
                ))}
              </div>
              <span className="text-xs opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
                {total - used}/{total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}