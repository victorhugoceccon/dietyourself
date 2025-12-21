/**
 * Skeleton - Componente de loading placeholder.
 * 
 * @param {string} variant - Tipo: 'text' | 'title' | 'avatar' | 'card' | 'button'
 * @param {number} count - Número de linhas (para texto)
 * @param {string} width - Largura customizada
 * @param {string} height - Altura customizada
 */
function Skeleton({ 
  variant = 'text', 
  count = 1, 
  width, 
  height,
  className = '' 
}) {
  const variantClass = `lifefit-skeleton--${variant}`
  
  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  if (count > 1 && variant === 'text') {
    return (
      <div className={`lifefit-skeleton-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className={`lifefit-skeleton ${variantClass}`}
            style={{ 
              ...style, 
              width: i === count - 1 ? '70%' : '100%' 
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div 
      className={`lifefit-skeleton ${variantClass} ${className}`}
      style={style}
    />
  )
}

export default Skeleton


