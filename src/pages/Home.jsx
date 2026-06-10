const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getLocalSheets, saveLocalSheet, deleteLocalSheet, exportSheetAsJSON, importSheetFromJSON } from '@/utils/localStorage';
import { Shield, Plus, Download, Upload, Cloud, Trash2, Edit, LogIn, Scroll, Users } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cloudSheets, setCloudSheets] = useState([]);
  const [localSheets, setLocalSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await db.auth.me();
        setUser(me);
        if (me) {
          const sheets = await db.entities.CharacterSheet.list('-updated_date');
          setCloudSheets(sheets);
        }
      } catch {}
      setLocalSheets(getLocalSheets());
      setLoading(false);
    }
    load();
  }, []);

  const handleNewSheet = () => {
    navigate('/sheet/new');
  };

  const handleDeleteLocal = (localId) => {
    if (!confirm('Delete this character sheet?')) return;
    deleteLocalSheet(localId);
    setLocalSheets(getLocalSheets());
  };

  const handleDeleteCloud = async (id) => {
    if (!confirm('Delete this character sheet from the cloud?')) return;
    await db.entities.CharacterSheet.delete(id);
    setCloudSheets(prev => prev.filter(s => s.id !== id));
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const sheet = await importSheetFromJSON(file);
      if (user) {
        const saved = await db.entities.CharacterSheet.create(sheet);
        setCloudSheets(prev => [saved, ...prev]);
        navigate(`/sheet/${saved.id}`);
      } else {
        const saved = saveLocalSheet(sheet);
        setLocalSheets(getLocalSheets());
        navigate(`/sheet/local/${saved.local_id}`);
      }
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };

  const SheetCard = ({ sheet, isCloud, onDelete }) => {
    const className = sheet.class_id ? '...' : '—';
    const href = isCloud
      ? (sheet.owner_user_id && user?.id && sheet.owner_user_id !== user.id ? `/sheet/${sheet.id}/view` : `/sheet/${sheet.id}`)
      : `/sheet/local/${sheet.local_id}`;
    return (
      <div
        className="parchment-box p-4 flex flex-col gap-2 hover:shadow-lg transition-all group cursor-pointer"
        style={{ borderColor: 'var(--parchment-dark)' }}
        onClick={() => navigate(href)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--ink-dark)', fontWeight: 700 }}>
              {sheet.character_name || 'Unnamed Hero'}
            </div>
            <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
              Level {sheet.level || 1} &bull; {sheet.alignment || 'Unknown'}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="p-1 rounded hover:bg-parchment-dark transition-colors"
              style={{ color: 'var(--ink-mid)' }}
              onClick={e => { e.stopPropagation(); exportSheetAsJSON(sheet); }}
              title="Download JSON"
            >
              <Download size={14} />
            </button>
            <button
              type="button"
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--ink-red)' }}
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCloud && (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(45,106,45,0.15)', color: '#2d6a2d' }}>
              <Cloud size={10} /> Cloud
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment-light)' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink-dark)', borderBottom: '3px solid var(--parchment-dark)' }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={28} style={{ color: 'var(--parchment-dark)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--parchment-light)', fontWeight: 900, letterSpacing: '0.05em' }}>
                D&D Character Forge
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--parchment-dark)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                5th Edition Character Builder
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/groups"
              className="flex items-center gap-2 scroll-btn"
            >
              <Users size={14} /> Groups
            </Link>
            {!user ? (
              <a
                href="/login"
                className="flex items-center gap-2 scroll-btn"
                onClick={e => { e.preventDefault(); db.auth.redirectToLogin('/'); }}
              >
                <LogIn size={14} /> Sign In to Save
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: 'var(--font-body)', color: 'var(--parchment-mid)', fontSize: '0.85rem' }}>
                  {user.full_name || user.email}
                </span>
                {user.role === 'admin' && (
                  <Link to="/admin" className="scroll-btn text-xs">Admin Panel</Link>
                )}
                <button className="scroll-btn text-xs" onClick={() => db.auth.logout('/')}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center py-12 px-4" style={{ background: `linear-gradient(180deg, var(--parchment-mid) 0%, var(--parchment-light) 100%)`, borderBottom: '1px solid var(--parchment-dark)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--ink-dark)', fontStyle: 'italic', lineHeight: 1.2 }}>
          Forge Your Legend
        </div>
        <div className="mt-2 max-w-xl mx-auto" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontSize: '1rem' }}>
          Create and manage your Dungeons & Dragons 5e character sheets. Races, classes, spells and equipment — all auto-calculated.
        </div>
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          <button className="scroll-btn flex items-center gap-2" onClick={handleNewSheet}>
            <Plus size={14} /> New Character
          </button>
          <label className="scroll-btn flex items-center gap-2 cursor-pointer">
            <Upload size={14} /> Import JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Sheet Library */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {!user && (
          <div className="mb-6 p-4 rounded" style={{ background: 'rgba(122,92,30,0.1)', border: '1px solid var(--parchment-dark)', fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontSize: '0.9rem' }}>
            <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem' }}>Guest Mode</strong> — Your sheets are saved in your browser. 
            <button className="ml-2 underline" style={{ color: 'var(--ink-gold)' }} onClick={() => db.auth.redirectToLogin('/')}>Sign in</button> to save them to the cloud and access from any device.
          </div>
        )}

        {loading && (
          <div className="text-center py-12" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
            Loading your chronicles...
          </div>
        )}

        {!loading && user && cloudSheets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Cloud size={16} style={{ color: 'var(--ink-gold)' }} />
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--ink-dark)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Your Cloud Characters
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cloudSheets.map(sheet => (
                <SheetCard key={sheet.id} sheet={sheet} isCloud={true} onDelete={() => handleDeleteCloud(sheet.id)} />
              ))}
            </div>
          </div>
        )}

        {!loading && localSheets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Scroll size={16} style={{ color: 'var(--ink-gold)' }} />
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--ink-dark)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Local Characters {user ? '(Browser Only)' : ''}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {localSheets.map(sheet => (
                <SheetCard key={sheet.local_id} sheet={sheet} isCloud={false} onDelete={() => handleDeleteLocal(sheet.local_id)} />
              ))}
            </div>
          </div>
        )}

        {!loading && cloudSheets.length === 0 && localSheets.length === 0 && (
          <div className="text-center py-16">
            <Shield size={48} style={{ color: 'var(--parchment-dark)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
              Your adventure awaits
            </div>
            <div className="mt-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
              Create your first character to begin.
            </div>
            <button className="scroll-btn mt-4 flex items-center gap-2 mx-auto" onClick={handleNewSheet}>
              <Plus size={14} /> Create First Character
            </button>
          </div>
        )}
      </main>
    </div>
  );
}