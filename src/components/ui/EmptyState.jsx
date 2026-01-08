/**
 * EmptyState - Componente para estados vazios de listas e páginas.
 * 
 * @param {string} title - Título principal
 * @param {string} description - Descrição/instrução
 * @param {React.ReactNode} icon - Ícone SVG (opcional)
 * @param {React.ReactNode} action - Botão ou ação (opcional)
 */
function EmptyState({ 
  title, 
  description, 
  icon,
  action,
  className = '' 
}) {
  const defaultIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )

  return (
    <div className={`lifefit-empty-state ${className}`}>
      <div className="lifefit-empty-state__icon">
        {icon || defaultIcon}
      </div>
      
      {title && (
        <h3 className="lifefit-empty-state__title">{title}</h3>
      )}
      
      {description && (
        <p className="lifefit-empty-state__description">{description}</p>
      )}
      
      {action && (
        <div className="lifefit-empty-state__action">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState


