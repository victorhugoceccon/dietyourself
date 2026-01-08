/**
 * Chip - Tag selecionável/removível.
 * 
 * @param {string} label - Texto do chip
 * @param {boolean} selected - Estado selecionado
 * @param {boolean} removable - Mostra botão de remover
 * @param {function} onClick - Handler de clique
 * @param {function} onRemove - Handler de remoção
 */
function Chip({ 
  label, 
  selected = false,
  removable = false,
  onClick,
  onRemove,
  className = '' 
}) {
  return (
    <button 
      type="button"
      className={`chip ${selected ? 'chip--selected' : ''} ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: '0.35rem 0.75rem',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        color: selected ? 'var(--on-primary)' : 'var(--text-primary)',
        background: selected ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
        border: `1px solid ${selected ? 'transparent' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)'
      }}
    >
      {label}
      {removable && onRemove && (
        <span 
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            marginLeft: '0.25rem',
            borderRadius: '50%',
            background: selected ? 'rgba(0,0,0,0.2)' : 'var(--border-color)',
            cursor: 'pointer'
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </span>
      )}
    </button>
  )
}

export default Chip
