const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';

import { getLocalSheet, saveLocalSheet, exportSheetAsJSON } from '@/utils/localStorage';
import CharacterSheetForm from '@/components/dnd/CharacterSheetForm';
import { computeDerivedStats } from '@/utils/dndCalculations';
import { Shield, ArrowLeft, Save, Download, FileText, Cloud, Loader2, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DEFAULT_SHEET = {
  character_name: '',
  player_name: '',
  level: 1,
  experience_points: 0,
  ability_scores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
  feat_ids: [],
  spell_ids: [],
  equipment_ids: [],
  death_saves: { successes: 0, failures: 0 },
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  skill_overrides: {},
  saving_throw_overrides: {},
  attacks: [],
  spell_slots_used: {},
  appearance: {},
  inspiration: false,
  equipped_shield: false,
};

function ReadOnlySheetView({ sheet, items, onBack }) {
  const derived = useMemo(() => computeDerivedStats(sheet, items), [sheet, items]);

  const className = items.find(item => item.id === sheet.class_id)?.name || 'Unknown class';
  const raceName = items.find(item => item.id === sheet.race_id)?.name || 'Unknown ancestry';
  const backgroundName = items.find(item => item.id === sheet.background_id)?.name || 'Unknown background';

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="parchment-box p-4 md:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--ink-dark)', fontWeight: 900 }}>
              {sheet.character_name || 'Unnamed character'}
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--ink-mid)' }}>
              {sheet.player_name || 'No player name'} · Level {sheet.level || 1}
            </div>
          </div>
          <button className="scroll-btn text-xs" onClick={onBack}>
            Back
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
            <div className="text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--ink-mid)' }}>Identity</div>
            <div className="mt-2 text-sm" style={{ color: 'var(--ink-dark)' }}>{className}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>{raceName}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>{backgroundName}</div>
          </div>

          <div className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
            <div className="text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--ink-mid)' }}>Combat</div>
            <div className="mt-2 text-sm" style={{ color: 'var(--ink-dark)' }}>HP {sheet.hp_current || 0}/{derived.hpMax || sheet.hp_max || 0}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>AC {derived.ac}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>Speed {derived.speedM} m</div>
          </div>

          <div className="p-3 rounded border" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
            <div className="text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--ink-mid)' }}>Resources</div>
            <div className="mt-2 text-xs" style={{ color: 'var(--ink-mid)' }}>XP {sheet.experience_points || 0}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>Inspiration {sheet.inspiration ? 'Yes' : 'No'}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--ink-mid)' }}>Hit dice {sheet.hit_dice_remaining || sheet.hit_dice_total || '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="parchment-box p-4 space-y-3">
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-dark)', fontWeight: 800 }}>Ability scores</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(key => (
              <div key={key} className="p-3 rounded border text-center" style={{ borderColor: 'var(--parchment-dark)', background: 'rgba(255,255,255,0.45)' }}>
                <div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--ink-mid)' }}>{key}</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--ink-dark)' }}>{sheet.ability_scores?.[key] ?? 10}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="parchment-box p-4 space-y-3">
          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-dark)', fontWeight: 800 }}>Notes</div>
          <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink-mid)' }}>
            {sheet.backstory || sheet.appearance?.summary || sheet.notes || 'No notes available.'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SheetEditor() {
  const params = useParams();
  const id = params.id;
  const localId = params.localId;
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoSaveTimer = useRef(null);
  const sheetRef = useRef(null);

  const isNew = id === 'new';
  const isLocal = !!localId;
  const isCloud = !isLocal && !isNew;
  const location = useLocation();
  const isViewMode = location.pathname.endsWith('/view');
  const canEdit = !isCloud || (sheet ? (!isViewMode && (!sheet.owner_user_id || !user || sheet.owner_user_id === user.id)) : true);
  const isReadOnly = !canEdit;

  useEffect(() => {
    async function load() {
      try {
        const me = await db.auth.me();
        setUser(me);
      } catch {}

      // Load ALL items (paginated to handle large libraries)
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

      // Load sheet
      if (isNew) {
        setSheet({ ...DEFAULT_SHEET });
      } else if (isLocal) {
        const s = getLocalSheet(localId);
        setSheet(s || { ...DEFAULT_SHEET });
      } else {
        try {
          const found = await db.entities.CharacterSheet.get(id);
          setSheet(found || { ...DEFAULT_SHEET });
        } catch {
          try {
            const s = await db.entities.CharacterSheet.list('-updated_date', 1);
            const fallback = s.find(sheet => sheet.id === id);
            setSheet(fallback || { ...DEFAULT_SHEET });
          } catch {
            setSheet({ ...DEFAULT_SHEET });
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [id, localId]);

  const handleChange = useCallback((newSheet) => {
    if (isReadOnly) return;
    setSheet(newSheet);
    setSaved(false);
    // Auto-save for cloud sheets
    if (isCloud && newSheet.id) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        db.entities.CharacterSheet.update(newSheet.id, newSheet).then(() => setSaved(true));
      }, 2000);
    }
  }, [isCloud, isReadOnly]);

  const handleSave = async () => {
    if (isReadOnly) return;
    setSaving(true);
    try {
      const me = await db.auth.me().catch(() => null);
      if (me) {
        if (isNew || isLocal) {
          const { local_id, ...cloudSheet } = sheet;
          const payload = { ...cloudSheet, owner_user_id: me.id };
          const saved = await db.entities.CharacterSheet.create(payload);
          navigate(`/sheet/${saved.id}`, { replace: true });
        } else {
          await db.entities.CharacterSheet.update(sheet.id, { ...sheet, owner_user_id: sheet.owner_user_id || me.id });
          setSaved(true);
        }
      } else {
        // Save locally
        const savedSheet = saveLocalSheet(sheet);
        if (isNew) {
          navigate(`/sheet/local/${savedSheet.local_id}`, { replace: true });
        } else {
          saveLocalSheet(sheet);
          setSaved(true);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!sheetRef.current) return;
    try {
      const canvas = await html2canvas(sheetRef.current, { scale: 2, useCORS: true, backgroundColor: '#F2E6C9' });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      const name = (sheet.character_name || 'character').replace(/\s+/g, '_');
      pdf.save(`${name}_character_sheet.pdf`);
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment-light)' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--parchment-dark)' }} />
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
            Preparing your scroll...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--parchment-light)' }}>
      {/* Toolbar */}
      <div
        className="sticky top-0 z-40 px-4 py-2 flex items-center gap-3 flex-wrap"
        style={{ background: 'var(--ink-dark)', borderBottom: '2px solid var(--parchment-dark)' }}
      >
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
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--parchment-light)', fontWeight: 700, flex: 1 }}>
          {sheet?.character_name || 'New Character'}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saved && !saving && (
            <span className="text-xs" style={{ color: 'var(--parchment-dark)', fontFamily: 'var(--font-body)' }}>
              ✓ Saved
            </span>
          )}
          <button className="scroll-btn flex items-center gap-1 text-xs" onClick={() => exportSheetAsJSON(sheet)}>
            <Download size={12} /> JSON
          </button>
          <button className="scroll-btn flex items-center gap-1 text-xs" onClick={handleExportPDF}>
            <FileText size={12} /> PDF
          </button>
          {!isReadOnly ? (
            <button
              className="scroll-btn flex items-center gap-1 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : user ? <Cloud size={12} /> : <Save size={12} />}
              {saving ? 'Saving...' : user ? 'Save to Cloud' : 'Save Locally'}
            </button>
          ) : (
            <span className="scroll-btn flex items-center gap-1 text-xs opacity-80">
              <EyeOff size={12} /> Read only
            </span>
          )}
          {!user && (
            <button
              className="scroll-btn flex items-center gap-1 text-xs"
              style={{ background: 'linear-gradient(135deg, #2d4a6a, #1a2d4a)' }}
              onClick={() => db.auth.redirectToLogin(`/sheet/${isLocal ? `local/${localId}` : id}`)}
            >
              <Cloud size={12} /> Sign In to Cloud Save
            </button>
          )}
        </div>
      </div>

      {/* Sheet */}
      <div className="flex-1" ref={sheetRef}>
        {sheet && (
          isReadOnly ? (
            <ReadOnlySheetView sheet={sheet} items={items} onBack={() => navigate(-1)} />
          ) : (
            <CharacterSheetForm
              sheet={sheet}
              items={items}
              onChange={handleChange}
            />
          )
        )}
      </div>
    </div>
  );
}