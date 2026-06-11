import { useState, useEffect } from 'react';
import { loadCampaignWorkspace, saveCampaignWorkspace, exportCampaignWorkspace, diceRoll } from '@/utils/campaignWorkspace';
import { Dice6, FileText, MessageSquare, Save, Download } from 'lucide-react';

export default function CampaignDashboard({ groupId, members, sheets, creatures, usersById, canManage }) {
  const [ws, setWs] = useState(() => loadCampaignWorkspace(groupId));
  const [diceResult, setDiceResult] = useState(null);

  const update = (patch) => {
    const next = { ...ws, ...patch };
    setWs(next);
    saveCampaignWorkspace(groupId, next);
  };

  const rollDice = () => {
    const result = diceRoll(ws.diceInput?.formula || '1d20', {
      advantage: ws.diceInput?.advantage,
      disadvantage: ws.diceInput?.disadvantage,
    });
    if (!result) return;
    const entry = {
      id: Date.now(),
      formula: ws.diceInput.formula,
      result,
      label: ws.diceInput.label || '',
      time: new Date().toLocaleTimeString(),
    };
    setDiceResult(entry);
    update({ diceLog: [entry, ...(ws.diceLog || []).slice(0, 19)] });
  };

  const addChatMessage = (e) => {
    e.preventDefault();
    const content = e.target.message.value.trim();
    if (!content) return;
    const msg = { id: Date.now(), content, time: new Date().toLocaleTimeString() };
    update({ chatThreads: { ...ws.chatThreads, group: [...(ws.chatThreads?.group || []), msg] } });
    e.target.reset();
  };

  const addInitiativeEntry = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const init = parseInt(e.target.init.value) || 0;
    if (!name) return;
    const entry = { id: Date.now(), name, initiative: init };
    const sorted = [...(ws.initiative || []), entry].sort((a, b) => b.initiative - a.initiative);
    update({ initiative: sorted });
    e.target.reset();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Session Notes */}
      <div className="md:col-span-2">
        <div className="parchment-box p-3 mb-4">
          <div className="section-header mb-2 flex items-center gap-2">
            <FileText size={12} /> Session Notes
          </div>
          <textarea
            className="parchment-input w-full"
            rows={8}
            value={ws.sessionNotes || ''}
            onChange={e => update({ sessionNotes: e.target.value })}
            placeholder="Write session notes here..."
            style={{ resize: 'vertical', minHeight: 160 }}
          />
        </div>

        {/* Initiative Tracker */}
        <div className="parchment-box p-3 mb-4">
          <div className="section-header mb-2">Initiative Tracker</div>
          <form onSubmit={addInitiativeEntry} className="flex gap-2 mb-3">
            <input name="name" className="parchment-input flex-1" placeholder="Name..." />
            <input name="init" type="number" className="parchment-input w-16 text-center" placeholder="Init" />
            <button type="submit" className="scroll-btn text-xs" style={{ padding: '4px 10px', minHeight: 'auto' }}>Add</button>
          </form>
          {(ws.initiative || []).length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>No combatants yet.</p>
          )}
          {(ws.initiative || []).map((entry, i) => (
            <div key={entry.id} className="stat-row">
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, minWidth: 32, color: 'var(--ink-gold)' }}>{entry.initiative}</span>
              <span style={{ flex: 1 }}>{entry.name}</span>
              <button
                onClick={() => update({ initiative: ws.initiative.filter(e => e.id !== entry.id) })}
                style={{ color: 'var(--ink-red)', padding: '0 4px', fontFamily: 'var(--font-heading)' }}
              >×</button>
            </div>
          ))}
          {(ws.initiative || []).length > 0 && (
            <button
              className="scroll-btn scroll-btn-danger text-xs mt-2"
              style={{ padding: '4px 10px', minHeight: 'auto' }}
              onClick={() => update({ initiative: [] })}
            >Clear All</button>
          )}
        </div>

        {/* Rule Reminders */}
        <div className="parchment-box p-3">
          <div className="section-header mb-2">Rule Reminders</div>
          {(ws.ruleReminders || []).map((r, i) => (
            <div key={i} className="stat-row">
              <span style={{ fontSize: '0.8rem' }}>• {r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right column */}
      <div>
        {/* Dice Roller */}
        <div className="parchment-box p-3 mb-4">
          <div className="section-header mb-2 flex items-center gap-2">
            <Dice6 size={12} /> Dice Roller
          </div>
          <div className="flex gap-2 mb-2">
            <input
              className="parchment-input flex-1"
              value={ws.diceInput?.formula || '1d20'}
              onChange={e => update({ diceInput: { ...ws.diceInput, formula: e.target.value } })}
              placeholder="e.g. 2d6+3"
            />
            <input
              className="parchment-input flex-1"
              value={ws.diceInput?.label || ''}
              onChange={e => update({ diceInput: { ...ws.diceInput, label: e.target.value } })}
              placeholder="Label..."
            />
          </div>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
              <input type="checkbox" checked={ws.diceInput?.advantage || false} onChange={e => update({ diceInput: { ...ws.diceInput, advantage: e.target.checked, disadvantage: e.target.checked ? false : ws.diceInput?.disadvantage } })} />
              Advantage
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ fontFamily: 'var(--font-body)' }}>
              <input type="checkbox" checked={ws.diceInput?.disadvantage || false} onChange={e => update({ diceInput: { ...ws.diceInput, disadvantage: e.target.checked, advantage: e.target.checked ? false : ws.diceInput?.advantage } })} />
              Disadvantage
            </label>
          </div>
          <button className="scroll-btn w-full text-sm" onClick={rollDice}>Roll!</button>
          {diceResult && (
            <div className="parchment-box p-2 mt-2 text-center">
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink-dark)' }}>{diceResult.result.total}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-mid)' }}>{diceResult.formula} → [{diceResult.result.rolls.join(', ')}]{diceResult.result.bonus ? `${diceResult.result.bonus > 0 ? '+' : ''}${diceResult.result.bonus}` : ''}</div>
              {diceResult.label && <div style={{ fontSize: '0.72rem', color: 'var(--ink-gold)', fontFamily: 'var(--font-heading)' }}>{diceResult.label}</div>}
            </div>
          )}
          {(ws.diceLog || []).length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto">
              {ws.diceLog.map((entry, i) => (
                <div key={entry.id} className="stat-row text-xs">
                  <span style={{ color: 'var(--ink-mid)' }}>{entry.time}</span>
                  <span style={{ flex: 1, textAlign: 'center', color: 'var(--ink-gold)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{entry.result.total}</span>
                  <span style={{ color: 'var(--ink-mid)' }}>{entry.formula}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Chat */}
        <div className="parchment-box p-3">
          <div className="section-header mb-2 flex items-center gap-2">
            <MessageSquare size={12} /> Group Chat
          </div>
          <div className="max-h-48 overflow-y-auto mb-2 space-y-1">
            {(ws.chatThreads?.group || []).length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>No messages yet.</p>
            )}
            {[...(ws.chatThreads?.group || [])].reverse().map(msg => (
              <div key={msg.id} className="stat-row">
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)' }}>{msg.time}</span>
                <span style={{ flex: 1, fontSize: '0.82rem', marginLeft: 6 }}>{msg.content}</span>
              </div>
            ))}
          </div>
          <form onSubmit={addChatMessage} className="flex gap-1">
            <input name="message" className="parchment-input flex-1 text-sm" placeholder="Message..." />
            <button type="submit" className="scroll-btn text-xs" style={{ padding: '4px 10px', minHeight: 'auto' }}>Send</button>
          </form>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className="scroll-btn text-xs flex-1 flex items-center justify-center gap-1"
            style={{ padding: '6px', minHeight: 'auto' }}
            onClick={() => exportCampaignWorkspace(groupId, ws)}
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}