const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { ITEM_CATEGORIES, SOURCE_BOOKS, SPELL_SCHOOLS, DAMAGE_TYPES } from '@/utils/dndCalculations';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Search, ArrowLeft, X, Loader2 } from 'lucide-react';

const EFFECT_TYPES = [
  'ability_score_bonus', 'ability_score_set', 'skill_proficiency', 'saving_throw_proficiency',
  'weapon_proficiency', 'armor_proficiency', 'tool_proficiency', 'language', 'trait',
  'speed_bonus', 'speed_set', 'hp_bonus', 'ac_bonus', 'darkvision', 'initiative_bonus',
  'resistance', 'immunity', 'custom',
];

const IMPORT_METHODS = [
  { value: 'manual', label: 'Manual' },
  { value: 'pdf_import', label: 'PDF import' },
  { value: 'ai_generated', label: 'AI generated' },
  { value: 'copied', label: 'Copied / derived' },
];

const CATEGORY_TEMPLATES = {
  Race: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Ancestral traits, bonuses, and special senses.',
  },
  Subrace: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Variant traits that modify a race.',
  },
  Class: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Core class features, proficiencies, and spellcasting basis.',
  },
  Subclass: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Subclass features that extend a base class.',
  },
  Background: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Narrative background plus skill, tool, and language proficiencies.',
  },
  Feat: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A feat, talent, or optional build choice.',
  },
  Spell: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A spell imported from a rules source or created from a spell block.',
  },
  Weapon: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Weapon statistics and properties.',
  },
  Armor: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Armor statistics and drawbacks.',
  },
  'Adventuring Gear': {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'Equipment, tools, packs, and adventuring supplies.',
  },
  Tool: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A tool proficiency or toolkit entry.',
  },
  'Mount & Vehicle': {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A mount or vehicle entry with travel rules.',
  },
  'Magic Item': {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A magical item with rarity and attunement state.',
  },
  Language: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A language entry or script.',
  },
  Skill: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A skill entry or proficiency note.',
  },
  Condition: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A rules condition with its effects.',
  },
  Sense: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A sense or perception mode.',
  },
  Currency: {
    source: 'Custom',
    approval_status: 'draft',
    visibility: 'private',
    is_active: true,
    short_description: 'A currency entry or exchange note.',
  },
};


function csvToArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[,\n]/)
    .map(v => v.trim())
    .filter(Boolean);
}

function arrayToCsv(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function stripEmptyStrings(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') out[key] = trimmed;
      return;
    }
    if (Array.isArray(value)) {
      const filtered = value.filter(v => v !== '' && v !== null && v !== undefined);
      if (filtered.length) out[key] = filtered;
      return;
    }
    if (value !== null && value !== undefined) out[key] = value;
  });
  return out;
}

function resolveCategory(value) {
  if (!value) return null;
  const cleaned = String(value).trim().toLowerCase();
  const direct = ITEM_CATEGORIES.find(cat => cat.toLowerCase() === cleaned);
  if (direct) return direct;

  const aliases = {
    spell: 'Spell',
    spells: 'Spell',
    magicalitem: 'Magic Item',
    magicitem: 'Magic Item',
    magic_item: 'Magic Item',
    magic: 'Magic Item',
    weapon: 'Weapon',
    weapons: 'Weapon',
    armor: 'Armor',
    armors: 'Armor',
    gear: 'Adventuring Gear',
    adventuringgear: 'Adventuring Gear',
    adventuring_gear: 'Adventuring Gear',
    tool: 'Tool',
    tools: 'Tool',
    race: 'Race',
    subrace: 'Subrace',
    class: 'Class',
    subclass: 'Subclass',
    feat: 'Feat',
    background: 'Background',
    language: 'Language',
    skill: 'Skill',
    condition: 'Condition',
    sense: 'Sense',
    currency: 'Currency',
    mountvehicle: 'Mount & Vehicle',
    mount_vehicle: 'Mount & Vehicle',
  };

  const normalized = cleaned.replace(/[^a-z]/g, '');
  return aliases[normalized] || aliases[cleaned.replace(/\s+/g, '')] || null;
}

