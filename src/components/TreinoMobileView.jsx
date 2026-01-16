import { useEffect, useState, useRef } from 'react'
import { API_URL } from '../config/api'
import './TreinoMobileView.css'

function TreinoMobileView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [prescricao, setPrescricao] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [fotoFrente, setFotoFrente] = useState(null)
  const [fotoCostas, setFotoCostas] = useState(null)
  const [previewFrente, setPreviewFrente] = useState(null)
  const [previewCostas, setPreviewCostas] = useState(null)
  const [generatingWorkout, setGeneratingWorkout] = useState(false)
  const [workoutError, setWorkoutError] = useState('')
  const [expandedWorkout, setExpandedWorkout] = useState(null)
  const [savedPhotos, setSavedPhotos] = useState({ frente: null, costas: null, date: null })

  // Estados para execução de treino
  const [weekData, setWeekData] = useState([])
  const [weekStreak, setWeekStreak] = useState(0)
  const [activeTreino, setActiveTreino] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [finishedTreinoData, setFinishedTreinoData] = useState(null)
  const [feedback, setFeedback] = useState({
    intensidade: 7,
    dificuldade: 5,
    satisfacao: 8,
    completouTreino: true,
    observacao: '',
    motivoIncompleto: ''
  })

  const timerRef = useRef(null)
  const shareCardRef = useRef(null)

  useEffect(() => {
    loadData()
    loadWeekData()
    checkActiveTreino()
    const saved = localStorage.getItem('giba_workout_photos')
    if (saved) {
      try {
        setSavedPhotos(JSON.parse(saved))
      } catch (e) {
        console.warn('Erro ao carregar fotos salvas')
      }
    }
  }, [])

  // Timer para treino em andamento
  useEffect(() => {
    if (activeTreino) {
      const startTime = new Date(activeTreino.startTime).getTime()
      
      timerRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000)
        setElapsedTime(elapsed)
      }, 1000)

      return () => clearInterval(timerRef.current)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsedTime(0)
    }
  }, [activeTreino])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/prescricoes-treino`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erro ao carregar treinos')
      const data = await res.json()
      const lista = Array.isArray(data.prescricoes) ? data.prescricoes : []
      const ativo = lista.find(p => p.ativo !== false) || lista[0] || null
      setPrescricao(ativo || null)

      if (ativo?.analysisJson) {
        try {
          const parsed = typeof ativo.analysisJson === 'string' ? JSON.parse(ativo.analysisJson) : ativo.analysisJson
          setAnalysis(parsed)
        } catch (err) {
          console.warn('Não foi possível parsear analysisJson', err)
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadWeekData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/workout/week`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWeekData(data.weekData || [])
        setWeekStreak(data.streak || 0)
      }
    } catch (err) {
      console.error('Erro ao carregar semana:', err)
    }
  }

  const checkActiveTreino = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/workout/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.active) {
          setActiveTreino(data.treino)
          // Expandir o treino ativo
          const workouts = analysis?.workouts || analysis?.divisoes || []
          const idx = workouts.findIndex(w => w.dayLabel === data.treino.divisaoNome || w.dayName === data.treino.divisaoNome)
          if (idx >= 0) setExpandedWorkout(idx)
        }
      }
    } catch (err) {
      console.error('Erro ao verificar treino ativo:', err)
    }
  }

  const handleStartWorkout = async (divisaoId, workoutIndex) => {
    if (!prescricao) return
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/workout/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prescricaoId: prescricao.id,
          divisaoId
        })
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.treinoId) {
          // Já tem treino em andamento
          await checkActiveTreino()
        }
        throw new Error(data.error || 'Erro ao iniciar treino')
      }

      setActiveTreino(data.treino)
      setExpandedWorkout(workoutIndex)
      
    } catch (err) {
      console.error('Erro ao iniciar treino:', err)
      alert(err.message)
    }
  }

  const handleFinishWorkout = async () => {
    if (!activeTreino) return
    setShowFeedbackModal(true)
  }

  const submitFeedbackAndFinish = async () => {
    if (!activeTreino) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/workout/finish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          treinoId: activeTreino.id,
          feedback: {
            intensidade: feedback.intensidade,
            dificuldade: feedback.dificuldade,
            satisfacao: feedback.satisfacao,
            completouTreino: feedback.completouTreino,
            observacao: feedback.observacao,
            motivoIncompleto: feedback.motivoIncompleto
          }
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao finalizar treino')

      // Salvar dados para o share card
      setFinishedTreinoData({
        ...data.treino,
        streak: data.weekStats?.streak || 1,
        feedback: feedback
      })

      setShowFeedbackModal(false)
      setShowShareCard(true)
      setActiveTreino(null)
      loadWeekData()

      // Reset feedback
      setFeedback({
        intensidade: 7,
        dificuldade: 5,
        satisfacao: 8,
        completouTreino: true,
        observacao: '',
        motivoIncompleto: ''
      })

    } catch (err) {
      console.error('Erro ao finalizar treino:', err)
      alert(err.message)
    }
  }

  const handleCancelWorkout = async () => {
    if (!activeTreino) return
    if (!confirm('Tem certeza que deseja cancelar este treino?')) return

    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/workout/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ treinoId: activeTreino.id })
      })
      setActiveTreino(null)
      setExpandedWorkout(null)
    } catch (err) {
      console.error('Erro ao cancelar treino:', err)
    }
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`
  }

  const getDayOfWeekName = (dateStr) => {
    const date = new Date(dateStr)
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return dias[date.getDay()]
  }

  const handlePhotoSelect = (type, file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === 'frente') {
      setFotoFrente(file)
      setPreviewFrente(url)
    } else {
      setFotoCostas(file)
      setPreviewCostas(url)
    }
  }

  const handleGenerateWorkout = async () => {
    if (!fotoFrente || !fotoCostas) {
      setWorkoutError('Envie as duas fotos para continuar')
      return
    }
    setWorkoutError('')
    setGeneratingWorkout(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('fotoFrente', fotoFrente)
      formData.append('fotoCostas', fotoCostas)

      // Salvar fotos no localStorage
      const reader1 = new FileReader()
      const reader2 = new FileReader()

      reader1.onload = (e) => {
        const photoData = {
          ...savedPhotos,
          frente: e.target.result,
          date: new Date().toISOString()
        }
        reader2.onload = (e2) => {
          photoData.costas = e2.target.result
          localStorage.setItem('giba_workout_photos', JSON.stringify(photoData))
          setSavedPhotos(photoData)
        }
        reader2.readAsDataURL(fotoCostas)
      }
      reader1.readAsDataURL(fotoFrente)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 660000)

      const response = await fetch(`${API_URL}/workout/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao criar seu treino')
      }

      setFotoFrente(null)
      setFotoCostas(null)
      setPreviewFrente(null)
      setPreviewCostas(null)
      await loadData()
    } catch (err) {
      console.error('Erro ao gerar treino:', err)
      setWorkoutError(err.message || 'Algo deu errado. Tente novamente.')
    } finally {
      setGeneratingWorkout(false)
    }
  }

  // Download share card como imagem
  const downloadShareCard = async () => {
    if (!shareCardRef.current) return
    
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0f1419',
        scale: 2,
        useCORS: true
      })
      
      const link = document.createElement('a')
      link.download = `treino-giba-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
      alert('Erro ao gerar imagem. Tente tirar um print da tela.')
    }
  }

  const workouts = analysis?.workouts || analysis?.divisoes || []
  const inputsSummary = analysis?.inputsSummary || {}
  const userInfo = analysis?.user || {}
  const progression = analysis?.progression || {}
  const notesForUser = analysis?.notesForUser || []

  const formatRest = (rest) => {
    if (!rest) return null
    const num = typeof rest === 'number' ? rest : parseInt(rest)
    if (isNaN(num)) return rest
    if (num >= 60) {
      const min = Math.floor(num / 60)
      const sec = num % 60
      return sec > 0 ? `${min}min ${sec}s` : `${min} minuto${min > 1 ? 's' : ''}`
    }
    return `${num} segundos`
  }

  // Modal de Feedback
  const renderFeedbackModal = () => (
    <div className="giba-modal-overlay">
      <div className="giba-modal giba-feedback-modal">
        <div className="giba-modal-header">
          <h2>🎉 Treino concluído!</h2>
          <p>Como foi?</p>
        </div>

        <div className="giba-modal-body">
          <div className="giba-feedback-field">
            <label>Intensidade</label>
            <div className="giba-rating-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={feedback.intensidade}
                onChange={(e) => setFeedback({ ...feedback, intensidade: parseInt(e.target.value) })}
              />
              <div className="giba-rating-labels">
                <span>Leve</span>
                <span className="giba-rating-value">{feedback.intensidade}</span>
                <span>Pesado</span>
              </div>
            </div>
          </div>

          <div className="giba-feedback-field">
            <label>Satisfação</label>
            <div className="giba-rating-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={feedback.satisfacao}
                onChange={(e) => setFeedback({ ...feedback, satisfacao: parseInt(e.target.value) })}
              />
              <div className="giba-rating-labels">
                <span>😕</span>
                <span className="giba-rating-value">{feedback.satisfacao}</span>
                <span>🤩</span>
              </div>
            </div>
          </div>

          <div className="giba-feedback-field">
            <label>Completou tudo?</label>
            <div className="giba-toggle-group">
              <button
                className={`giba-toggle-btn ${feedback.completouTreino ? 'active' : ''}`}
                onClick={() => setFeedback({ ...feedback, completouTreino: true })}
              >
                ✓ Sim
              </button>
              <button
                className={`giba-toggle-btn ${!feedback.completouTreino ? 'active' : ''}`}
                onClick={() => setFeedback({ ...feedback, completouTreino: false })}
              >
                Não
              </button>
            </div>
          </div>

          <div className="giba-feedback-field">
            <label>Observação (opcional)</label>
            <textarea
              value={feedback.observacao}
              onChange={(e) => setFeedback({ ...feedback, observacao: e.target.value })}
              placeholder="Algo a comentar?"
            />
          </div>
        </div>

        <div className="giba-modal-footer">
          <button className="giba-btn-secondary" onClick={() => setShowFeedbackModal(false)}>
            Voltar
          </button>
          <button className="giba-btn-primary" onClick={submitFeedbackAndFinish}>
            Finalizar
          </button>
        </div>
      </div>
    </div>
  )

  // Share Card (Imagem Instagramável)
  const renderShareCard = () => (
    <div className="giba-modal-overlay">
      <div className="giba-modal giba-share-modal">
        <div className="giba-modal-header">
          <h2>🎉 Parabéns!</h2>
          <p>Compartilhe seu treino nas redes sociais</p>
        </div>

        <div className="giba-share-card-wrapper">
          <div ref={shareCardRef} className="giba-share-card">
            {/* Background gradient */}
            <div className="giba-share-bg"></div>
            
            {/* Content */}
            <div className="giba-share-content">
              {/* Logo */}
              <div className="giba-share-logo">
                <span className="giba-share-logo-icon">🔥</span>
                <span className="giba-share-logo-text">GIBA</span>
              </div>

              {/* Badge de conclusão */}
              <div className="giba-share-badge">
                <span>✓ TREINO CONCLUÍDO</span>
              </div>

              {/* Nome do treino */}
              <h2 className="giba-share-workout-name">
                {finishedTreinoData?.divisaoNome || 'Treino do dia'}
              </h2>

              {/* Dia da semana */}
              <p className="giba-share-day">
                {finishedTreinoData?.diaSemana ? getDayOfWeekName(finishedTreinoData.startTime) : 'Hoje'}
              </p>

              {/* Stats */}
              <div className="giba-share-stats">
                <div className="giba-share-stat">
                  <span className="giba-share-stat-value">
                    {finishedTreinoData?.duracaoMinutos ? formatDuration(finishedTreinoData.duracaoMinutos) : '--'}
                  </span>
                  <span className="giba-share-stat-label">Duração</span>
                </div>
                <div className="giba-share-stat">
                  <span className="giba-share-stat-value">{finishedTreinoData?.streak || 1}x</span>
                  <span className="giba-share-stat-label">Esta semana</span>
                </div>
                <div className="giba-share-stat">
                  <span className="giba-share-stat-value">{feedback.intensidade}/10</span>
                  <span className="giba-share-stat-label">Intensidade</span>
                </div>
              </div>

              {/* Streak visual */}
              <div className="giba-share-streak">
                <div className="giba-share-streak-title">
                  <span>🔥 Sequência da semana</span>
                </div>
                <div className="giba-share-streak-days">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div
                      key={i}
                      className={`giba-share-streak-day ${weekData[i]?.completed ? 'done' : ''} ${weekData[i]?.isToday ? 'today' : ''}`}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mensagem motivacional */}
              <div className="giba-share-message">
                {finishedTreinoData?.streak >= 5 ? (
                  <p>💪 Semana de campeão! Continue assim!</p>
                ) : finishedTreinoData?.streak >= 3 ? (
                  <p>🔥 Você está on fire! Constância é a chave!</p>
                ) : (
                  <p>✨ Cada treino conta. Você está evoluindo!</p>
                )}
              </div>

              {/* Data */}
              <div className="giba-share-date">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className="giba-modal-footer">
          <button className="giba-btn-secondary" onClick={() => setShowShareCard(false)}>
            Fechar
          </button>
          <button className="giba-btn-primary" onClick={downloadShareCard}>
            📲 Salvar imagem
          </button>
        </div>
      </div>
    </div>
  )

  // Calendário semanal
  const renderWeekCalendar = () => (
    <section className="giba-section giba-week-section">
      <div className="giba-section-header">
        <h2 className="giba-section-title">Sua semana</h2>
        {weekStreak > 0 && (
          <span className="giba-streak-badge">🔥 {weekStreak}x</span>
        )}
      </div>
      <p className="giba-section-desc">
        Cada treino finalizado marca um dia. Continue sua sequência!
      </p>

      <div className="giba-week-grid">
        {weekData.map((day, idx) => (
          <div
            key={idx}
            className={`giba-week-day ${day.completed ? 'completed' : ''} ${day.isToday ? 'today' : ''}`}
          >
            <span className="giba-week-day-name">{day.day}</span>
            <div className="giba-week-day-status">
              {day.completed ? '✓' : day.isToday ? '•' : ''}
            </div>
          </div>
        ))}
      </div>

      {weekStreak > 0 && (
        <div className="giba-week-summary">
          <span>{weekStreak} treino{weekStreak > 1 ? 's' : ''} esta semana</span>
          <span className="giba-week-motivational">
            {weekStreak >= 5 ? '🏆 Semana épica!' : weekStreak >= 3 ? '💪 Continue assim!' : '🚀 Boa sequência!'}
          </span>
        </div>
      )}
    </section>
  )

  // Estado vazio
  const renderEmptyState = () => (
    <div className="giba-page">
      <div className="giba-welcome-hero">
        <div className="giba-logo-badge">
          <span className="giba-logo-icon">🔥</span>
          <span className="giba-logo-text">GIBA</span>
        </div>
        <h1 className="giba-welcome-title">Vamos criar seu treino personalizado</h1>
        <p className="giba-welcome-sub">
          Em poucos minutos você terá um plano completo, feito especialmente para o seu corpo e seus objetivos.
        </p>
      </div>

      <section className="giba-section">
        <div className="giba-section-header">
          <span className="giba-step-badge">Passo 1</span>
          <h2 className="giba-section-title">Envie suas fotos</h2>
        </div>
        <p className="giba-section-desc">
          Tire uma foto de frente e uma de costas. Isso ajuda a identificar seus pontos fortes e o que podemos melhorar juntos.
        </p>

        <div className="giba-upload-area">
          <label className={`giba-upload-card ${previewFrente ? 'has-photo' : ''} ${generatingWorkout ? 'scanning' : ''}`}>
            {generatingWorkout && previewFrente && (
              <div className="giba-scan-overlay">
                <div className="giba-scan-line"></div>
                <span>Analisando...</span>
              </div>
            )}
            {previewFrente ? (
              <img src={previewFrente} alt="Foto frontal" className="giba-upload-img" />
            ) : (
              <div className="giba-upload-empty">
                <span className="giba-upload-icon">📸</span>
                <span className="giba-upload-label">Foto de frente</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handlePhotoSelect('frente', e.target.files[0])} disabled={generatingWorkout} />
          </label>

          <label className={`giba-upload-card ${previewCostas ? 'has-photo' : ''} ${generatingWorkout ? 'scanning' : ''}`}>
            {generatingWorkout && previewCostas && (
              <div className="giba-scan-overlay">
                <div className="giba-scan-line"></div>
                <span>Analisando...</span>
              </div>
            )}
            {previewCostas ? (
              <img src={previewCostas} alt="Foto de costas" className="giba-upload-img" />
            ) : (
              <div className="giba-upload-empty">
                <span className="giba-upload-icon">📸</span>
                <span className="giba-upload-label">Foto de costas</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => handlePhotoSelect('costas', e.target.files[0])} disabled={generatingWorkout} />
          </label>
        </div>

        {workoutError && <div className="giba-error-msg">{workoutError}</div>}

        {generatingWorkout && (
          <div className="giba-progress-section">
            <div className="giba-progress-bar">
              <div className="giba-progress-fill"></div>
            </div>
            <p className="giba-progress-text">Criando seu treino personalizado... isso pode levar alguns minutos</p>
          </div>
        )}

        <button
          className="giba-btn-primary"
          onClick={handleGenerateWorkout}
          disabled={generatingWorkout || !fotoFrente || !fotoCostas}
        >
          {generatingWorkout ? 'Criando seu treino...' : 'Criar meu treino'}
        </button>
      </section>

      <section className="giba-info-section">
        <div className="giba-info-card">
          <span className="giba-info-icon">🎯</span>
          <div>
            <h3>Treino sob medida</h3>
            <p>Baseado nas suas fotos, identificamos seus pontos fortes e áreas para desenvolver.</p>
          </div>
        </div>
        <div className="giba-info-card">
          <span className="giba-info-icon">📊</span>
          <div>
            <h3>Acompanhe sua evolução</h3>
            <p>Suas fotos ficam salvas para comparar com check-ins futuros.</p>
          </div>
        </div>
        <div className="giba-info-card">
          <span className="giba-info-icon">💪</span>
          <div>
            <h3>Resultados reais</h3>
            <p>Treinos equilibrados que respeitam seu corpo e maximizam resultados.</p>
          </div>
        </div>
      </section>
    </div>
  )

  // Vista com treino
  const renderWorkoutView = () => (
    <div className="giba-page">
      {/* Timer flutuante quando treino ativo */}
      {activeTreino && (
        <div className="giba-active-timer">
          <div className="giba-timer-content">
            <span className="giba-timer-label">⏱️ Treino em andamento</span>
            <span className="giba-timer-value">{formatTime(elapsedTime)}</span>
          </div>
          <div className="giba-timer-actions">
            <button className="giba-timer-btn cancel" onClick={handleCancelWorkout}>
              ✕
            </button>
            <button className="giba-timer-btn finish" onClick={handleFinishWorkout}>
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="giba-hero">
        <div className="giba-hero-badge">
          <span className="giba-logo-icon">🔥</span>
          <span>GIBA</span>
        </div>
        <h1 className="giba-hero-title">
          {userInfo.objective || 'Seu plano de treino'}
        </h1>
        {userInfo.frequenciaAtividade && (
          <p className="giba-hero-freq">{userInfo.frequenciaAtividade}</p>
        )}
      </div>

      {/* Calendário semanal */}
      {weekData.length > 0 && renderWeekCalendar()}

      {/* Análise Visual */}
      {(inputsSummary.postureSummary || inputsSummary.visualNotes?.length > 0) && (
        <section className="giba-section">
          <div className="giba-section-header">
            <h2 className="giba-section-title">O que observamos em você</h2>
          </div>
          
          {inputsSummary.postureSummary && (
            <div className="giba-insight-card">
              <span className="giba-insight-icon">🧍</span>
              <div>
                <h4>Sua postura</h4>
                <p>{inputsSummary.postureSummary}</p>
              </div>
            </div>
          )}

          {inputsSummary.visualNotes?.length > 0 && (
            <div className="giba-notes-list">
              {inputsSummary.visualNotes.map((note, idx) => (
                <div className="giba-note-item" key={idx}>
                  <span className="giba-note-bullet">•</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Pontos de foco */}
      {(inputsSummary.priorityMuscleGroups?.length > 0 || inputsSummary.musclesWeakPoints?.length > 0) && (
        <section className="giba-section">
          <div className="giba-section-header">
            <h2 className="giba-section-title">Onde vamos focar</h2>
          </div>
          <p className="giba-section-desc">
            Identificamos algumas áreas que merecem atenção especial no seu treino.
          </p>

          {inputsSummary.priorityMuscleGroups?.length > 0 && (
            <div className="giba-focus-group">
              <h4 className="giba-focus-label">Prioridades</h4>
              <div className="giba-tags">
                {inputsSummary.priorityMuscleGroups.map((m, idx) => (
                  <span className="giba-tag priority" key={idx}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {inputsSummary.musclesWeakPoints?.length > 0 && (
            <div className="giba-focus-group">
              <h4 className="giba-focus-label">Para desenvolver</h4>
              <div className="giba-tags">
                {inputsSummary.musclesWeakPoints.map((m, idx) => (
                  <span className="giba-tag weak" key={idx}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {inputsSummary.musclesGoodDevelopment?.length > 0 && (
            <div className="giba-focus-group">
              <h4 className="giba-focus-label">Seus pontos fortes</h4>
              <div className="giba-tags">
                {inputsSummary.musclesGoodDevelopment.map((m, idx) => (
                  <span className="giba-tag strong" key={idx}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Lista de treinos */}
      {workouts.length > 0 && (
        <section className="giba-section">
          <div className="giba-section-header">
            <h2 className="giba-section-title">Seus treinos da semana</h2>
          </div>
          <p className="giba-section-desc">
            {workouts.length} treinos diferentes. Toque em um treino para expandir e iniciar.
          </p>

          <div className="giba-workouts-list">
            {workouts.map((w, idx) => {
              const divisaoId = prescricao?.divisoes?.[idx]?.id
              const isActive = activeTreino && activeTreino.divisaoNome === (w.dayName || `Treino ${idx + 1}`)
              
              return (
                <div
                  className={`giba-workout-card ${expandedWorkout === idx ? 'expanded' : ''} ${isActive ? 'active-workout' : ''}`}
                  key={idx}
                >
                  <div
                    className="giba-workout-header"
                    onClick={() => setExpandedWorkout(expandedWorkout === idx ? null : idx)}
                  >
                    <div className="giba-workout-day">
                      <span className="giba-day-letter">{w.dayLabel || String.fromCharCode(65 + idx)}</span>
                    </div>
                    <div className="giba-workout-info">
                      <h3 className="giba-workout-name">{w.dayName || `Treino ${idx + 1}`}</h3>
                      {w.focus && (
                        <p className="giba-workout-focus">Foco: {w.focus.join(', ')}</p>
                      )}
                      <p className="giba-workout-meta">
                        {w.exercises?.length || 0} exercícios
                      </p>
                    </div>
                    {isActive && (
                      <span className="giba-workout-active-badge">Em andamento</span>
                    )}
                    <span className="giba-expand-icon">{expandedWorkout === idx ? '▲' : '▼'}</span>
                  </div>

                  {expandedWorkout === idx && (
                    <div className="giba-workout-exercises">
                      {/* Botão de iniciar/finalizar */}
                      {!activeTreino && divisaoId && (
                        <button
                          className="giba-start-workout-btn"
                          onClick={() => handleStartWorkout(divisaoId, idx)}
                        >
                          <span>▶</span> Iniciar treino
                        </button>
                      )}

                      {isActive && (
                        <div className="giba-workout-in-progress">
                          <div className="giba-workout-timer">
                            <span className="giba-workout-timer-icon">⏱️</span>
                            <span className="giba-workout-timer-value">{formatTime(elapsedTime)}</span>
                          </div>
                          <button className="giba-finish-workout-btn" onClick={handleFinishWorkout}>
                            ✓ Finalizar treino
                          </button>
                        </div>
                      )}

                      {(w.exercises || []).map((ex, exIdx) => (
                        <div className="giba-exercise-card" key={exIdx}>
                          <div className="giba-exercise-header">
                            <span className="giba-exercise-num">{exIdx + 1}</span>
                            <h4 className="giba-exercise-name">{ex.name}</h4>
                          </div>

                          <div className="giba-exercise-details">
                            <div className="giba-detail-row">
                              <span className="giba-detail-icon">🔄</span>
                              <div className="giba-detail-content">
                                <span className="giba-detail-label">Séries e repetições</span>
                                <span className="giba-detail-value">
                                  {ex.series} séries de {ex.repetitions || ex.repeticoes || '10-12'} repetições
                                </span>
                              </div>
                            </div>

                            {(ex.restSeconds || ex.rest) && (
                              <div className="giba-detail-row">
                                <span className="giba-detail-icon">⏱️</span>
                                <div className="giba-detail-content">
                                  <span className="giba-detail-label">Descanso entre séries</span>
                                  <span className="giba-detail-value">
                                    {formatRest(ex.restSeconds || ex.rest)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {ex.rir !== undefined && (
                              <div className="giba-detail-row">
                                <span className="giba-detail-icon">💪</span>
                                <div className="giba-detail-content">
                                  <span className="giba-detail-label">Intensidade</span>
                                  <span className="giba-detail-value">
                                    Pare quando faltar {ex.rir} repetição{ex.rir !== 1 ? 'ões' : ''} para a falha
                                  </span>
                                  <span className="giba-detail-hint">
                                    Isso garante estímulo sem risco de lesão
                                  </span>
                                </div>
                              </div>
                            )}

                            {ex.muscleGroup && (
                              <div className="giba-detail-row">
                                <span className="giba-detail-icon">🎯</span>
                                <div className="giba-detail-content">
                                  <span className="giba-detail-label">Músculo trabalhado</span>
                                  <span className="giba-detail-value">{ex.muscleGroup}</span>
                                </div>
                              </div>
                            )}

                            {ex.technicalNotes && (
                              <div className="giba-tip-box">
                                <span className="giba-tip-icon">💡</span>
                                <div>
                                  <span className="giba-tip-label">Dica de execução</span>
                                  <p className="giba-tip-text">{ex.technicalNotes}</p>
                                </div>
                              </div>
                            )}

                            {ex.alternatives?.length > 0 && (
                              <div className="giba-alternatives">
                                <span className="giba-alt-label">Não tem esse equipamento? Tente:</span>
                                <div className="giba-alt-list">
                                  {ex.alternatives.map((alt, altIdx) => (
                                    <span className="giba-alt-item" key={altIdx}>{alt}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Progressão */}
      {(progression.principle || progression.notes) && (
        <section className="giba-section">
          <div className="giba-section-header">
            <h2 className="giba-section-title">Como progredir</h2>
          </div>
          <div className="giba-progress-card">
            {progression.principle && (
              <p className="giba-progress-principle">{progression.principle}</p>
            )}
            {progression.weeklyIncreasePercentage && (
              <div className="giba-progress-tip">
                <span className="giba-progress-icon">📈</span>
                <span>Aumente a carga em torno de {progression.weeklyIncreasePercentage}% por semana quando se sentir confortável.</span>
              </div>
            )}
            {progression.notes && (
              <p className="giba-progress-notes">{progression.notes}</p>
            )}
          </div>
        </section>
      )}

      {/* Dicas */}
      {notesForUser?.length > 0 && (
        <section className="giba-section">
          <div className="giba-section-header">
            <h2 className="giba-section-title">Dicas importantes</h2>
          </div>
          <div className="giba-tips-list">
            {notesForUser.map((note, idx) => (
              <div className="giba-tip-item" key={idx}>
                <span className="giba-tip-num">{idx + 1}</span>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fotos de referência */}
      {savedPhotos.frente && savedPhotos.costas && (
        <section className="giba-section">
          <div className="giba-section-header">
            <h2 className="giba-section-title">Suas fotos de referência</h2>
          </div>
          <p className="giba-section-desc">
            Essas fotos serão usadas para comparar sua evolução nos check-ins semanais.
          </p>
          <div className="giba-saved-photos">
            <div className="giba-saved-photo">
              <img src={savedPhotos.frente} alt="Frente" />
              <span>Frente</span>
            </div>
            <div className="giba-saved-photo">
              <img src={savedPhotos.costas} alt="Costas" />
              <span>Costas</span>
            </div>
          </div>
          {savedPhotos.date && (
            <p className="giba-saved-date">
              Registradas em {new Date(savedPhotos.date).toLocaleDateString('pt-BR')}
            </p>
          )}
        </section>
      )}

      {/* Novo treino */}
      <section className="giba-section giba-regenerate">
        <p className="giba-regenerate-text">
          Quer atualizar seu treino com novas fotos?
        </p>
        <button
          className="giba-btn-secondary"
          onClick={() => {
            setPrescricao(null)
            setAnalysis(null)
          }}
        >
          Criar novo treino
        </button>
      </section>

      {/* Modals */}
      {showFeedbackModal && renderFeedbackModal()}
      {showShareCard && renderShareCard()}
    </div>
  )

  if (loading) {
    return (
      <div className="giba-page">
        <div className="giba-loading">
          <div className="giba-loading-spinner"></div>
          <p>Carregando seu treino...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="giba-page">
        <div className="giba-error">
          <span className="giba-error-icon">😕</span>
          <p>{error}</p>
          <button className="giba-btn-primary" onClick={loadData}>Tentar novamente</button>
        </div>
      </div>
    )
  }

  return prescricao ? renderWorkoutView() : renderEmptyState()
}

export default TreinoMobileView
