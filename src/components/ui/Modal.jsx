import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modal - Componente de modal reutilizável seguindo o design system LifeFit.
 * 
 * @param {boolean} isOpen - Controla se o modal está aberto
 * @param {function} onClose - Callback quando o modal é fechado
 * @param {string} title - Título do modal
 * @param {string} subtitle - Subtítulo opcional
 * @param {string} size - Tamanho: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {boolean} showClose - Mostrar botão de fechar
 * @param {boolean} closeOnOverlay - Fechar ao clicar no overlay
 * @param {React.ReactNode} children - Conteúdo do body
 * @param {React.ReactNode} footer - Conteúdo do footer (botões)
 * @param {boolean} footerSpread - Footer com justify-content: space-between
 */
function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  children,
  footer,
  footerSpread = false,
  className = ''
}) {
  // Fechar com ESC
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && onClose) {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const sizeClass = size !== 'md' ? `lifefit-modal--${size}` : ''
  const footerClass = footerSpread ? 'lifefit-modal__footer--spread' : ''

  const modalContent = (
    <div 
      className="lifefit-modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div 
        className={`lifefit-modal ${sizeClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        {(title || showClose) && (
          <header className="lifefit-modal__header">
            <div className="lifefit-modal__header-content">
              {title && (
                <h2 id="modal-title" className="lifefit-modal__title">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="lifefit-modal__subtitle">{subtitle}</p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                className="lifefit-modal__close"
                onClick={onClose}
                aria-label="Fechar modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>
        )}

        {/* Body */}
        <div className="lifefit-modal__body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer className={`lifefit-modal__footer ${footerClass}`}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default Modal


