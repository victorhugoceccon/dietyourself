import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import { StatCard, SectionHeader, Skeleton } from './ui'
import './NutricionistaStats.css'

/**
 * NutricionistaStats - Dashboard de KPIs para nutricionistas.
 */
function NutricionistaStats({ pacientes = [], onPacienteClick }) {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    comDieta: 0,
    semDieta: 0,
    aderenciaMedia: 0,
    checkInsHoje: 0,
    pacientesAtencao: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateStats()
  }, [pacientes])

  const calculateStats = () => {
    if (!pacientes || pacientes.length === 0) {
      setLoading(false)
      return
    }

    const total = pacientes.length
    const comDieta = pacientes.filter(p => p.dieta).length
    const semDieta = total - comDieta

    // Identificar pacientes que precisam de atenção
    // (sem dieta ou com questionário incompleto)
    const atencao = pacientes.filter(p => 
      !p.dieta || !p.questionnaireData
    ).slice(0, 5) // Limitar a 5

    setStats({
      totalPacientes: total,
      comDieta,
      semDieta,
      aderenciaMedia: 0, // TODO: calcular quando tivermos endpoint
      checkInsHoje: 0,
      pacientesAtencao: atencao
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="nutricionista-stats">
        <div className="stats-grid">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    )
  }

  return (
    <div className="nutricionista-stats">
      {/* KPIs Grid */}
      <div className="stats-grid lifefit-stats-grid">
        <StatCard
          label="Total de Pacientes"
          value={stats.totalPacientes}
          highlight
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <StatCard
          label="Com Dieta Ativa"
          value={stats.comDieta}
          change={stats.totalPacientes > 0 
            ? `${Math.round((stats.comDieta / stats.totalPacientes) * 100)}%`
            : '0%'
          }
          positive={stats.comDieta > stats.semDieta}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <StatCard
          label="Sem Dieta"
          value={stats.semDieta}
          change={stats.semDieta > 0 ? 'Pendente' : ''}
          positive={false}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />

        <StatCard
          label="Aderência Média"
          value={`${stats.aderenciaMedia}%`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          }
        />
      </div>

      {/* Pacientes que precisam de atenção */}
      {stats.pacientesAtencao.length > 0 && (
        <div className="attention-section">
          <SectionHeader 
            title="Precisam de Atenção"
            subtitle={`${stats.pacientesAtencao.length} pacientes aguardando`}
          />
          
          <div className="attention-list">
            {stats.pacientesAtencao.map((paciente) => (
              <button 
                key={paciente.id}
                className="attention-card"
                onClick={() => onPacienteClick?.(paciente)}
              >
                <div className="attention-avatar">
                  {(paciente.name || paciente.email || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="attention-info">
                  <span className="attention-name">
                    {paciente.name || paciente.email}
                  </span>
                  <span className="attention-status">
                    {!paciente.dieta 
                      ? 'Sem dieta' 
                      : !paciente.questionnaireData 
                        ? 'Questionário pendente'
                        : 'Verificar'
                    }
                  </span>
                </div>
                <svg className="attention-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dica quando não há pacientes */}
      {stats.totalPacientes === 0 && (
        <div className="stats-empty">
          <div className="stats-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h3>Nenhum paciente cadastrado</h3>
          <p>Adicione seu primeiro paciente para começar a acompanhar.</p>
        </div>
      )}
    </div>
  )
}

export default NutricionistaStats


