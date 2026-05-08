// components/BottomNav.jsx

/**
 * Fixed mobile bottom navigation bar.
 *
 * Props:
 *   items      – array of { key, label, icon, onClick, badge?, activeColor? }
 *   activeKey  – key of the currently active item
 */
function BottomNav({ items, activeKey }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      style={{
        background: 'rgba(10,19,33,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.09)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {items.map(item => {
        const isActive = activeKey === item.key;
        const accent = item.activeColor || '#ef4444';
        return (
          <button
            key={item.key}
            onClick={item.onClick}
            className="relative flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors"
            style={{ color: isActive ? accent : 'rgba(255,255,255,0.38)' }}
          >
            {/* Active top-bar indicator */}
            {isActive && (
              <span
                className="absolute top-0 rounded-b-full"
                style={{
                  left: '25%', right: '25%', height: 2,
                  background: accent,
                  boxShadow: `0 0 8px ${accent}`,
                }}
              />
            )}

            {/* Icon with optional badge */}
            <span className="relative">
              {item.icon}
              {item.badge > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] rounded-full bg-red-500 text-white flex items-center justify-center font-bold px-0.5"
                  style={{ fontSize: 9 }}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </span>

            <span className="text-[9px] font-bold tracking-wider uppercase leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
