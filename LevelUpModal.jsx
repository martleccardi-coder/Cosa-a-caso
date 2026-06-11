import { useState, useMemo } from 'react';
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
import { Sword, Shield, Scroll, Star, BookOpen, User, Heart, Package } from 'lucide-react';

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function CharacterSheetForm({ sheet, items, onChange }) {
  const [activeTab, setActiveTab] = useState('core');
  const [levelUpPending, setLevelUpPending] = useState(null);

  const itemsByCategory = useMemo(() => {
    const map = {};
    items.forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [items]);

  const derived = useMemo(() => computeDerivedStats(sheet, items), [sheet, items]);

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
    let bonus = 0;
    const activeIds = [sheet.race_id, sheet.subrace_id, sheet.class_id, sheet.background_id, ...(sheet.feat_ids || [])].filter(Boolean);
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
    const newScores = { ...(sheet.ability_scores || {}) };
    newScores[ability] = baseValue + bonus;
    update({ ability_scores: newScores });
  };

  const getBaseScore = (ability) => {
    const current = sheet.ability_scores?.[ability] || 10;
    let bonus = 0;
    const activeIds = [sheet.race_id, sheet.subrace_id, sheet.class_id, sheet.background_id, ...(sheet.feat_ids || [])].filter(Boolean);
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
    { id: 'equipment', label: 'Equipment', icon: Package },
    { id: 'backstory', label: 'Story', icon: Scroll },
  ];

  return (
    <div>
      <div className="flex gap-1 flex-wrap mb-4 pb-2" style={{ borderBottom: '2px solid var(--parchment-dark)' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1 px-3 py-2 rounded text-sm transition-all"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: activeTab === t.id ? 'var(--ink-mid)' : 'var(--parchment-mid)',
                color: activeTab === t.id ? 'var(--parchment-light)' : 'var(--ink-mid)',
                border: '1.5px solid',
                borderColor: activeTab === t.id ? 'var(--ink-mid)' : 'var(--parchment-dark)',
              }}
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

      <div>
        {activeTab === 'core' && (
          <CoreTab sheet={sheet} update={update} derived={derived} items={items} itemsByCategory={itemsByCategory}
            updateAbility={updateAbility} getBaseScore={getBaseScore} onLevelChange={handleLevelChange} />
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

function CoreTab({ sheet, update, derived, items, itemsByCategory, updateAbility, getBaseScore, onLevelChange }) {
  return (
    <div>
      <ParchmentSection title="Identity">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="sheet-label">Character Name</div>
            <input className="parchment-input w-full" value={sheet.character_name || ''} onChange={e => update({ character_name: e.target.value })} />
          </div>
          <div>
            <div className="sheet-label">Player Name</div>
            <input className="parchment-input w-full" value={sheet.player_name || ''} onChange={e => update({ player_name: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <ItemDropdown label="Class" items={itemsByCategory['Class'] || []} value={sheet.class_id} onChange={v => update({ class_id: v, subclass_id: null })} />
          <div>
            <div className="sheet-label">Level</div>
            <select className="parchment-select w-full" value={sheet.level || 1} onChange={e => onLevelChange(parseInt(e.target.value))}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <ItemDropdown label="Race" items={itemsByCategory['Race'] || []} value={sheet.race_id} onChange={v => update({ race_id: v, subrace_id: null })} />
          <ItemDropdown label="Subrace" items={(itemsByCategory['Subrace'] || []).filter(i => !i.parent_item_id || i.parent_item_id === sheet.race_id)} value={sheet.subrace_id} onChange={v => update({ subrace_id: v })} disabled={!sheet.race_id} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <ItemDropdown label="Background" items={itemsByCategory['Background'] || []} value={sheet.background_id} onChange={v => update({ background_id: v })} />
          <ItemDropdown label="Subclass" items={(itemsByCategory['Subclass'] || []).filter(i => !i.parent_item_id || i.parent_item_id === sheet.class_id)} value={sheet.subclass_id} onChange={v => update({ subclass_id: v })} disabled={!sheet.class_id} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="sheet-label">Alignment</div>
            <select className="parchment-select w-full" value={sheet.alignment || ''} onChange={e => update({ alignment: e.target.value })}>
              <option value="">Select...</option>
              {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div className="sheet-label">Experience Points</div>
            <input type="number" className="parchment-input w-full" value={sheet.experience_points || 0} onChange={e => update({ experience_points: parseInt(e.target.value) || 0 })} min={0} />
          </div>
        </div>
      </ParchmentSection>

      <ParchmentSection title="Ability Scores">
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {ABILITY_SCORES.map(ability => (
            <AbilityScoreBox
              key={ability}
              ability={ability}
              score={sheet.ability_scores?.[ability] || 10}
              baseScore={getBaseScore(ability)}
              onChange={v => updateAbility(ability, v)}
            />
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--ink-mid)', textAlign: 'center' }}>
          Enter base values — racial/feat bonuses are applied automatically
        </p>
      </ParchmentSection>

      <ParchmentSection title="Quick Stats">
        <div className="flex flex-wrap gap-3">
          <div className="text-center">
            <div className="sheet-label">Prof. Bonus</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>{formatModifier(derived.profBonus)}</div>
          </div>
          <div className="text-center">
            <div className="sheet-label">Passive Perc.</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>{derived.passivePerception}</div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sheet.inspiration || false} onChange={e => update({ inspiration: e.target.checked })} style={{ accentColor: 'var(--ink-mid)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Inspiration</span>
          </label>
        </div>
      </ParchmentSection>

      <ParchmentSection title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {[['Age', 'age'], ['Height (cm)', 'height_cm'], ['Weight (kg)', 'weight_kg'], ['Eyes', 'eyes'], ['Skin', 'skin'], ['Hair', 'hair']].map(([label, key]) => (
            <div key={key}>
              <div className="sheet-label">{label}</div>
              <input className="parchment-input w-full" value={sheet.appearance?.[key] || ''} onChange={e => update({ appearance: { ...sheet.appearance, [key]: e.target.value } })} />
            </div>
          ))}
        </div>
      </ParchmentSection>

      {derived.traits.length > 0 && (
        <ParchmentSection title="Racial & Class Traits">
          {derived.traits.map((t, i) => (
            <div key={i} className="stat-row">
              <span style={{ fontWeight: 600 }}>{t.label}:</span>
              <span style={{ color: 'var(--ink-mid)', marginLeft: 4 }}>{t.value}</span>
            </div>
          ))}
        </ParchmentSection>
      )}

      {derived.languages.length > 0 && (
        <ParchmentSection title="Languages">
          <div className="flex flex-wrap gap-1">
            {derived.languages.map((l, i) => (
              <span key={i} style={{ background: 'var(--parchment-mid)', border: '1px solid var(--parchment-dark)', borderRadius: 3, padding: '1px 6px', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>{l}</span>
            ))}
          </div>
        </ParchmentSection>
      )}
    </div>
  );
}

function CombatTab({ sheet, update, derived, items, itemsByCategory }) {
  const addAttack = () => update({ attacks: [...(sheet.attacks || []), { name: '', attack_bonus: '', damage: '', damage_type: '' }] });
  const removeAttack = (i) => update({ attacks: sheet.attacks.filter((_, idx) => idx !== i) });
  const updateAttack = (i, field, val) => {
    const attacks = [...(sheet.attacks || [])];
    attacks[i] = { ...attacks[i], [field]: val };
    update({ attacks });
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Armor Class</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700 }}>{derived.ac}</div>
          <input type="number" placeholder="Override" className="parchment-input text-center text-xs" value={sheet.ac_override || ''} onChange={e => update({ ac_override: parseInt(e.target.value) || null })} style={{ maxWidth: 60 }} />
        </div>
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Initiative</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700 }}>{formatModifier(derived.initiativeBonus)}</div>
        </div>
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label">Speed</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700 }}>{derived.speedM} m</div>
        </div>
      </div>

      <ParchmentSection title="Hit Points">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <div className="sheet-label">Maximum HP</div>
            <input type="number" className="parchment-input w-full" value={sheet.hp_max || ''} onChange={e => update({ hp_max: parseInt(e.target.value) || 0 })} min={0} placeholder={`Auto: ${derived.hpMax}`} />
          </div>
          <div>
            <div className="sheet-label">Current HP</div>
            <input type="number" className="parchment-input w-full" value={sheet.hp_current ?? ''} onChange={e => update({ hp_current: parseInt(e.target.value) })} />
          </div>
          <div>
            <div className="sheet-label">Temporary HP</div>
            <input type="number" className="parchment-input w-full" value={sheet.hp_temp || 0} onChange={e => update({ hp_temp: parseInt(e.target.value) || 0 })} min={0} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
            Hit Die: <strong>{derived.hitDie}</strong> · Auto HP: {derived.hpMax}
          </div>
        </div>
      </ParchmentSection>

      <DeathSaves
        successes={sheet.death_saves?.successes || 0}
        failures={sheet.death_saves?.failures || 0}
        onChange={ds => update({ death_saves: ds })}
      />

      <ParchmentSection title="Saving Throws">
        {ABILITY_SCORES.map(a => (
          <div key={a} className="stat-row">
            <div
              className={`proficiency-circle ${derived.savingThrowProfs?.includes(a) || sheet.saving_throw_overrides?.[a] ? 'filled' : ''}`}
              onClick={() => {
                const cur = sheet.saving_throw_overrides || {};
                update({ saving_throw_overrides: { ...cur, [a]: !cur[a] } });
              }}
            />
            <span style={{ flex: 1 }}>{a}</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{formatModifier(derived.savingThrows[a])}</span>
          </div>
        ))}
      </ParchmentSection>

      {derived.spellcastingAbility && (
        <ParchmentSection title="Spellcasting">
          <div className="flex gap-4">
            <div className="text-center">
              <div className="sheet-label">Spell Save DC</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem' }}>{derived.spellSaveDC}</div>
            </div>
            <div className="text-center">
              <div className="sheet-label">Spell Attack</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem' }}>{formatModifier(derived.spellAttackBonus)}</div>
            </div>
            <div className="text-center">
              <div className="sheet-label">Ability</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem' }}>{derived.spellcastingAbility}</div>
            </div>
          </div>
        </ParchmentSection>
      )}

      <ParchmentSection title="Attacks">
        {(sheet.attacks || []).map((atk, i) => (
          <div key={i} className="flex gap-1 mb-1 items-center">
            <input className="parchment-input flex-1" placeholder="Name" value={atk.name || ''} onChange={e => updateAttack(i, 'name', e.target.value)} style={{ fontSize: '0.8rem' }} />
            <input className="parchment-input" placeholder="+Atk" value={atk.attack_bonus || ''} onChange={e => updateAttack(i, 'attack_bonus', e.target.value)} style={{ width: 50, fontSize: '0.8rem' }} />
            <input className="parchment-input" placeholder="Dmg" value={atk.damage || ''} onChange={e => updateAttack(i, 'damage', e.target.value)} style={{ width: 60, fontSize: '0.8rem' }} />
            <input className="parchment-input" placeholder="Type" value={atk.damage_type || ''} onChange={e => updateAttack(i, 'damage_type', e.target.value)} style={{ width: 60, fontSize: '0.8rem' }} />
            <button onClick={() => removeAttack(i)} style={{ color: 'var(--ink-red)', fontFamily: 'var(--font-heading)', padding: '0 4px' }}>✕</button>
          </div>
        ))}
        <button className="scroll-btn text-xs mt-1" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={addAttack}>+ Add Attack</button>
      </ParchmentSection>

      <ParchmentSection title="Armor & Shield">
        <ItemDropdown
          label="Equipped Armor"
          items={(itemsByCategory['Armor'] || []).filter(i => i.armor_class)}
          value={sheet.equipped_armor_id}
          onChange={v => update({ equipped_armor_id: v })}
        />
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={sheet.equipped_shield || false} onChange={e => update({ equipped_shield: e.target.checked })} style={{ accentColor: 'var(--ink-mid)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Shield Equipped (+2 AC)</span>
        </label>
      </ParchmentSection>

      {(derived.weaponProfs.length > 0 || derived.armorProfs.length > 0 || derived.toolProfs.length > 0) && (
        <ParchmentSection title="Proficiencies">
          {derived.weaponProfs.length > 0 && <div className="stat-row"><span style={{ fontWeight: 600, minWidth: 60 }}>Weapons</span><span style={{ color: 'var(--ink-mid)' }}>{derived.weaponProfs.join(', ')}</span></div>}
          {derived.armorProfs.length > 0 && <div className="stat-row"><span style={{ fontWeight: 600, minWidth: 60 }}>Armor</span><span style={{ color: 'var(--ink-mid)' }}>{derived.armorProfs.join(', ')}</span></div>}
          {derived.toolProfs.length > 0 && <div className="stat-row"><span style={{ fontWeight: 600, minWidth: 60 }}>Tools</span><span style={{ color: 'var(--ink-mid)' }}>{derived.toolProfs.join(', ')}</span></div>}
        </ParchmentSection>
      )}
    </div>
  );
}

function SkillsTab({ sheet, update, derived }) {
  const updateSkillProf = (skillName, level) => {
    const overrides = { ...(sheet.skill_overrides || {}) };
    overrides[skillName] = level;
    update({ skill_overrides: overrides });
  };

  return (
    <div>
      <ParchmentSection title="Skills">
        {SKILLS.map(skill => {
          const override = sheet.skill_overrides?.[skill.name] || 0;
          return (
            <SkillRow
              key={skill.name}
              skill={skill}
              value={derived.skills[skill.name] ?? 0}
              profLevel={override}
              onProfChange={v => updateSkillProf(skill.name, v)}
            />
          );
        })}
      </ParchmentSection>
      <p style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
        ● Proficient &nbsp; ◉ Expertise &nbsp; (Filled = auto from class/background)
      </p>
    </div>
  );
}

function EquipmentTab({ sheet, update, derived, items, itemsByCategory }) {
  return (
    <div>
      <ParchmentSection title="Feats">
        <ItemDropdown
          label="Add Feat"
          items={itemsByCategory['Feat'] || []}
          value={null}
          onChange={v => {
            if (v && !(sheet.feat_ids || []).includes(v)) {
              update({ feat_ids: [...(sheet.feat_ids || []), v] });
            }
          }}
          placeholder="Select a feat to add..."
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {(sheet.feat_ids || []).map(id => {
            const feat = items.find(i => i.id === id);
            if (!feat) return null;
            return (
              <span key={id} style={{ background: 'var(--parchment-mid)', border: '1px solid var(--parchment-dark)', borderRadius: 3, padding: '2px 8px', fontSize: '0.78rem', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {feat.name}
                <button onClick={() => update({ feat_ids: (sheet.feat_ids || []).filter(f => f !== id) })} style={{ color: 'var(--ink-red)', lineHeight: 1 }}>×</button>
              </span>
            );
          })}
        </div>
      </ParchmentSection>

      <ParchmentSection title="Currency">
        <div className="flex flex-wrap gap-3">
          {['cp', 'sp', 'ep', 'gp', 'pp'].map(coin => (
            <div key={coin} className="text-center">
              <div className="sheet-label">{coin.toUpperCase()}</div>
              <input
                type="number"
                className="parchment-input text-center"
                style={{ width: 60 }}
                value={sheet.currency?.[coin] || 0}
                onChange={e => update({ currency: { ...(sheet.currency || {}), [coin]: parseInt(e.target.value) || 0 } })}
                min={0}
              />
            </div>
          ))}
        </div>
      </ParchmentSection>

      <InventoryPanel
        inventory={sheet.inventory || []}
        onChange={inv => update({ inventory: inv })}
        carryingCapacityKg={derived.carryingCapacityKg}
      />
    </div>
  );
}

function BackstoryTab({ sheet, update }) {
  const fields = [
    { key: 'personality_traits', label: 'Personality Traits' },
    { key: 'ideals', label: 'Ideals' },
    { key: 'bonds', label: 'Bonds' },
    { key: 'flaws', label: 'Flaws' },
    { key: 'backstory', label: 'Backstory' },
    { key: 'allies_and_organizations', label: 'Allies & Organizations' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="space-y-3">
      {fields.map(({ key, label }) => (
        <ParchmentSection key={key} title={label}>
          <textarea
            className="parchment-input w-full"
            rows={key === 'backstory' ? 6 : 3}
            value={sheet[key] || ''}
            onChange={e => update({ [key]: e.target.value })}
            style={{ resize: 'vertical', minHeight: key === 'backstory' ? 120 : 60 }}
          />
        </ParchmentSection>
      ))}
    </div>
  );
}