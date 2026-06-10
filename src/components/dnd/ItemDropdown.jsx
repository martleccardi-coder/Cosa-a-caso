import { useState, useRef, useEffect } from 'react';
import { convertImperialText } from '@/utils/dndCalculations';
import { ChevronDown, Search, Book } from 'lucide-react';

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
    <div ref={ref} className={`relative ${className}`}>
      {label && <div className="sheet-label mb-1">{label}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between parchment-select text-sm font-body min-h-[32px] text-left"
        style={{ fontFamily: 'var(--font-body)', color: selectedItem ? 'var(--ink-dark)' : 'var(--ink-mid)', opacity: disabled ? 0.6 : 1 }}
      >
        <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
        <ChevronDown size={14} style={{ color: 'var(--ink-gold)', flexShrink: 0, marginLeft: 4 }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[220px] rounded-sm shadow-xl"
          style={{
            background: 'var(--parchment-light)',
            border: '2px solid var(--parchment-dark)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search */}
          <div className="p-2 border-b" style={{ borderColor: 'var(--parchment-dark)' }}>
            <div className="flex items-center gap-1">
              <Search size={12} style={{ color: 'var(--ink-gold)' }} />
              <input
                autoFocus
                type="text"
                className="parchment-input text-xs flex-1"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* None option */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm transition-colors"
              style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--parchment-mid)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
              onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
            >
              — None —
            </button>

            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--ink-mid)' }}>No items found</div>
            )}

            {filtered.map(item => (
              <div
                key={item.id}
                className="relative group"
                onMouseEnter={() => (item.short_description || item.description) && setTooltip(item.id)}
                onMouseLeave={() => setTooltip(null)}
              >
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between gap-2"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    color: item.id === value ? 'var(--parchment-light)' : 'var(--ink-dark)',
                    background: item.id === value ? 'var(--ink-mid)' : '',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (item.id !== value) e.currentTarget.style.background = 'var(--parchment-mid)'; }}
                  onMouseLeave={e => { if (item.id !== value) e.currentTarget.style.background = ''; }}
                  onClick={() => { onChange(item.id); setOpen(false); setSearch(''); }}
                >
                  <span>{item.name}</span>
                  <span className="text-xs opacity-50 flex-shrink-0">{item.source}</span>
                </button>

                {/* Tooltip */}
                {tooltip === item.id && (item.short_description || item.description) && (
                  <div
                    className="absolute left-full top-0 ml-2 z-50 w-72 rounded-sm p-3 shadow-2xl"
                    style={{
                      background: 'var(--parchment-mid)',
                      border: '2px solid var(--parchment-dark)',
                      fontSize: '0.78rem',
                      color: 'var(--ink-mid)',
                      fontFamily: 'var(--font-body)',
                      maxHeight: '250px',
                      overflowY: 'auto',
                    }}
                  >
                    <div className="font-heading text-xs font-bold mb-1" style={{ color: 'var(--ink-dark)' }}>
                      {item.name}
                      {item.source && (
                        <span className="ml-2 opacity-60 font-normal">({item.source})</span>
                      )}
                    </div>
                    {item.short_description && (
                      <p className="mb-1">{convertImperialText(item.short_description)}</p>
                    )}
                    {item.description && (
                      <div
                        className="prose-sm"
                        dangerouslySetInnerHTML={{ __html: convertImperialText(item.description) }}
                      />
                    )}
                    {item.effects && item.effects.length > 0 && (
                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--parchment-dark)' }}>
                        <div className="font-heading text-xs font-bold mb-1" style={{ color: 'var(--ink-gold)' }}>Effects</div>
                        {item.effects.map((e, i) => (
                          <div key={i} className="text-xs opacity-80">
                            • {e.label || `${e.type}: ${e.target} ${e.value}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}