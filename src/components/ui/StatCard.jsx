/**
 * StatCard - Card de estatística/KPI.
 * 
 * @param {string} label - Rótulo da métrica
 * @param {string|number} value - Valor principal
 * @param {string} change - Texto de mudança (ex: "+5%")
 * @param {boolean} positive - Se a mudança é positiva
 * @param {React.ReactNode} icon - Ícone opcional
 * @param {boolean} highlight - Destaque visual
 */
function StatCard({ 
  label, 
  value, 
  change,
  positive,
  icon,
  highlight = false,
  className = '' 
}) {
  const highlightClass = highlight ? 'lifefit-stat-card--highlight' : ''
  const changeClass = change 
    ? positive 
      ? 'lifefit-stat-card__change--positive' 
      : 'lifefit-stat-card__change--negative'
    : ''

  return (
    <div className={`lifefit-stat-card ${highlightClass} ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="lifefit-stat-card__label">{label}</span>
        {icon && (
          <span style={{ color: '#90c22c', opacity: 0.8 }}>
            {icon}
          </span>
        )}
      </div>
      
      <span className="lifefit-stat-card__value">{value}</span>
      
      {change && (
        <span className={`lifefit-stat-card__change ${changeClass}`}>
          {positive ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
          {change}
        </span>
      )}
    </div>
  )
}

export default StatCard


