import { useState, useMemo } from 'react';
import { ABILITY_SCORES, getProficiencyBonus, formatModifier } from '@/utils/dndCalculations';
import { X, TrendingUp, Star, Zap } from 'lucide-react';

// ASI levels: every class gets ASI at 4, 8, 12, 16, 19 (standard 5e)
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

  // Check if any of the levels crossed gives an ASI
  const levelsGained = Array.from({ length: newLevel - oldLevel }, (_, i) => oldLevel + 1 + i);
  const hasASI = levelsGained.some(l => ASI_LEVELS.includes(l));

  // ASI state: user can put +2 into one stat, or +1/+1 into two
  const [asiMode, setAsiMode] = useState('two_plus_one'); // 'two_plus_one' | 'one_one'
  const [asiChoice, setAsiChoice] = useState({ stat1: '', stat2: '' });

  const conMod = Math.floor(((sheet.ability_scores?.CON || 10) - 10) / 2);
  const hpGained = hitDieAvg + conMod;

  const canConfirm = !hasASI || (
    asiMode === 'two_plus_one'
      ? asiChoice.stat1 !== ''
      : asiChoice.stat1 !== '' && asiChoice.stat2 !== ''
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

    onConfirm({
      level: newLevel,
      ability_scores: newAbilityScores,
      hp_max: newHpMax,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(28,16,7,0.75)' }}>
      <div className="w-full max-w-md rounded-sm" style={{ background: 'var(--parchment-light)', border: '3px solid var(--parchment-dark)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'var(--ink-mid)', borderBottom: '2px solid var(--parchment-dark)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} style={{ color: 'var(--parchment-dark)' }} />
            <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--parchment-light)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
              Level Up! → Level {newLevel}
            </div>
          </div>
          <button type="button" onClick={onCancel} style={{ color: 'var(--parchment-mid)' }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Class + level info */}
          <div className="text-center">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
              {sheet.character_name || 'Your hero'} reaches Level {newLevel} {className && `as a ${className}`}
            </div>
          </div>

          {/* Automatic bonuses */}
          <div className="parchment-box p-3 space-y-2">
            <div className="sheet-label mb-1">Automatic Bonuses</div>

            {/* HP */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,26,26,0.15)' }}>
                <span style={{ color: 'var(--ink-red)', fontSize: '0.6rem' }}>♥</span>
              </div>
              <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>
                <strong>+{Math.max(1, hpGained)} Max HP</strong>
                <span style={{ color: 'var(--ink-mid)' }}> ({hitDie} avg {hitDieAvg} + CON {formatModifier(conMod)})</span>
                {sheet.hp_max === 0 || !sheet.hp_max ? (
                  <span style={{ color: 'var(--ink-mid)', fontStyle: 'italic' }}> — using auto HP, updates automatically</span>
                ) : null}
              </div>
            </div>

            {/* Proficiency bonus */}
            {profBonusIncreased && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(122,92,30,0.15)' }}>
                  <Star size={10} style={{ color: 'var(--ink-gold)' }} />
                </div>
                <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>
                  <strong>Proficiency Bonus</strong>
                  <span style={{ color: 'var(--ink-mid)' }}> increases: {formatModifier(oldProfBonus)} → {formatModifier(newProfBonus)}</span>
                </div>
              </div>
            )}

            {/* Hit die */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(61,43,31,0.1)' }}>
                <Zap size={10} style={{ color: 'var(--ink-mid)' }} />
              </div>
              <div className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-dark)' }}>
                Hit Dice pool: <strong>{newLevel}{hitDie}</strong>
              </div>
            </div>
          </div>

          {/* ASI Choice */}
          {hasASI && (
            <div className="parchment-box p-3">
              <div className="sheet-label mb-2">Ability Score Improvement</div>
              <div className="text-xs mb-3" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontStyle: 'italic' }}>
                At level {levelsGained.find(l => ASI_LEVELS.includes(l))}, you gain an ASI. Choose how to spend your +2 points:
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  className="flex-1 text-xs py-1.5 rounded transition-all"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    background: asiMode === 'two_plus_one' ? 'var(--ink-mid)' : 'transparent',
                    color: asiMode === 'two_plus_one' ? 'var(--parchment-light)' : 'var(--ink-mid)',
                    border: '1.5px solid var(--parchment-dark)',
                  }}
                  onClick={() => { setAsiMode('two_plus_one'); setAsiChoice({ stat1: '', stat2: '' }); }}
                >
                  +2 to one stat
                </button>
                <button
                  type="button"
                  className="flex-1 text-xs py-1.5 rounded transition-all"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    background: asiMode === 'one_one' ? 'var(--ink-mid)' : 'transparent',
                    color: asiMode === 'one_one' ? 'var(--parchment-light)' : 'var(--ink-mid)',
                    border: '1.5px solid var(--parchment-dark)',
                  }}
                  onClick={() => { setAsiMode('one_one'); setAsiChoice({ stat1: '', stat2: '' }); }}
                >
                  +1 to two stats
                </button>
              </div>

              {/* Stat selection */}
              <div className={`grid gap-2 ${asiMode === 'one_one' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <div className="sheet-label">{asiMode === 'two_plus_one' ? '+2 to' : '+1 to (first)'}</div>
                  <select
                    className="parchment-select w-full text-sm"
                    value={asiChoice.stat1}
                    onChange={e => setAsiChoice(c => ({ ...c, stat1: e.target.value }))}
                  >
                    <option value="">— Choose stat —</option>
                    {ABILITY_SCORES.map(a => (
                      <option key={a} value={a}>
                        {a} (current: {sheet.ability_scores?.[a] || 10})
                      </option>
                    ))}
                  </select>
                </div>
                {asiMode === 'one_one' && (
                  <div>
                    <div className="sheet-label">+1 to (second)</div>
                    <select
                      className="parchment-select w-full text-sm"
                      value={asiChoice.stat2}
                      onChange={e => setAsiChoice(c => ({ ...c, stat2: e.target.value }))}
                    >
                      <option value="">— Choose stat —</option>
                      {ABILITY_SCORES.filter(a => a !== asiChoice.stat1).map(a => (
                        <option key={a} value={a}>
                          {a} (current: {sheet.ability_scores?.[a] || 10})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              className="scroll-btn text-sm flex-1"
              style={{ background: 'transparent', border: '1.5px solid var(--parchment-dark)', color: 'var(--ink-mid)' }}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="scroll-btn text-sm flex-1"
              disabled={!canConfirm}
              onClick={handleConfirm}
              style={{ opacity: canConfirm ? 1 : 0.5, cursor: canConfirm ? 'pointer' : 'not-allowed' }}
            >
              Confirm Level Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}