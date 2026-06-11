const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { ArrowLeft, Plus, Trash2, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const REPUTATION_LABELS = [
  { min: -100, max: -61, label: 'Hated', color: '#8b1a1a' },
  { min: -60, max: -31, label: 'Hostile', color: '#c04040' },
  { min: -30, max: -11, label: 'Unfriendly', color: '#c07040' },
  { min: -10, max: 10, label: 'Neutral', color: '#7a7060' },
  { min: 11, max: 30, label: 'Friendly', color: '#4a7a4a' },
  { min: 31, max: 60, label: 'Honored', color: '#2a6a5a' },
  { min: 61, max: 100, label: 'Exalted', color: '#7a5c1e' },
];

function getRepLabel(score) {
  return REPUTATION_LABELS.find(r => score >= r.min && score <= r.max) || REPUTATION_LABELS[3];
}

export default function FactionTracker() {
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newFaction, setNewFaction] = useState({ name: '', description: '', alignment: '', color: '#7A5C1E' });
  const [selectedId, setSelectedId] = useState(null);
  const [logForm, setLogForm] = useState({ character_name: '', change: 0, reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFactions();
  }, []);

  async function loadFactions() {
    setLoading(true);
    const list = await db.entities.Faction.list('-created_date', 100);
    setFactions(list);
    if (list.length && !selectedId) setSelectedId(list[0].id);
    setLoading(false);
  }

  const selectedFaction = factions.find(f => f.id === selectedId);

  async function handleCreateFaction(e) {
    e.preventDefault();
    if (!newFaction.name.trim()) return;
    setSaving(true);
    const created = await db.entities.Faction.create({ ...newFaction, reputation_entries: [] });
    setFactions(prev => [created, ...prev]);
    setSelectedId(created.id);
    setNewFaction({ name: '', description: '', alignment: '', color: '#7A5C1E' });
    setShowForm(false);
    setSaving(false);
  }

  async function handleLogReputation(e) {
    e.preventDefault();
    if (!selectedFaction || !logForm.character_name || logForm.change === 0) return;
    setSaving(true);
    const entries = selectedFaction.reputation_entries || [];
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    const current = (lastEntry?.current ?? 0) + Number(logForm.change);
    const newEntry = {
      date: new Date().toLocaleDateString(),
      character_name: logForm.character_name,
      change: Number(logForm.change),
      current: Math.max(-100, Math.min(100, current)),
      reason: logForm.reason,
    };
    const updated = await db.entities.Faction.update(selectedFaction.id, {
      reputation_entries: [...entries, newEntry],
    });
    setFactions(prev => prev.map(f => f.id === updated.id ? updated : f));
    setLogForm({ character_name: '', change: 0, reason: '' });
    setSaving(false);
  }

  async function handleDeleteFaction(id) {
    if (!confirm('Delete this faction?')) return;
    await db.entities.Faction.delete(id);
    setFactions(prev => prev.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(factions.find(f => f.id !== id)?.id || null);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment-light)' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-mid)' }}>Loading factions...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment-light)' }}>
      <div style={{ background: 'var(--ink-mid)', borderBottom: '3px solid var(--ink-gold)', padding: '8px 16px' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="icon-action-btn" style={{ color: 'var(--parchment-mid)' }}><ArrowLeft size={18} /></Link>
          <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1rem', letterSpacing: '0.06em', flex: 1 }}>
            Faction Reputation Tracker
          </span>
          <button className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => setShowForm(true)}>
            <Plus size={12} /> New Faction
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 flex gap-4">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="parchment-box p-2">
            <div className="section-header mb-2">Factions</div>
            {factions.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', padding: '8px 4px' }}>No factions yet.</p>
            )}
            {factions.map(f => {
              const entries = f.reputation_entries || [];
              const current = entries.length > 0 ? entries[entries.length - 1].current : 0;
              const rep = getRepLabel(current);
              return (
                <button
                  key={f.id}
                  className="w-full text-left px-2 py-2 rounded mb-1 transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: selectedId === f.id ? 'var(--ink-mid)' : 'transparent',
                    color: selectedId === f.id ? 'var(--parchment-light)' : 'var(--ink-dark)',
                  }}
                  onClick={() => setSelectedId(f.id)}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.name}</div>
                  <div style={{ fontSize: '0.65rem', color: selectedId === f.id ? 'var(--parchment-dark)' : rep.color, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>{rep.label} ({current > 0 ? '+' : ''}{current})</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {!selectedFaction ? (
            <div className="parchment-box p-10 text-center">
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', marginBottom: 16 }}>Create your first faction to start tracking reputation.</p>
              <button className="scroll-btn" onClick={() => setShowForm(true)}><Plus size={14} /> Create Faction</button>
            </div>
          ) : (
            <>
              {/* Faction header */}
              <div className="parchment-box p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--ink-dark)', marginBottom: 4 }}>
                      {selectedFaction.name}
                    </div>
                    {selectedFaction.description && (
                      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontSize: '0.85rem', marginBottom: 8 }}>{selectedFaction.description}</p>
                    )}
                    {selectedFaction.alignment && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{selectedFaction.alignment}</span>
                    )}
                  </div>
                  <button className="icon-action-btn" style={{ color: 'var(--ink-red)', padding: 6, minWidth: 32, minHeight: 32 }} onClick={() => handleDeleteFaction(selectedFaction.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Reputation meter */}
                {(() => {
                  const entries = selectedFaction.reputation_entries || [];
                  const current = entries.length > 0 ? entries[entries.length - 1].current : 0;
                  const rep = getRepLabel(current);
                  const pct = ((current + 100) / 200) * 100;
                  return (
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>Reputation</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: rep.color }}>{rep.label} ({current > 0 ? '+' : ''}{current})</span>
                      </div>
                      <div style={{ height: 10, background: 'var(--parchment-dark)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: rep.color, transition: 'width 0.4s ease' }} />
                        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(0,0,0,0.3)' }} />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span style={{ fontSize: '0.6rem', color: '#8b1a1a', fontFamily: 'var(--font-body)' }}>Hated -100</span>
                        <span style={{ fontSize: '0.6rem', color: '#7a5c1e', fontFamily: 'var(--font-body)' }}>Exalted +100</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Log reputation change */}
              <div className="parchment-box p-3 mb-4">
                <div className="section-header mb-2">Log Reputation Change</div>
                <form onSubmit={handleLogReputation} className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <div className="sheet-label mb-1">Character</div>
                    <input className="parchment-input w-full" placeholder="Character name..." value={logForm.character_name} onChange={e => setLogForm(f => ({ ...f, character_name: e.target.value }))} />
                  </div>
                  <div>
                    <div className="sheet-label mb-1">Change (±)</div>
                    <input type="number" min={-100} max={100} className="parchment-input w-full text-center" value={logForm.change} onChange={e => setLogForm(f => ({ ...f, change: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <div className="sheet-label mb-1">Reason</div>
                    <input className="parchment-input w-full" placeholder="Helped the guild..." value={logForm.reason} onChange={e => setLogForm(f => ({ ...f, reason: e.target.value }))} />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button type="submit" className="scroll-btn text-sm flex items-center gap-1" style={{ padding: '6px 14px', minHeight: 'auto' }} disabled={saving || !logForm.character_name || logForm.change === 0}>
                      {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                      Log Change
                    </button>
                  </div>
                </form>
              </div>

              {/* History */}
              <div className="parchment-box p-3">
                <div className="section-header mb-2">Reputation History</div>
                {(selectedFaction.reputation_entries || []).length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>No history yet.</p>
                ) : (
                  [...(selectedFaction.reputation_entries || [])].reverse().map((entry, i) => {
                    const Icon = entry.change > 0 ? TrendingUp : entry.change < 0 ? TrendingDown : Minus;
                    const color = entry.change > 0 ? '#4a7a4a' : entry.change < 0 ? '#8b1a1a' : '#7a7060';
                    return (
                      <div key={i} className="stat-row">
                        <Icon size={12} style={{ color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, minWidth: 80, fontSize: '0.8rem' }}>{entry.character_name}</span>
                        <span style={{ color, fontFamily: 'var(--font-heading)', fontWeight: 700, minWidth: 36 }}>
                          {entry.change > 0 ? '+' : ''}{entry.change}
                        </span>
                        <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--ink-mid)' }}>{entry.reason}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>
                          {entry.date} · total: {entry.current > 0 ? '+' : ''}{entry.current}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Faction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="parchment-box p-6 w-full max-w-md" style={{ background: 'var(--parchment-light)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--ink-dark)', marginBottom: 16 }}>Create Faction</h2>
            <form onSubmit={handleCreateFaction} className="space-y-3">
              <div>
                <div className="sheet-label mb-1">Faction Name *</div>
                <input required className="parchment-input w-full" value={newFaction.name} onChange={e => setNewFaction(f => ({ ...f, name: e.target.value }))} placeholder="The Merchant Guild..." />
              </div>
              <div>
                <div className="sheet-label mb-1">Description</div>
                <textarea className="parchment-input w-full" rows={2} value={newFaction.description} onChange={e => setNewFaction(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <div className="sheet-label mb-1">Alignment</div>
                <input className="parchment-input w-full" value={newFaction.alignment} onChange={e => setNewFaction(f => ({ ...f, alignment: e.target.value }))} placeholder="Lawful Neutral..." />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="scroll-btn scroll-btn-danger text-sm" style={{ padding: '6px 14px', minHeight: 'auto' }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="scroll-btn text-sm" style={{ padding: '6px 14px', minHeight: 'auto' }} disabled={saving}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}