import { useState, useEffect, useMemo } from 'react';

import {
  ABILITY_SCORES, SKILLS, ALIGNMENTS, computeDerivedStats,
  formatModifier, getProficiencyBonus, feetToMeters, lbsToKg
} from '@/utils/dndCalculations';
import AbilityScoreBox from './AbilityScoreBox';
import SkillRow from './SkillRow';
import ItemDropdown from './ItemDropdown';
import DeathSaves from './DeathSaves';
import SpellSlotsPanel from './SpellSlotsPanel';
import ParchmentSection from './ParchmentSection';
import InventoryPanel from './InventoryPanel';
import LevelUpModal from './LevelUpModal';
import SpellbookTab from './SpellbookTab';
import { Sword, Shield, Scroll, Star, BookOpen, User, Heart } from 'lucide-react';

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function CharacterSheetForm({ sheet, items, onChange }) {
  const [activeTab, setActiveTab] = useState('core');
  const [levelUpPending, setLevelUpPending] = useState(null); // new level number if modal open

  const itemsByCategory = useMemo(() => {
    const map = {};
    items.forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [items]);

  const derived = useMemo(
    () => computeDerivedStats(sheet, items),
    [sheet, items]
  );

  const update = (patch) => onChange({ ...sheet, ...patch });

  const handleLevelChange = (newLevel) => {
    const oldLevel = sheet.level || 1;
    if (newLevel > oldLevel) {
      setLevelUpPending(newLevel);
    } else {
      update({ level: newLevel });
    }
  };

  const handleLevelUpConfirm = (changes) => {
    onChange({ ...sheet, ...changes });
    setLevelUpPending(null);
  };

  const updateAbility = (ability, baseValue) => {
    const current = sheet.ability_scores || {};
    // Calculate bonuses from items
    const bonuses = {};
    ABILITY_SCORES.forEach(a => { bonuses[a] = 0; });
    const activeIds = [sheet.race_id, sheet.subrace_id, sheet.class_id, sheet.background_id, ...(sheet.feat_ids||[])].filter(Boolean);
    activeIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item?.effects) {
        item.effects.forEach(e => {
          if (e.type === 'ability_score_bonus' && ABILITY_SCORES.includes(e.target)) {
            bonuses[e.target] = (bonuses[e.target] || 0) + parseInt(e.value || 0);
          }
        });
      }
    });
    update({ ability_scores: { ...current, [ability]: baseValue } });
  };

  // Get base (pre-bonus) ability scores
  const getBaseScore = (ability) => {
    const current = sheet.ability_scores?.[ability] || 10;
    // Subtract bonuses from items
    let bonus = 0;
    const activeIds = [sheet.race_id, sheet.subrace_id, sheet.class_id, sheet.background_id, ...(sheet.feat_ids||[])].filter(Boolean);
    activeIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item?.effects) {
        item.effects.forEach(e => {
          if (e.type === 'ability_score_bonus' && e.target === ability) {
            bonus += parseInt(e.value || 0);
          }
        });
      }
    });
    return current - bonus;
  };

  const classItem = items.find(i => i.id === sheet.class_id);

  const tabs = [
    { id: 'core', label: 'Core', icon: User },
    { id: 'combat', label: 'Combat', icon: Sword },
    { id: 'skills', label: 'Skills', icon: Star },
    { id: 'spellbook', label: 'Spellbook', icon: BookOpen },
    { id: 'equipment', label: 'Equipment', icon: Shield },
    { id: 'backstory', label: 'Story', icon: Scroll },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--parchment-dark)', background: 'var(--parchment-mid)', flexShrink: 0 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 text-xs transition-all whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: activeTab === t.id ? 'var(--parchment-light)' : 'var(--ink-mid)',
                background: activeTab === t.id ? 'var(--ink-mid)' : 'transparent',
                borderBottom: activeTab === t.id ? '2px solid var(--ink-gold)' : '2px solid transparent',
              }}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {levelUpPending && (
        <LevelUpModal
          sheet={sheet}
          newLevel={levelUpPending}
          items={items}
          onConfirm={handleLevelUpConfirm}
          onCancel={() => setLevelUpPending(null)}
        />
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'core' && (
          <CoreTab
            sheet={sheet}
            update={update}
            derived={derived}
            items={items}
            itemsByCategory={itemsByCategory}
            updateAbility={updateAbility}
            getBaseScore={getBaseScore}
            onLevelChange={handleLevelChange}
          />
        )}
        {activeTab === 'combat' && (
          <CombatTab sheet={sheet} update={update} derived={derived} items={items} itemsByCategory={itemsByCategory} />
        )}
        {activeTab === 'skills' && (
          <SkillsTab sheet={sheet} update={update} derived={derived} />
        )}
        {activeTab === 'spellbook' && (
          <SpellbookTab sheet={sheet} update={update} derived={derived} items={items} classItem={classItem} />
        )}
        {activeTab === 'equipment' && (
          <EquipmentTab sheet={sheet} update={update} derived={derived} items={items} itemsByCategory={itemsByCategory} />
        )}
        {activeTab === 'backstory' && (
          <BackstoryTab sheet={sheet} update={update} />
        )}
      </div>
    </div>
  );
}

