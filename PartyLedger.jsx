const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ArrowLeft, Plus, Trash2, Loader2, Calendar } from 'lucide-react';

const EVENT_TYPES = ['session','holiday','festival','lunar','world_event','plot_beat','custom'];
const TYPE_COLORS = {
  session:'#4a7a9b', holiday:'#7a5c1e', festival:'#8b6a2a', lunar:'#4a5a7a',
  world_event:'#8b1a1a', plot_beat:'#4a7a4a', custom:'#6a6a6a'
};
const TYPE_ICONS = {
  session:'⚔', holiday:'🎉', festival:'🎊', lunar:'🌙',
  world_event:'🌍', plot_beat:'📖', custom:'📌'
};

const DEFAULT_EVENT = { title:'', description:'', event_type:'custom', in_game_date:'', real_date:'', is_gm_only:false, recurring:'' };

// Simple lunar phase calculation
function lunarPhase(dayOfYear) {
  const phases = ['🌑 New Moon','🌒 Waxing Crescent','🌓 First Quarter','🌔 Waxing Gibbous','🌕 Full Moon','🌖 Waning Gibbous','🌗 Last Quarter','🌘 Waning Crescent'];
  return phases[Math.floor((dayOfYear % 30) / 30 * 8) % 8];
}

export default function CampaignCalendar() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(DEFAULT_EVENT);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isGM, setIsGM] = useState(false);
  const [user, setUser] = useState(null);
  const [currentGameDay, setCurrentGameDay] = useState(1);

  useEffect(() => {
    async function load() {
      const me = await db.auth.me().catch(() => null);
      setUser(me);
      setIsGM(me?.role === 'admin');
      const [groupList, membershipList] = await Promise.all([
        db.entities.Group.list('-name', 100),
        db.entities.GroupMembership.list('-created_date', 200),
      ]);
      const myGroups = me ? groupList.filter(g => membershipList.some(m => m.group_id === g.id && m.user_id === me.id)) : groupList;
      setGroups(myGroups);
      if (myGroups.length) setSelectedGroupId(myGroups[0].id);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    db.entities.CampaignCalendar.filter({ group_id: selectedGroupId }, 'in_game_date', 200).then(setEvents);
  }, [selectedGroupId]);

  const visibleEvents = useMemo(() => events.filter(e => {
    if (!isGM && e.is_gm_only) return false;
    if (filter !== 'all' && e.event_type !== filter) return false;
    return true;
  }), [events, isGM, filter]);

  const openForm = (event = null) => {
    setEditingEvent(event);
    setForm(event ? { ...event } : { ...DEFAULT_EVENT, group_id: selectedGroupId });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, group_id: selectedGroupId, created_by_user_id: user?.id };
    if (editingEvent) {
      const updated = await db.entities.CampaignCalendar.update(editingEvent.id, payload);
      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
    } else {
      const created = await db.entities.CampaignCalendar.create(payload);
      setEvents(prev => [...prev, created].sort((a,b) => a.in_game_date?.localeCompare(b.in_game_date||'')||0));
    }
    setSaving(false);
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await db.entities.CampaignCalendar.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--parchment-light)' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-mid)' }}>Loading calendar...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment-light)' }}>
      <div style={{ background: 'var(--ink-mid)', borderBottom: '3px solid var(--ink-gold)', padding: '8px 16px' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="icon-action-btn" style={{ color: 'var(--parchment-mid)' }}><ArrowLeft size={18} /></Link>
          <Calendar size={18} style={{ color: 'var(--parchment-light)' }} />
          <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1rem', letterSpacing: '0.06em', flex: 1 }}>
            Campaign Calendar
          </span>
          {groups.length > 1 && (
            <select className="parchment-select text-sm" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <button className="scroll-btn text-xs flex items-center gap-1" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => openForm()}>
            <Plus size={12} /> Add Event
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Lunar info & current day */}
        <div className="parchment-box p-3 mb-4 flex flex-wrap gap-4 items-center">
          <div className="text-center">
            <div className="sheet-label">Current Game Day</div>
            <input
              type="number" min={1}
              className="parchment-input text-center w-20"
              value={currentGameDay}
              onChange={e => setCurrentGameDay(parseInt(e.target.value)||1)}
            />
          </div>
          <div className="text-center">
            <div className="sheet-label">Lunar Phase</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{lunarPhase(currentGameDay)}</div>
          </div>
          <div className="text-center">
            <div className="sheet-label">Day in Month</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Day {((currentGameDay - 1) % 30) + 1} of 30</div>
          </div>
          <div className="text-center">
            <div className="sheet-label">Season</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              {['❄ Winter','🌱 Spring','☀ Summer','🍂 Autumn'][Math.floor(((currentGameDay - 1) % 360) / 90)]}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-1 mb-4">
          {['all', ...EVENT_TYPES].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className="px-3 py-1 rounded text-xs transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                background: filter === type ? (TYPE_COLORS[type] || 'var(--ink-mid)') : 'var(--parchment-mid)',
                color: filter === type ? 'var(--parchment-light)' : 'var(--ink-dark)',
                border: '1px solid var(--parchment-dark)',
              }}
            >
              {TYPE_ICONS[type] || '📋'} {type === 'all' ? 'All' : type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Events list */}
        {visibleEvents.length === 0 ? (
          <div className="parchment-box p-8 text-center">
            <Calendar size={36} style={{ color: 'var(--parchment-dark)', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', marginBottom: 16 }}>No events yet. Add holidays, sessions, or plot beats.</p>
            <button className="scroll-btn text-sm" style={{ padding: '6px 14px', minHeight: 'auto' }} onClick={() => openForm()}>
              <Plus size={14} /> Add First Event
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleEvents.map(event => (
              <div key={event.id} className="parchment-box p-3 flex items-start gap-3">
                <div style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{TYPE_ICONS[event.event_type] || '📌'}</div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-dark)' }}>{event.title}</span>
                    <span style={{ fontSize: '0.65rem', color: TYPE_COLORS[event.event_type] || 'var(--ink-mid)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>{event.event_type?.replace('_',' ')}</span>
                    {event.is_gm_only && <span style={{ fontSize: '0.6rem', color: 'var(--ink-red)', fontFamily: 'var(--font-heading)' }}>GM ONLY</span>}
                    {event.recurring && <span style={{ fontSize: '0.65rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>↻ {event.recurring}</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {event.in_game_date && <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>📅 Day {event.in_game_date}</span>}
                    {event.real_date && <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>IRL: {event.real_date}</span>}
                  </div>
                  {event.description && <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)', marginTop: 4 }}>{event.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {isGM && <button className="icon-action-btn" style={{ color: 'var(--ink-gold)', padding: 4, minWidth: 28, minHeight: 28 }} onClick={() => openForm(event)}>✎</button>}
                  {isGM && <button className="icon-action-btn" style={{ color: 'var(--ink-red)', padding: 4, minWidth: 28, minHeight: 28 }} onClick={() => handleDelete(event.id)}><Trash2 size={12} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="parchment-box p-5 w-full max-w-lg" style={{ background: 'var(--parchment-light)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--ink-dark)', marginBottom: 16 }}>
              {editingEvent ? 'Edit Event' : 'Add Calendar Event'}
            </h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="sheet-label mb-1">Title *</div>
                  <input required className="parchment-input w-full" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
                </div>
                <div>
                  <div className="sheet-label mb-1">Type</div>
                  <select className="parchment-select w-full" value={form.event_type} onChange={e => setForm(f => ({...f, event_type: e.target.value}))}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="sheet-label mb-1">In-Game Day #</div>
                  <input className="parchment-input w-full" placeholder="e.g. 42" value={form.in_game_date} onChange={e => setForm(f => ({...f, in_game_date: e.target.value}))} />
                </div>
                <div>
                  <div className="sheet-label mb-1">Real-World Date</div>
                  <input type="date" className="parchment-input w-full" value={form.real_date} onChange={e => setForm(f => ({...f, real_date: e.target.value}))} />
                </div>
              </div>
              <div>
                <div className="sheet-label mb-1">Description</div>
                <textarea className="parchment-input w-full" rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div>
                <div className="sheet-label mb-1">Recurring (e.g. "Every 30 days", "Annually")</div>
                <input className="parchment-input w-full" value={form.recurring} onChange={e => setForm(f => ({...f, recurring: e.target.value}))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_gm_only} onChange={e => setForm(f => ({...f, is_gm_only: e.target.checked}))} style={{ accentColor: 'var(--ink-red)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--ink-red)' }}>GM Only (hidden from players)</span>
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="scroll-btn scroll-btn-danger text-sm" style={{ padding: '6px 14px', minHeight: 'auto' }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="scroll-btn text-sm flex items-center gap-1" style={{ padding: '6px 14px', minHeight: 'auto' }} disabled={saving}>
                  {saving && <Loader2 size={12} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}