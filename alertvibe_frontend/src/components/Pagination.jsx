// components/Pagination.jsx
const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/**
 * Reusable pagination bar.
 * Props:
 *   page       – current 1-based page number
 *   totalPages – total number of pages
 *   onChange   – (newPage: number) => void
 *   pageSize   – items per page (for display)
 *   total      – total item count (for display)
 */
const Pagination = ({ page, totalPages, onChange, pageSize, total }) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  // Build page number list with ellipsis
  const pages = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
    transition: 'all 0.15s',
  };
  const btnActive = {
    ...btnBase,
    background: 'rgba(99,102,241,0.35)',
    border: '1px solid rgba(99,102,241,0.6)',
    color: '#fff',
  };
  const btnDisabled = { ...btnBase, opacity: 0.3, cursor: 'default' };

  return (
    <div className="flex items-center justify-between px-6 py-3"
         style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-white/40 text-xs hidden sm:block">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1 mx-auto sm:mx-0">
        {/* Prev */}
        <button
          style={page === 1 ? btnDisabled : btnBase}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`}
                  style={{ ...btnBase, cursor: 'default', background: 'transparent', border: 'none' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              style={p === page ? btnActive : btnBase}
              onClick={() => onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          style={page === totalPages ? btnDisabled : btnBase}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
