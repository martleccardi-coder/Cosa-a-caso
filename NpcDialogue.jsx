const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown, ChevronUp, Swords } from 'lucide-react';
import { DAMAGE_TYPES, ABILITY_SCORES } from '@/utils/dndCalculations';

const DEFAULT_PHASE = { name: '', hp_threshold: 50, description: '', actions: [] };
const DEFAULT_ACTION = { name: '', description: '', damage: '', recharge: '' };

const CREATURE_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
const CREATURE_TYPES_LIST = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'];
const CR_LIST = ['0','1/8','1/4','1/2','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30'];

export default function BossBuilder() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [boss, setBoss] = useState({
    name: '',
    creature_type: 'npc',
    summary: '',
    challenge_rating: '10',
    size: 'Large',
    type: 'Monstrosity',
    alignment: 'Chaotic Evil',
    ac: 17,
    hp_dice_count: 15,
    hp_dice_sides: 10,
    hp_bonus: 45,
    speed: 40,
    languages: 'Common',
    // Ability scores (store as traits via effects)
    str: 20, dex: 14, con: 18, int: 12, wis: 14, cha: 16,
    // Resistances / Immunities
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    conditions_immune: [],
    // Boss-specific
    legendary_actions_count: 3,
    legendary_actions: [],
    lair_actions: [],
    phases: [],
    traits: [],
    actions: [],
    notes: '',
  });

  const update = (patch) => setBoss(b => ({ ...b, ...patch }));

  const addListItem = (key, template) => update({ [key]: [...(boss[key] || []), { ...template, id: Date.now() }] });
  const removeListItem = (key, id) => update({ [key]: boss[key].filter(i => i.id !== id) });
  const updateListItem = (key, id, patch) => update({ [key]: boss[key].map(i => i.id === id ? { ...i, ...patch } : i) });

  const handleSave = async () => {
    if (!boss.name) return;
    setSaving(true);
    const hpAvg = Math.floor(boss.hp_dice_count * ((boss.hp_dice_sides + 1) / 2)) + (boss.hp_bonus || 0);

    // Build effects from ability scores
    const abilityEffects = ABILITY_SCORES.map(ab => ({
      type: 'ability_score_set',
      target: ab,
      value: String(boss[ab.toLowerCase()] || 10),
      label: `${ab}: ${boss[ab.toLowerCase()] || 10}`
    }));
    const resistEffects = (boss.resistances || []).map(r => ({ type: 'resistance', target: r, label: `Resistant to ${r}` }));
    const immuneEffects = (boss.immunities || []).map(r => ({ type: 'immunity', target: r, label: `Immune to ${r}` }));
    const vulnEffects = (boss.vulnerabilities || []).map(r => ({ type: 'vulnerability', target: r, label: `Vulnerable to ${r}` }));

    const traitEffects = (boss.traits || []).map(t => ({ type: 'trait', target: t.name, label: t.description, value: t.description }));
    const legendaryTrait = boss.legendary_actions_count > 0 ? [{
      type: 'trait',
      target: 'Legendary Actions',
      label: `Can take ${boss.legendary_actions_count} legendary actions per round.`,
      value: `${boss.legendary_actions_count} per round`
    }] : [];

    const allEffects = [...abilityEffects, ...resistEffects, ...immuneEffects, ...vulnEffects, ...traitEffects, ...legendaryTrait];

    const allActions = [
      ...(boss.actions || []).map(a => ({ ...a, type: 'action' })),
      ...(boss.legendary_actions || []).map(a => ({ ...a, type: 'legendary' })),
      ...(boss.lair_actions || []).map(a => ({ ...a, type: 'lair' })),
    ];

    const payload = {
      name: boss.name,
      creature_type: 'enemy',
      summary: boss.summary,
      challenge_rating: boss.challenge_rating,
      size: boss.size,
      type: boss.type,
      alignment: boss.alignment,
      languages: boss.languages,
      ac: boss.ac,
      hp_dice_count: boss.hp_dice_count,
      hp_dice_sides: boss.hp_dice_sides,
      hp_bonus: boss.hp_bonus,
      hp_average: hpAvg,
      hp_formula: `${boss.hp_dice_count}d${boss.hp_dice_sides}${boss.hp_bonus > 0 ? `+${boss.hp_bonus}` : ''}`,
      speed: boss.speed,
      effects: allEffects,
      actions: allActions,
      traits: (boss.phases || []).length > 0 ? [{ phases: boss.phases }] : [],
      notes: boss.notes,
      visibility: 'private',
    };

    await db.entities.CreatureProfile.create(payload);
    setSaving(false);
    navigate('/groups');
  };

  const sections = [
    { id: 'basic', label: 'Basic' },
    { id: 'stats', label: 'Stats' },
    { id: 'defenses', label: 'Defenses' },
    { id: 'actions', label: 'Actions' },
    { id: 'legendary', label: 'Legendary' },
    { id: 'phases', label: 'Phases' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment-light)' }}>
      <div style={{ background: 'var(--ink-mid)', borderBottom: '3px solid var(--ink-gold)', padding: '8px 16px' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/groups" className="icon-action-btn" style={{ color: 'var(--parchment-mid)' }}><ArrowLeft size={18} /></Link>
          <Swords size={18} style={{ color: 'var(--parchment-light)' }} />
          <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1rem', letterSpacing: '0.06em', flex: 1 }}>
            Boss / NPC Builder
          </span>
          <button
            className="scroll-btn text-sm flex items-center gap-1"
            style={{ padding: '6px 12px', minHeight: 'auto' }}
            onClick={handleSave}
            disabled={saving || !boss.name}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Creature
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Section tabs */}
        <div className="flex gap-1 flex-wrap mb-4">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="px-3 py-1.5 rounded text-xs transition-all"
              style={{
                fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase',
                background: activeSection === s.id ? 'var(--ink-mid)' : 'var(--parchment-mid)',
                color: activeSection === s.id ? 'var(--parchment-light)' : 'var(--ink-mid)',
                border: '1.5px solid', borderColor: activeSection === s.id ? 'var(--ink-mid)' : 'var(--parchment-dark)',
              }}
            >{s.label}</button>
          ))}
        </div>

        {activeSection === 'basic' && (
          <div className="parchment-box p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label mb-1">Name *</div>
                <input className="parchment-input w-full" value={boss.name} onChange={e => update({ name: e.target.value })} placeholder="Ancient Dragon..." />
              </div>
              <div>
                <div className="sheet-label mb-1">Challenge Rating</div>
                <select className="parchment-select w-full" value={boss.challenge_rating} onChange={e => update({ challenge_rating: e.target.value })}>
                  {CR_LIST.map(cr => <option key={cr} value={cr}>CR {cr}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label mb-1">Size</div>
                <select className="parchment-select w-full" value={boss.size} onChange={e => update({ size: e.target.value })}>
                  {CREATURE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label mb-1">Type</div>
                <select className="parchment-select w-full" value={boss.type} onChange={e => update({ type: e.target.value })}>
                  {CREATURE_TYPES_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="sheet-label mb-1">AC</div>
                <input type="number" className="parchment-input w-full" value={boss.ac} onChange={e => update({ ac: parseInt(e.target.value) || 10 })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Speed (ft)</div>
                <input type="number" className="parchment-input w-full" value={boss.speed} onChange={e => update({ speed: parseInt(e.target.value) || 30 })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Alignment</div>
                <input className="parchment-input w-full" value={boss.alignment} onChange={e => update({ alignment: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="sheet-label mb-1">HP Formula</div>
              <div className="flex gap-2 items-center">
                <input type="number" min={1} className="parchment-input w-16 text-center" value={boss.hp_dice_count} onChange={e => update({ hp_dice_count: parseInt(e.target.value) || 1 })} />
                <span style={{ fontFamily: 'var(--font-heading)' }}>d</span>
                <select className="parchment-select" value={boss.hp_dice_sides} onChange={e => update({ hp_dice_sides: parseInt(e.target.value) })}>
                  {[4,6,8,10,12,20].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <span style={{ fontFamily: 'var(--font-heading)' }}>+</span>
                <input type="number" className="parchment-input w-16 text-center" value={boss.hp_bonus} onChange={e => update({ hp_bonus: parseInt(e.target.value) || 0 })} />
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
                  avg: {Math.floor(boss.hp_dice_count * ((boss.hp_dice_sides + 1) / 2)) + (boss.hp_bonus || 0)} HP
                </span>
              </div>
            </div>
            <div>
              <div className="sheet-label mb-1">Summary</div>
              <textarea className="parchment-input w-full" rows={3} value={boss.summary} onChange={e => update({ summary: e.target.value })} placeholder="A fearsome creature that..." />
            </div>
            <div>
              <div className="sheet-label mb-1">Languages</div>
              <input className="parchment-input w-full" value={boss.languages} onChange={e => update({ languages: e.target.value })} placeholder="Common, Draconic..." />
            </div>
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="parchment-box p-4">
            <div className="section-header mb-3">Ability Scores</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {ABILITY_SCORES.map(ab => (
                <div key={ab} className="parchment-box p-2 text-center">
                  <div className="sheet-label">{ab}</div>
                  <input
                    type="number" min={1} max={30}
                    className="parchment-input text-center w-full"
                    value={boss[ab.toLowerCase()] || 10}
                    onChange={e => update({ [ab.toLowerCase()]: parseInt(e.target.value) || 10 })}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
                    {(() => { const m = Math.floor(((boss[ab.toLowerCase()] || 10) - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; })()}
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header mb-2">Traits</div>
            {(boss.traits || []).map(t => (
              <div key={t.id} className="flex gap-2 mb-2 items-start">
                <div className="flex-1">
                  <input className="parchment-input w-full mb-1" placeholder="Trait name" value={t.name || ''} onChange={e => updateListItem('traits', t.id, { name: e.target.value })} />
                  <textarea className="parchment-input w-full" rows={2} placeholder="Description..." value={t.description || ''} onChange={e => updateListItem('traits', t.id, { description: e.target.value })} />
                </div>
                <button onClick={() => removeListItem('traits', t.id)} style={{ color: 'var(--ink-red)', padding: '0 4px', fontFamily: 'var(--font-heading)', marginTop: 4 }}>×</button>
              </div>
            ))}
            <button className="scroll-btn text-xs mt-1" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => addListItem('traits', { name: '', description: '' })}>
              <Plus size={10} /> Add Trait
            </button>
          </div>
        )}

        {activeSection === 'defenses' && (
          <div className="parchment-box p-4 space-y-4">
            {[
              { key: 'resistances', label: 'Damage Resistances' },
              { key: 'immunities', label: 'Damage Immunities' },
              { key: 'vulnerabilities', label: 'Damage Vulnerabilities' },
            ].map(({ key, label }) => (
              <div key={key}>
                <div className="section-header mb-2">{label}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(boss[key] || []).map(type => (
                    <span key={type} style={{ background: 'var(--parchment-mid)', border: '1px solid var(--parchment-dark)', borderRadius: 3, padding: '2px 8px', fontSize: '0.78rem', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {type}
                      <button onClick={() => update({ [key]: boss[key].filter(t => t !== type) })} style={{ color: 'var(--ink-red)' }}>×</button>
                    </span>
                  ))}
                </div>
                <select
                  className="parchment-select"
                  value=""
                  onChange={e => { if (e.target.value && !(boss[key] || []).includes(e.target.value)) update({ [key]: [...(boss[key] || []), e.target.value] }); }}
                >
                  <option value="">+ Add damage type...</option>
                  {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  <option value="Nonmagical Attacks">Nonmagical Attacks</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'actions' && (
          <div className="parchment-box p-4">
            <div className="section-header mb-2">Standard Actions</div>
            {(boss.actions || []).map(a => (
              <div key={a.id} className="parchment-box p-2 mb-2">
                <div className="flex gap-2 mb-1">
                  <input className="parchment-input flex-1" placeholder="Action name" value={a.name || ''} onChange={e => updateListItem('actions', a.id, { name: e.target.value })} />
                  <input className="parchment-input w-24" placeholder="Damage" value={a.damage || ''} onChange={e => updateListItem('actions', a.id, { damage: e.target.value })} />
                  <input className="parchment-input w-20" placeholder="Recharge" value={a.recharge || ''} onChange={e => updateListItem('actions', a.id, { recharge: e.target.value })} />
                  <button onClick={() => removeListItem('actions', a.id)} style={{ color: 'var(--ink-red)', padding: '0 4px' }}>×</button>
                </div>
                <textarea className="parchment-input w-full" rows={2} placeholder="Description..." value={a.description || ''} onChange={e => updateListItem('actions', a.id, { description: e.target.value })} />
              </div>
            ))}
            <button className="scroll-btn text-xs mt-1" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => addListItem('actions', { name: '', description: '', damage: '', recharge: '' })}>
              <Plus size={10} /> Add Action
            </button>
          </div>
        )}

        {activeSection === 'legendary' && (
          <div className="parchment-box p-4 space-y-4">
            <div>
              <div className="sheet-label mb-1">Legendary Actions per Round</div>
              <input type="number" min={0} max={5} className="parchment-input w-20 text-center" value={boss.legendary_actions_count} onChange={e => update({ legendary_actions_count: parseInt(e.target.value) || 0 })} />
            </div>

            <div>
              <div className="section-header mb-2">Legendary Actions</div>
              {(boss.legendary_actions || []).map(a => (
                <div key={a.id} className="flex gap-2 mb-2 items-start">
                  <div className="flex-1">
                    <input className="parchment-input w-full mb-1" placeholder="Action name (cost in parens)" value={a.name || ''} onChange={e => updateListItem('legendary_actions', a.id, { name: e.target.value })} />
                    <textarea className="parchment-input w-full" rows={2} placeholder="Description..." value={a.description || ''} onChange={e => updateListItem('legendary_actions', a.id, { description: e.target.value })} />
                  </div>
                  <button onClick={() => removeListItem('legendary_actions', a.id)} style={{ color: 'var(--ink-red)', padding: '0 4px', marginTop: 4 }}>×</button>
                </div>
              ))}
              <button className="scroll-btn text-xs" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => addListItem('legendary_actions', { name: '', description: '' })}>
                <Plus size={10} /> Add Legendary Action
              </button>
            </div>

            <div>
              <div className="section-header mb-2">Lair Actions</div>
              <p style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                On initiative count 20 (losing ties), the boss takes a lair action from the list below.
              </p>
              {(boss.lair_actions || []).map(a => (
                <div key={a.id} className="flex gap-2 mb-2 items-start">
                  <div className="flex-1">
                    <input className="parchment-input w-full mb-1" placeholder="Lair action name" value={a.name || ''} onChange={e => updateListItem('lair_actions', a.id, { name: e.target.value })} />
                    <textarea className="parchment-input w-full" rows={2} placeholder="Description..." value={a.description || ''} onChange={e => updateListItem('lair_actions', a.id, { description: e.target.value })} />
                  </div>
                  <button onClick={() => removeListItem('lair_actions', a.id)} style={{ color: 'var(--ink-red)', padding: '0 4px', marginTop: 4 }}>×</button>
                </div>
              ))}
              <button className="scroll-btn text-xs" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => addListItem('lair_actions', { name: '', description: '' })}>
                <Plus size={10} /> Add Lair Action
              </button>
            </div>
          </div>
        )}

        {activeSection === 'phases' && (
          <div className="parchment-box p-4">
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
              Define combat phases that trigger at specific HP thresholds (%). When the boss drops to or below that HP%, the phase activates.
            </p>
            {(boss.phases || []).map((phase, idx) => (
              <div key={phase.id} className="parchment-box p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.75rem', color: 'var(--ink-gold)' }}>Phase {idx + 1}</span>
                  <button onClick={() => removeListItem('phases', phase.id)} style={{ color: 'var(--ink-red)', padding: '0 4px', fontFamily: 'var(--font-heading)', marginLeft: 'auto' }}>×</button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <div className="sheet-label mb-1">Phase Name</div>
                    <input className="parchment-input w-full" placeholder="Enraged Form..." value={phase.name || ''} onChange={e => updateListItem('phases', phase.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <div className="sheet-label mb-1">HP Threshold (%)</div>
                    <input type="number" min={1} max={99} className="parchment-input w-full" value={phase.hp_threshold || 50} onChange={e => updateListItem('phases', phase.id, { hp_threshold: parseInt(e.target.value) || 50 })} />
                  </div>
                </div>
                <div>
                  <div className="sheet-label mb-1">What changes in this phase?</div>
                  <textarea className="parchment-input w-full" rows={3} placeholder="Gains multiattack, sprouts wings, immune to fire..." value={phase.description || ''} onChange={e => updateListItem('phases', phase.id, { description: e.target.value })} />
                </div>
              </div>
            ))}
            <button className="scroll-btn text-xs" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => addListItem('phases', { name: '', hp_threshold: 50, description: '' })}>
              <Plus size={10} /> Add Phase
            </button>
          </div>
        )}
      </div>
    </div>
  );
}