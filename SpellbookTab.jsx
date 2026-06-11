import { useState, useRef, useEffect } from 'react';
import { convertImperialText } from '@/utils/dndCalculations';
import { ChevronDown, Search } from 'lucide-react';

export default function ItemDropdown({
  label,
  items = [],
  value,
  onChange,
  placeholder = 'Select...',
  filterFn,
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const ref = useRef(null);

  const selectedItem = items.find(i => i.id === value);

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterFn ? filterFn(item) : true;
    return matchSearch && matchFilter;
  });

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && <div className="sheet-label mb-1">{label}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between parchment-select text-sm font-body min-h-[32px] text-left"
        style={{ fontFamily: 'var(--font-body)', color: selectedItem ? 'var(--ink-dark)' : 'var(--ink-mid)', opacity: disabled ? 0.6 : 1 }}
      >
        <span>{selectedItem ? selectedItem.name : placeholder}</span>
        <ChevronDown size={14} style={{ color: 'var(--ink-mid)', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded shadow-lg"
          style={{ background: 'var(--parchment-light)', border: '1.5px solid var(--parchment-dark)', maxHeight: 300, overflowY: 'auto' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--parchment-dark)' }}>
            <div className="flex items-center gap-1">
              <Search size={12} style={{ color: 'var(--ink-mid)' }} />
              <input
                autoFocus
                className="parchment-input text-xs w-full"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div
            className="px-3 py-2 cursor-pointer text-sm"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--parchment-mid)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
            onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
          >
            — None —
          </div>

          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs" style={{ color: 'var(--ink-mid)' }}>No items found</div>
          )}

          {filtered.map(item => (
            <div key={item.id} className="relative">
              <div
                className="px-3 py-2 cursor-pointer text-sm flex items-center justify-between gap-2"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: item.id === value ? 'var(--parchment-mid)' : '',
                  color: 'var(--ink-dark)',
                }}
                onMouseEnter={e => {
                  if (item.id !== value) e.currentTarget.style.background = 'var(--parchment-mid)';
                  if (item.short_description || item.description) setTooltip(item.id);
                }}
                onMouseLeave={e => {
                  if (item.id !== value) e.currentTarget.style.background = '';
                  setTooltip(null);
                }}
                onClick={() => { onChange(item.id); setOpen(false); setSearch(''); }}
              >
                <span>{item.name}</span>
                {item.source && <span style={{ fontSize: '0.65rem', color: 'var(--ink-mid)', flexShrink: 0 }}>{item.source}</span>}
              </div>

              {tooltip === item.id && (item.short_description || item.description) && (
                <div
                  className="absolute right-full top-0 mr-2 rounded shadow-lg p-3 z-50"
                  style={{ background: 'var(--parchment-light)', border: '1.5px solid var(--parchment-dark)', width: 220, pointerEvents: 'none' }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--ink-dark)' }}>{item.name}</div>
                  {item.short_description && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', marginTop: 4 }}>
                      {convertImperialText(item.short_description)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}