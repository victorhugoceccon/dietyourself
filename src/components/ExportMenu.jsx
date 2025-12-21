import { useState, useRef, useEffect } from 'react'
import { exportDietaAsTxt, copyDietaToClipboard, exportAsPng } from '../utils/pdfExport'
import './ExportMenu.css'

/**
 * ExportMenu - Menu dropdown para exportar dieta/dados.
 * 
 * @param {Object} dieta - Dados da dieta
 * @param {string} pacienteName - Nome do paciente
 * @param {React.RefObject} contentRef - Ref do elemento a exportar como imagem (opcional)
 */
function ExportMenu({ dieta, pacienteName = 'Paciente', contentRef }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copying, setCopying] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showToast, setShowToast] = useState('')
  const menuRef = useRef(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mostrar toast
  useEffect(() => {
    if (showToast) {
      const timeout = setTimeout(() => setShowToast(''), 3000)
      return () => clearTimeout(timeout)
    }
  }, [showToast])

  const handleExportTxt = () => {
    if (!dieta) return
    exportDietaAsTxt(dieta, pacienteName)
    setShowToast('Dieta exportada como TXT!')
    setIsOpen(false)
  }

  const handleCopyClipboard = async () => {
    if (!dieta) return
    setCopying(true)
    const success = await copyDietaToClipboard(dieta, pacienteName)
    setCopying(false)
    setShowToast(success ? 'Copiado para a área de transferência!' : 'Erro ao copiar')
    setIsOpen(false)
  }

  const handleExportImage = async () => {
    if (!contentRef?.current) {
      setShowToast('Nenhum conteúdo para exportar como imagem')
      return
    }

    setExporting(true)
    try {
      await exportAsPng(contentRef.current, `dieta_${pacienteName.toLowerCase().replace(/\s+/g, '_')}`)
      setShowToast('Imagem exportada com sucesso!')
    } catch (error) {
      setShowToast('Erro ao exportar imagem')
    } finally {
      setExporting(false)
      setIsOpen(false)
    }
  }

  const handleShare = async () => {
    if (!dieta) return

    const shareData = {
      title: `Dieta - ${pacienteName}`,
      text: `Confira meu plano alimentar! Meta: ${dieta.totalDiaKcal || 0} kcal/dia`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setShowToast('Compartilhado!')
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowToast('Erro ao compartilhar')
        }
      }
    } else {
      // Fallback: copiar para clipboard
      await handleCopyClipboard()
    }
    setIsOpen(false)
  }

  if (!dieta) return null

  return (
    <div className="export-menu" ref={menuRef}>
      <button 
        className="export-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Exportar dieta"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span>Exportar</span>
      </button>

      {isOpen && (
        <div className="export-dropdown">
          <button onClick={handleExportTxt} className="export-option">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Baixar como TXT</span>
          </button>

          <button onClick={handleCopyClipboard} disabled={copying} className="export-option">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{copying ? 'Copiando...' : 'Copiar para Clipboard'}</span>
          </button>

          {contentRef && (
            <button onClick={handleExportImage} disabled={exporting} className="export-option">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>{exporting ? 'Gerando...' : 'Salvar como Imagem'}</span>
            </button>
          )}

          <div className="export-divider" />

          <button onClick={handleShare} className="export-option">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Compartilhar</span>
          </button>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="export-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {showToast}
        </div>
      )}
    </div>
  )
}

export default ExportMenu