// ─── CORE TAB ────────────────────────────────────────────────────────────────
function CoreTab({ sheet, update, derived, items, itemsByCategory, updateAbility, getBaseScore, onLevelChange }) {
  return (
    <div className="space-y-3">
      {/* Character Info */}
      <ParchmentSection title="Character Information">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="sheet-label">Character Name</div>
            <input className="parchment-input text-sm" value={sheet.character_name || ''} onChange={e => update({ character_name: e.target.value })} />
          </div>
          <div>
            <div className="sheet-label">Player Name</div>
            <input className="parchment-input text-sm" value={sheet.player_name || ''} onChange={e => update({ player_name: e.target.value })} />
          </div>
          <div>
            <ItemDropdown label="Class" items={itemsByCategory['Class'] || []} value={sheet.class_id} onChange={v => update({ class_id: v, subclass_id: null })} />
          </div>
          <div>
            <div className="sheet-label">Level</div>
            <select className="parchment-select w-full text-sm" value={sheet.level || 1} onChange={e => onLevelChange(parseInt(e.target.value))}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <ItemDropdown label="Race" items={itemsByCategory['Race'] || []} value={sheet.race_id} onChange={v => update({ race_id: v, subrace_id: null })} />
          </div>
          <div>
            <ItemDropdown label="Subrace" items={(itemsByCategory['Subrace'] || []).filter(i => !i.parent_item_id || i.parent_item_id === sheet.race_id)} value={sheet.subrace_id} onChange={v => update({ subrace_id: v })} disabled={!sheet.race_id} />
          </div>
          <div>
            <ItemDropdown label="Background" items={itemsByCategory['Background'] || []} value={sheet.background_id} onChange={v => update({ background_id: v })} />
          </div>
          <div>
            <ItemDropdown label="Subclass" items={(itemsByCategory['Subclass'] || []).filter(i => !i.parent_item_id || i.parent_item_id === sheet.class_id)} value={sheet.subclass_id} onChange={v => update({ subclass_id: v })} disabled={!sheet.class_id} />
          </div>
          <div>
            <div className="sheet-label">Alignment</div>
            <select className="parchment-select w-full text-sm" value={sheet.alignment || ''} onChange={e => update({ alignment: e.target.value })}>
              <option value="">Select...</option>
              {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div className="sheet-label">Experience Points</div>
            <input type="number" className="parchment-input text-sm" value={sheet.experience_points || 0} onChange={e => update({ experience_points: parseInt(e.target.value) || 0 })} min="0" />
          </div>
        </div>
      </ParchmentSection>

      {/* Ability Scores */}
      <ParchmentSection title="Ability Scores">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ABILITY_SCORES.map(ability => (
            <AbilityScoreBox
              key={ability}
              ability={ability}
              score={derived.abilityScores[ability]}
              baseScore={getBaseScore(ability)}
              onChange={v => updateAbility(ability, v)}
            />
          ))}
        </div>
        <div className="mt-2 text-xs text-center" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
          Enter base values — racial/feat bonuses are applied automatically
        </div>
      </ParchmentSection>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Proficiency Bonus</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--ink-dark)' }}>
            {formatModifier(derived.profBonus)}
          </div>
        </div>
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Passive Perception</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--ink-dark)' }}>
            {derived.passivePerception}
          </div>
        </div>
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label flex items-center justify-center gap-1">
            <input type="checkbox" checked={sheet.inspiration || false} onChange={e => update({ inspiration: e.target.checked })} style={{ cursor: 'pointer' }} />
            Inspiration
          </div>
        </div>
      </div>

      {/* Appearance */}
      <ParchmentSection title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="sheet-label">Age</div>
            <input className="parchment-input text-sm" value={sheet.appearance?.age || ''} onChange={e => update({ appearance: { ...sheet.appearance, age: e.target.value } })} />
          </div>
          <div>
            <div className="sheet-label">Height (cm)</div>
            <input type="number" className="parchment-input text-sm" value={sheet.appearance?.height_cm || ''} onChange={e => update({ appearance: { ...sheet.appearance, height_cm: parseInt(e.target.value) } })} />
          </div>
          <div>
            <div className="sheet-label">Weight (kg)</div>
            <input type="number" className="parchment-input text-sm" value={sheet.appearance?.weight_kg || ''} onChange={e => update({ appearance: { ...sheet.appearance, weight_kg: parseFloat(e.target.value) } })} />
          </div>
          <div>
            <div className="sheet-label">Eyes</div>
            <input className="parchment-input text-sm" value={sheet.appearance?.eyes || ''} onChange={e => update({ appearance: { ...sheet.appearance, eyes: e.target.value } })} />
          </div>
          <div>
            <div className="sheet-label">Skin</div>
            <input className="parchment-input text-sm" value={sheet.appearance?.skin || ''} onChange={e => update({ appearance: { ...sheet.appearance, skin: e.target.value } })} />
          </div>
          <div>
            <div className="sheet-label">Hair</div>
            <input className="parchment-input text-sm" value={sheet.appearance?.hair || ''} onChange={e => update({ appearance: { ...sheet.appearance, hair: e.target.value } })} />
          </div>
        </div>
      </ParchmentSection>

      {/* Auto-applied traits */}
      {derived.traits.length > 0 && (
        <ParchmentSection title="Racial & Class Traits">
          <div className="space-y-1">
            {derived.traits.map((t, i) => (
              <div key={i} className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>
                <span className="font-semibold">{t.label}:</span>{' '}
                <span style={{ color: 'var(--ink-mid)' }}>{t.value}</span>
              </div>
            ))}
          </div>
        </ParchmentSection>
      )}

      {/* Languages */}
      {derived.languages.length > 0 && (
        <ParchmentSection title="Languages">
          <div className="flex flex-wrap gap-1">
            {derived.languages.map((l, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--parchment-dark)', color: 'var(--ink-dark)', fontFamily: 'var(--font-body)' }}>
                {l}
              </span>
            ))}
          </div>
        </ParchmentSection>
      )}
    </div>
  );
}

