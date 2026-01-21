import { useState, useRef, useEffect } from 'react'
import { Camera, FolderOpen, Confetti, Barbell, Bread, Drop } from '@phosphor-icons/react'
import { API_URL } from '../config/api'
import './PhotoMealCapture.css'

function PhotoMealCapture({ onClose, onSuccess, showCloseButton = true }) {
  const [stream, setStream] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [mealName, setMealName] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      setCameraReady(false)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Câmera traseira no mobile
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play()
            setCameraReady(true)
          } catch (playError) {
            console.warn('Não foi possível iniciar o vídeo automaticamente:', playError)
            setCameraReady(true)
          }
        }
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError('Não foi possível acessar a câmera. Você pode enviar uma foto da galeria.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      const photoData = canvas.toDataURL('image/jpeg', 0.8)
      setPhoto(photoData)
      stopCamera()
    }
  }

  const retakePhoto = () => {
    setPhoto(null)
    setResult(null)
    setError(null)
    startCamera()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhoto(reader.result)
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  const analyzePhoto = async () => {
    if (!photo) return

    setAnalyzing(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/photo-meals/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          photoBase64: photo,
          mealName: mealName || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar foto')
      }

      setResult({
        ...data.analysis,
        photoMeal: data.photoMeal
      })
    } catch (err) {
      console.error('Erro ao analisar foto:', err)
      setError(err.message || 'Erro ao analisar foto. Tente novamente.')
    } finally {
      setAnalyzing(false)
    }
  }

  const confirmMeal = async () => {
    if (onSuccess && result) {
      // Passar dados completos incluindo photoMeal
      onSuccess({
        ...result,
        photoUrl: photo,
        mealName: mealName || result.photoMeal?.mealName || null
      })
    }
    if (!result?.photoMeal) {
      // Se não tiver photoMeal, ainda chama onSuccess mas sem dados
      if (onSuccess) {
        onSuccess({
          ...result,
          photoUrl: photo,
          mealName: mealName || null
        })
      }
    }
    onClose()
  }

  return (
    <div className="photo-meal-capture-overlay" onClick={onClose}>
      <div className="photo-meal-capture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="photo-meal-capture-header">
          <h2>Adicionar Refeição por Foto</h2>
          {showCloseButton && (
            <button className="photo-meal-close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="photo-meal-capture-content">
          {!photo ? (
            <>
              {/* Preview da câmera */}
              <div className="photo-meal-camera-preview">
                {stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="photo-meal-video"
                    />
                    <div className="photo-meal-camera-overlay">
                      <div className="photo-meal-camera-guide">
                        <p>Posicione o prato dentro da área</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="photo-meal-camera-error">
                    <p>Não foi possível abrir a câmera.</p>
                    <p>Envie uma foto da galeria para continuar.</p>
                  </div>
                )}
              </div>
              
              {/* Botões FORA do preview para garantir visibilidade */}
              <div className="photo-meal-camera-actions">
                {stream && (
                  <button
                    className="photo-meal-capture-btn"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                  >
                    <Camera size={20} weight="regular" />
                    {cameraReady ? 'Tirar Foto' : 'Aguardando câmera...'}
                  </button>
                )}
                <label className="photo-meal-upload-btn">
                  <FolderOpen size={20} weight="regular" />
                  Carregar Foto
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              
              {error && (
                <div className="photo-meal-error">
                  {error}
                </div>
              )}
            </>
          ) : !result ? (
            // Foto capturada, aguardando análise
            <div className="photo-meal-preview">
              <img src={photo} alt="Foto capturada" className="photo-meal-preview-img" />
              <div className="photo-meal-preview-actions">
                <input
                  type="text"
                  placeholder="Nome da refeição (opcional)"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="photo-meal-name-input"
                />
                <div className="photo-meal-preview-buttons">
                  <button
                    className="photo-meal-retake-btn"
                    onClick={retakePhoto}
                    disabled={analyzing}
                  >
                    Refazer
                  </button>
                  <button
                    className="photo-meal-analyze-btn"
                    onClick={analyzePhoto}
                    disabled={analyzing}
                  >
                    {analyzing ? 'Analisando...' : 'Analisar Foto'}
                  </button>
                </div>
              </div>
              {error && (
                <div className="photo-meal-error">
                  {error}
                </div>
              )}
            </div>
          ) : (
            // Resultado da análise
            <div className="photo-meal-result">
              <div className="photo-meal-result-header">
                <h3>
                  <Confetti size={24} weight="fill" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Análise Completa!
                </h3>
                <img src={photo} alt="Foto analisada" className="photo-meal-result-img" />
              </div>

              <div className="photo-meal-result-summary">
                <div className="photo-meal-result-kcal">
                  <span className="photo-meal-result-label">Total de Calorias</span>
                  <span className="photo-meal-result-value">{Math.round(result.totalKcal)} kcal</span>
                </div>
              </div>

              <div className="photo-meal-result-macros">
                <div className="photo-meal-macro-item">
                  <span className="photo-meal-macro-icon">
                    <Barbell size={24} weight="fill" />
                  </span>
                  <div>
                    <span className="photo-meal-macro-value">{result.totalProtein}g</span>
                    <span className="photo-meal-macro-label">Proteína</span>
                  </div>
                </div>
                <div className="photo-meal-macro-item">
                  <span className="photo-meal-macro-icon">
                    <Bread size={24} weight="fill" />
                  </span>
                  <div>
                    <span className="photo-meal-macro-value">{result.totalCarbs}g</span>
                    <span className="photo-meal-macro-label">Carboidrato</span>
                  </div>
                </div>
                <div className="photo-meal-macro-item">
                  <span className="photo-meal-macro-icon">
                    <Drop size={24} weight="fill" />
                  </span>
                  <div>
                    <span className="photo-meal-macro-value">{result.totalFat}g</span>
                    <span className="photo-meal-macro-label">Gordura</span>
                  </div>
                </div>
              </div>

              <div className="photo-meal-result-foods">
                <h4>Alimentos Identificados:</h4>
                <ul className="photo-meal-foods-list">
                  {result.alimentos.map((alimento, index) => (
                    <li key={index} className="photo-meal-food-item">
                      <span className="photo-meal-food-name">{alimento.nome}</span>
                      <span className="photo-meal-food-quantity">{alimento.quantidade}</span>
                      <span className="photo-meal-food-kcal">{alimento.kcal} kcal</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="photo-meal-result-actions">
                <button
                  className="photo-meal-retake-btn"
                  onClick={retakePhoto}
                >
                  Refazer
                </button>
                <button
                  className="photo-meal-confirm-btn"
                  onClick={confirmMeal}
                >
                  Confirmar e Adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default PhotoMealCapture
