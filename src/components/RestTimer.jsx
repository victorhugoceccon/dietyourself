import { useState, useEffect, useRef } from 'react'
import './RestTimer.css'

function RestTimer({ suggestedTime = 60, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(suggestedTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsCompleted(true)
            if (onComplete) {
              setTimeout(() => onComplete(), 500)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, onComplete])

  const handleStart = () => {
    setIsRunning(true)
    setIsCompleted(false)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsCompleted(false)
    setTimeLeft(suggestedTime)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    return ((suggestedTime - timeLeft) / suggestedTime) * 100
  }

  return (
    <div className="rest-timer">
      <div className="rest-timer-header">
        <div className="rest-timer-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <span className="rest-timer-label">Descanso</span>
      </div>

      {isCompleted ? (
        <div className="rest-timer-completed">
          <div className="completed-icon">✓</div>
          <p className="completed-message">Descanso concluído</p>
          <p className="completed-hint">Pronto para a próxima série</p>
          <button className="rest-timer-reset-btn" onClick={handleReset}>
            Reiniciar
          </button>
        </div>
      ) : (
        <>
          <div className="rest-timer-display">
            <div className="rest-timer-circle">
              <svg className="rest-timer-svg" viewBox="0 0 100 100">
                <circle
                  className="rest-timer-bg"
                  cx="50"
                  cy="50"
                  r="45"
                />
                <circle
                  className="rest-timer-progress"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}`,
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - getProgress() / 100)}`
                  }}
                />
              </svg>
              <div className="rest-timer-time">{formatTime(timeLeft)}</div>
            </div>
          </div>

          <div className="rest-timer-controls">
            {!isRunning ? (
              <button className="rest-timer-start-btn" onClick={handleStart}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Iniciar
              </button>
            ) : (
              <button className="rest-timer-pause-btn" onClick={handlePause}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                Pausar
              </button>
            )}
            <button className="rest-timer-reset-btn" onClick={handleReset}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Reiniciar
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default RestTimer