function resolveSource(value) {
  if (!value) return 'Custom';
  const cleaned = String(value).trim();
  const direct = Object.keys(SOURCE_BOOKS).find(key => key.toLowerCase() === cleaned.toLowerCase());
  if (direct) return direct;
  const sourceMap = {
    playerhandbook: 'PHB',
    phb: 'PHB',
    dungeonmastersguide: 'DMG',
    dmg: 'DMG',
    xanatharsguidetoeverything: 'XGE',
    xge: 'XGE',
    tashascauldronofeverything: 'TCE',
    tce: 'TCE',
    mordenkainentomeoffoes: 'MToF',
    mtf: 'MToF',
    volosguidetomonsters: 'VGM',
    vgm: 'VGM',
    swordcoastadventurersguide: 'SCAG',
    scag: 'SCAG',
    guildmastersguidetoravnica: 'GGR',
    ggr: 'GGR',
    explorersguidetowildemount: 'EGW',
    egw: 'EGW',
    fizbanstreasuryofdragons: 'FToD',
    ftod: 'FToD',
    spelljammeradventures: 'SJA',
    sja: 'SJA',
    custom: 'Custom',
  };
  return sourceMap[cleaned.toLowerCase().replace(/[^a-z]/g, '')] || sourceMap[cleaned.toLowerCase()] || 'Custom';
}

function normalizeEffects(effects) {
  return (effects || [])
    .map(effect => stripEmptyStrings(effect))
    .filter(effect => effect.type || effect.target || effect.value || effect.label);
}

function normalizePrerequisites(prerequisites) {
  return (prerequisites || [])
    .map(prereq => {
      if (typeof prereq === 'string') return { text: prereq.trim() };
      return stripEmptyStrings(prereq);
    })
    .filter(prereq => Object.keys(prereq).length > 0);
}

function buildInitialForm(item) {
  const template = item?.id ? {} : (CATEGORY_TEMPLATES[item?.category] || CATEGORY_TEMPLATES.Race);
  return {
    is_active: true,
    approval_status: 'draft',
    visibility: 'private',
    source: 'Custom',
    import_method: 'manual',
    tags: [],
    effects: [],
    prerequisites: [],
    available_classes: [],
    sub_items: [],
    ...template,
    ...item,
  };
}

function buildSavePayload(form) {
  const { id, created_at, updated_at, createdAt, updatedAt, ...safeForm } = form || {};
  const payload = {
    ...safeForm,
    name: form.name?.trim(),
    category: resolveCategory(form.category) || form.category,
    source: resolveSource(form.source),
    source_title: form.source_title?.trim(),
    created_from_file_name: form.created_from_file_name?.trim(),
    source_excerpt: form.source_excerpt?.trim(),
    short_description: form.short_description?.trim(),
    description: form.description?.trim(),
    import_method: form.import_method || 'manual',
    approval_status: form.approval_status || 'draft',
    visibility: form.visibility || 'private',
    is_active: form.is_active !== false,
    parent_item_id: form.parent_item_id || '',
    rarity: form.rarity || '',
    requires_attunement: !!form.requires_attunement,
    spell_level: parseOptionalNumber(form.spell_level),
    source_page_start: parseOptionalNumber(form.source_page_start),
    source_page_end: parseOptionalNumber(form.source_page_end),
    weight_lbs: parseOptionalNumber(form.weight_lbs),
    cost_gp: parseOptionalNumber(form.cost_gp),
    armor_class: parseOptionalNumber(form.armor_class),
    str_requirement: parseOptionalNumber(form.str_requirement),
    effects: normalizeEffects(form.effects),
    prerequisites: normalizePrerequisites(form.prerequisites),
    tags: csvToArray(form.tags),
    available_classes: csvToArray(form.available_classes),
    sub_items: csvToArray(form.sub_items),
  };

  return stripEmptyStrings(payload);
}

