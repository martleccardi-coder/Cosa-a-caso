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
    <div>
      <div className="parchment-box p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="sheet-label">Carry Weight</div>
          <div style={{ fontSize: '0.8rem', color: isOverEncumbered ? '#8B1A1A' : 'var(--ink-mid)' }}>
            {Math.round(totalWeightKg * 10) / 10} / {carryingCapacityKg} kg
            {isOverEncumbered && <span style={{ marginLeft: 4 }}>⚠ Encumbered</span>}
          </div>
        </div>
        <div style={{ height: 6, background: 'var(--parchment-mid)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${usedPercent}%`,
            background: usedPercent > 75 ? '#b8922a' : 'var(--ink-mid)',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {INVENTORY_CATEGORIES.map(({ key, label, icon: Icon, color }) => {
        const catItems = inventory.filter(i => i.category === key);
        if (!catItems.length && !adding) return null;
        return (
          <ParchmentSection key={key} title={label}>
            {catItems.map(item => (
              <div key={item.id} className="flex items-center gap-1 mb-1">
                <input
                  type="number"
                  value={item.qty || 1}
                  min={1}
                  className="parchment-input text-center"
                  style={{ width: 36, fontSize: '0.8rem' }}
                  onChange={e => updateItem(item.id, { qty: parseInt(e.target.value) || 1 })}
                  title="Quantity"
                />
                <input
                  className="parchment-input flex-1"
                  style={{ fontSize: '0.82rem' }}
                  value={item.name || ''}
                  onChange={e => updateItem(item.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  value={item.weight_lbs || 0}
                  className="parchment-input text-center"
                  style={{ width: 44, fontSize: '0.78rem' }}
                  onChange={e => updateItem(item.id, { weight_lbs: parseFloat(e.target.value) || 0 })}
                  placeholder="lbs"
                  title="Weight in lbs"
                  min={0}
                  step={0.1}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-mid)', minWidth: 32 }}>
                  {Math.round(lbsToKg((parseFloat(item.weight_lbs) || 0) * (parseInt(item.qty) || 1)) * 10) / 10}kg
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="icon-action-btn"
                  style={{ color: 'var(--ink-red)', padding: 4, minWidth: 28, minHeight: 28 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </ParchmentSection>
        );
      })}

      {adding ? (
        <div className="parchment-box p-3 mb-3">
          <div className="section-header mb-2">Add Item</div>
          <div className="space-y-2">
            <div>
              <div className="sheet-label mb-1">Item Name *</div>
              <input
                className="parchment-input w-full"
                value={newItem.name}
                onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
            </div>
            <div className="flex gap-2">
              <div>
                <div className="sheet-label mb-1">Category</div>
                <select
                  className="parchment-select"
                  value={newItem.category}
                  onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                >
                  {INVENTORY_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <div className="sheet-label mb-1">Qty</div>
                <input
                  type="number"
                  min={1}
                  value={newItem.qty}
                  className="parchment-input w-16 text-center"
                  onChange={e => setNewItem(n => ({ ...n, qty: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <div className="sheet-label mb-1">Weight (lbs)</div>
                <input
                  type="number"
                  value={newItem.weight_lbs}
                  className="parchment-input w-20 text-center"
                  onChange={e => setNewItem(n => ({ ...n, weight_lbs: parseFloat(e.target.value) || 0 }))}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="scroll-btn scroll-btn-danger text-xs" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => setAdding(false)}>Cancel</button>
              <button className="scroll-btn text-xs" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={addItem}>Add</button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="scroll-btn w-full text-sm"
          onClick={() => setAdding(true)}
        >
          <Plus size={14} /> Add Item
        </button>
      )}
    </div>
  );
}