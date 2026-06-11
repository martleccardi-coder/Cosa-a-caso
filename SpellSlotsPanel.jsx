import { useState } from 'react';
import { ABILITY_SCORES, getProficiencyBonus, formatModifier } from '@/utils/dndCalculations';
import { X } from 'lucide-react';

const ASI_LEVELS = [4, 8, 12, 16, 19];

export default function LevelUpModal({ sheet, newLevel, items, onConfirm, onCancel }) {
  const oldLevel = sheet.level || 1;
  const classItem = items.find(i => i.id === sheet.class_id);
  const className = classItem?.name || 'your class';
  const hitDie = classItem?.hit_die || 'd8';
  const hitDieAvg = { d6: 4, d8: 5, d10: 6, d12: 7 }[hitDie] || 5;

  const newProfBonus = getProficiencyBonus(newLevel);
  const oldProfBonus = getProficiencyBonus(oldLevel);
  const profBonusIncreased = newProfBonus > oldProfBonus;

  const levelsGained = Array.from({ length: newLevel - oldLevel }, (_, i) => oldLevel + 1 + i);
  const hasASI = levelsGained.some(l => ASI_LEVELS.includes(l));

  const [asiMode, setAsiMode] = useState('two_plus_one');
  const [asiChoice, setAsiChoice] = useState({ stat1: '', stat2: '' });

  const conMod = Math.floor(((sheet.ability_scores?.CON || 10) - 10) / 2);
  const hpGained = hitDieAvg + conMod;

  const canConfirm = !hasASI || (
    asiMode === 'two_plus_one' ? asiChoice.stat1 !== '' : asiChoice.stat1 !== '' && asiChoice.stat2 !== ''
  );

  const handleConfirm = () => {
    let newAbilityScores = { ...(sheet.ability_scores || {}) };
    if (hasASI && asiChoice.stat1) {
      const bonus1 = asiMode === 'two_plus_one' ? 2 : 1;
      newAbilityScores[asiChoice.stat1] = (newAbilityScores[asiChoice.stat1] || 10) + bonus1;
      if (asiMode === 'one_one' && asiChoice.stat2 && asiChoice.stat2 !== asiChoice.stat1) {
        newAbilityScores[asiChoice.stat2] = (newAbilityScores[asiChoice.stat2] || 10) + 1;
      }
    }
    const currentHpMax = sheet.hp_max || 0;
    const newHpMax = currentHpMax > 0 ? currentHpMax + Math.max(1, hpGained) : 0;
    onConfirm({ level: newLevel, ability_scores: newAbilityScores, hp_max: newHpMax });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="parchment-box p-6 max-w-md w-full relative" style={{ background: 'var(--parchment-light)' }}>
        <button onClick={onCancel} className="absolute top-3 right-3 icon-action-btn" style={{ color: 'var(--ink-mid)' }}>
          <X size={16} />
        </button>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--ink-dark)', marginBottom: 8 }}>
          Level Up! → Level {newLevel}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontSize: '0.9rem', marginBottom: 16 }}>
          {sheet.character_name || 'Your hero'} reaches Level {newLevel}{className ? ` as a ${className}` : ''}.
        </p>

        <div className="parchment-box p-3 mb-4">
          <div className="section-header mb-2">Automatic Bonuses</div>
          <div className="space-y-2" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>
            <div>♥ <strong>+{Math.max(1, hpGained)} Max HP</strong> ({hitDie} avg {hitDieAvg} + CON {formatModifier(conMod)})</div>
            {profBonusIncreased && (
              <div><strong>Proficiency Bonus</strong>: {formatModifier(oldProfBonus)} → {formatModifier(newProfBonus)}</div>
            )}
            <div>Hit Dice pool: <strong>{newLevel}{hitDie}</strong></div>
          </div>
        </div>

        {hasASI && (
          <div className="parchment-box p-3 mb-4">
            <div className="section-header mb-2">Ability Score Improvement</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', marginBottom: 8 }}>
              At level {levelsGained.find(l => ASI_LEVELS.includes(l))}, you gain an ASI. Choose how to spend your +2:
            </p>
            <div className="flex gap-2 mb-3">
              <button
                className={`scroll-btn text-xs ${asiMode === 'two_plus_one' ? '' : 'opacity-60'}`}
                style={{ padding: '4px 10px', minHeight: 'auto' }}
                onClick={() => { setAsiMode('two_plus_one'); setAsiChoice({ stat1: '', stat2: '' }); }}
              >+2 to one stat</button>
              <button
                className={`scroll-btn text-xs ${asiMode === 'one_one' ? '' : 'opacity-60'}`}
                style={{ padding: '4px 10px', minHeight: 'auto' }}
                onClick={() => { setAsiMode('one_one'); setAsiChoice({ stat1: '', stat2: '' }); }}
              >+1 to two stats</button>
            </div>
            <div className="space-y-2">
              <div>
                <div className="sheet-label mb-1">{asiMode === 'two_plus_one' ? '+2 to' : '+1 to (first)'}</div>
                <select
                  className="parchment-select w-full"
                  value={asiChoice.stat1}
                  onChange={e => setAsiChoice(c => ({ ...c, stat1: e.target.value }))}
                >
                  <option value="">— Choose stat —</option>
                  {ABILITY_SCORES.map(a => (
                    <option key={a} value={a}>{a} (current: {sheet.ability_scores?.[a] || 10})</option>
                  ))}
                </select>
              </div>
              {asiMode === 'one_one' && (
                <div>
                  <div className="sheet-label mb-1">+1 to (second)</div>
                  <select
                    className="parchment-select w-full"
                    value={asiChoice.stat2}
                    onChange={e => setAsiChoice(c => ({ ...c, stat2: e.target.value }))}
                  >
                    <option value="">— Choose stat —</option>
                    {ABILITY_SCORES.filter(a => a !== asiChoice.stat1).map(a => (
                      <option key={a} value={a}>{a} (current: {sheet.ability_scores?.[a] || 10})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button className="scroll-btn scroll-btn-danger text-sm" style={{ padding: '6px 14px', minHeight: 'auto' }} onClick={onCancel}>Cancel</button>
          <button
            className="scroll-btn text-sm"
            style={{ padding: '6px 14px', minHeight: 'auto', opacity: canConfirm ? 1 : 0.5 }}
            onClick={canConfirm ? handleConfirm : undefined}
            disabled={!canConfirm}
          >
            Confirm Level Up
          </button>
        </div>
      </div>
    </div>
  );
}