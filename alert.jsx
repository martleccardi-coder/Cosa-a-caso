import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

export const THEMES = {
  parchment: {
    label: 'Parchment',
    vars: {
      '--background': '38 45% 92%',
      '--foreground': '25 30% 12%',
      '--parchment-light': '#F2E6C9',
      '--parchment-mid': '#E8D5A3',
      '--parchment-dark': '#C8A96E',
      '--parchment-deep': '#B8922A',
      '--ink-dark': '#1C1007',
      '--ink-mid': '#3D2B1F',
      '--ink-red': '#8B1A1A',
      '--ink-gold': '#7A5C1E',
    }
  },
  dark_parchment: {
    label: 'Dark Parchment',
    vars: {
      '--parchment-light': '#2A2018',
      '--parchment-mid': '#35291C',
      '--parchment-dark': '#5C4830',
      '--parchment-deep': '#8C6A3A',
      '--ink-dark': '#F0DFB0',
      '--ink-mid': '#D4BC80',
      '--ink-red': '#E05050',
      '--ink-gold': '#C8A96E',
    }
  },
  aged_paper: {
    label: 'Aged Paper',
    vars: {
      '--parchment-light': '#EDE0C4',
      '--parchment-mid': '#D4C49A',
      '--parchment-dark': '#A88C5A',
      '--parchment-deep': '#7A5C2A',
      '--ink-dark': '#0A0804',
      '--ink-mid': '#2A1C0C',
      '--ink-red': '#7A1010',
      '--ink-gold': '#5A3C0A',
    }
  },
  print: {
    label: 'Clean Print',
    vars: {
      '--parchment-light': '#FFFFFF',
      '--parchment-mid': '#F5F5F5',
      '--parchment-dark': '#CCCCCC',
      '--parchment-deep': '#999999',
      '--ink-dark': '#000000',
      '--ink-mid': '#333333',
      '--ink-red': '#CC0000',
      '--ink-gold': '#666666',
    }
  },
};

const STORAGE_KEY = 'dnd-forge-theme';

export function applyTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
  localStorage.setItem(STORAGE_KEY, themeId);
}

export function loadSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'parchment';
  applyTheme(saved);
  return saved;
}

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState(() => localStorage.getItem(STORAGE_KEY) || 'parchment');
  const [open, setOpen] = useState(false);

  const selectTheme = (id) => {
    setCurrent(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="icon-action-btn"
        style={{ color: 'var(--parchment-mid)', minWidth: 36, minHeight: 36, padding: 6 }}
        onClick={() => setOpen(o => !o)}
        title="Change theme"
      >
        <Palette size={16} />
      </button>
      {open && (
        <div
          className="parchment-box"
          style={{
            position: 'absolute', right: 0, top: '110%', zIndex: 100,
            minWidth: 160, padding: 8, background: 'var(--parchment-light)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {Object.entries(THEMES).map(([id, theme]) => (
            <button
              key={id}
              onClick={() => selectTheme(id)}
              className="w-full text-left px-3 py-1.5 rounded mb-0.5 transition-all text-sm"
              style={{
                fontFamily: 'var(--font-body)',
                background: current === id ? 'var(--ink-mid)' : 'transparent',
                color: current === id ? 'var(--parchment-light)' : 'var(--ink-dark)',
              }}
            >
              {current === id && '✓ '}{theme.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}