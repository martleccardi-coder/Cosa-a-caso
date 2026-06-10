import { useState } from 'react';
import { Plus, Trash2, Package, Sword, Gem } from 'lucide-react';
import { lbsToKg } from '@/utils/dndCalculations';
import ParchmentSection from './ParchmentSection';

const INVENTORY_CATEGORIES = [
  { key: 'weapon', label: 'Weapons', icon: Sword, color: 'var(--ink-red)' },
  { key: 'gear', label: 'Gear', icon: Package, color: 'var(--ink-gold)' },
  { key: 'loot', label: 'Loot', icon: Gem, color: '#4a7a4a' },
];

const EMPTY_ITEM = { name: '', qty: 1, weight_lbs: 0, category: 'gear', notes: '' };

export default function InventoryPanel({ inventory = [], onChange, carryingCapacityKg }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });

  const totalWeightKg = inventory.reduce((sum, item) => {
    return sum + (lbsToKg(parseFloat(item.weight_lbs) || 0) * (parseInt(item.qty) || 1));
  }, 0);

  const usedPercent = carryingCapacityKg > 0
    ? Math.min(100, (totalWeightKg / carryingCapacityKg) * 100)
    : 0;

  const isOverEncumbered = totalWeightKg > carryingCapacityKg;

  const addItem = () => {
    if (!newItem.name.trim()) return;
    onChange([...inventory, { ...newItem, id: Date.now().toString() }]);
    setNewItem({ ...EMPTY_ITEM });
    setAdding(false);
  };

  const removeItem = (id) => onChange(inventory.filter(i => i.id !== id));

  const updateItem = (id, patch) => onChange(inventory.map(i => i.id === id ? { ...i, ...patch } : i));

  return (
    <ParchmentSection title="Inventory">
      {/* Carry Capacity Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <div className="sheet-label">Carry Weight</div>
          <div className="text-xs" style={{
            fontFamily: 'var(--font-heading)',
            color: isOverEncumbered ? 'var(--ink-red)' : 'var(--ink-mid)'
          }}>
            {Math.round(totalWeightKg * 10) / 10} / {carryingCapacityKg} kg
            {isOverEncumbered && <span className="ml-1" style={{ color: 'var(--ink-red)' }}>⚠ Encumbered</span>}
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--parchment-dark)', opacity: 0.5 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${usedPercent}%`,
              background: isOverEncumbered ? 'var(--ink-red)' : usedPercent > 75 ? '#b8922a' : 'var(--ink-mid)',
            }}
          />
        </div>
      </div>

      {/* Items by category */}
      {INVENTORY_CATEGORIES.map(({ key, label, icon: Icon, color }) => {
        const catItems = inventory.filter(i => i.category === key);
        if (!catItems.length && !adding) return null;
        return (
          <div key={key} className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              <Icon size={11} style={{ color }} />
              <div className="sheet-label">{label}</div>
            </div>
            <div className="space-y-1">
              {catItems.map(item => (
                <div key={item.id} className="flex items-center gap-1 group">
                  <input
                    className="parchment-input text-xs w-6 text-center flex-shrink-0"
                    type="number" min="1"
                    value={item.qty || 1}
                    onChange={e => updateItem(item.id, { qty: parseInt(e.target.value) || 1 })}
                    title="Quantity"
                  />
                  <input
                    className="parchment-input text-xs flex-1"
                    value={item.name}
                    onChange={e => updateItem(item.id, { name: e.target.value })}
                  />
                  <input
                    className="parchment-input text-xs w-14 text-center flex-shrink-0"
                    type="number" min="0" step="0.1"
                    value={item.weight_lbs || ''}
                    onChange={e => updateItem(item.id, { weight_lbs: parseFloat(e.target.value) || 0 })}
                    placeholder="lbs"
                    title="Weight in lbs"
                  />
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--ink-mid)', width: 36, textAlign: 'right', fontFamily: 'var(--font-body)' }}>
                    {Math.round(lbsToKg((parseFloat(item.weight_lbs) || 0) * (parseInt(item.qty) || 1)) * 10) / 10}kg
                  </span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--ink-red)' }}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add item form */}
      {adding ? (
        <div className="parchment-box p-2 space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="sheet-label">Item Name *</div>
              <input
                className="parchment-input text-xs"
                placeholder="e.g. Rope, Dagger..."
                value={newItem.name}
                onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
            </div>
            <div>
              <div className="sheet-label">Category</div>
              <select
                className="parchment-select w-full text-xs"
                value={newItem.category}
                onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
              >
                {INVENTORY_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <div className="sheet-label">Qty</div>
              <input
                type="number" min="1"
                className="parchment-input text-xs"
                value={newItem.qty}
                onChange={e => setNewItem(n => ({ ...n, qty: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <div className="sheet-label">Weight (lbs per item)</div>
              <input
                type="number" min="0" step="0.1"
                className="parchment-input text-xs"
                value={newItem.weight_lbs || ''}
                onChange={e => setNewItem(n => ({ ...n, weight_lbs: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="scroll-btn text-xs" style={{ background: 'transparent', border: '1px solid var(--parchment-dark)', color: 'var(--ink-mid)' }} onClick={() => setAdding(false)}>Cancel</button>
            <button type="button" className="scroll-btn text-xs" onClick={addItem} disabled={!newItem.name.trim()}>Add</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="scroll-btn text-xs flex items-center gap-1 mt-2"
          onClick={() => setAdding(true)}
        >
          <Plus size={12} /> Add Item
        </button>
      )}
    </ParchmentSection>
  );
}