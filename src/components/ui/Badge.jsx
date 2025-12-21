/**
 * Badge - Indicador visual pequeno.
 * 
 * @param {React.ReactNode} children - Conteúdo
 * @param {string} variant - 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral'
 * @param {React.ReactNode} icon - Ícone opcional
 */
function Badge({ 
  children, 
  variant = 'neutral',
  icon,
  className = '' 
}) {
  const variantClass = `lifefit-badge--${variant}`

  return (
    <span className={`lifefit-badge ${variantClass} ${className}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
