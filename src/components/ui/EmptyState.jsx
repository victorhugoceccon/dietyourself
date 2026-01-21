import { Question } from '@phosphor-icons/react'

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
  const defaultIcon = <Question size={48} weight="duotone" />

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