// ─── COMBAT TAB ──────────────────────────────────────────────────────────────
function CombatTab({ sheet, update, derived, items, itemsByCategory }) {
  const addAttack = () => update({ attacks: [...(sheet.attacks || []), { name: '', attack_bonus: '', damage: '', damage_type: '' }] });
  const removeAttack = (i) => update({ attacks: sheet.attacks.filter((_, idx) => idx !== i) });
  const updateAttack = (i, field, val) => {
    const attacks = [...(sheet.attacks || [])];
    attacks[i] = { ...attacks[i], [field]: val };
    update({ attacks });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="hp-box">
          <div className="sheet-label">Armor Class</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--ink-dark)' }}>{derived.ac}</div>
          <input type="number" className="parchment-input text-xs text-center mt-1" placeholder="Override" value={sheet.ac_override || ''} onChange={e => update({ ac_override: parseInt(e.target.value) || null })} />
        </div>
        <div className="hp-box">
          <div className="sheet-label">Initiative</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--ink-dark)' }}>{formatModifier(derived.initiativeBonus)}</div>
        </div>
        <div className="hp-box">
          <div className="sheet-label">Speed</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--ink-dark)' }}>{derived.speedM} m</div>
        </div>
      </div>

      <ParchmentSection title="Hit Points">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="sheet-label">Maximum HP</div>
            <input
              type="number"
              className="parchment-input text-center text-lg font-heading"
              value={sheet.hp_max !== undefined && sheet.hp_max !== null ? sheet.hp_max : derived.hpMax}
              onChange={e => update({ hp_max: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
              Auto: {derived.hpMax} ({derived.hitDie}+CON×{sheet.level || 1})
            </div>
          </div>
          <div className="text-center">
            <div className="sheet-label">Current HP</div>
            <input type="number" className="parchment-input text-center text-lg font-heading" value={sheet.hp_current ?? derived.hpMax} onChange={e => update({ hp_current: parseInt(e.target.value) })} />
          </div>
          <div className="text-center">
            <div className="sheet-label">Temporary HP</div>
            <input type="number" className="parchment-input text-center text-lg font-heading" value={sheet.hp_temp || 0} onChange={e => update({ hp_temp: parseInt(e.target.value) || 0 })} min="0" />
          </div>
        </div>
        <div className="mt-2 text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
          Leave Max HP at 0 to use auto-calculated value. Override by entering a number.
        </div>
      </ParchmentSection>

      <div className="grid grid-cols-2 gap-2">
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Hit Die</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>{derived.hitDie}</div>
        </div>
        <DeathSaves
          successes={sheet.death_saves?.successes || 0}
          failures={sheet.death_saves?.failures || 0}
          onChange={ds => update({ death_saves: ds })}
        />
      </div>

      {/* Saving Throws */}
      <ParchmentSection title="Saving Throws">
        {ABILITY_SCORES.map(a => (
          <div key={a} className="stat-row">
            <button
              type="button"
              className={`proficiency-circle ${derived.savingThrowProfs.includes(a) ? 'filled' : ''}`}
              onClick={() => {
                const cur = sheet.saving_throw_overrides || {};
                update({ saving_throw_overrides: { ...cur, [a]: !cur[a] && !derived.savingThrowProfs.includes(a) } });
              }}
            />
            <span className="flex-1 text-sm" style={{ fontFamily: 'var(--font-body)' }}>{a}</span>
            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-mid)' }}>
              {formatModifier(derived.savingThrows[a])}
            </span>
          </div>
        ))}
      </ParchmentSection>

      {/* Attacks */}
      <ParchmentSection title="Attacks & Spellcasting">
        {derived.spellcastingAbility && (
          <div className="flex gap-3 mb-2">
            <div className="text-center parchment-box p-1 flex-1">
              <div className="sheet-label">Spell Save DC</div>
              <div style={{ fontFamily: 'var(--font-heading)' }}>{derived.spellSaveDC}</div>
            </div>
            <div className="text-center parchment-box p-1 flex-1">
              <div className="sheet-label">Spell Attack</div>
              <div style={{ fontFamily: 'var(--font-heading)' }}>{formatModifier(derived.spellAttackBonus)}</div>
            </div>
            <div className="text-center parchment-box p-1 flex-1">
              <div className="sheet-label">Spell Ability</div>
              <div style={{ fontFamily: 'var(--font-heading)' }}>{derived.spellcastingAbility}</div>
            </div>
          </div>
        )}
        <div className="space-y-1">
          {(sheet.attacks || []).map((atk, i) => (
            <div key={i} className="flex gap-1 items-center">
              <input className="parchment-input text-xs flex-1" placeholder="Name" value={atk.name || ''} onChange={e => updateAttack(i, 'name', e.target.value)} />
              <input className="parchment-input text-xs w-14" placeholder="+Atk" value={atk.attack_bonus || ''} onChange={e => updateAttack(i, 'attack_bonus', e.target.value)} />
              <input className="parchment-input text-xs w-16" placeholder="Damage" value={atk.damage || ''} onChange={e => updateAttack(i, 'damage', e.target.value)} />
              <input className="parchment-input text-xs w-16" placeholder="Type" value={atk.damage_type || ''} onChange={e => updateAttack(i, 'damage_type', e.target.value)} />
              <button type="button" className="text-xs" style={{ color: 'var(--ink-red)' }} onClick={() => removeAttack(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="scroll-btn text-xs mt-1" onClick={addAttack}>+ Add Attack</button>
        </div>
      </ParchmentSection>

      {/* Armor & Equipment Selection */}
      <ParchmentSection title="Armor">
        <ItemDropdown
          label="Equipped Armor"
          items={[...(itemsByCategory['Armor'] || []), ...(itemsByCategory['Magic Item'] || []).filter(i => i.armor_class)]}
          value={sheet.equipped_armor_id}
          onChange={v => update({ equipped_armor_id: v })}
        />
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" id="shield" checked={sheet.equipped_shield || false} onChange={e => update({ equipped_shield: e.target.checked })} />
          <label htmlFor="shield" className="sheet-label cursor-pointer">Shield Equipped (+2 AC)</label>
        </div>
      </ParchmentSection>

      {/* Proficiencies */}
      <ParchmentSection title="Proficiencies">
        {derived.weaponProfs.length > 0 && (
          <div className="mb-1">
            <div className="sheet-label">Weapons</div>
            <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>{derived.weaponProfs.join(', ')}</div>
          </div>
        )}
        {derived.armorProfs.length > 0 && (
          <div className="mb-1">
            <div className="sheet-label">Armor</div>
            <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>{derived.armorProfs.join(', ')}</div>
          </div>
        )}
        {derived.toolProfs.length > 0 && (
          <div className="mb-1">
            <div className="sheet-label">Tools</div>
            <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>{derived.toolProfs.join(', ')}</div>
          </div>
        )}
        <div>
          <div className="sheet-label">Carrying Capacity</div>
          <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>{derived.carryingCapacityKg} kg</div>
        </div>
        {derived.darkvision > 0 && (
          <div className="mt-1">
            <div className="sheet-label">Darkvision</div>
            <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>{Math.round(feetToMeters(derived.darkvision) * 10) / 10} m</div>
          </div>
        )}
      </ParchmentSection>
    </div>
  );
}

// ─── SKILLS TAB ──────────────────────────────────────────────────────────────
function SkillsTab({ sheet, update, derived }) {
  const updateSkillProf = (skillName, level) => {
    const overrides = { ...(sheet.skill_overrides || {}) };
    overrides[skillName] = level;
    update({ skill_overrides: overrides });
  };

  return (
    <div className="space-y-3">
      <ParchmentSection title="Skills">
        <div className="space-y-0.5">
          {SKILLS.map(skill => (
            <SkillRow
              key={skill.name}
              skill={skill}
              value={derived.skillValues[skill.name]}
              profLevel={derived.skillProfs[skill.name] || 0}
              onProfChange={v => updateSkillProf(skill.name, v)}
            />
          ))}
        </div>
        <div className="mt-2 text-xs" style={{ color: 'var(--ink-mid)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
          ● Proficient &nbsp;&nbsp; ◉ Expertise &nbsp;&nbsp; (Filled = auto from class/background)
        </div>
      </ParchmentSection>
    </div>
  );
}

// ─── SPELLS TAB ──────────────────────────────────────────────────────────────
function SpellsTab({ sheet, update, derived, items, itemsByCategory, classItem }) {
  const spells = itemsByCategory['Spell'] || [];
  const classSpells = classItem
    ? spells.filter(s => !s.available_classes?.length || s.available_classes.includes(classItem.name) || s.class_spell_list === classItem.name)
    : spells;

  const selectedSpellIds = sheet.spell_ids || [];

  const toggleSpell = (id) => {
    if (selectedSpellIds.includes(id)) {
      update({ spell_ids: selectedSpellIds.filter(s => s !== id) });
    } else {
      update({ spell_ids: [...selectedSpellIds, id] });
    }
  };

  const spellsByLevel = {};
  classSpells.forEach(s => {
    const lvl = s.spell_level ?? 0;
    if (!spellsByLevel[lvl]) spellsByLevel[lvl] = [];
    spellsByLevel[lvl].push(s);
  });

  return (
    <div className="space-y-3">
      {derived.spellcastingAbility ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="parchment-box p-2 text-center">
              <div className="sheet-label">Spellcasting Ability</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>{derived.spellcastingAbility}</div>
            </div>
            <div className="parchment-box p-2 text-center">
              <div className="sheet-label">Spell Save DC</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>{derived.spellSaveDC}</div>
            </div>
            <div className="parchment-box p-2 text-center">
              <div className="sheet-label">Spell Attack Bonus</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>{formatModifier(derived.spellAttackBonus)}</div>
            </div>
          </div>

          <SpellSlotsPanel
            className={classItem?.name}
            level={sheet.level || 1}
            slotsUsed={sheet.spell_slots_used || {}}
            onSlotToggle={(lvl, used) => update({ spell_slots_used: { ...(sheet.spell_slots_used || {}), [lvl]: used } })}
          />

          {Object.entries(spellsByLevel).sort(([a],[b]) => a-b).map(([lvl, spellList]) => (
            <ParchmentSection key={lvl} title={lvl === '0' ? 'Cantrips' : `Level ${lvl} Spells`}>
              <div className="grid grid-cols-1 gap-1">
                {spellList.map(spell => (
                  <div key={spell.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSpellIds.includes(spell.id)}
                      onChange={() => toggleSpell(spell.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--ink-mid)' }}
                    />
                    <span className="text-sm flex-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>
                      {spell.name}
                    </span>
                    {spell.casting_time && (
                      <span className="text-xs opacity-50" style={{ fontFamily: 'var(--font-body)' }}>{spell.casting_time}</span>
                    )}
                    {spell.source && (
                      <span className="text-xs opacity-40" style={{ fontFamily: 'var(--font-body)' }}>{spell.source}</span>
                    )}
                  </div>
                ))}
              </div>
            </ParchmentSection>
          ))}

          {classSpells.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
              No spells found. Administrators can add spells in the Item Library.
            </div>
          )}
        </>
      ) : (
        <div className="parchment-box p-6 text-center">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink-mid)' }}>
            This class does not have spellcasting.
          </div>
          {!classItem && (
            <div className="text-sm mt-2" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
              Select a class in the Core tab to see available spells.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EQUIPMENT TAB ───────────────────────────────────────────────────────────
function EquipmentTab({ sheet, update, derived, items, itemsByCategory }) {
  const equipmentIds = sheet.equipment_ids || [];
  const featIds = sheet.feat_ids || [];
  const inventory = sheet.inventory || [];

  const toggleEquipment = (id) => {
    if (equipmentIds.includes(id)) {
      update({ equipment_ids: equipmentIds.filter(e => e !== id) });
    } else {
      update({ equipment_ids: [...equipmentIds, id] });
    }
  };

  const toggleFeat = (id) => {
    if (featIds.includes(id)) {
      update({ feat_ids: featIds.filter(f => f !== id) });
    } else {
      update({ feat_ids: [...featIds, id] });
    }
  };

  const equipmentCategories = ['Weapon', 'Armor', 'Adventuring Gear', 'Tool', 'Mount & Vehicle', 'Magic Item'];

  return (
    <div className="space-y-3">
      {/* Feats */}
      <ParchmentSection title="Feats">
        <div className="grid grid-cols-1 gap-1">
          {(itemsByCategory['Feat'] || []).map(feat => (
            <div key={feat.id} className="flex items-center gap-2">
              <input type="checkbox" checked={featIds.includes(feat.id)} onChange={() => toggleFeat(feat.id)} style={{ cursor: 'pointer', accentColor: 'var(--ink-mid)' }} />
              <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>{feat.name}</span>
              <span className="text-xs opacity-50 ml-auto">{feat.source}</span>
            </div>
          ))}
          {!(itemsByCategory['Feat']?.length) && (
            <div className="text-sm" style={{ color: 'var(--ink-mid)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>No feats in library yet.</div>
          )}
        </div>
      </ParchmentSection>

      {/* Equipment */}
      {equipmentCategories.map(cat => {
        const catItems = itemsByCategory[cat] || [];
        if (!catItems.length) return null;
        return (
          <ParchmentSection key={cat} title={cat}>
            <div className="grid grid-cols-1 gap-1">
              {catItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={equipmentIds.includes(item.id)} onChange={() => toggleEquipment(item.id)} style={{ cursor: 'pointer', accentColor: 'var(--ink-mid)' }} />
                  <span className="text-sm flex-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>{item.name}</span>
                  {item.weight_lbs && (
                    <span className="text-xs opacity-50">{Math.round(item.weight_lbs * 0.453592 * 10) / 10} kg</span>
                  )}
                  {item.cost_gp && (
                    <span className="text-xs opacity-50">{item.cost_gp} gp</span>
                  )}
                  <span className="text-xs opacity-40">{item.source}</span>
                </div>
              ))}
            </div>
          </ParchmentSection>
        );
      })}

      {/* Inventory */}
      <InventoryPanel
        inventory={inventory}
        onChange={inv => update({ inventory: inv })}
        carryingCapacityKg={derived.carryingCapacityKg}
      />

      {/* Currency */}
      <ParchmentSection title="Currency">
        <div className="grid grid-cols-5 gap-1">
          {['cp', 'sp', 'ep', 'gp', 'pp'].map(coin => (
            <div key={coin} className="text-center">
              <div className="sheet-label">{coin.toUpperCase()}</div>
              <input
                type="number"
                min="0"
                className="parchment-input text-sm text-center"
                value={sheet.currency?.[coin] || 0}
                onChange={e => update({ currency: { ...(sheet.currency || {}), [coin]: parseInt(e.target.value) || 0 } })}
              />
            </div>
          ))}
        </div>
      </ParchmentSection>
    </div>
  );
}

// ─── BACKSTORY TAB ───────────────────────────────────────────────────────────
function BackstoryTab({ sheet, update }) {
  return (
    <div className="space-y-3">
      {[
        { key: 'personality_traits', label: 'Personality Traits' },
        { key: 'ideals', label: 'Ideals' },
        { key: 'bonds', label: 'Bonds' },
        { key: 'flaws', label: 'Flaws' },
        { key: 'backstory', label: 'Character Backstory' },
        { key: 'allies_and_organizations', label: 'Allies & Organizations' },
        { key: 'treasure_notes', label: 'Treasure & Notes' },
        { key: 'notes', label: 'Additional Notes' },
      ].map(({ key, label }) => (
        <ParchmentSection key={key} title={label}>
          <textarea
            className="parchment-input text-sm w-full resize-none"
            rows={key === 'backstory' ? 5 : 3}
            style={{ borderBottom: 'none', border: 'none', background: 'transparent', resize: 'vertical' }}
            value={sheet[key] || ''}
            onChange={e => update({ [key]: e.target.value })}
            placeholder={`Write ${label.toLowerCase()} here...`}
          />
        </ParchmentSection>
      ))}
    </div>
  );
}