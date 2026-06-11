import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, SkipForward, RotateCcw, Swords,
  ChevronUp, ChevronDown, Copy, Eye, EyeOff, Dice6, Star,
  Shield, Zap, Clock, AlertTriangle, X, Check, Settings,
  Layers, Users, Target
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const CONDITIONS = [
  { id: 'blinded',       label: 'Blinded',       emoji: '👁️', color: '#6a4a8a' },
  { id: 'charmed',       label: 'Charmed',        emoji: '💕', color: '#c04080' },
  { id: 'deafened',      label: 'Deafened',       emoji: '🔇', color: '#808080' },
  { id: 'exhaustion',    label: 'Exhaustion',      emoji: '😓', color: '#8b5a2a' },
  { id: 'frightened',    label: 'Frightened',      emoji: '😱', color: '#6b3a9a' },
  { id: 'grappled',      label: 'Grappled',        emoji: '🤝', color: '#7a4a1a' },
  { id: 'incapacitated', label: 'Incapacitated',  emoji: '💫', color: '#5a5a5a' },
  { id: 'invisible',     label: 'Invisible',       emoji: '👻', color: '#b0c4de' },
  { id: 'paralyzed',     label: 'Paralyzed',       emoji: '⚡', color: '#daa520' },
  { id: 'petrified',     label: 'Petrified',       emoji: '🪨', color: '#8b7355' },
  { id: 'poisoned',      label: 'Poisoned',        emoji: '☠️', color: '#2d7a2d' },
  { id: 'prone',         label: 'Prone',           emoji: '🛐', color: '#8b4513' },
  { id: 'restrained',    label: 'Restrained',      emoji: '⛓️', color: '#5a3a1a' },
  { id: 'stunned',       label: 'Stunned',         emoji: '⭐', color: '#daa520' },
  { id: 'unconscious',   label: 'Unconscious',     emoji: '💤', color: '#4a4a6a' },
  { id: 'concentration', label: 'Concentration',   emoji: '🎯', color: '#2060a0' },
  { id: 'blessed',       label: 'Blessed',         emoji: '✨', color: '#b8860b' },
  { id: 'hasted',        label: 'Hasted',          emoji: '💨', color: '#1a8a5a' },
  { id: 'raged',         label: 'Raging',          emoji: '🔥', color: '#cc2200' },
  { id: 'hidden',        label: 'Hidden',          emoji: '🫥', color: '#555577' },
  { id: 'surprised',     label: 'Surprised',       emoji: '❗', color: '#cc7700' },
  { id: 'delayed',       label: 'Delayed',         emoji: '⏸️', color: '#888888' },
];

const CREATURE_TYPES = ['humanoid','beast','undead','fiend','celestial','construct','dragon','elemental','fey','giant','monstrosity','ooze','plant','swarm'];
const TOKEN_COLORS = ['#c04040','#4060c0','#40a040','#c0a020','#a040a0','#40a0c0','#c07020','#707070','#204080','#802020','#208040','#806020'];

const PHASES = ['Surprise Round', 'Main Battle', 'Aftermath', 'Custom'];

const DICE = [4, 6, 8, 10, 12, 20, 100];

const MACROS_DEFAULT = [
  { id: 'm1', label: 'Attack', formula: '1d20+5', category: 'attack' },
  { id: 'm2', label: 'Dmg (Sword)', formula: '1d8+3', category: 'damage' },
  { id: 'm3', label: 'STR Save', formula: '1d20+2', category: 'save' },
  { id: 'm4', label: 'DEX Save', formula: '1d20+4', category: 'save' },
  { id: 'm5', label: 'Fireball', formula: '8d6', category: 'damage' },
  { id: 'm6', label: 'Heal', formula: '2d8+3', category: 'heal' },
];

const CRIT_TABLE = [
  'Double damage dice!',
  'Target drops one item.',
  'Target is pushed 10 ft.',
  'Extra attack this turn.',
  'Target is briefly stunned until their next turn.',
  'Maximum damage on all dice.',
  'Wound — disadvantage on attacks until healed.',
  'Terrifying blow — target is frightened until end of your next turn.',
];

const FUMBLE_TABLE = [
  'Drop your weapon.',
  'Trip — you are prone.',
  'Strike ally (if adjacent).',
  'Your weapon is stuck — bonus action to free.',
  'Off-balance — disadvantage on next attack.',
  'You stumble 5 ft in a random direction.',
  'Exposed — next attack against you has advantage.',
  'You lose your action next turn.',
];

// ─── Dice Logic ─────────────────────────────────────────────────────────────

function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

function parseAndRoll(formula) {
  formula = formula.trim().toLowerCase();
  let total = 0;
  const breakdown = [];
  const parts = formula.split(/(?=[+-])/).map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const sign = part.startsWith('-') ? -1 : 1;
    const clean = part.replace(/^[+-]/, '').trim();
    if (clean.includes('d')) {
      const [countStr, sidesStr] = clean.split('d');
      const count = parseInt(countStr) || 1;
      const sides = parseInt(sidesStr) || 6;
      const rolls = Array.from({ length: count }, () => rollDie(sides));
      rolls.forEach(r => { total += sign * r; breakdown.push({ label: `d${sides}`, value: sign * r, raw: r }); });
    } else {
      const n = parseInt(clean) || 0;
      total += sign * n;
      breakdown.push({ label: 'mod', value: sign * n, raw: n });
    }
  }
  return { total, breakdown, formula };
}

// ─── Helper ──────────────────────────────────────────────────────────────────

let _nextId = 1;
const uid = () => `t${_nextId++}`;

function makeToken(overrides = {}) {
  return {
    id: uid(),
    name: 'Combatant',
    displayName: '',
    type: 'enemy',
    color: TOKEN_COLORS[0],
    initiative: 0,
    initiativeRoll: 0,
    dexMod: 0,
    hp: 10,
    hpMax: 10,
    ac: 10,
    conditions: [],
    isGrouped: false,
    groupId: null,
    isSurprised: false,
    isDelayed: false,
    isDown: false,
    deathSuccesses: 0,
    deathFailures: 0,
    legendaryResistances: 0,
    legendaryResistancesMax: 0,
    notes: '',
    isGMOnly: false,
    count: 1,          // for swarms / squads
    isSwarm: false,
    sharedStats: true,
    individualHP: [],  // per-clone HP when !sharedStats
    statBlock: null,
    phase: 'Main Battle',
    ...overrides,
  };
}

function autoName(name, existing) {
  const sameName = existing.filter(t => t.name === name);
  if (sameName.length === 0) return name;
  // find highest index
  const nums = existing
    .filter(t => t.name === name || t.displayName.startsWith(name + ' '))
    .map(t => { const m = t.displayName.match(/(\d+)$/); return m ? parseInt(m[1]) : 1; });
  const next = Math.max(0, ...nums) + 1;
  return `${name} ${next}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConditionBadge({ cond, onRemove }) {
  const def = CONDITIONS.find(c => c.id === cond);
  if (!def) return null;
  return (
    <span
      title={def.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        background: def.color + '30', border: `1px solid ${def.color}`,
        borderRadius: 3, padding: '1px 4px', fontSize: '0.65rem',
        color: def.color, fontFamily: 'var(--font-heading)', cursor: onRemove ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onRemove}
    >
      {def.emoji} {def.label}
    </span>
  );
}

function HPBar({ current, max }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color = pct > 60 ? '#4a7a4a' : pct > 30 ? '#c07040' : '#8b1a1a';
  return (
    <div style={{ height: 4, background: 'rgba(0,0,0,0.15)', borderRadius: 2, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s', borderRadius: 2 }} />
    </div>
  );
}

function DiceRoller({ onClose }) {
  const [formula, setFormula] = useState('1d20');
  const [history, setHistory] = useState([]);
  const [macros, setMacros] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dnd_macros') || 'null') || MACROS_DEFAULT; } catch { return MACROS_DEFAULT; }
  });
  const [newMacro, setNewMacro] = useState({ label: '', formula: '', category: 'attack' });
  const [showMacroForm, setShowMacroForm] = useState(false);
  const [critTable, setCritTable] = useState(null);

  const saveMacros = (m) => { setMacros(m); localStorage.setItem('dnd_macros', JSON.stringify(m)); };

  const roll = useCallback((f = formula, label = '') => {
    const result = parseAndRoll(f);
    const isCrit = result.breakdown.some(b => b.raw === 20 && b.label === 'd20');
    const isFumble = result.breakdown.some(b => b.raw === 1 && b.label === 'd20');
    const entry = { ...result, label: label || f, isCrit, isFumble, ts: Date.now() };
    setHistory(h => [entry, ...h].slice(0, 30));
    if (isCrit) setCritTable({ type: 'crit', text: CRIT_TABLE[Math.floor(Math.random() * CRIT_TABLE.length)] });
    if (isFumble) setCritTable({ type: 'fumble', text: FUMBLE_TABLE[Math.floor(Math.random() * FUMBLE_TABLE.length)] });
    return entry;
  }, [formula]);

  const addMacro = () => {
    if (!newMacro.label || !newMacro.formula) return;
    saveMacros([...macros, { ...newMacro, id: uid() }]);
    setNewMacro({ label: '', formula: '', category: 'attack' });
    setShowMacroForm(false);
  };

  const CATEGORY_COLORS = { attack: '#c04040', damage: '#c07020', save: '#4060c0', heal: '#40a040', check: '#a040a0' };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="ml-auto h-full flex flex-col"
        style={{ width: 340, background: 'var(--parchment-light)', borderLeft: '3px solid var(--ink-gold)', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ background: 'var(--ink-mid)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid var(--ink-gold)' }}>
          <Dice6 size={16} style={{ color: 'var(--ink-gold)' }} />
          <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', flex: 1, letterSpacing: '0.06em' }}>Dice Tray</span>
          <button onClick={onClose} style={{ color: 'var(--parchment-mid)' }}><X size={16} /></button>
        </div>

        <div style={{ padding: 12 }}>
          {/* Formula input */}
          <div className="flex gap-2 mb-2">
            <input
              className="parchment-input flex-1"
              value={formula}
              onChange={e => setFormula(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && roll()}
              placeholder="e.g. 2d6+3"
            />
            <button className="scroll-btn text-sm" style={{ padding: '4px 12px', minHeight: 'auto' }} onClick={() => roll()}>Roll</button>
          </div>

          {/* Quick dice */}
          <div className="flex gap-1 flex-wrap mb-3">
            {DICE.map(d => (
              <button
                key={d}
                className="parchment-box px-2 py-1 text-xs cursor-pointer hover:shadow-md transition-all"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-gold)' }}
                onClick={() => roll(`1d${d}`, `d${d}`)}
              >d{d}</button>
            ))}
            <button
              className="parchment-box px-2 py-1 text-xs cursor-pointer hover:shadow-md transition-all"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-mid)' }}
              onClick={() => roll('2d20', 'Advantage')}
            >2d20↑</button>
            <button
              className="parchment-box px-2 py-1 text-xs cursor-pointer hover:shadow-md transition-all"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-mid)' }}
              onClick={() => { const a=rollDie(20),b=rollDie(20); const worse=Math.min(a,b); const entry={total:worse,breakdown:[{label:'d20',value:a,raw:a},{label:'d20',value:b,raw:b}],formula:'Disadvantage',label:'Disadvantage',isCrit:false,isFumble:worse===1,ts:Date.now()}; setHistory(h=>[entry,...h].slice(0,30)); }}
            >2d20↓</button>
          </div>

          {/* Crit/Fumble alert */}
          {critTable && (
            <div
              className="parchment-box p-2 mb-3 text-center"
              style={{ borderColor: critTable.type === 'crit' ? 'var(--ink-gold)' : 'var(--ink-red)', cursor: 'pointer' }}
              onClick={() => setCritTable(null)}
            >
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: critTable.type === 'crit' ? 'var(--ink-gold)' : 'var(--ink-red)', textTransform: 'uppercase', marginBottom: 4 }}>
                {critTable.type === 'crit' ? '⚔ Critical Hit!' : '💀 Critical Fumble!'}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink-dark)' }}>{critTable.text}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--ink-mid)', marginTop: 4 }}>click to dismiss</div>
            </div>
          )}

          {/* Macros */}
          <div style={{ marginBottom: 8 }}>
            <div className="flex items-center justify-between mb-1">
              <div className="sheet-label">Quick Macros</div>
              <button onClick={() => setShowMacroForm(f => !f)} style={{ fontSize: '0.65rem', color: 'var(--ink-gold)', fontFamily: 'var(--font-heading)' }}>+ Add</button>
            </div>
            {showMacroForm && (
              <div className="parchment-box p-2 mb-2 space-y-1">
                <input className="parchment-input w-full text-xs" placeholder="Label" value={newMacro.label} onChange={e => setNewMacro(m => ({...m, label: e.target.value}))} />
                <input className="parchment-input w-full text-xs" placeholder="Formula e.g. 2d6+3" value={newMacro.formula} onChange={e => setNewMacro(m => ({...m, formula: e.target.value}))} />
                <select className="parchment-select w-full text-xs" value={newMacro.category} onChange={e => setNewMacro(m => ({...m, category: e.target.value}))}>
                  {['attack','damage','save','heal','check'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-1">
                  <button className="scroll-btn text-xs flex-1" style={{ padding: '3px', minHeight: 'auto' }} onClick={addMacro}>Save</button>
                  <button className="scroll-btn scroll-btn-danger text-xs flex-1" style={{ padding: '3px', minHeight: 'auto' }} onClick={() => setShowMacroForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {macros.map(m => (
                <div key={m.id} className="flex items-center" style={{ position: 'relative' }}>
                  <button
                    className="parchment-box px-2 py-1 text-xs cursor-pointer hover:shadow-md transition-all"
                    style={{ borderColor: CATEGORY_COLORS[m.category] || 'var(--parchment-dark)', color: 'var(--ink-dark)', fontFamily: 'var(--font-body)' }}
                    onClick={() => roll(m.formula, m.label)}
                    title={m.formula}
                  >
                    <span style={{ color: CATEGORY_COLORS[m.category], fontFamily: 'var(--font-heading)', fontSize: '0.6rem', textTransform: 'uppercase', marginRight: 3 }}>{m.category}</span>
                    {m.label}
                  </button>
                  <button
                    style={{ position: 'absolute', top: -4, right: -4, background: 'var(--ink-red)', color: 'white', borderRadius: '50%', width: 13, height: 13, fontSize: 9, display: 'none', alignItems: 'center', justifyContent: 'center', lineHeight: 1, cursor: 'pointer' }}
                    className="macro-del"
                    onClick={() => saveMacros(macros.filter(x => x.id !== m.id))}
                  >×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Roll history */}
          <div className="sheet-label mb-1">Roll History</div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {history.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', padding: 4 }}>No rolls yet.</div>}
            {history.map((r, i) => (
              <div key={i} className="stat-row" style={{
                background: r.isCrit ? 'rgba(180,140,0,0.1)' : r.isFumble ? 'rgba(139,26,26,0.1)' : 'transparent'
              }}>
                <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>{r.label}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: r.isCrit ? 'var(--ink-gold)' : r.isFumble ? 'var(--ink-red)' : 'var(--ink-dark)' }}>
                  {r.total}
                  {r.isCrit && ' ⚔'}
                  {r.isFumble && ' 💀'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', maxWidth: 100 }}>
                  [{r.breakdown.map(b => b.raw).join(', ')}]
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlockPanel({ token, onClose }) {
  const sb = token.statBlock || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <div className="parchment-box p-4 w-full max-w-sm overflow-y-auto" style={{ maxHeight: '90vh', background: 'var(--parchment-light)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--ink-dark)' }}>{token.displayName || token.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
              {sb.size || ''} {sb.type || token.type} {sb.alignment ? `· ${sb.alignment}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--ink-mid)' }}><X size={16} /></button>
        </div>
        <hr style={{ borderColor: 'var(--parchment-dark)', marginBottom: 8 }} />
        <div className="grid grid-cols-3 gap-1 mb-2 text-center">
          {[['HP', `${token.hp}/${token.hpMax}`], ['AC', token.ac], ['Spd', sb.speed || '30 ft']].map(([l,v]) => (
            <div key={l} className="parchment-box p-1">
              <div className="sheet-label">{l}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-dark)' }}>{v}</div>
            </div>
          ))}
        </div>
        {sb.abilities && (
          <div className="grid grid-cols-6 gap-1 mb-2 text-center">
            {['STR','DEX','CON','INT','WIS','CHA'].map(a => (
              <div key={a} className="parchment-box py-1">
                <div className="sheet-label" style={{ fontSize: '0.5rem' }}>{a}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem' }}>{sb.abilities[a] || 10}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--ink-mid)' }}>{Math.floor((sb.abilities[a]-10)/2)>=0?'+':''}{Math.floor(((sb.abilities[a]||10)-10)/2)}</div>
              </div>
            ))}
          </div>
        )}
        {sb.cr && <div className="stat-row"><span style={{flex:1,fontFamily:'var(--font-heading)',fontSize:'0.75rem'}}>Challenge Rating</span><span style={{fontFamily:'var(--font-heading)',fontWeight:700}}>{sb.cr}</span></div>}
        {sb.traits?.map((t,i) => (
          <div key={i} className="mb-2">
            <div style={{fontFamily:'var(--font-heading)',fontSize:'0.75rem',color:'var(--ink-dark)',fontWeight:700}}>{t.name}</div>
            <div style={{fontFamily:'var(--font-body)',fontSize:'0.8rem',color:'var(--ink-mid)'}}>{t.desc}</div>
          </div>
        ))}
        {sb.actions?.map((a,i) => (
          <div key={i} className="mb-2">
            <div style={{fontFamily:'var(--font-heading)',fontSize:'0.75rem',color:'var(--ink-dark)',fontWeight:700}}>{a.name}</div>
            <div style={{fontFamily:'var(--font-body)',fontSize:'0.8rem',color:'var(--ink-mid)'}}>{a.desc}</div>
          </div>
        ))}
        {token.notes && (
          <div style={{ background: 'rgba(139,26,26,0.06)', border: '1px dashed var(--ink-red)', borderRadius: 4, padding: 8, marginTop: 8 }}>
            <div className="sheet-label" style={{color:'var(--ink-red)'}}>GM Notes</div>
            <div style={{fontFamily:'var(--font-body)',fontSize:'0.8rem',color:'var(--ink-mid)',marginTop:2}}>{token.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CombatTracker() {
  const [tokens, setTokens] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState('Main Battle');
  const [customPhase, setCustomPhase] = useState('');
  const [sortMode, setSortMode] = useState('initiative'); // 'initiative' | 'dex' | 'custom'
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [viewingStatBlock, setViewingStatBlock] = useState(null);
  const [editingToken, setEditingToken] = useState(null);
  const [showConditionPicker, setShowConditionPicker] = useState(null);
  const [isGMView, setIsGMView] = useState(true);
  const [showPhaseEditor, setShowPhaseEditor] = useState(false);
  const [combatLog, setCombatLog] = useState([]);
  const [showLog, setShowLog] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '', type: 'enemy', hp: 10, hpMax: 10, ac: 10, initiative: 0,
    dexMod: 0, color: TOKEN_COLORS[0], count: 1, isSwarm: false,
    legendaryResistancesMax: 0, notes: '', isGMOnly: false,
    statBlock: { size: 'Medium', type: 'humanoid', alignment: '', speed: '30 ft', cr: '',
      abilities: { STR:10,DEX:10,CON:10,INT:10,WIS:10,CHA:10 }, traits:[], actions:[] }
  });

  const log = useCallback((msg) => {
    setCombatLog(l => [`Round ${round}: ${msg}`, ...l].slice(0, 50));
  }, [round]);

  const sorted = (() => {
    if (sortMode === 'initiative') return [...tokens].sort((a,b) => b.initiative - a.initiative || b.dexMod - a.dexMod);
    if (sortMode === 'dex') return [...tokens].sort((a,b) => b.dexMod - a.dexMod || b.initiative - a.initiative);
    return tokens; // custom order
  })();

  const activeSorted = sorted.filter(t => !t.isDown);
  const activeToken = activeSorted[currentIndex % Math.max(1, activeSorted.length)];

  function addToken() {
    const base = { ...addForm };
    const toAdd = [];

    for (let i = 0; i < (addForm.count || 1); i++) {
      const rawName = addForm.name || 'Creature';
      const displayName = addForm.count > 1 ? autoName(rawName, [...tokens, ...toAdd]) : rawName;
      toAdd.push(makeToken({
        ...base,
        name: rawName,
        displayName,
        hp: base.hp,
        hpMax: base.hpMax,
        initiative: base.initiative + (addForm.count > 1 ? 0 : 0),
        phase,
      }));
    }

    setTokens(prev => [...prev, ...toAdd]);
    log(`Added ${toAdd.map(t => t.displayName).join(', ')}`);
    setShowAddForm(false);
    setAddForm(f => ({ ...f, name: '', count: 1 }));
  }

  function removeToken(id) {
    setTokens(prev => prev.filter(t => t.id !== id));
  }

  function updateToken(id, patch) {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  function duplicateToken(token) {
    const displayName = autoName(token.name, tokens);
    setTokens(prev => [...prev, { ...token, id: uid(), displayName }]);
    log(`Duplicated ${token.displayName}`);
  }

  function rollInitiativeAll() {
    setTokens(prev => prev.map(t => {
      const roll = rollDie(20) + t.dexMod;
      return { ...t, initiative: roll, initiativeRoll: roll };
    }));
    log('Rolled initiative for all combatants');
  }

  function nextTurn() {
    const active = sorted.filter(t => !t.isDown && !t.isSurprised && !t.isDelayed);
    if (active.length === 0) return;
    const nextIdx = (currentIndex + 1) % active.length;
    if (nextIdx === 0) {
      setRound(r => r + 1);
      log('New round begins');
    }
    setCurrentIndex(nextIdx);
    log(`${active[nextIdx]?.displayName || active[nextIdx]?.name}'s turn`);
  }

  function delayTurn(id) {
    updateToken(id, { isDelayed: true });
    nextTurn();
    log(`${tokens.find(t=>t.id===id)?.displayName} delayed their turn`);
  }

  function resumeDelayed(id) {
    updateToken(id, { isDelayed: false });
    log(`${tokens.find(t=>t.id===id)?.displayName} resumed from delay`);
  }

  function resetCombat() {
    if (!confirm('Reset combat? This will clear all tokens and reset the round counter.')) return;
    setTokens([]);
    setCurrentIndex(0);
    setRound(1);
    setCombatLog([]);
    log('Combat reset');
  }

  function toggleCondition(tokenId, condId) {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      const has = t.conditions.includes(condId);
      return { ...t, conditions: has ? t.conditions.filter(c => c !== condId) : [...t.conditions, condId] };
    }));
  }

  function adjustHP(id, delta) {
    setTokens(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newHP = Math.max(0, Math.min(t.hpMax, t.hp + delta));
      const isDown = newHP === 0;
      if (isDown && !t.isDown) log(`${t.displayName || t.name} fell!`);
      return { ...t, hp: newHP, isDown };
    }));
  }

  function spendLegendaryResistance(id) {
    setTokens(prev => prev.map(t => {
      if (t.id !== id || t.legendaryResistances <= 0) return t;
      return { ...t, legendaryResistances: t.legendaryResistances - 1 };
    }));
    log(`${tokens.find(t=>t.id===id)?.displayName} used Legendary Resistance`);
  }

  const phaseTokens = sorted.filter(t => t.phase === phase || phase === 'All');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--parchment-light)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink-mid)', borderBottom: '3px solid var(--ink-gold)', padding: '8px 16px', flexShrink: 0 }}>
        <div className="max-w-6xl mx-auto flex items-center gap-2 flex-wrap">
          <Link to="/" className="icon-action-btn" style={{ color: 'var(--parchment-mid)' }}><ArrowLeft size={18} /></Link>
          <Swords size={16} style={{ color: 'var(--parchment-light)' }} />
          <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1rem', letterSpacing: '0.06em' }}>
            Combat Tracker
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-gold)', fontSize: '0.85rem', marginLeft: 8 }}>
            Round {round}
          </span>
          <div style={{ flex: 1 }} />

          {/* Phase selector */}
          <select className="parchment-select text-xs" value={phase} onChange={e => setPhase(e.target.value)}>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
            <option value="All">All Phases</option>
          </select>

          {/* Sort mode */}
          <select className="parchment-select text-xs" value={sortMode} onChange={e => setSortMode(e.target.value)}>
            <option value="initiative">Sort: Initiative</option>
            <option value="dex">Sort: Dexterity</option>
            <option value="custom">Sort: Custom</option>
          </select>

          <button className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '4px 8px', minHeight: 'auto' }} onClick={rollInitiativeAll} title="Roll initiative for all">
            <Dice6 size={12} /> Roll All Init
          </button>

          <button className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '4px 8px', minHeight: 'auto' }} onClick={() => setShowAddForm(true)}>
            <Plus size={12} /> Add
          </button>

          <button
            className="scroll-btn text-xs flex items-center gap-1"
            style={{ padding: '4px 8px', minHeight: 'auto' }}
            onClick={() => setIsGMView(v => !v)}
            title="Toggle GM / Player view"
          >
            {isGMView ? <Eye size={12} /> : <EyeOff size={12} />} {isGMView ? 'GM' : 'Player'}
          </button>

          <button className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '4px 8px', minHeight: 'auto' }} onClick={() => setShowDice(true)}>
            <Dice6 size={12} /> Dice
          </button>

          <button className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '4px 8px', minHeight: 'auto' }} onClick={() => setShowLog(l => !l)}>
            <Clock size={12} /> Log
          </button>

          <button className="scroll-btn scroll-btn-danger text-xs flex items-center gap-1" style={{ padding: '4px 8px', minHeight: 'auto' }} onClick={resetCombat}>
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-3 flex gap-3 w-full flex-1" style={{ minHeight: 0 }}>
        {/* Initiative Timeline */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div className="parchment-box p-2 mb-2">
            <div className="section-header mb-2">Initiative Order</div>

            {/* Surprise round banner */}
            {phase === 'Surprise Round' && (
              <div style={{ background: 'rgba(139,26,26,0.12)', border: '1px solid var(--ink-red)', borderRadius: 4, padding: '4px 8px', marginBottom: 8, textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: 'var(--ink-red)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ⚔ Surprise Round Active
                </span>
              </div>
            )}

            <div className="space-y-1" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {sorted.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 8px', fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontSize: '0.82rem' }}>
                  No combatants yet.<br />Click + Add to begin.
                </div>
              )}
              {sorted.map((token, idx) => {
                const isActive = activeToken?.id === token.id && !token.isDown && !token.isSurprised && !token.isDelayed;
                const hidden = !isGMView && token.isGMOnly;
                if (hidden) return null;
                return (
                  <div
                    key={token.id}
                    className="rounded transition-all cursor-pointer"
                    style={{
                      padding: '6px 8px',
                      background: isActive ? token.color + '25' : token.isDown ? 'rgba(0,0,0,0.05)' : 'transparent',
                      border: `2px solid ${isActive ? token.color : 'transparent'}`,
                      opacity: token.isDown ? 0.5 : 1,
                    }}
                    onClick={() => setEditingToken(editingToken?.id === token.id ? null : token)}
                  >
                    <div className="flex items-center gap-2">
                      {/* Color swatch / turn indicator */}
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', background: token.color, flexShrink: 0,
                        boxShadow: isActive ? `0 0 0 2px ${token.color}60` : 'none'
                      }} />

                      {/* Initiative badge */}
                      <div style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem',
                        color: isActive ? token.color : 'var(--ink-mid)',
                        minWidth: 24, textAlign: 'right'
                      }}>{token.initiative}</div>

                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.82rem', color: isActive ? 'var(--ink-dark)' : 'var(--ink-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {token.displayName || token.name}
                          {token.isGMOnly && <EyeOff size={9} style={{ marginLeft: 3, color: 'var(--ink-red)', verticalAlign: 'middle' }} />}
                        </div>
                        <HPBar current={token.hp} max={token.hpMax} />
                      </div>

                      {/* Status icons */}
                      <div className="flex gap-0.5">
                        {token.isSurprised && <AlertTriangle size={10} style={{ color: 'var(--ink-red)' }} title="Surprised" />}
                        {token.isDelayed && <Clock size={10} style={{ color: '#888' }} title="Delayed" />}
                        {token.isDown && <span title="Down" style={{ fontSize: 10 }}>💀</span>}
                        {token.legendaryResistances > 0 && <Star size={10} style={{ color: 'var(--ink-gold)' }} title={`Legendary Resistance ×${token.legendaryResistances}`} />}
                      </div>
                    </div>

                    {/* Condition badges */}
                    {token.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {token.conditions.map(c => <ConditionBadge key={c} cond={c} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Turn control */}
          <button
            className="scroll-btn w-full flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}
            onClick={nextTurn}
            disabled={activeSorted.length === 0}
          >
            <SkipForward size={16} /> Next Turn
          </button>
        </div>

        {/* Token detail / editor */}
        <div className="flex-1 min-w-0">
          {editingToken ? (
            <TokenEditor
              token={tokens.find(t => t.id === editingToken.id) || editingToken}
              isGMView={isGMView}
              onUpdate={(patch) => updateToken(editingToken.id, patch)}
              onClose={() => setEditingToken(null)}
              onDuplicate={() => duplicateToken(tokens.find(t => t.id === editingToken.id))}
              onRemove={() => { removeToken(editingToken.id); setEditingToken(null); }}
              onAdjustHP={(delta) => adjustHP(editingToken.id, delta)}
              onToggleCondition={(c) => toggleCondition(editingToken.id, c)}
              onDelay={() => delayTurn(editingToken.id)}
              onResume={() => resumeDelayed(editingToken.id)}
              onViewStatBlock={() => setViewingStatBlock(tokens.find(t => t.id === editingToken.id))}
              onUseLegRes={() => spendLegendaryResistance(editingToken.id)}
            />
          ) : (
            <div className="parchment-box p-6 text-center h-full flex flex-col items-center justify-center" style={{ minHeight: 300 }}>
              <Target size={40} style={{ color: 'var(--parchment-dark)', marginBottom: 12 }} />
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', marginBottom: 8 }}>Click a combatant in the initiative order to view or edit their details.</p>
              {activeToken && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: 'var(--ink-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Current Turn</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: activeToken.color }}>{activeToken.displayName || activeToken.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink-mid)' }}>
                    HP {activeToken.hp}/{activeToken.hpMax} · AC {activeToken.ac} · Initiative {activeToken.initiative}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Log panel */}
        {showLog && (
          <div style={{ width: 200, flexShrink: 0 }}>
            <div className="parchment-box p-2">
              <div className="section-header mb-2">Combat Log</div>
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {combatLog.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', padding: 4 }}>No events yet.</div>}
                {combatLog.map((entry, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', padding: '2px 0', borderBottom: '1px solid rgba(200,169,110,0.3)' }}>{entry}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add form modal */}
      {showAddForm && (
        <AddTokenModal
          form={addForm}
          onChange={setAddForm}
          onAdd={addToken}
          onClose={() => setShowAddForm(false)}
          existingTokens={tokens}
        />
      )}

      {showDice && <DiceRoller onClose={() => setShowDice(false)} />}
      {viewingStatBlock && <StatBlockPanel token={viewingStatBlock} onClose={() => setViewingStatBlock(null)} />}
    </div>
  );
}

// ─── Token Editor ─────────────────────────────────────────────────────────────

function TokenEditor({ token, isGMView, onUpdate, onClose, onDuplicate, onRemove, onAdjustHP, onToggleCondition, onDelay, onResume, onViewStatBlock, onUseLegRes }) {
  const [hpDelta, setHpDelta] = useState('');
  const [showAllConditions, setShowAllConditions] = useState(false);

  const applyHP = (sign) => {
    const n = parseInt(hpDelta) || 0;
    if (n > 0) { onAdjustHP(sign * n); setHpDelta(''); }
  };

  return (
    <div className="parchment-box p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <input
            className="parchment-input text-lg font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--ink-dark)', width: 220 }}
            value={token.displayName || token.name}
            onChange={e => onUpdate({ displayName: e.target.value })}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
            {token.type} · Phase: {token.phase}
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          <button className="scroll-btn text-xs" style={{ padding: '3px 8px', minHeight: 'auto' }} onClick={onViewStatBlock} title="Stat Block"><Shield size={11} /></button>
          <button className="scroll-btn text-xs" style={{ padding: '3px 8px', minHeight: 'auto' }} onClick={onDuplicate} title="Duplicate"><Copy size={11} /></button>
          <button className="scroll-btn scroll-btn-danger text-xs" style={{ padding: '3px 8px', minHeight: 'auto' }} onClick={onRemove}><Trash2 size={11} /></button>
          <button className="icon-action-btn" style={{ color: 'var(--ink-mid)', padding: 4, minWidth: 28, minHeight: 28 }} onClick={onClose}><X size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {/* HP */}
        <div className="parchment-box p-2 text-center col-span-2">
          <div className="sheet-label mb-1">Hit Points</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: token.hp === 0 ? 'var(--ink-red)' : 'var(--ink-dark)' }}>
            {token.hp} <span style={{ fontSize: '0.9rem', color: 'var(--ink-mid)' }}>/ {token.hpMax}</span>
          </div>
          <HPBar current={token.hp} max={token.hpMax} />
          <div className="flex gap-1 mt-2 items-center justify-center">
            <button className="scroll-btn scroll-btn-danger text-xs" style={{ padding: '2px 8px', minHeight: 'auto' }} onClick={() => applyHP(-1)}>- Dmg</button>
            <input
              className="parchment-input text-center"
              style={{ width: 50, fontSize: '0.85rem' }}
              type="number" min={0}
              value={hpDelta}
              onChange={e => setHpDelta(e.target.value)}
              placeholder="..."
            />
            <button className="scroll-btn text-xs" style={{ padding: '2px 8px', minHeight: 'auto', background: 'linear-gradient(135deg,#2d7a2d,#1a5a1a)', borderColor:'#1a5a1a' }} onClick={() => applyHP(1)}>+ Heal</button>
          </div>
          {/* Death saves (shown when HP=0) */}
          {token.hp === 0 && (
            <div className="mt-2">
              <div className="sheet-label mb-1">Death Saves</div>
              <div className="flex justify-center gap-2">
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#4a7a4a', fontFamily: 'var(--font-heading)' }}>✓ Successes</div>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} onClick={() => onUpdate({ deathSuccesses: token.deathSuccesses === i+1 ? i : i+1 })}
                        style={{ width:14,height:14,borderRadius:'50%',border:'1.5px solid #4a7a4a',background:token.deathSuccesses>i?'#4a7a4a':'transparent',cursor:'pointer' }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--ink-red)', fontFamily: 'var(--font-heading)' }}>✗ Failures</div>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} onClick={() => onUpdate({ deathFailures: token.deathFailures === i+1 ? i : i+1 })}
                        style={{ width:14,height:14,borderRadius:'50%',border:'1.5px solid var(--ink-red)',background:token.deathFailures>i?'var(--ink-red)':'transparent',cursor:'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AC & Init */}
        <div className="parchment-box p-2 text-center">
          <div className="sheet-label mb-1">AC</div>
          <input type="number" className="parchment-input text-center w-full" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem' }}
            value={token.ac} onChange={e => onUpdate({ ac: parseInt(e.target.value)||0 })} />
        </div>

        <div className="parchment-box p-2 text-center">
          <div className="sheet-label mb-1">Initiative</div>
          <input type="number" className="parchment-input text-center w-full" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem' }}
            value={token.initiative} onChange={e => onUpdate({ initiative: parseInt(e.target.value)||0 })} />
        </div>
      </div>

      {/* Quick toggles */}
      <div className="flex flex-wrap gap-2 mb-3">
        <label className="flex items-center gap-1 cursor-pointer text-xs" style={{ fontFamily: 'var(--font-body)' }}>
          <input type="checkbox" checked={token.isSurprised} onChange={e => onUpdate({ isSurprised: e.target.checked })} />
          <AlertTriangle size={10} style={{ color: 'var(--ink-red)' }} /> Surprised
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-xs" style={{ fontFamily: 'var(--font-body)' }}>
          <input type="checkbox" checked={token.isDelayed} onChange={e => e.target.checked ? onDelay() : onResume()} />
          <Clock size={10} /> Delayed
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-xs" style={{ fontFamily: 'var(--font-body)' }}>
          <input type="checkbox" checked={token.isDown} onChange={e => onUpdate({ isDown: e.target.checked })} />
          💀 Down/Dead
        </label>
        {isGMView && (
          <label className="flex items-center gap-1 cursor-pointer text-xs" style={{ fontFamily: 'var(--font-body)' }}>
            <input type="checkbox" checked={token.isGMOnly} onChange={e => onUpdate({ isGMOnly: e.target.checked })} />
            <EyeOff size={10} style={{ color: 'var(--ink-red)' }} /> GM Only
          </label>
        )}
        {token.legendaryResistancesMax > 0 && (
          <button className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '2px 8px', minHeight: 'auto' }} onClick={onUseLegRes} disabled={token.legendaryResistances <= 0}>
            <Star size={10} /> Leg. Resist ({token.legendaryResistances}/{token.legendaryResistancesMax})
          </button>
        )}
      </div>

      {/* Conditions */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="sheet-label">Conditions</div>
          <button style={{ fontSize: '0.65rem', color: 'var(--ink-gold)', fontFamily: 'var(--font-heading)' }} onClick={() => setShowAllConditions(v => !v)}>
            {showAllConditions ? 'Collapse' : 'Edit Conditions'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mb-1">
          {token.conditions.map(c => (
            <ConditionBadge key={c} cond={c} onRemove={() => onToggleCondition(c)} />
          ))}
          {token.conditions.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>None</span>}
        </div>
        {showAllConditions && (
          <div className="parchment-box p-2 flex flex-wrap gap-1">
            {CONDITIONS.map(c => (
              <button
                key={c.id}
                onClick={() => onToggleCondition(c.id)}
                style={{
                  padding: '2px 6px', borderRadius: 3, fontSize: '0.65rem', cursor: 'pointer',
                  border: `1px solid ${c.color}`, fontFamily: 'var(--font-heading)',
                  background: token.conditions.includes(c.id) ? c.color + '30' : 'transparent',
                  color: c.color,
                }}
              >{c.emoji} {c.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Legendary resistances setup */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="sheet-label mb-1">Leg. Resistances (max)</div>
          <input type="number" min={0} max={10} className="parchment-input w-full" value={token.legendaryResistancesMax}
            onChange={e => { const n=parseInt(e.target.value)||0; onUpdate({ legendaryResistancesMax: n, legendaryResistances: Math.min(token.legendaryResistances, n) }); }} />
        </div>
        <div>
          <div className="sheet-label mb-1">Phase</div>
          <select className="parchment-select w-full" value={token.phase} onChange={e => onUpdate({ phase: e.target.value })}>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Dex Mod */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="sheet-label mb-1">DEX Modifier</div>
          <input type="number" className="parchment-input w-full" value={token.dexMod}
            onChange={e => onUpdate({ dexMod: parseInt(e.target.value)||0 })} />
        </div>
        <div>
          <div className="sheet-label mb-1">Token Color</div>
          <div className="flex flex-wrap gap-1">
            {TOKEN_COLORS.map(c => (
              <div key={c} onClick={() => onUpdate({ color: c })}
                style={{ width:16,height:16,borderRadius:'50%',background:c,cursor:'pointer',border:token.color===c?'2px solid var(--ink-dark)':'2px solid transparent' }} />
            ))}
          </div>
        </div>
      </div>

      {/* GM Notes (GM view only) */}
      {isGMView && (
        <div>
          <div className="sheet-label mb-1">GM Notes</div>
          <textarea className="parchment-input w-full" rows={2} value={token.notes}
            onChange={e => onUpdate({ notes: e.target.value })} placeholder="Secret info, tactics, triggers..." />
        </div>
      )}
    </div>
  );
}

// ─── Add Token Modal ──────────────────────────────────────────────────────────

function AddTokenModal({ form, onChange, onAdd, onClose, existingTokens }) {
  const upd = (patch) => onChange(f => ({ ...f, ...patch }));
  const updSB = (patch) => onChange(f => ({ ...f, statBlock: { ...f.statBlock, ...patch } }));
  const [tab, setTab] = useState('basic');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="parchment-box p-4 w-full max-w-lg overflow-y-auto" style={{ maxHeight: '90vh', background: 'var(--parchment-light)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--ink-dark)' }}>Add Combatant</h2>
          <button onClick={onClose} style={{ color: 'var(--ink-mid)' }}><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {['basic', 'stats', 'statblock'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1 rounded text-xs transition-all"
              style={{ fontFamily: 'var(--font-heading)', background: tab===t?'var(--ink-mid)':'var(--parchment-mid)', color: tab===t?'var(--parchment-light)':'var(--ink-mid)', border:'1px solid var(--parchment-dark)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {t === 'statblock' ? 'Stat Block' : t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'basic' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><div className="sheet-label mb-1">Name *</div><input required className="parchment-input w-full" value={form.name} onChange={e => upd({ name: e.target.value })} /></div>
              <div>
                <div className="sheet-label mb-1">Type</div>
                <select className="parchment-select w-full" value={form.type} onChange={e => upd({ type: e.target.value })}>
                  {['player','enemy','ally','npc','object'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="sheet-label mb-1">Count</div><input type="number" min={1} max={50} className="parchment-input w-full" value={form.count} onChange={e => upd({ count: parseInt(e.target.value)||1 })} /></div>
              <div><div className="sheet-label mb-1">Initiative</div><input type="number" className="parchment-input w-full" value={form.initiative} onChange={e => upd({ initiative: parseInt(e.target.value)||0 })} /></div>
              <div><div className="sheet-label mb-1">DEX Mod</div><input type="number" className="parchment-input w-full" value={form.dexMod} onChange={e => upd({ dexMod: parseInt(e.target.value)||0 })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="sheet-label mb-1">HP</div><input type="number" min={1} className="parchment-input w-full" value={form.hp} onChange={e => { const n=parseInt(e.target.value)||1; upd({ hp:n, hpMax:n }); }} /></div>
              <div><div className="sheet-label mb-1">AC</div><input type="number" min={1} className="parchment-input w-full" value={form.ac} onChange={e => upd({ ac: parseInt(e.target.value)||10 })} /></div>
              <div><div className="sheet-label mb-1">Leg. Resist</div><input type="number" min={0} className="parchment-input w-full" value={form.legendaryResistancesMax} onChange={e => upd({ legendaryResistancesMax: parseInt(e.target.value)||0 })} /></div>
            </div>
            <div>
              <div className="sheet-label mb-1">Token Color</div>
              <div className="flex flex-wrap gap-1">
                {TOKEN_COLORS.map(c => (
                  <div key={c} onClick={() => upd({ color: c })}
                    style={{ width:18,height:18,borderRadius:'50%',background:c,cursor:'pointer',border:form.color===c?'2.5px solid var(--ink-dark)':'2px solid transparent' }} />
                ))}
              </div>
            </div>
            <div>
              <div className="sheet-label mb-1">Phase</div>
              <select className="parchment-select w-full" value={form.phase || 'Main Battle'} onChange={e => upd({ phase: e.target.value })}>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isGMOnly} onChange={e => upd({ isGMOnly: e.target.checked })} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink-red)' }}>GM Only (hidden from players)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isSwarm} onChange={e => upd({ isSwarm: e.target.checked })} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Swarm / Squad (shared stat block)</span>
            </label>
          </div>
        )}

        {tab === 'stats' && form.statBlock && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {['STR','DEX','CON','INT','WIS','CHA'].map(a => (
                <div key={a}>
                  <div className="sheet-label mb-1">{a}</div>
                  <input type="number" min={1} max={30} className="parchment-input w-full text-center" value={form.statBlock.abilities?.[a]||10}
                    onChange={e => updSB({ abilities: { ...(form.statBlock.abilities||{}), [a]: parseInt(e.target.value)||10 } })} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="sheet-label mb-1">Size</div>
                <select className="parchment-select w-full" value={form.statBlock.size||'Medium'} onChange={e => updSB({ size: e.target.value })}>
                  {['Tiny','Small','Medium','Large','Huge','Gargantuan'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><div className="sheet-label mb-1">Creature Type</div>
                <select className="parchment-select w-full" value={form.statBlock.type||'humanoid'} onChange={e => updSB({ type: e.target.value })}>
                  {CREATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="sheet-label mb-1">Speed</div><input className="parchment-input w-full" value={form.statBlock.speed||'30 ft'} onChange={e => updSB({ speed: e.target.value })} /></div>
              <div><div className="sheet-label mb-1">CR</div><input className="parchment-input w-full" value={form.statBlock.cr||''} onChange={e => updSB({ cr: e.target.value })} /></div>
            </div>
            <div><div className="sheet-label mb-1">Alignment</div><input className="parchment-input w-full" value={form.statBlock.alignment||''} onChange={e => updSB({ alignment: e.target.value })} /></div>
          </div>
        )}

        {tab === 'statblock' && form.statBlock && (
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="sheet-label">Traits</div>
                <button className="scroll-btn text-xs" style={{ padding:'2px 6px',minHeight:'auto' }}
                  onClick={() => updSB({ traits: [...(form.statBlock.traits||[]), { name:'', desc:'' }] })}>+ Add</button>
              </div>
              {(form.statBlock.traits||[]).map((tr,i) => (
                <div key={i} className="parchment-box p-2 mb-1">
                  <div className="flex gap-2 mb-1">
                    <input className="parchment-input flex-1 text-xs font-bold" placeholder="Trait name" value={tr.name} onChange={e => { const t=[...(form.statBlock.traits||[])]; t[i]={...t[i],name:e.target.value}; updSB({traits:t}); }} />
                    <button onClick={() => { const t=(form.statBlock.traits||[]).filter((_,j)=>j!==i); updSB({traits:t}); }} style={{color:'var(--ink-red)',padding:'0 4px'}}>×</button>
                  </div>
                  <textarea className="parchment-input w-full text-xs" rows={2} placeholder="Description..." value={tr.desc} onChange={e => { const t=[...(form.statBlock.traits||[])]; t[i]={...t[i],desc:e.target.value}; updSB({traits:t}); }} />
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="sheet-label">Actions</div>
                <button className="scroll-btn text-xs" style={{ padding:'2px 6px',minHeight:'auto' }}
                  onClick={() => updSB({ actions: [...(form.statBlock.actions||[]), { name:'', desc:'' }] })}>+ Add</button>
              </div>
              {(form.statBlock.actions||[]).map((ac,i) => (
                <div key={i} className="parchment-box p-2 mb-1">
                  <div className="flex gap-2 mb-1">
                    <input className="parchment-input flex-1 text-xs font-bold" placeholder="Action name" value={ac.name} onChange={e => { const a=[...(form.statBlock.actions||[])]; a[i]={...a[i],name:e.target.value}; updSB({actions:a}); }} />
                    <button onClick={() => { const a=(form.statBlock.actions||[]).filter((_,j)=>j!==i); updSB({actions:a}); }} style={{color:'var(--ink-red)',padding:'0 4px'}}>×</button>
                  </div>
                  <textarea className="parchment-input w-full text-xs" rows={2} placeholder="Description..." value={ac.desc} onChange={e => { const a=[...(form.statBlock.actions||[])]; a[i]={...a[i],desc:e.target.value}; updSB({actions:a}); }} />
                </div>
              ))}
            </div>
            <div>
              <div className="sheet-label mb-1">GM Notes</div>
              <textarea className="parchment-input w-full" rows={2} value={form.notes||''} onChange={e => upd({ notes: e.target.value })} placeholder="Tactics, secrets, triggers..." />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-3 mt-3 border-t" style={{ borderColor: 'var(--parchment-dark)' }}>
          <button className="scroll-btn scroll-btn-danger text-sm" style={{ padding:'6px 14px',minHeight:'auto' }} onClick={onClose}>Cancel</button>
          <button className="scroll-btn text-sm" style={{ padding:'6px 14px',minHeight:'auto' }} onClick={onAdd} disabled={!form.name}>
            Add {form.count > 1 ? `${form.count} Tokens` : 'Token'}
          </button>
        </div>
      </div>
    </div>
  );
}