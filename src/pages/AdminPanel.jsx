const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ITEM_CATEGORIES, SOURCE_BOOKS, ABILITY_SCORES, SKILLS, CLASS_NAMES, SPELL_SCHOOLS, DAMAGE_TYPES } from '@/utils/dndCalculations';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Search, ArrowLeft, Save, X, Upload, Loader2 } from 'lucide-react';

const EFFECT_TYPES = [
  'ability_score_bonus', 'ability_score_set',
  'skill_proficiency', 'saving_throw_proficiency',
  'weapon_proficiency', 'armor_proficiency', 'tool_proficiency',
  'language', 'trait', 'speed_bonus', 'speed_set',
  'hp_bonus', 'ac_bonus', 'darkvision', 'initiative_bonus',
  'cantrip', 'spell', 'resistance', 'immunity',
  'carrying_capacity_multiplier', 'item_modifier', 'custom'
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Race');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await db.auth.me();
        if (!me || me.role !== 'admin') {
          navigate('/');
          return;
        }
        setUser(me);
        // Load ALL items paginated
        let allItems = [];
        let page = 0;
        const pageSize = 200;
        while (true) {
          const batch = await db.entities.DndItem.list('-name', pageSize, page * pageSize);
          allItems = [...allItems, ...batch];
          if (batch.length < pageSize) break;
          page++;
        }
        setItems(allItems);
      } catch {
        navigate('/');
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = items.filter(item =>
    item.category === selectedCategory &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    await db.entities.DndItem.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setImportResult({ success: false, error: `File too large (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB). Maximum allowed size is 15 GB.` });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      const result = await db.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              source: { type: 'string' },
              description: { type: 'string' },
              short_description: { type: 'string' },
              effects: { type: 'array', items: { type: 'object' } },
              spell_level: { type: 'number' },
              spell_school: { type: 'string' },
              casting_time: { type: 'string' },
              range_imperial: { type: 'string' },
              duration: { type: 'string' },
              components: { type: 'string' },
              damage_dice: { type: 'string' },
              damage_type: { type: 'string' },
              weight_lbs: { type: 'number' },
              cost_gp: { type: 'number' },
              armor_class: { type: 'number' },
              armor_type: { type: 'string' },
              hit_die: { type: 'string' },
              available_classes: { type: 'array', items: { type: 'string' } },
            }
          }
        }
      });
      if (result.status !== 'success' || !Array.isArray(result.output)) {
        throw new Error(result.details || 'Could not parse file');
      }
      const toCreate = result.output.filter(r => r.name && r.category).map(r => ({ is_active: true, ...r }));
      // Batch create in chunks of 50
      let created = 0;
      for (let i = 0; i < toCreate.length; i += 50) {
        const chunk = toCreate.slice(i, i + 50);
        const results = await Promise.all(chunk.map(item => db.entities.DndItem.create(item)));
        setItems(prev => [...results, ...prev]);
        created += results.length;
      }
      setImportResult({ success: true, count: created });
    } catch (err) {
      setImportResult({ success: false, error: err.message });
    }
    setImporting(false);
  };

  const handleSave = async (data) => {
    if (editingItem?.id) {
      const updated = await db.entities.DndItem.update(editingItem.id, data);
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } else {
      const created = await db.entities.DndItem.create(data);
      setItems(prev => [created, ...prev]);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment-light)' }}>
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment-light)' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink-dark)', borderBottom: '2px solid var(--parchment-dark)' }} className="px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded transition-all text-sm"
              style={{ color: 'var(--parchment-mid)', fontFamily: 'var(--font-heading)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(200,169,110,0.3)', letterSpacing: '0.06em' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <ArrowLeft size={15} /> Back
            </button>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--parchment-light)', fontWeight: 700 }}>
              Admin: Item Library
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="scroll-btn flex items-center gap-1 text-sm cursor-pointer" title="Bulk import from JSON, CSV, or Excel file">
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? 'Importing...' : 'Bulk Import'}
              <input type="file" accept=".json,.csv,.xlsx,.xls,.pdf,.doc,.docx" className="hidden" onChange={handleBulkImport} disabled={importing} />
            </label>
            <button
              className="scroll-btn flex items-center gap-1 text-sm"
              onClick={() => { setEditingItem({ category: selectedCategory, is_active: true, effects: [], prerequisites: [], source: 'PHB' }); setShowForm(true); }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
        </div>
      </header>

      {importResult && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div
            className="flex items-center justify-between p-3 rounded text-sm"
            style={{
              background: importResult.success ? 'rgba(45,106,45,0.12)' : 'rgba(139,26,26,0.12)',
              border: `1px solid ${importResult.success ? '#2d6a2d' : 'var(--ink-red)'}`,
              color: importResult.success ? '#2d6a2d' : 'var(--ink-red)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span>{importResult.success ? `✓ Successfully imported ${importResult.count} item(s).` : `✗ Import failed: ${importResult.error}`}</span>
            <button type="button" onClick={() => setImportResult(null)} style={{ color: 'inherit', opacity: 0.6 }}><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex gap-0">
        {/* Sidebar: categories */}
        <aside className="w-48 flex-shrink-0 p-3" style={{ minHeight: 'calc(100vh - 56px)', borderRight: '1px solid var(--parchment-dark)' }}>
          <div className="sheet-label mb-2">Categories</div>
          {ITEM_CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className="w-full text-left px-2 py-1.5 rounded text-sm mb-0.5 flex justify-between items-center transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: selectedCategory === cat ? 'var(--ink-mid)' : 'transparent',
                  color: selectedCategory === cat ? 'var(--parchment-light)' : 'var(--ink-dark)',
                }}
                onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
              >
                <span className="truncate">{cat}</span>
                <span className="text-xs opacity-60 flex-shrink-0">{count}</span>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--ink-dark)', fontWeight: 700 }}>
              {selectedCategory}
            </div>
            <div className="flex-1 flex items-center gap-1 parchment-input max-w-xs">
              <Search size={13} style={{ color: 'var(--ink-gold)', flexShrink: 0 }} />
              <input
                className="bg-transparent outline-none text-sm flex-1"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
              No items in this category yet. Click "Add Item" to create one.
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(item => (
                <ItemRow key={item.id} item={item} onEdit={() => { setEditingItem(item); setShowForm(true); }} onDelete={() => handleDelete(item)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Edit/Create Modal */}
      {showForm && editingItem && (
        <ItemForm
          item={editingItem}
          allItems={items}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

function ItemRow({ item, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="parchment-box overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button type="button" className="flex-1 flex items-center gap-2 text-left" onClick={() => setExpanded(e => !e)}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--ink-dark)' }}>{item.name}</div>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--parchment-dark)', color: 'var(--ink-dark)', fontFamily: 'var(--font-body)' }}>{item.source}</span>
          {!item.is_active && <span className="text-xs" style={{ color: 'var(--ink-red)' }}>(Inactive)</span>}
          {expanded ? <ChevronUp size={13} style={{ color: 'var(--ink-mid)' }} /> : <ChevronDown size={13} style={{ color: 'var(--ink-mid)' }} />}
        </button>
        <button type="button" className="p-1" style={{ color: 'var(--ink-gold)' }} onClick={onEdit} title="Edit"><Edit2 size={14} /></button>
        <button type="button" className="p-1" style={{ color: 'var(--ink-red)' }} onClick={onDelete} title="Delete"><Trash2 size={14} /></button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid var(--parchment-dark)' }}>
          {item.short_description && (
            <div className="text-sm mt-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>{item.short_description}</div>
          )}
          {item.description && (
            <div className="text-sm prose-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }} dangerouslySetInnerHTML={{ __html: item.description }} />
          )}
          {item.effects?.length > 0 && (
            <div>
              <div className="sheet-label mt-2">Effects</div>
              {item.effects.map((e, i) => (
                <div key={i} className="text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
                  • {e.label || `${e.type}: ${e.target || ''} ${e.value || ''}`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemForm({ item, allItems, onSave, onCancel }) {
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  const addEffect = () => update({ effects: [...(form.effects || []), { type: 'ability_score_bonus', target: '', value: '', label: '' }] });
  const removeEffect = (i) => update({ effects: form.effects.filter((_, idx) => idx !== i) });
  const updateEffect = (i, patch) => {
    const effects = [...(form.effects || [])];
    effects[i] = { ...effects[i], ...patch };
    update({ effects });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const getTargetOptions = (effectType) => {
    if (effectType === 'ability_score_bonus' || effectType === 'ability_score_set' || effectType === 'saving_throw_proficiency') {
      return ABILITY_SCORES;
    }
    if (effectType === 'skill_proficiency') return SKILLS.map(s => s.name);
    return [];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(28,16,7,0.7)' }}>
      <div className="w-full max-w-2xl my-4 rounded-sm" style={{ background: 'var(--parchment-light)', border: '3px solid var(--parchment-dark)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'var(--ink-mid)', borderBottom: '2px solid var(--parchment-dark)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1rem' }}>
            {item.id ? `Edit: ${item.name}` : `New ${item.category}`}
          </div>
          <button type="button" onClick={onCancel} style={{ color: 'var(--parchment-mid)' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sheet-label">Name *</div>
              <input required className="parchment-input text-sm" value={form.name || ''} onChange={e => update({ name: e.target.value })} />
            </div>
            <div>
              <div className="sheet-label">Category</div>
              <select className="parchment-select w-full text-sm" value={form.category || 'Race'} onChange={e => update({ category: e.target.value })}>
                {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="sheet-label">Source</div>
              <select className="parchment-select w-full text-sm" value={form.source || 'PHB'} onChange={e => update({ source: e.target.value })}>
                {Object.entries(SOURCE_BOOKS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="active" checked={form.is_active !== false} onChange={e => update({ is_active: e.target.checked })} />
              <label htmlFor="active" className="sheet-label cursor-pointer">Active (visible to users)</label>
            </div>
          </div>

          <div>
            <div className="sheet-label">Short Description (tooltip summary)</div>
            <input className="parchment-input text-sm" value={form.short_description || ''} onChange={e => update({ short_description: e.target.value })} placeholder="One-line summary..." />
          </div>

          <div>
            <div className="sheet-label">Full Description (HTML supported)</div>
            <textarea
              className="parchment-input text-sm w-full"
              rows={5}
              style={{ resize: 'vertical', border: '1.5px solid var(--parchment-dark)' }}
              value={form.description || ''}
              onChange={e => update({ description: e.target.value })}
              placeholder="Detailed description..."
            />
          </div>

          {/* Spell fields */}
          {form.category === 'Spell' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label">Spell Level (0=Cantrip)</div>
                <input type="number" min="0" max="9" className="parchment-input text-sm" value={form.spell_level ?? ''} onChange={e => update({ spell_level: parseInt(e.target.value) })} />
              </div>
              <div>
                <div className="sheet-label">School</div>
                <select className="parchment-select w-full text-sm" value={form.spell_school || ''} onChange={e => update({ spell_school: e.target.value })}>
                  <option value="">—</option>
                  {SPELL_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label">Casting Time</div>
                <input className="parchment-input text-sm" value={form.casting_time || ''} onChange={e => update({ casting_time: e.target.value })} placeholder="1 action" />
              </div>
              <div>
                <div className="sheet-label">Range (original, e.g. "30 ft")</div>
                <input className="parchment-input text-sm" value={form.range_imperial || ''} onChange={e => update({ range_imperial: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label">Duration</div>
                <input className="parchment-input text-sm" value={form.duration || ''} onChange={e => update({ duration: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label">Components</div>
                <input className="parchment-input text-sm" value={form.components || ''} onChange={e => update({ components: e.target.value })} placeholder="V, S, M" />
              </div>
              <div>
                <div className="sheet-label">Damage Dice</div>
                <input className="parchment-input text-sm" value={form.damage_dice || ''} onChange={e => update({ damage_dice: e.target.value })} placeholder="2d6" />
              </div>
              <div>
                <div className="sheet-label">Damage Type</div>
                <select className="parchment-select w-full text-sm" value={form.damage_type || ''} onChange={e => update({ damage_type: e.target.value })}>
                  <option value="">—</option>
                  {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <div className="sheet-label">Available to Classes (comma-separated, blank = all)</div>
                <input className="parchment-input text-sm" value={(form.available_classes || []).join(', ')} onChange={e => update({ available_classes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Wizard, Sorcerer" />
              </div>
            </div>
          )}

          {/* Weapon/Armor fields */}
          {(form.category === 'Weapon' || form.category === 'Armor') && (
            <div className="grid grid-cols-2 gap-3">
              {form.category === 'Armor' && (
                <>
                  <div>
                    <div className="sheet-label">Armor Type</div>
                    <select className="parchment-select w-full text-sm" value={form.armor_type || ''} onChange={e => update({ armor_type: e.target.value })}>
                      <option value="">—</option>
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="heavy">Heavy</option>
                      <option value="shield">Shield</option>
                    </select>
                  </div>
                  <div>
                    <div className="sheet-label">Base AC</div>
                    <input type="number" className="parchment-input text-sm" value={form.armor_class || ''} onChange={e => update({ armor_class: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <div className="sheet-label">STR Requirement</div>
                    <input type="number" className="parchment-input text-sm" value={form.str_requirement || ''} onChange={e => update({ str_requirement: parseInt(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" id="stealth" checked={form.stealth_disadvantage || false} onChange={e => update({ stealth_disadvantage: e.target.checked })} />
                    <label htmlFor="stealth" className="sheet-label">Stealth Disadvantage</label>
                  </div>
                </>
              )}
              {form.category === 'Weapon' && (
                <>
                  <div>
                    <div className="sheet-label">Damage Dice</div>
                    <input className="parchment-input text-sm" value={form.damage_dice || ''} onChange={e => update({ damage_dice: e.target.value })} placeholder="1d8" />
                  </div>
                  <div>
                    <div className="sheet-label">Damage Type</div>
                    <select className="parchment-select w-full text-sm" value={form.damage_type || ''} onChange={e => update({ damage_type: e.target.value })}>
                      <option value="">—</option>
                      {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <div className="sheet-label">Weight (lbs — auto-converted to kg)</div>
                <input type="number" step="0.1" className="parchment-input text-sm" value={form.weight_lbs || ''} onChange={e => update({ weight_lbs: parseFloat(e.target.value) })} />
              </div>
              <div>
                <div className="sheet-label">Cost (gp)</div>
                <input type="number" step="0.1" className="parchment-input text-sm" value={form.cost_gp || ''} onChange={e => update({ cost_gp: parseFloat(e.target.value) })} />
              </div>
            </div>
          )}

          {/* Class fields */}
          {form.category === 'Class' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label">Hit Die</div>
                <select className="parchment-select w-full text-sm" value={form.hit_die || 'd8'} onChange={e => update({ hit_die: e.target.value })}>
                  {['d6','d8','d10','d12'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Parent item */}
          {(form.category === 'Subrace' || form.category === 'Subclass') && (
            <div>
              <div className="sheet-label">Parent {form.category === 'Subrace' ? 'Race' : 'Class'}</div>
              <select
                className="parchment-select w-full text-sm"
                value={form.parent_item_id || ''}
                onChange={e => update({ parent_item_id: e.target.value })}
              >
                <option value="">— Select parent —</option>
                {allItems.filter(i => i.category === (form.category === 'Subrace' ? 'Race' : 'Class')).map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Effects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="sheet-label">Effects (auto-applied to character sheet)</div>
              <button type="button" className="scroll-btn text-xs" onClick={addEffect}>+ Add Effect</button>
            </div>
            <div className="space-y-2">
              {(form.effects || []).map((effect, i) => (
                <div key={i} className="parchment-box p-2">
                  <div className="grid grid-cols-4 gap-2 items-end">
                    <div>
                      <div className="sheet-label">Type</div>
                      <select className="parchment-select w-full text-xs" value={effect.type || ''} onChange={e => updateEffect(i, { type: e.target.value, target: '' })}>
                        {EFFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="sheet-label">Target</div>
                      {getTargetOptions(effect.type).length > 0 ? (
                        <select className="parchment-select w-full text-xs" value={effect.target || ''} onChange={e => updateEffect(i, { target: e.target.value })}>
                          <option value="">—</option>
                          {getTargetOptions(effect.type).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <input className="parchment-input text-xs" value={effect.target || ''} onChange={e => updateEffect(i, { target: e.target.value })} placeholder="e.g. STR, Perception" />
                      )}
                    </div>
                    <div>
                      <div className="sheet-label">Value</div>
                      <input className="parchment-input text-xs" value={effect.value || ''} onChange={e => updateEffect(i, { value: e.target.value })} placeholder="+2, 30, proficient..." />
                    </div>
                    <div className="flex gap-1 items-end">
                      <div className="flex-1">
                        <div className="sheet-label">Label</div>
                        <input className="parchment-input text-xs" value={effect.label || ''} onChange={e => updateEffect(i, { label: e.target.value })} placeholder="Human-readable..." />
                      </div>
                      <button type="button" className="mb-0.5" style={{ color: 'var(--ink-red)' }} onClick={() => removeEffect(i)}><X size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="scroll-btn text-sm" style={{ background: 'transparent', border: '1.5px solid var(--parchment-dark)', color: 'var(--ink-mid)' }} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="scroll-btn flex items-center gap-1 text-sm" disabled={saving}>
              <Save size={13} /> {saving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}