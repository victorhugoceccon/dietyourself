import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DietDisplay from './DietDisplay'
import LoadingBar from './LoadingBar'
import ProfessionalBrandCard from './ProfessionalBrandCard'
import { useBranding } from '../hooks/useBranding'
import { API_URL } from '../config/api'
import './PacienteDieta.css'
import { useOutletContext } from 'react-router-dom'

function PacienteDieta() {
  const [generatingDiet, setGeneratingDiet] = useState(false)
  const [dietError, setDietError] = useState('')
  const [dietRefreshTrigger, setDietRefreshTrigger] = useState(0)
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false)
  const [hasDiet, setHasDiet] = useState(false)
  const [checking, setChecking] = useState(true)
  const [nutritionalNeeds, setNutritionalNeeds] = useState(null)
  const outlet = useOutletContext()
  const nutricionistaId = outlet?.userData?.nutricionistaId || null
  const navigate = useNavigate()
  const { branding } = useBranding(nutricionistaId)

  useEffect(() => {
    checkQuestionnaire()
  }, [])

  useEffect(() => {
    if (hasQuestionnaire) {
      checkDiet()
    }
  }, [hasQuestionnaire, dietRefreshTrigger])

  const checkDiet = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHasDiet(!!data.dieta)
        if (data.nutritionalNeeds) {
          setNutritionalNeeds(data.nutritionalNeeds)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar dieta:', error)
      setHasDiet(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar dieta')
      }

      const data = await response.json()
      if (!data.dieta) {
        alert('Nenhuma dieta encontrada para download')
        return
      }

      // Usar window.print() como alternativa simples, ou criar HTML para impressão
      const printWindow = window.open('', '_blank')
      const printContent = generatePDFHTML(data.dieta, nutritionalNeeds)
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  const generatePDFHTML = (dieta, nutritionalNeeds) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Minha Dieta - LifeFit</title>
          <style>
            @media print {
              @page { 
                margin: 15mm;
                size: A4;
              }
              body { margin: 0; padding: 0; }
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              color: #0B0F14;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 30px 20px;
              background: #FFFFFF;
            }
            .header {
              background: linear-gradient(135deg, #B9FF2C 0%, #36D7FF 100%);
              padding: 30px;
              border-radius: 16px;
              margin-bottom: 30px;
              box-shadow: 0 4px 20px rgba(185, 255, 44, 0.2);
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #B9FF2C 0%, #36D7FF 50%, #B9FF2C 100%);
            }
            h1 {
              background: linear-gradient(135deg, #0B0F14 0%, #1A1F26 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-size: 28px;
              margin: 0 0 15px 0;
              font-weight: 700;
              letter-spacing: -0.02em;
            }
            .nutrition-summary {
              background: rgba(255, 255, 255, 0.95);
              padding: 20px;
              border-radius: 12px;
              margin-top: 20px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
              border: 1px solid rgba(185, 255, 44, 0.3);
            }
            .nutrition-summary strong {
              color: #0B0F14;
              font-size: 14px;
              display: block;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .nutrition-stats {
              display: flex;
              gap: 20px;
              flex-wrap: wrap;
              margin-top: 10px;
            }
            .nutrition-stat {
              flex: 1;
              min-width: 120px;
              padding: 12px;
              background: linear-gradient(135deg, #F8FAF8 0%, #FFFFFF 100%);
              border-radius: 8px;
              border: 1px solid rgba(185, 255, 44, 0.2);
            }
            .nutrition-stat-label {
              font-size: 11px;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            }
            .nutrition-stat-value {
              font-size: 18px;
              font-weight: 700;
              color: #0B0F14;
            }
            .meal-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
              background: linear-gradient(135deg, #F8FAF8 0%, #FFFFFF 100%);
              border-radius: 16px;
              padding: 25px;
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
              border: 1px solid rgba(185, 255, 44, 0.15);
            }
            .meal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid rgba(185, 255, 44, 0.3);
            }
            .meal-title {
              font-size: 20px;
              font-weight: 700;
              background: linear-gradient(135deg, #0B0F14 0%, #1A1F26 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin: 0;
              text-transform: capitalize;
            }
            .meal-kcal {
              font-size: 14px;
              font-weight: 600;
              color: #6B7280;
              background: rgba(185, 255, 44, 0.15);
              padding: 6px 12px;
              border-radius: 8px;
            }
            .food-item {
              margin-bottom: 16px;
              padding: 16px;
              background: #FFFFFF;
              border-radius: 12px;
              border: 1px solid rgba(185, 255, 44, 0.2);
              box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
            }
            .food-name {
              font-weight: 600;
              font-size: 16px;
              color: #0B0F14;
              margin: 0 0 8px 0;
            }
            .food-details {
              font-size: 13px;
              color: #6B7280;
              margin: 0 0 8px 0;
              display: flex;
              gap: 12px;
            }
            .food-detail-item {
              padding: 4px 8px;
              background: rgba(185, 255, 44, 0.1);
              border-radius: 6px;
              font-weight: 500;
            }
            .substitutions {
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid rgba(185, 255, 44, 0.2);
            }
            .substitutions-title {
              font-weight: 600;
              font-size: 12px;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 8px;
            }
            .substitution-item {
              margin: 4px 0;
              font-size: 12px;
              color: #4B5563;
              padding-left: 12px;
            }
            .observations {
              margin-top: 30px;
              padding: 20px;
              background: linear-gradient(135deg, rgba(185, 255, 44, 0.1) 0%, rgba(54, 215, 255, 0.1) 100%);
              border-left: 4px solid #B9FF2C;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            .observations-title {
              font-weight: 700;
              font-size: 14px;
              color: #0B0F14;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .observations-content {
              color: #374151;
              font-size: 13px;
              line-height: 1.7;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid rgba(185, 255, 44, 0.2);
              text-align: center;
              color: #6B7280;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🥗 Minha Dieta Personalizada</h1>
            ${nutritionalNeeds ? `
              <div class="nutrition-summary">
                <strong>📊 Meta Nutricional Diária</strong>
                <div class="nutrition-stats">
                  <div class="nutrition-stat">
                    <div class="nutrition-stat-label">🔥 Calorias</div>
                    <div class="nutrition-stat-value">${nutritionalNeeds.calorias || 0}</div>
                  </div>
                  <div class="nutrition-stat">
                    <div class="nutrition-stat-label">💪 Proteínas</div>
                    <div class="nutrition-stat-value">${nutritionalNeeds.macros?.proteina || 0}g</div>
                  </div>
                  <div class="nutrition-stat">
                    <div class="nutrition-stat-label">🍞 Carboidratos</div>
                    <div class="nutrition-stat-value">${nutritionalNeeds.macros?.carboidrato || 0}g</div>
                  </div>
                  <div class="nutrition-stat">
                    <div class="nutrition-stat-label">🥑 Gorduras</div>
                    <div class="nutrition-stat-value">${nutritionalNeeds.macros?.gordura || 0}g</div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
          
          ${dieta.refeicoes ? dieta.refeicoes.map((refeicao, mealIndex) => `
            <div class="meal-section">
              <div class="meal-header">
                <h2 class="meal-title">🍽️ ${refeicao.nome}</h2>
                <div class="meal-kcal">${refeicao.totalRefeicaoKcal || 0} kcal</div>
              </div>
              ${refeicao.itens ? refeicao.itens.map((item, itemIndex) => `
                <div class="food-item">
                  <div class="food-name">${item.alimento}</div>
                  <div class="food-details">
                    <span class="food-detail-item">${item.porcao || 'N/A'}</span>
                    <span class="food-detail-item">${item.kcal || 0} kcal</span>
                  </div>
                  ${item.substituicoes && item.substituicoes.length > 0 ? `
                    <div class="substitutions">
                      <div class="substitutions-title">🔄 Alternativas:</div>
                      ${item.substituicoes.map(sub => `
                        <div class="substitution-item">• ${sub.alimento} (${sub.porcaoEquivalente || sub.porcao})</div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('') : ''}
            </div>
          `).join('') : ''}
          
          ${dieta.observacoesPlano ? `
            <div class="observations">
              <div class="observations-title">📝 Observações do Plano</div>
              <div class="observations-content">${dieta.observacoesPlano}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>💚 LifeFit Diet - Sistema de Nutrição Personalizada</p>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </body>
      </html>
    `
  }

  const checkQuestionnaire = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/questionnaire/check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.hasCompleted) {
          setHasQuestionnaire(true)
        } else {
          // Se não tem questionário, redirecionar para perfil
          navigate('/paciente/perfil', { replace: true })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar questionário:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleGenerateDiet = async () => {
    setGeneratingDiet(true)
    setDietError('')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 660000) // 11 minutos

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/diet/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      let data
      try {
        const responseText = await response.text()
        if (!responseText) {
          throw new Error('Resposta vazia do servidor')
        }
        
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError)
          throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}`)
        }
      } catch (error) {
        if (error.message.includes('Erro ao processar')) {
          throw error
        }
        console.error('Erro ao ler resposta:', error)
        throw new Error('Erro ao ler resposta do servidor: ' + error.message)
      }

      if (!response.ok) {
        const errorMessage = data.error || 'Erro ao gerar dieta'
        const errorDetails = data.details ? `: ${data.details}` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      console.log('✅ Dieta gerada com sucesso!')

      if (data.nutritionalNeeds) {
        localStorage.setItem('nutritionalNeeds', JSON.stringify(data.nutritionalNeeds))
        setNutritionalNeeds(data.nutritionalNeeds)
      }

      setTimeout(() => {
        setDietRefreshTrigger(prev => prev + 1)
        setHasDiet(true)
        // Após gerar dieta, redirecionar para dashboard
        navigate('/paciente/dashboard', { replace: true })
      }, 500)
      
      return true
    } catch (error) {
      console.error('Erro ao gerar dieta:', error)
      
      if (error.name === 'AbortError') {
        setDietError('A geração da dieta está demorando mais que o esperado. Por favor, tente novamente em alguns instantes.')
      } else {
        setDietError(error.message || 'Erro ao gerar dieta. Tente novamente.')
      }
      
      return false
    } finally {
      clearTimeout(timeoutId)
      setGeneratingDiet(false)
    }
  }

  if (checking) {
    return (
      <div className="paciente-dieta">
        <div className="paciente-dieta-content">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        </div>
      </div>
    )
  }

  if (!hasQuestionnaire) {
    return null
  }

  return (
    <div className="paciente-dieta">
      <div className="paciente-dieta-content">
        <div 
          className="dieta-hero"
          style={{
            backgroundImage: branding?.bannerUrl 
              ? `linear-gradient(135deg, rgba(15, 18, 27, 0.85), rgba(8, 11, 18, 0.9)), url(${branding.bannerUrl})`
              : undefined
          }}
        >
          <div className="dieta-hero__glow"></div>
          <div className="dieta-hero__content">
            {branding?.logoUrl && (
              <div className="dieta-hero__logo">
                <img src={branding.logoUrl} alt="Logo do Nutricionista" />
              </div>
            )}
            <p className="dieta-hero__kicker">Plano alimentar</p>
            <h1 className="dieta-hero__title">Sua dieta personalizada</h1>
            <p className="dieta-hero__subtitle">
              Acompanhe seu plano, baixe em PDF e gere atualizações sempre que precisar.
            </p>

            <div className="dieta-hero__chips">
              <div className="dieta-hero__chip">
                <span>Status</span>
                <strong>{hasDiet ? 'Dieta ativa' : 'Sem dieta'}</strong>
              </div>
              <div className="dieta-hero__chip">
                <span>Questionário</span>
                <strong>Concluído</strong>
              </div>
              <div className="dieta-hero__chip">
                <span>Nutricionista</span>
                <strong>{nutricionistaId ? 'Conectado' : 'Pendente'}</strong>
              </div>
            </div>

            <div className="dieta-hero__actions">
              {!hasDiet ? (
                <button
                  onClick={handleGenerateDiet}
                  disabled={generatingDiet}
                  className="dieta-cta"
                >
                  {generatingDiet ? 'Gerando...' : 'Gerar dieta'}
                </button>
              ) : (
                <div className="dieta-hero__info">
                  Para gerar outra dieta, reinicie sua conta em Perfil.
                </div>
              )}

              {hasDiet && (
                <button
                  onClick={handleDownloadPDF}
                  className="dieta-secondary"
                  title="Baixar dieta em PDF"
                >
                  <span>PDF</span>
                  <span className="cta-hero__arrow">
                    <svg width="46" height="24" viewBox="0 0 66 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path className="one" d="M40.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L65.692 20.785a.7.7 0 0 1 0 .988L44.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L56.994 21.857a.271.271 0 0 0-.006-.714L40.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                      <path className="two" d="M20.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L45.692 20.785a.7.7 0 0 1 0 .988L24.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L36.994 21.857a.271.271 0 0 0-.006-.714L20.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                      <path className="three" d="m.154 3.895 3.822-3.756c.195-.192.507-.192.702 0L25.692 20.785a.7.7 0 0 1 0 .988L4.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L16.994 21.857a.271.271 0 0 0-.006-.714L.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                    </svg>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="diet-section diet-card">
          <ProfessionalBrandCard professionalUserId={nutricionistaId} roleLabel="Sua Nutricionista" />

          {dietError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {dietError}
            </div>
          )}

          {generatingDiet ? (
            <div>
              <LoadingBar message="Gerando sua dieta personalizada..." />
              <div className="diet-generation-info">
                <p>
                  ⏱️ Estamos criando sua dieta personalizada com base nas suas necessidades e preferências. 
                  Este processo pode levar alguns minutos para garantir que tudo esteja perfeito para você. 
                  Por favor, aguarde enquanto preparamos algo especial! 🌟
                </p>
              </div>
            </div>
          ) : (
            <DietDisplay 
              onGenerateDiet={handleGenerateDiet} 
              refreshTrigger={dietRefreshTrigger}
              nutritionalNeeds={nutritionalNeeds}
              onMealToggle={() => {
                setDietRefreshTrigger(prev => prev + 1)
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}

export default PacienteDieta





