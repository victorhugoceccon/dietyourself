import { useState } from 'react'
import './WeeklyWorkoutCalendar.css'

function WeeklyWorkoutCalendar({ treinosSemana, rotinaAtiva, onDayClick, branding }) {
  const [selectedDay, setSelectedDay] = useState(null)

  // Obter dia atual da semana
  const getDiaAtual = () => {
    const dias = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']
    return dias[new Date().getDay()]
  }

  const diasSemana = [
    { key: 'SEGUNDA', label: 'Seg', fullLabel: 'Segunda' },
    { key: 'TERCA', label: 'Ter', fullLabel: 'Terça' },
    { key: 'QUARTA', label: 'Qua', fullLabel: 'Quarta' },
    { key: 'QUINTA', label: 'Qui', fullLabel: 'Quinta' },
    { key: 'SEXTA', label: 'Sex', fullLabel: 'Sexta' },
    { key: 'SABADO', label: 'Sáb', fullLabel: 'Sábado' },
    { key: 'DOMINGO', label: 'Dom', fullLabel: 'Domingo' }
  ]

  const diaAtual = getDiaAtual()

  // Obter treino do dia
  const getTreinoDoDia = (diaKey) => {
    if (!treinosSemana?.treinosPorDia) return null
    
    const treinosDoDia = treinosSemana.treinosPorDia[diaKey] || []
    
    // Priorizar treino finalizado
    const treinoFinalizado = treinosDoDia.find(t => t.finalizado)
    if (treinoFinalizado) {
      return {
        tipo: 'concluido',
        treino: treinoFinalizado,
        divisao: treinoFinalizado.divisao
      }
    }
    
    // Se não tem treino finalizado, verificar se há treino iniciado mas não finalizado
    const treinoIniciado = treinosDoDia.find(t => !t.finalizado)
    if (treinoIniciado) {
      return {
        tipo: 'iniciado',
        treino: treinoIniciado,
        divisao: treinoIniciado.divisao
      }
    }
    
    return null
  }

  const handleDayClick = (dia) => {
    const treinoDoDia = getTreinoDoDia(dia.key)
    
    if (treinoDoDia?.tipo === 'concluido' && onDayClick) {
      setSelectedDay(dia.key)
      onDayClick(treinoDoDia.treino)
    }
  }

  return (
    <div className="weekly-workout-calendar">
      <div className="weekly-calendar-header">
        <h3 className="weekly-calendar-title">Treinos da Semana</h3>
        <p className="weekly-calendar-subtitle">Sua constância em um só lugar</p>
      </div>

      <div className="weekly-calendar-grid">
        {diasSemana.map((dia) => {
          const treinoDoDia = getTreinoDoDia(dia.key)
          const isToday = dia.key === diaAtual
          const hasTreino = treinoDoDia !== null
          const isConcluido = treinoDoDia?.tipo === 'concluido'
          const isClickable = isConcluido

          return (
            <div
              key={dia.key}
              className={`weekly-calendar-day ${isToday ? 'today' : ''} ${hasTreino ? 'has-treino' : ''} ${isConcluido ? 'concluido' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && handleDayClick(dia)}
            >
              {!isToday && <div className="weekly-day-label">{dia.label}</div>}
              
              <div className="weekly-day-indicator">
                {isConcluido ? (
                  <div className="weekly-day-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                ) : hasTreino ? (
                  <div className="weekly-day-planned">
                    <div className="weekly-day-dot"></div>
                  </div>
                ) : (
                  <div className="weekly-day-empty"></div>
                )}
              </div>

              {treinoDoDia && (
                <div className="weekly-day-treino-info">
                  <div className="weekly-day-treino-name">
                    {treinoDoDia.divisao?.nome || 'Treino'}
                  </div>
                  {isConcluido && (
                    <div className="weekly-day-status">Feito</div>
                  )}
                </div>
              )}

              {isToday && (
                <div className="weekly-day-today-badge">Hoje</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumo da semana */}
      <div className="weekly-calendar-summary">
        <div className="weekly-summary-item">
          <div className="weekly-summary-value">
            {Object.values(treinosSemana?.treinosPorDia || {}).flat().filter(t => t.finalizado).length}
          </div>
          <div className="weekly-summary-label">Treinos concluídos</div>
        </div>
        <div className="weekly-summary-divider"></div>
        <div className="weekly-summary-item">
          <div className="weekly-summary-value">
            {rotinaAtiva?.divisoes?.length || 0}
          </div>
          <div className="weekly-summary-label">Treinos disponíveis</div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyWorkoutCalendar




