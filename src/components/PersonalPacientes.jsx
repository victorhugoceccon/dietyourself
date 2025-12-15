import { useState, useEffect } from 'react'
import './PersonalPacientes.css'

const API_URL = 'http://localhost:5000/api'

function PersonalPacientes() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPacientes()
  }, [])

  const loadPacientes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/personal/pacientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPacientes(data.pacientes || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao carregar pacientes')
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setError('Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="personal-pacientes">
        <div className="loading">Carregando pacientes...</div>
      </div>
    )
  }

  return (
    <div className="personal-pacientes">
      <div className="pacientes-header">
        <h2>Meus Pacientes</h2>
        <p className="subtitle">
          {pacientes.length} {pacientes.length === 1 ? 'paciente vinculado' : 'pacientes vinculados'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {pacientes.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não tem pacientes vinculados.</p>
          <p>Os pacientes serão vinculados a você quando você prescrever treinos para eles.</p>
        </div>
      ) : (
        <div className="pacientes-list">
          {pacientes.map(paciente => (
            <div
              key={paciente.id}
              className={`paciente-card ${selectedPaciente?.id === paciente.id ? 'selected' : ''}`}
              onClick={() => setSelectedPaciente(paciente)}
            >
              <div className="paciente-info">
                <h3>{paciente.name || paciente.email}</h3>
                <p className="paciente-email">{paciente.email}</p>
                {paciente.questionnaireData && (
                  <div className="paciente-data">
                    {paciente.questionnaireData.idade && (
                      <span className="data-item">
                        <strong>Idade:</strong> {paciente.questionnaireData.idade} anos
                      </span>
                    )}
                    {paciente.questionnaireData.pesoAtual && (
                      <span className="data-item">
                        <strong>Peso:</strong> {paciente.questionnaireData.pesoAtual} kg
                      </span>
                    )}
                    {paciente.questionnaireData.altura && (
                      <span className="data-item">
                        <strong>Altura:</strong> {paciente.questionnaireData.altura} cm
                      </span>
                    )}
                    {paciente.questionnaireData.objetivo && (
                      <span className="data-item">
                        <strong>Objetivo:</strong> {paciente.questionnaireData.objetivo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPaciente && (
        <div className="paciente-detail">
          <h3>Detalhes do Paciente</h3>
          <p><strong>Nome:</strong> {selectedPaciente.name || 'Não informado'}</p>
          <p><strong>Email:</strong> {selectedPaciente.email}</p>
          {selectedPaciente.questionnaireData && (
            <>
              {selectedPaciente.questionnaireData.idade && (
                <p><strong>Idade:</strong> {selectedPaciente.questionnaireData.idade} anos</p>
              )}
              {selectedPaciente.questionnaireData.sexo && (
                <p><strong>Sexo:</strong> {selectedPaciente.questionnaireData.sexo}</p>
              )}
              {selectedPaciente.questionnaireData.pesoAtual && (
                <p><strong>Peso:</strong> {selectedPaciente.questionnaireData.pesoAtual} kg</p>
              )}
              {selectedPaciente.questionnaireData.altura && (
                <p><strong>Altura:</strong> {selectedPaciente.questionnaireData.altura} cm</p>
              )}
              {selectedPaciente.questionnaireData.objetivo && (
                <p><strong>Objetivo:</strong> {selectedPaciente.questionnaireData.objetivo}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PersonalPacientes