export default function AdminPanel() {
  const navigate = useNavigate();
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
      const me = await db.auth.me().catch(() => null);
      if (!me || me.role !== 'admin') { navigate('/'); return; }
      let allItems = [];
      let page = 0;
      while (true) {
        const batch = await db.entities.DndItem.list('-name', 200, page * 200);
        allItems = [...allItems, ...batch];
        if (batch.length < 200) break;
        page++;
      }
      setItems(allItems);
      setLoading(false);
    }
    load();
  }, [navigate]);

  const filtered = items.filter(item => {
    if (item.category !== selectedCategory) return false;
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return [
      item.name,
      item.short_description,
      item.description,
      item.source,
      item.source_title,
      item.created_from_file_name,
      ...(item.tags || []),
    ].filter(Boolean).some(value => String(value).toLowerCase().includes(q));
  });

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await db.entities.DndItem.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setImportResult({ success: false, error: 'File must be under 10MB' });
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
              source_title: { type: 'string' },
              source_page_start: { type: 'number' },
              source_page_end: { type: 'number' },
              created_from_file_name: { type: 'string' },
              source_excerpt: { type: 'string' },
              import_method: { type: 'string' },
              description: { type: 'string' },
              short_description: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              effects: { type: 'array', items: { type: 'object' } },
              prerequisites: { type: 'array', items: { type: 'object' } },
              sub_items: { type: 'array', items: { type: 'string' } },
              parent_item_id: { type: 'string' },
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
              stealth_disadvantage: { type: 'boolean' },
              str_requirement: { type: 'number' },
              hit_die: { type: 'string' },
              class_spell_list: { type: 'string' },
              available_classes: { type: 'array', items: { type: 'string' } },
              rarity: { type: 'string' },
              requires_attunement: { type: 'boolean' },
              approval_status: { type: 'string' },
              visibility: { type: 'string' },
            }
          }
        }
      });

      if (result.status !== 'success' || !Array.isArray(result.output)) {
        setImportResult({ success: false, error: result.details || 'Could not parse file' });
        return;
      }

      const inferredFileName = file.name.replace(/\.[^.]+$/, '');
      const toCreate = result.output
        .map((raw) => ({
          is_active: true,
          import_method: 'pdf_import',
          created_from_file_name: inferredFileName,
          source_title: inferredFileName,
          source: 'Custom',
          ...raw,
        }))
        .map(raw => ({
          ...raw,
          category: resolveCategory(raw.category || raw.item_type || raw.type || raw.kind) || raw.category,
          source: resolveSource(raw.source || raw.source_book || raw.book || raw.book_code),
          name: raw.name?.trim(),
          short_description: raw.short_description?.trim() || raw.description?.split(/(?<=[.!?])\s+/)[0] || '',
        }))
        .filter(r => r.name && r.category);

      let created = 0;
      for (let i = 0; i < toCreate.length; i += 50) {
        const chunk = toCreate.slice(i, i + 50);
        const results = await Promise.all(chunk.map(item => db.entities.DndItem.create(buildSavePayload(item))));
        setItems(prev => [...results, ...prev]);
        created += results.length;
      }

      setImportResult({ success: true, count: created });
    } catch (error) {
      setImportResult({ success: false, error: error?.message || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async (data) => {
    const payload = buildSavePayload(data);
    if (editingItem?.id) {
      const updated = await db.entities.DndItem.update(editingItem.id, payload);
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } else {
      const created = await db.entities.DndItem.create(payload);
      setItems(prev => [created, ...prev]);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment-light)' }}>
      <Loader2 className="animate-spin" style={{ color: 'var(--ink-mid)' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment-light)' }}>
      <div style={{ background: 'var(--ink-mid)', borderBottom: '3px solid var(--ink-gold)', padding: '8px 16px' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="icon-action-btn" style={{ color: 'var(--parchment-mid)' }}>
            <ArrowLeft size={18} />
          </Link>
          <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1rem', letterSpacing: '0.06em', flex: 1 }}>
            Item Library — Admin
          </span>
          {importResult && (
            <div style={{ fontSize: '0.78rem', color: importResult.success ? '#7ab87a' : '#e07a7a', fontFamily: 'var(--font-body)' }}>
              {importResult.success ? `✓ Imported ${importResult.count}` : `✗ ${importResult.error}`}
              <button onClick={() => setImportResult(null)} style={{ marginLeft: 8, opacity: 0.6, color: 'inherit' }}>×</button>
            </div>
          )}
          <label className="scroll-btn text-xs flex items-center gap-1 cursor-pointer" style={{ padding: '4px 10px', minHeight: 'auto' }}>
            {importing ? <Loader2 size={12} className="animate-spin" /> : null}
            Import From File
            <input type="file" className="hidden" onChange={handleBulkImport} disabled={importing} accept=".pdf,.txt,.md,.doc,.docx" />
          </label>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 flex gap-4">
        <div className="w-40 flex-shrink-0">
          <div className="parchment-box p-2">
            {ITEM_CATEGORIES.map(cat => (
              <button
                key={cat}
                className="w-full text-left px-2 py-1 rounded text-xs mb-0.5 transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: selectedCategory === cat ? 'var(--ink-mid)' : 'transparent',
                  color: selectedCategory === cat ? 'var(--parchment-light)' : 'var(--ink-dark)',
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--ink-dark)', flex: 1 }}>{selectedCategory}</h2>
            <div className="flex items-center gap-1 parchment-box px-2 py-1">
              <Search size={12} style={{ color: 'var(--ink-mid)' }} />
              <input
                className="parchment-input text-xs"
                placeholder="Search name, text, tags, source..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: 180 }}
              />
            </div>
            <button
              className="scroll-btn text-xs flex items-center gap-1"
              style={{ padding: '4px 10px', minHeight: 'auto' }}
              onClick={() => { setEditingItem({ category: selectedCategory, ...buildInitialForm({ category: selectedCategory }) }); setShowForm(true); }}
            >
              <Plus size={12} /> Add Item
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="parchment-box p-8 text-center" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
              No items found. Click "Add Item" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => { setEditingItem(item); setShowForm(true); }}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
  const provenance = [item.source_title || SOURCE_BOOKS[item.source] || item.source, pageRange(item)].filter(Boolean).join(' · ');
  const metadata = [item.approval_status, item.visibility, item.import_method].filter(Boolean);

  return (
    <div className="parchment-box">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--ink-dark)' }}>
          <div>{item.name}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-heading)' }}>{item.category}</div>
        </div>
        {provenance && <span style={{ fontSize: '0.65rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-heading)' }}>{provenance}</span>}
        {!item.is_active && <span style={{ fontSize: '0.65rem', color: 'var(--ink-red)', fontFamily: 'var(--font-heading)' }}>Inactive</span>}
        {item.rarity && <span style={{ fontSize: '0.65rem', color: 'var(--ink-gold)', fontFamily: 'var(--font-heading)' }}>{item.rarity}</span>}
        {item.requires_attunement && <span style={{ fontSize: '0.65rem', color: 'var(--ink-gold)', fontFamily: 'var(--font-heading)' }}>Attunement</span>}
        {metadata.map(m => <span key={m} style={{ fontSize: '0.63rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-heading)' }}>{m}</span>)}
        <button className="icon-action-btn" style={{ color: 'var(--ink-gold)', padding: 4, minWidth: 28, minHeight: 28 }} onClick={e => { e.stopPropagation(); onEdit(); }}>
          <Edit2 size={12} />
        </button>
        <button className="icon-action-btn" style={{ color: 'var(--ink-red)', padding: 4, minWidth: 28, minHeight: 28 }} onClick={e => { e.stopPropagation(); onDelete(); }}>
          <Trash2 size={12} />
        </button>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--ink-mid)' }} /> : <ChevronDown size={14} style={{ color: 'var(--ink-mid)' }} />}
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: 'var(--parchment-dark)' }}>
          {item.short_description && (
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', marginTop: 8, fontFamily: 'var(--font-body)' }}>{item.short_description}</p>
          )}
          {item.description && item.description !== item.short_description && (
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-dark)', marginTop: 8, fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap' }}>{item.description}</p>
          )}
          {item.source_excerpt && (
            <div style={{ marginTop: 10, fontSize: '0.74rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
              “{item.source_excerpt}”
            </div>
          )}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map(tag => (
                <span key={tag} style={{ background: 'var(--parchment-mid)', border: '1px solid var(--parchment-dark)', borderRadius: 3, padding: '1px 6px', fontSize: '0.7rem', fontFamily: 'var(--font-body)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          {item.effects?.length > 0 && (
            <div className="mt-2">
              <div className="section-header mb-1" style={{ fontSize: '0.6rem' }}>Effects</div>
              {item.effects.map((e, i) => (
                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
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

function pageRange(item) {
  const start = item.source_page_start;
  const end = item.source_page_end;
  const hasStart = start !== '' && start !== null && start !== undefined;
  const hasEnd = end !== '' && end !== null && end !== undefined;
  if (!hasStart && !hasEnd) return '';
  if (hasStart && hasEnd && start !== end) {
    return `pp. ${start}-${end}`;
  }
  const page = hasStart ? start : end;
  return `p. ${page}`;
}

function ItemForm({ item, allItems, onSave, onCancel }) {
  const [form, setForm] = useState(() => buildInitialForm(item));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(item));
  }, [item]);

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  const applyCategoryTemplate = (category) => {
    const template = CATEGORY_TEMPLATES[category] || {};
    setForm(prev => {
      const next = { ...prev, category };
      Object.entries(template).forEach(([key, value]) => {
        const current = next[key];
        const empty = current === undefined || current === null || current === '' || (Array.isArray(current) && current.length === 0);
        if (empty) next[key] = Array.isArray(value) ? value.map(v => ({ ...v })) : value;
      });
      return next;
    });
  };

  const addEffect = () => update({ effects: [...(form.effects || []), { type: 'trait', target: '', value: '', label: '' }] });
  const removeEffect = (i) => update({ effects: (form.effects || []).filter((_, idx) => idx !== i) });
  const updateEffect = (i, patch) => {
    const effects = [...(form.effects || [])];
    effects[i] = { ...effects[i], ...patch };
    update({ effects });
  };

  const addPrerequisiteLine = () => update({ prerequisites: [...(form.prerequisites || []), { text: '' }] });
  const removePrerequisite = (i) => update({ prerequisites: (form.prerequisites || []).filter((_, idx) => idx !== i) });
  const updatePrerequisite = (i, text) => {
    const prerequisites = [...(form.prerequisites || [])];
    prerequisites[i] = { ...(prerequisites[i] || {}), text };
    update({ prerequisites });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const parentOptions = allItems.filter(candidate => {
    if (candidate.id === item.id) return false;
    if (form.category === 'Subrace') return candidate.category === 'Race';
    if (form.category === 'Subclass') return candidate.category === 'Class';
    return true;
  });

  const categoryHint = CATEGORY_TEMPLATES[form.category]?.short_description || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="parchment-box p-6 w-full max-w-3xl relative overflow-y-auto" style={{ maxHeight: '90vh', background: 'var(--parchment-light)' }}>
        <button onClick={onCancel} className="absolute top-3 right-3 icon-action-btn" style={{ color: 'var(--ink-mid)' }}>
          <X size={16} />
        </button>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--ink-dark)', marginBottom: 16 }}>
          {item.id ? `Edit: ${item.name}` : `New ${item.category}`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sheet-label mb-1">Name *</div>
              <input required className="parchment-input w-full" value={form.name || ''} onChange={e => update({ name: e.target.value })} />
            </div>
            <div>
              <div className="sheet-label mb-1">Category</div>
              <select
                className="parchment-select w-full"
                value={form.category || ''}
                onChange={e => applyCategoryTemplate(e.target.value)}
              >
                {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {categoryHint && (
            <div className="parchment-box p-3" style={{ background: 'var(--parchment-mid)' }}>
              <div className="section-header mb-1" style={{ fontSize: '0.6rem' }}>Category hint</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-dark)', fontFamily: 'var(--font-body)' }}>{categoryHint}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sheet-label mb-1">Source</div>
              <select className="parchment-select w-full" value={form.source || 'Custom'} onChange={e => update({ source: e.target.value })}>
                {Object.entries(SOURCE_BOOKS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active !== false} onChange={e => update({ is_active: e.target.checked })} style={{ accentColor: 'var(--ink-mid)' }} />
                <span className="sheet-label" style={{ textTransform: 'none', fontSize: '0.8rem' }}>Active (visible to users)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="sheet-label mb-1">Approval</div>
              <select className="parchment-select w-full" value={form.approval_status || 'draft'} onChange={e => update({ approval_status: e.target.value })}>
                {['draft', 'pending', 'approved', 'rejected'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="sheet-label mb-1">Visibility</div>
              <select className="parchment-select w-full" value={form.visibility || 'private'} onChange={e => update({ visibility: e.target.value })}>
                {['private', 'group', 'public'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="sheet-label mb-1">Import method</div>
              <select className="parchment-select w-full" value={form.import_method || 'manual'} onChange={e => update({ import_method: e.target.value })}>
                {IMPORT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sheet-label mb-1">Source title</div>
              <input className="parchment-input w-full" value={form.source_title || ''} onChange={e => update({ source_title: e.target.value })} placeholder="Player's Handbook, custom PDF, chapter name..." />
            </div>
            <div>
              <div className="sheet-label mb-1">Created from file</div>
              <input className="parchment-input w-full" value={form.created_from_file_name || ''} onChange={e => update({ created_from_file_name: e.target.value })} placeholder="filename.pdf" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="sheet-label mb-1">Source page start</div>
              <input type="number" min={1} className="parchment-input w-full" value={form.source_page_start ?? ''} onChange={e => update({ source_page_start: e.target.value })} />
            </div>
            <div>
              <div className="sheet-label mb-1">Source page end</div>
              <input type="number" min={1} className="parchment-input w-full" value={form.source_page_end ?? ''} onChange={e => update({ source_page_end: e.target.value })} />
            </div>
            <div>
              <div className="sheet-label mb-1">Rarity</div>
              <select className="parchment-select w-full" value={form.rarity || ''} onChange={e => update({ rarity: e.target.value })}>
                <option value="">—</option>
                {['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sheet-label mb-1">Short Description (tooltip)</div>
              <input className="parchment-input w-full" value={form.short_description || ''} onChange={e => update({ short_description: e.target.value })} placeholder="One-line summary..." />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.requires_attunement} onChange={e => update({ requires_attunement: e.target.checked })} style={{ accentColor: 'var(--ink-mid)' }} />
                <span className="sheet-label" style={{ textTransform: 'none', fontSize: '0.8rem' }}>Requires attunement</span>
              </label>
            </div>
          </div>

          <div>
            <div className="sheet-label mb-1">Full Description</div>
            <textarea className="parchment-input w-full" rows={4} value={form.description || ''} onChange={e => update({ description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>

          <div>
            <div className="sheet-label mb-1">Source excerpt</div>
            <textarea className="parchment-input w-full" rows={3} value={form.source_excerpt || ''} onChange={e => update({ source_excerpt: e.target.value })} placeholder="Optional quoted or summarized excerpt from the uploaded source." style={{ resize: 'vertical' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sheet-label mb-1">Tags</div>
              <input className="parchment-input w-full" value={arrayToCsv(form.tags)} onChange={e => update({ tags: e.target.value })} placeholder="comma-separated tags" />
            </div>
            <div>
              <div className="sheet-label mb-1">Parent item</div>
              <select className="parchment-select w-full" value={form.parent_item_id || ''} onChange={e => update({ parent_item_id: e.target.value })}>
                <option value="">—</option>
                {parentOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} · {opt.category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="sheet-label mb-1">Available classes</div>
              <input className="parchment-input w-full" value={arrayToCsv(form.available_classes)} onChange={e => update({ available_classes: e.target.value })} placeholder="comma-separated class names" />
            </div>
            <div>
              <div className="sheet-label mb-1">Sub items</div>
              <input className="parchment-input w-full" value={arrayToCsv(form.sub_items)} onChange={e => update({ sub_items: e.target.value })} placeholder="comma-separated IDs or names" />
            </div>
          </div>

          <div>
            <div className="sheet-label mb-1">Prerequisites</div>
            <div className="space-y-2">
              {(form.prerequisites || []).map((prereq, i) => (
                <div key={i} className="flex gap-1 items-center">
                  <input className="parchment-input text-xs flex-1" value={prereq.text || ''} onChange={e => updatePrerequisite(i, e.target.value)} placeholder="One prerequisite per line" />
                  <button type="button" onClick={() => removePrerequisite(i)} style={{ color: 'var(--ink-red)', padding: '0 4px', fontFamily: 'var(--font-heading)' }}>×</button>
                </div>
              ))}
              <button type="button" className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '2px 8px', minHeight: 'auto' }} onClick={addPrerequisiteLine}>
                <Plus size={10} /> Add prerequisite
              </button>
            </div>
          </div>

          {form.category === 'Spell' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label mb-1">Spell Level (0=cantrip)</div>
                <input type="number" min={0} max={9} className="parchment-input w-full" value={form.spell_level ?? ''} onChange={e => update({ spell_level: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">School</div>
                <select className="parchment-select w-full" value={form.spell_school || ''} onChange={e => update({ spell_school: e.target.value })}>
                  <option value="">—</option>
                  {SPELL_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label mb-1">Casting Time</div>
                <input className="parchment-input w-full" value={form.casting_time || ''} onChange={e => update({ casting_time: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Range</div>
                <input className="parchment-input w-full" value={form.range_imperial || ''} onChange={e => update({ range_imperial: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Duration</div>
                <input className="parchment-input w-full" value={form.duration || ''} onChange={e => update({ duration: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Components</div>
                <input className="parchment-input w-full" placeholder="V, S, M..." value={form.components || ''} onChange={e => update({ components: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Damage Dice</div>
                <input className="parchment-input w-full" placeholder="e.g. 2d6" value={form.damage_dice || ''} onChange={e => update({ damage_dice: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Damage Type</div>
                <select className="parchment-select w-full" value={form.damage_type || ''} onChange={e => update({ damage_type: e.target.value })}>
                  <option value="">—</option>
                  {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {form.category === 'Class' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label mb-1">Hit Die</div>
                <select className="parchment-select w-full" value={form.hit_die || 'd8'} onChange={e => update({ hit_die: e.target.value })}>
                  {['d6', 'd8', 'd10', 'd12'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label mb-1">Class spell list</div>
                <input className="parchment-input w-full" value={form.class_spell_list || ''} onChange={e => update({ class_spell_list: e.target.value })} placeholder="wizard, cleric, druid..." />
              </div>
            </div>
          )}

          {form.category === 'Armor' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label mb-1">Base AC</div>
                <input type="number" className="parchment-input w-full" value={form.armor_class ?? ''} onChange={e => update({ armor_class: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Armor Type</div>
                <select className="parchment-select w-full" value={form.armor_type || ''} onChange={e => update({ armor_type: e.target.value })}>
                  <option value="">—</option>
                  {['light', 'medium', 'heavy', 'shield'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label mb-1">Weight (lbs)</div>
                <input type="number" className="parchment-input w-full" value={form.weight_lbs ?? ''} onChange={e => update({ weight_lbs: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Cost (gp)</div>
                <input type="number" className="parchment-input w-full" value={form.cost_gp ?? ''} onChange={e => update({ cost_gp: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.stealth_disadvantage} onChange={e => update({ stealth_disadvantage: e.target.checked })} style={{ accentColor: 'var(--ink-mid)' }} />
                  <span className="sheet-label" style={{ textTransform: 'none', fontSize: '0.8rem' }}>Stealth disadvantage</span>
                </label>
              </div>
              <div>
                <div className="sheet-label mb-1">Strength requirement</div>
                <input type="number" className="parchment-input w-full" value={form.str_requirement ?? ''} onChange={e => update({ str_requirement: e.target.value })} />
              </div>
            </div>
          )}

          {form.category === 'Weapon' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label mb-1">Damage Dice</div>
                <input className="parchment-input w-full" value={form.damage_dice || ''} onChange={e => update({ damage_dice: e.target.value })} placeholder="e.g. 1d8" />
              </div>
              <div>
                <div className="sheet-label mb-1">Damage Type</div>
                <select className="parchment-select w-full" value={form.damage_type || ''} onChange={e => update({ damage_type: e.target.value })}>
                  <option value="">—</option>
                  {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label mb-1">Weight (lbs)</div>
                <input type="number" className="parchment-input w-full" value={form.weight_lbs ?? ''} onChange={e => update({ weight_lbs: e.target.value })} />
              </div>
              <div>
                <div className="sheet-label mb-1">Cost (gp)</div>
                <input type="number" className="parchment-input w-full" value={form.cost_gp ?? ''} onChange={e => update({ cost_gp: e.target.value })} />
              </div>
            </div>
          )}

          {form.category === 'Magic Item' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="sheet-label mb-1">Rarity</div>
                <select className="parchment-select w-full" value={form.rarity || ''} onChange={e => update({ rarity: e.target.value })}>
                  <option value="">—</option>
                  {['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label mb-1">Requires attunement</div>
                <label className="flex items-center gap-2 cursor-pointer parchment-box px-3 py-2">
                  <input type="checkbox" checked={!!form.requires_attunement} onChange={e => update({ requires_attunement: e.target.checked })} style={{ accentColor: 'var(--ink-mid)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--ink-dark)' }}>Attunement required</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="sheet-label">Effects</div>
              <button type="button" className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '2px 8px', minHeight: 'auto' }} onClick={addEffect}>
                <Plus size={10} /> Add Effect
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {['trait', 'skill_proficiency', 'saving_throw_proficiency', 'ability_score_bonus', 'speed_bonus', 'darkvision'].map(type => (
                <button
                  key={type}
                  type="button"
                  className="scroll-btn text-xs"
                  style={{ padding: '2px 8px', minHeight: 'auto' }}
                  onClick={() => update({ effects: [...(form.effects || []), { type, target: '', value: '', label: '' }] })}
                >
                  + {type}
                </button>
              ))}
            </div>
            {(form.effects || []).map((eff, i) => (
              <div key={i} className="flex gap-1 mb-1 items-center">
                <select className="parchment-select text-xs" value={eff.type || ''} onChange={e => updateEffect(i, { type: e.target.value })}>
                  {EFFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="parchment-input text-xs flex-1" placeholder="Target" value={eff.target || ''} onChange={e => updateEffect(i, { target: e.target.value })} />
                <input className="parchment-input text-xs w-16" placeholder="Value" value={eff.value || ''} onChange={e => updateEffect(i, { value: e.target.value })} />
                <input className="parchment-input text-xs flex-1" placeholder="Label" value={eff.label || ''} onChange={e => updateEffect(i, { label: e.target.value })} />
                <button type="button" onClick={() => removeEffect(i)} style={{ color: 'var(--ink-red)', padding: '0 4px', fontFamily: 'var(--font-heading)' }}>×</button>
              </div>
            ))}
          </div>

          <div className="parchment-box p-3" style={{ background: 'var(--parchment-mid)' }}>
            <div className="section-header mb-2" style={{ fontSize: '0.6rem' }}>Live preview</div>
            <div style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)', fontSize: '0.82rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', marginBottom: 4 }}>{form.name || 'Unnamed item'}</div>
              <div>{form.category || '—'} · {form.source || 'Custom'}{pageRange(form) ? ` · ${pageRange(form)}` : ''}</div>
              {form.short_description && <div style={{ marginTop: 4 }}>{form.short_description}</div>}
              {form.effects?.length > 0 && <div style={{ marginTop: 4 }}>Effects: {form.effects.length}</div>}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="scroll-btn scroll-btn-danger text-sm" style={{ padding: '6px 14px', minHeight: 'auto' }} onClick={onCancel}>Cancel</button>
            <button type="submit" className="scroll-btn text-sm flex items-center gap-1" style={{ padding: '6px 14px', minHeight: 'auto' }} disabled={saving}>
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
