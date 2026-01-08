/**
 * SectionHeader - Header padronizado para seções.
 * 
 * @param {string} title - Título da seção
 * @param {string} subtitle - Subtítulo opcional
 * @param {React.ReactNode} actions - Botões/ações à direita
 */
function SectionHeader({ 
  title, 
  subtitle,
  actions,
  className = '' 
}) {
  return (
    <div className={`lifefit-section-header ${className}`}>
      <div>
        <h2 className="lifefit-section-header__title">{title}</h2>
        {subtitle && (
          <p className="lifefit-section-header__subtitle">{subtitle}</p>
        )}
      </div>
      
      {actions && (
        <div className="lifefit-section-header__actions">
          {actions}
        </div>
      )}
    </div>
  )
}

export default SectionHeader


