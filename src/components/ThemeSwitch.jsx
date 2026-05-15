import { useTheme } from '../contexts/ThemeContext';

const SunIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2"  x2="12" y2="5"/>  <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/> <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
    <line x1="2" y1="12"  x2="5"  y2="12"/> <line x1="19" y1="12"  x2="22" y2="12"/>
    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/> <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

export default function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggle}
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      className="flex items-center gap-1.5 flex-shrink-0"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      {/* Sun */}
      <span style={{ color: isLight ? '#d97706' : 'rgba(255,255,255,0.3)', transition: 'color 0.25s' }}>
        <SunIcon />
      </span>

      {/* Track */}
      <div
        style={{
          position: 'relative', width: 34, height: 18, borderRadius: 9,
          background: isLight
            ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
            : 'linear-gradient(135deg,#6366f1,#4f46e5)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
          transition: 'background 0.3s',
          flexShrink: 0,
        }}
      >
        {/* Thumb */}
        <div
          style={{
            position: 'absolute', top: 1,
            left: isLight ? 15 : 1,
            width: 14, height: 14, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            transition: 'left 0.25s cubic-bezier(0.34,1.4,0.64,1)',
          }}
        />
      </div>

      {/* Moon */}
      <span style={{ color: isLight ? 'rgba(30,41,59,0.3)' : 'rgba(255,255,255,0.7)', transition: 'color 0.25s' }}>
        <MoonIcon />
      </span>
    </button>
  );
}
