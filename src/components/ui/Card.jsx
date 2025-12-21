/**
 * Card - Componente de card reutilizável.
 * 
 * @param {React.ReactNode} children - Conteúdo do card
 * @param {string} variant - Variante: 'default' | 'flat' | 'elevated' | 'bordered' | 'interactive'
 * @param {boolean} compact - Padding reduzido
 * @param {boolean} noPadding - Sem padding
 * @param {function} onClick - Handler de clique (torna o card interativo)
 */
function Card({ 
  children, 
  variant = 'default',
  compact = false,
  noPadding = false,
  onClick,
  className = '',
  ...props 
}) {
  const variantClass = variant !== 'default' ? `lifefit-card--${variant}` : ''
  const compactClass = compact ? 'lifefit-card--compact' : ''
  const noPaddingClass = noPadding ? 'lifefit-card--no-padding' : ''
  const interactiveClass = onClick ? 'lifefit-card--interactive' : ''

  const Component = onClick ? 'button' : 'div'

  return (
    <Component 
      className={`lifefit-card ${variantClass} ${compactClass} ${noPaddingClass} ${interactiveClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Card
