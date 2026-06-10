import { useState, useMemo } from 'react';
import ParchmentSection from './ParchmentSection';
import SpellSlotsPanel from './SpellSlotsPanel';
import { formatModifier } from '@/utils/dndCalculations';
import { Search, BookOpen } from 'lucide-react';

const SCHOOL_COLORS = {
  'Abjuration': '#2d6a9f',
  'Conjuration': '#6a2d9f',
  'Divination': '#2d9f6a',
  'Enchantment': '#9f6a2d',
  'Evocation': '#9f2d2d',
  'Illusion': '#9f2d9f',
  'Necromancy': '#2d2d2d',
  'Transmutation': '#9f9f2d',
};

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
      <div className="parchment-box p-8 text-center">
        <BookOpen size={40} style={{ color: 'var(--parchment-dark)', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
          No class selected
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
          Select a class in the Core tab to view the spellbook.
        </div>
      </div>
    );
  }

  if (!derived.spellcastingAbility) {
    return (
      <div className="parchment-box p-8 text-center">
        <BookOpen size={40} style={{ color: 'var(--parchment-dark)', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
          {classItem?.name} is not a spellcasting class
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
          Switch to a spellcasting class to access the spellbook.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Spellcasting Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="parchment-box p-3 text-center">
          <div className="sheet-label">Casting Ability</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--ink-dark)' }}>
            {derived.spellcastingAbility}
          </div>
          <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
            {formatModifier(derived.modifiers[derived.spellcastingAbility])} modifier
          </div>
        </div>
        <div className="parchment-box p-3 text-center">
          <div className="sheet-label">Spell Save DC</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--ink-dark)' }}>
            {derived.spellSaveDC}
          </div>
          <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
            8 + {derived.profBonus} + {formatModifier(derived.modifiers[derived.spellcastingAbility])}
          </div>
        </div>
        <div className="parchment-box p-3 text-center">
          <div className="sheet-label">Spell Attack Bonus</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--ink-dark)' }}>
            {formatModifier(derived.spellAttackBonus)}
          </div>
          <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
            {derived.profBonus} + {formatModifier(derived.modifiers[derived.spellcastingAbility])}
          </div>
        </div>
      </div>

      {/* Spell Slots */}
      <SpellSlotsPanel
        className={classItem?.name}
        level={sheet.level || 1}
        slotsUsed={sheet.spell_slots_used || {}}
        onSlotToggle={(lvl, used) =>
          update({ spell_slots_used: { ...(sheet.spell_slots_used || {}), [lvl]: used } })
        }
      />

      {/* Filters */}
      <div className="parchment-box p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-1 flex-1 min-w-36" style={{ borderBottom: '1.5px solid var(--parchment-dark)' }}>
            <Search size={13} style={{ color: 'var(--ink-gold)', flexShrink: 0 }} />
            <input
              className="bg-transparent outline-none text-sm flex-1"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)', padding: '2px 4px' }}
              placeholder="Search spells..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Level filter */}
          <select
            className="parchment-select text-xs"
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="0">Cantrips</option>
            {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={String(l)}>Level {l}</option>)}
          </select>
          {/* School filter */}
          {schools.length > 0 && (
            <select
              className="parchment-select text-xs"
              value={filterSchool}
              onChange={e => setFilterSchool(e.target.value)}
            >
              <option value="all">All Schools</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {/* Known only */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyKnown}
              onChange={e => setShowOnlyKnown(e.target.checked)}
              style={{ accentColor: 'var(--ink-mid)', cursor: 'pointer' }}
            />
            <span className="sheet-label cursor-pointer">Known only ({knownCount})</span>
          </label>
        </div>
      </div>

      {/* Spell List */}
      {Object.entries(spellsByLevel).sort(([a],[b]) => Number(a) - Number(b)).map(([lvl, spells]) => (
        <ParchmentSection key={lvl} title={lvl === '0' ? 'Cantrips' : `Level ${lvl} Spells`}>
          <div className="space-y-1">
            {spells.map(spell => {
              const known = selectedSpellIds.includes(spell.id);
              return (
                <div
                  key={spell.id}
                  className="flex items-start gap-2 py-1 px-1 rounded transition-all cursor-pointer"
                  style={{
                    background: known ? 'rgba(61,43,31,0.08)' : 'transparent',
                    borderLeft: known ? '2px solid var(--ink-mid)' : '2px solid transparent',
                  }}
                  onClick={() => toggleSpell(spell.id)}
                >
                  <input
                    type="checkbox"
                    checked={known}
                    onChange={() => toggleSpell(spell.id)}
                    style={{ cursor: 'pointer', accentColor: 'var(--ink-mid)', marginTop: 3, flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}
                      >
                        {spell.name}
                      </span>
                      {spell.spell_school && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: `${SCHOOL_COLORS[spell.spell_school] || '#555'}22`,
                            color: SCHOOL_COLORS[spell.spell_school] || '#555',
                            fontFamily: 'var(--font-body)',
                            border: `1px solid ${SCHOOL_COLORS[spell.spell_school] || '#555'}44`,
                          }}
                        >
                          {spell.spell_school}
                        </span>
                      )}
                      {spell.casting_time && (
                        <span className="text-xs opacity-50" style={{ fontFamily: 'var(--font-body)' }}>
                          {spell.casting_time}
                        </span>
                      )}
                      {spell.range_imperial && (
                        <span className="text-xs opacity-50" style={{ fontFamily: 'var(--font-body)' }}>
                          {spell.range_imperial}
                        </span>
                      )}
                      <span className="text-xs opacity-40 ml-auto" style={{ fontFamily: 'var(--font-body)' }}>
                        {spell.source}
                      </span>
                    </div>
                    {spell.short_description && (
                      <div
                        className="text-xs mt-0.5"
                        style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontStyle: 'italic' }}
                      >
                        {spell.short_description}
                      </div>
                    )}
                    {spell.components && (
                      <div className="text-xs opacity-50 mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                        Components: {spell.components}
                        {spell.duration && ` · Duration: ${spell.duration}`}
                      </div>
                    )}
                    {spell.damage_dice && (
                      <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-red)' }}>
                        {spell.damage_dice} {spell.damage_type}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ParchmentSection>
      ))}

      {Object.keys(spellsByLevel).length === 0 && (
        <div className="text-center py-10" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
          {showOnlyKnown
            ? 'No spells prepared yet. Uncheck "Known only" to browse all spells.'
            : 'No spells found for this class. Admins can add spells in the Item Library.'}
        </div>
      )}
    </div>
  );
}