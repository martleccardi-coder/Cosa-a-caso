import { useState, useMemo } from 'react';
import ParchmentSection from './ParchmentSection';
import SpellSlotsPanel from './SpellSlotsPanel';
import { formatModifier } from '@/utils/dndCalculations';
import { Search } from 'lucide-react';

export default function SpellbookTab({ sheet, update, derived, items, classItem }) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [showOnlyKnown, setShowOnlyKnown] = useState(false);

  const allSpells = useMemo(() => items.filter(i => i.category === 'Spell'), [items]);

  const classSpells = useMemo(() => {
    if (!classItem) return allSpells;
    return allSpells.filter(s =>
      !s.available_classes?.length ||
      s.available_classes.includes(classItem.name) ||
      s.class_spell_list === classItem.name
    );
  }, [allSpells, classItem]);

  const schools = useMemo(() => {
    const s = new Set(classSpells.map(sp => sp.spell_school).filter(Boolean));
    return [...s].sort();
  }, [classSpells]);

  const filteredSpells = useMemo(() => {
    return classSpells.filter(spell => {
      if (showOnlyKnown && !sheet.spell_ids?.includes(spell.id)) return false;
      if (filterLevel !== 'all' && String(spell.spell_level ?? 0) !== filterLevel) return false;
      if (filterSchool !== 'all' && spell.spell_school !== filterSchool) return false;
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [classSpells, filterLevel, filterSchool, search, showOnlyKnown, sheet.spell_ids]);

  const spellsByLevel = useMemo(() => {
    const grouped = {};
    filteredSpells.forEach(s => {
      const lvl = s.spell_level ?? 0;
      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(s);
    });
    return grouped;
  }, [filteredSpells]);

  const selectedSpellIds = sheet.spell_ids || [];

  const toggleSpell = (id) => {
    if (selectedSpellIds.includes(id)) {
      update({ spell_ids: selectedSpellIds.filter(s => s !== id) });
    } else {
      update({ spell_ids: [...selectedSpellIds, id] });
    }
  };

  const knownCount = selectedSpellIds.filter(id => allSpells.find(s => s.id === id)).length;

  if (!derived.spellcastingAbility && !classItem) {
    return (
      <div className="parchment-box p-6 text-center">
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
          Select a class in the Core tab to view the spellbook.
        </p>
      </div>
    );
  }

  if (!derived.spellcastingAbility) {
    return (
      <div className="parchment-box p-6 text-center">
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
          {classItem?.name} is not a spellcasting class.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Casting Ability</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>{derived.spellcastingAbility}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-mid)' }}>{formatModifier(derived.modifiers[derived.spellcastingAbility])}</div>
        </div>
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Spell Save DC</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>{derived.spellSaveDC}</div>
        </div>
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Spell Attack</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>{formatModifier(derived.spellAttackBonus)}</div>
        </div>
      </div>

      <SpellSlotsPanel
        className={classItem?.name}
        level={sheet.level}
        slotsUsed={sheet.spell_slots_used || {}}
        onSlotToggle={(lvl, used) => update({ spell_slots_used: { ...(sheet.spell_slots_used || {}), [lvl]: used } })}
      />

      <ParchmentSection title="Filters">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 flex-1 min-w-[120px]">
            <Search size={12} style={{ color: 'var(--ink-mid)' }} />
            <input
              className="parchment-input text-sm w-full"
              placeholder="Search spells..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="parchment-select text-sm" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="0">Cantrips</option>
            {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Level {l}</option>)}
          </select>
          {schools.length > 0 && (
            <select className="parchment-select text-sm" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
              <option value="all">All Schools</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <label className="flex items-center gap-1 cursor-pointer text-sm" style={{ fontFamily: 'var(--font-body)' }}>
            <input
              type="checkbox"
              checked={showOnlyKnown}
              onChange={e => setShowOnlyKnown(e.target.checked)}
              style={{ accentColor: 'var(--ink-mid)' }}
            />
            Known only ({knownCount})
          </label>
        </div>
      </ParchmentSection>

      {Object.entries(spellsByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([lvl, spells]) => (
        <ParchmentSection key={lvl} title={lvl === '0' ? 'Cantrips' : `Level ${lvl} Spells`}>
          {spells.map(spell => {
            const known = selectedSpellIds.includes(spell.id);
            return (
              <div
                key={spell.id}
                className="mb-2 p-2 rounded cursor-pointer"
                style={{ background: known ? 'rgba(200,169,110,0.3)' : 'rgba(232,213,163,0.2)', border: '1px solid var(--parchment-dark)' }}
                onClick={() => toggleSpell(spell.id)}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={known}
                    onChange={() => toggleSpell(spell.id)}
                    style={{ cursor: 'pointer', accentColor: 'var(--ink-mid)', marginTop: 2, flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1">
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem' }}>{spell.name}</span>
                      {spell.spell_school && (
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: 3, background: 'var(--parchment-mid)', color: 'var(--ink-mid)' }}>{spell.spell_school}</span>
                      )}
                      {spell.casting_time && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--ink-mid)' }}>{spell.casting_time}</span>
                      )}
                      <span style={{ fontSize: '0.65rem', marginLeft: 'auto', color: 'var(--ink-mid)' }}>{spell.source}</span>
                    </div>
                    {spell.short_description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', marginTop: 2 }}>{spell.short_description}</p>
                    )}
                    {spell.damage_dice && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-red)', fontFamily: 'var(--font-heading)' }}>
                        {spell.damage_dice} {spell.damage_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </ParchmentSection>
      ))}

      {Object.keys(spellsByLevel).length === 0 && (
        <div className="parchment-box p-4 text-center">
          <p style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
            {showOnlyKnown
              ? 'No spells prepared yet. Uncheck "Known only" to browse.'
              : 'No spells found. Admins can add spells in the Item Library.'}
          </p>
        </div>
      )}
    </div>
  );
}