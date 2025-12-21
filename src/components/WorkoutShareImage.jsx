import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'
import './WorkoutShareImage.css'

const STORY_W = 1080
const STORY_H = 1920

// Frases motivacionais
const FRASES_MOTIVACIONAIS = [
  "Disciplina é a ponte entre metas e conquistas",
  "Seu único limite é você mesmo",
  "O suor de hoje é o sucesso de amanhã",
  "Cada rep conta. Cada série importa.",
  "Transformando esforço em resultados",
  "Forte por dentro, forte por fora",
  "Consistência supera talento",
  "Sem atalhos, só dedicação",
  "Levante, treine, conquiste",
  "O difícil se torna hábito",
  "Mais um dia, mais uma vitória",
  "A dor é temporária, o orgulho é para sempre"
]

function WorkoutShareImage({ data, onClose, branding }) {
  const storyRef = useRef(null)
  const previewFrameRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  
  const [previewScale, setPreviewScale] = useState(0.35)
  const [mode, setMode] = useState('photo') // 'photo', 'camera', 'overlay', 'full'
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'user' ou 'environment'

  // Frase motivacional (fixa durante a sessão)
  const fraseMotivacional = useMemo(() => {
    return FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)]
  }, [])

  const brandColors = useMemo(() => ({
    primary: branding?.primaryColor || '#B9FF2C',
    secondary: branding?.accentColor || '#36D7FF',
    ultraNeon: '#B9FF2C',
    ultraCyan: '#36D7FF',
    ink: '#0B0F14'
  }), [branding])

  // Escala automática do preview
  useEffect(() => {
    const el = previewFrameRef.current
    if (!el) return

    const compute = () => {
      const rect = el.getBoundingClientRect()
      const scale = Math.min(rect.width / STORY_W, rect.height / STORY_H)
      const clamped = Math.max(0.18, Math.min(0.55, scale))
      setPreviewScale(clamped)
    }

    compute()
    const ro = new ResizeObserver(() => compute())
    ro.observe(el)
    window.addEventListener('orientationchange', compute)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', compute)
    }
  }, [])

  // Travar scroll do body
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsCameraActive(true)
        setMode('camera')
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões.')
      setMode('photo')
    }
  }, [facingMode])

  // Parar câmera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }, [])

  // Alternar câmera frontal/traseira
  const toggleCamera = useCallback(async () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [stopCamera])

  // Reiniciar câmera quando facingMode mudar
  useEffect(() => {
    if (mode === 'camera' && !isCameraActive) {
      startCamera()
    }
  }, [facingMode, mode, isCameraActive, startCamera])

  // Limpar câmera ao desmontar
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Capturar foto da câmera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Definir tamanho do canvas para proporção de story
    canvas.width = STORY_W
    canvas.height = STORY_H

    // Calcular crop para preencher o story (cover)
    const videoRatio = video.videoWidth / video.videoHeight
    const storyRatio = STORY_W / STORY_H

    let sx, sy, sw, sh

    if (videoRatio > storyRatio) {
      // Vídeo mais largo - cortar laterais
      sh = video.videoHeight
      sw = sh * storyRatio
      sx = (video.videoWidth - sw) / 2
      sy = 0
    } else {
      // Vídeo mais alto - cortar topo/baixo
      sw = video.videoWidth
      sh = sw / storyRatio
      sx = 0
      sy = (video.videoHeight - sh) / 2
    }

    // Se câmera frontal, espelhar
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, STORY_W, STORY_H)

    // Resetar transformação
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    const photoData = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedPhoto(photoData)
    stopCamera()
    setMode('photo')
  }, [facingMode, stopCamera])

  // Selecionar foto da galeria
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        canvas.width = STORY_W
        canvas.height = STORY_H

        // Calcular crop para preencher o story (cover)
        const imgRatio = img.width / img.height
        const storyRatio = STORY_W / STORY_H

        let sx, sy, sw, sh

        if (imgRatio > storyRatio) {
          sh = img.height
          sw = sh * storyRatio
          sx = (img.width - sw) / 2
          sy = 0
        } else {
          sw = img.width
          sh = sw / storyRatio
          sx = 0
          sy = (img.height - sh) / 2
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, STORY_W, STORY_H)
        const photoData = canvas.toDataURL('image/jpeg', 0.92)
        setCapturedPhoto(photoData)
        setMode('photo')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  // Formatação de duração
  const formatDuration = (minutes) => {
    if (!minutes || minutes < 1) return '1min'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  // Calcular streak
  const calcularStreak = () => {
    if (!data.diasTreinados) return data.treinosSemana || 1
    const diasTreinadosCount = Object.values(data.diasTreinados).filter(Boolean).length
    return diasTreinadosCount > 0 ? diasTreinadosCount : 1
  }

  const streak = calcularStreak()
  const treinosSemana = Object.values(data.diasTreinados || {}).filter(Boolean).length || data.treinosSemana || 1

  // Render para canvas com foto de fundo
  const renderToCanvas = async () => {
    if (!storyRef.current) throw new Error('Elemento não encontrado')

    // Criar canvas final
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = STORY_W
    finalCanvas.height = STORY_H
    const ctx = finalCanvas.getContext('2d')

    // Se tem foto, desenhar primeiro
    if (capturedPhoto && mode === 'photo') {
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = capturedPhoto
      })
      ctx.drawImage(img, 0, 0, STORY_W, STORY_H)
    } else if (mode === 'full') {
      // Fundo escuro
      ctx.fillStyle = '#0B0F14'
      ctx.fillRect(0, 0, STORY_W, STORY_H)
    }

    // Criar clone do overlay para renderizar
    const cloneWrapper = document.createElement('div')
    cloneWrapper.style.position = 'fixed'
    cloneWrapper.style.left = '-99999px'
    cloneWrapper.style.top = '0'
    cloneWrapper.style.width = `${STORY_W}px`
    cloneWrapper.style.height = `${STORY_H}px`
    cloneWrapper.style.pointerEvents = 'none'
    cloneWrapper.style.zIndex = '-1'

    const clone = storyRef.current.cloneNode(true)
    clone.style.transform = 'none'
    clone.style.transformOrigin = 'top left'
    clone.style.width = `${STORY_W}px`
    clone.style.height = `${STORY_H}px`

    cloneWrapper.appendChild(clone)
    document.body.appendChild(cloneWrapper)

    try {
      await new Promise(resolve => requestAnimationFrame(resolve))

      const overlayCanvas = await html2canvas(clone, {
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        width: STORY_W,
        height: STORY_H,
        logging: false,
        allowTaint: true
      })

      // Desenhar overlay sobre a foto
      ctx.drawImage(overlayCanvas, 0, 0)

      return finalCanvas
    } finally {
      document.body.removeChild(cloneWrapper)
    }
  }

  const handleDownload = async () => {
    try {
      const canvas = await renderToCanvas()
      const link = document.createElement('a')
      link.download = `treino-lifefit-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao gerar imagem:', error)
      alert('Erro ao gerar imagem: ' + (error?.message || ''))
    }
  }

  const handleShare = async () => {
    try {
      const canvas = await renderToCanvas()
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0))
      const file = new File([blob], 'treino-lifefit.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Meu treino no LifeFit',
          text: `Completei ${data.treinoNome} no LifeFit!`,
          files: [file]
        })
        return
      }

      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        alert('Imagem copiada!')
      } catch {
        await handleDownload()
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      await handleDownload()
    }
  }

  // Limpar foto
  const clearPhoto = () => {
    setCapturedPhoto(null)
    setMode('overlay')
  }

  const modal = (
    <div className="ws-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ws-backdrop" aria-hidden="true" />

      <button type="button" onClick={onClose} className="ws-close" aria-label="Fechar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Canvas oculto para processamento */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="ws-stage">
        {/* Seletor de modo */}
        <div className="ws-mode-selector" onClick={e => e.stopPropagation()}>
          <button 
            className={`ws-mode-btn ${mode === 'photo' || mode === 'camera' ? 'active' : ''}`}
            onClick={() => capturedPhoto ? setMode('photo') : startCamera()}
          >
            📷 Foto
          </button>
          <button 
            className={`ws-mode-btn ${mode === 'overlay' ? 'active' : ''}`}
            onClick={() => { stopCamera(); setCapturedPhoto(null); setMode('overlay') }}
          >
            ✨ Overlay
          </button>
          <button 
            className={`ws-mode-btn ${mode === 'full' ? 'active' : ''}`}
            onClick={() => { stopCamera(); setCapturedPhoto(null); setMode('full') }}
          >
            🎨 Completo
          </button>
        </div>

        <div className="ws-preview-frame" ref={previewFrameRef}>
          {/* Modo câmera */}
          {mode === 'camera' && (
            <div className="ws-camera-container" onClick={e => e.stopPropagation()}>
              <video 
                ref={videoRef} 
                className="ws-camera-video"
                playsInline 
                muted
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              {cameraError && (
                <div className="ws-camera-error">
                  <p>{cameraError}</p>
                  <button onClick={() => fileInputRef.current?.click()}>
                    Escolher da galeria
                  </button>
                </div>
              )}

              {/* Controles da câmera */}
              <div className="ws-camera-controls">
                <button className="ws-camera-btn ws-camera-btn-gallery" onClick={() => fileInputRef.current?.click()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
                
                <button className="ws-camera-btn ws-camera-btn-capture" onClick={capturePhoto}>
                  <div className="ws-capture-ring" />
                </button>
                
                <button className="ws-camera-btn ws-camera-btn-flip" onClick={toggleCamera}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Preview do story */}
          {mode !== 'camera' && (
            <div
              className="ws-story-preview"
              onClick={(e) => e.stopPropagation()}
              style={{ transform: `translateX(-50%) scale(${previewScale})` }}
            >
              <div 
                ref={storyRef} 
                className={`ws-story-v2 ${mode === 'full' ? 'ws-dark' : 'ws-transparent'}`}
              >
                {/* Foto de fundo (se houver) */}
                {capturedPhoto && mode === 'photo' && (
                  <div className="wsv2-photo-bg">
                    <img src={capturedPhoto} alt="" />
                    <div className="wsv2-photo-overlay" />
                  </div>
                )}

                {/* Background gradient (apenas modo full) */}
                {mode === 'full' && (
                  <div className="wsv2-bg" aria-hidden="true" />
                )}

                {/* Top Bar com logos */}
                <div className="wsv2-topbar">
                  <div className="wsv2-brand-row">
                    <div className="wsv2-personal-logo">
                      {branding?.logoUrl ? (
                        <img src={branding.logoUrl} alt="" className="wsv2-logo-img" />
                      ) : (
                        <div className="wsv2-logo-fallback">
                          {(branding?.brandName || 'P')[0]}
                        </div>
                      )}
                    </div>
                    
                    <div className="wsv2-personal-name">
                      {branding?.brandName || 'Personal Trainer'}
                    </div>

                    <div className="wsv2-lifefit-badge">
                      <span className="wsv2-lifefit-text">LifeFit</span>
                    </div>
                  </div>
                </div>

                {/* Main Dashboard */}
                <div className="wsv2-dashboard">
                  <div className="wsv2-status">
                    <div className="wsv2-status-dot" />
                    <span>TREINO CONCLUÍDO</span>
                  </div>

                  <h1 className="wsv2-title">{data.treinoNome}</h1>
                  {data.grupoMuscular && data.grupoMuscular !== data.treinoNome && (
                    <div className="wsv2-subtitle">{data.grupoMuscular}</div>
                  )}

                  {/* Stats Grid */}
                  <div className="wsv2-stats-grid">
                    <div className="wsv2-stat wsv2-stat-lg">
                      <div className="wsv2-stat-icon">⏱️</div>
                      <div className="wsv2-stat-value">{formatDuration(data.duracaoMinutos)}</div>
                      <div className="wsv2-stat-label">DURAÇÃO</div>
                    </div>
                    
                    <div className="wsv2-stat">
                      <div className="wsv2-stat-icon">💪</div>
                      <div className="wsv2-stat-value">{data.quantidadeExercicios}</div>
                      <div className="wsv2-stat-label">EXERCÍCIOS</div>
                    </div>
                    
                    <div className="wsv2-stat">
                      <div className="wsv2-stat-icon">🔄</div>
                      <div className="wsv2-stat-value">{data.totalSeries || 0}</div>
                      <div className="wsv2-stat-label">SÉRIES</div>
                    </div>
                  </div>

                  {/* Week Progress */}
                  <div className="wsv2-week">
                    <div className="wsv2-week-header">
                      <span className="wsv2-week-title">SEMANA</span>
                      <span className="wsv2-week-count">{treinosSemana}/7</span>
                    </div>
                    <div className="wsv2-week-dots">
                      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, i) => {
                        const dias = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO']
                        const treinado = data.diasTreinados?.[dias[i]]
                        return (
                          <div key={i} className={`wsv2-week-dot ${treinado ? 'active' : ''}`}>
                            <span>{dia}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Streak Badge */}
                  <div className="wsv2-streak">
                    <span className="wsv2-streak-fire">🔥</span>
                    <span className="wsv2-streak-num">{streak}</span>
                    <span className="wsv2-streak-text">{streak === 1 ? 'dia' : 'dias'} de treino</span>
                  </div>
                </div>

                {/* Quote */}
                <div className="wsv2-quote">
                  <div className="wsv2-quote-mark">"</div>
                  <p className="wsv2-quote-text">{fraseMotivacional}</p>
                </div>

                {/* Footer */}
                <div className="wsv2-footer">
                  <div className="wsv2-footer-date">{data.data}</div>
                  <div className="wsv2-footer-powered">
                    Powered by <strong>LifeFit</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {mode !== 'camera' && (
          <div className="ws-actions" onClick={(e) => e.stopPropagation()}>
            {capturedPhoto && mode === 'photo' && (
              <button type="button" className="ws-btn ws-btn-ghost ws-btn-small" onClick={clearPhoto}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6L18 18" />
                </svg>
                Remover foto
              </button>
            )}
            
            {!capturedPhoto && mode !== 'full' && (
              <button type="button" className="ws-btn ws-btn-ghost" onClick={startCamera}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Tirar foto
              </button>
            )}
            
            <button type="button" className="ws-btn ws-btn-ghost" onClick={handleDownload}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Baixar
            </button>
            
            <button
              type="button"
              className="ws-btn ws-btn-primary"
              onClick={handleShare}
              style={{ background: `linear-gradient(135deg, ${brandColors.ultraNeon} 0%, ${brandColors.ultraCyan} 100%)` }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Compartilhar
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default WorkoutShareImage
