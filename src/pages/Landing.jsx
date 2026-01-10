import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import './Landing.css'

const ABACATEPAY_ENABLED = Boolean(import.meta.env?.VITE_ABACATEPAY_ENABLED === 'true')
const EXTERNAL_CHECKOUT_ENABLED = Boolean(import.meta.env?.VITE_EXTERNAL_CHECKOUT_URL)

const features = [
  'Dietas personalizadas com IA e nutricionista',
  'Treinos guiados pelo seu personal com PDF moderno',
  'Check-in diário com foto e localização',
  'PWA: use no celular como app nativo',
  'Progresso, adesão semanal e próxima refeição em destaque'
]

const steps = [
  { title: 'Baixe/abra a PWA', desc: 'Funciona no navegador e pode ser instalada em segundos.', icon: '📱' },
  { title: 'Preencha o questionário', desc: 'Entendemos seu objetivo, rotina e restrições.', icon: '🧠' },
  { title: 'Receba dieta e treino', desc: 'Planos claros, com PDF elegante e listas de compras.', icon: '📄' },
  { title: 'Faça check-ins diários', desc: 'Foto, localização, humor, evolução e adesão semanal.', icon: '✅' }
]

const appShowcase = [
  { title: 'Check-in com foto + mapa', desc: 'Prove consistência e registre localização automaticamente.', icon: '📍' },
  { title: 'Próxima refeição em destaque', desc: 'Widget mostra o que consumir agora, sem perder tempo.', icon: '⏱️' },
  { title: 'Treino com vídeo e PDF', desc: 'Exercícios com specs, vídeo e PDF elegante para salvar.', icon: '🏋️' },
  { title: 'Adesão semanal', desc: 'Veja streaks e percentuais para manter motivação alta.', icon: '📈' }
]

const testimonials = [
  {
    name: 'Marina, 29',
    role: 'Paciente',
    quote: 'Em 2 semanas já organizei minhas refeições e estou seguindo o treino sem atrito.'
  },
  {
    name: 'João, 34',
    role: 'Paciente',
    quote: 'O check-in com foto e mapa me deu disciplina. O PDF de treino ficou lindo.'
  },
  {
    name: 'Carla, 31',
    role: 'Paciente',
    quote: 'Gostei do modo PWA, parece app nativo. E a dieta é fácil de seguir.'
  }
]

const faqs = [
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim, 7 dias grátis sem compromisso.'
  },
  {
    q: 'Preciso instalar algo?',
    a: 'Não. Use no navegador ou instale como PWA em segundos.'
  },
  {
    q: 'Consigo registrar meu progresso?',
    a: 'Sim. Check-in diário com foto, localização e evolução semanal.'
  }
]

function Landing() {
  const navigate = useNavigate()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [email, setEmail] = useState('')

  const planCards = useMemo(
    () => [
      {
        id: 'monthly',
        title: 'Mensal',
        price: 'R$ 49/mês',
        highlights: ['Acesso completo', 'Check-ins ilimitados', 'Suporte prioritário']
      },
      {
        id: 'yearly',
        title: 'Anual',
        price: 'R$ 39/mês',
        badge: 'Mais vantajoso',
        highlights: ['Economize 20%', 'Acesso completo', 'Check-ins ilimitados', 'Suporte prioritário']
      }
    ],
    []
  )

  const handleStartTrial = () => {
    navigate('/login')
  }

  const handleCheckout = async (planId, userEmail = null) => {
    // Se checkout externo estiver configurado, usar ele (mais simples!)
    if (EXTERNAL_CHECKOUT_ENABLED) {
      const checkoutUrl = import.meta.env?.VITE_EXTERNAL_CHECKOUT_URL
      if (checkoutUrl) {
        // Adicionar parâmetros opcionais (se o checkout externo suportar)
        const url = new URL(checkoutUrl)
        if (planId === 'yearly') {
          url.searchParams.set('plan', 'yearly')
        } else {
          url.searchParams.set('plan', 'monthly')
        }
        if (userEmail) {
          url.searchParams.set('email', userEmail)
        }
        window.location.href = url.toString()
        return
      }
    }

    // Fallback para AbacatePay (se configurado)
    if (ABACATEPAY_ENABLED) {
      try {
        setCheckoutLoading(true)
        
        const token = localStorage.getItem('token')
        let emailToUse = userEmail

        if (!token && !emailToUse) {
          setSelectedPlan(planId)
          setShowEmailModal(true)
          setCheckoutLoading(false)
          return
        }

        if (token) {
          const res = await fetch(`${API_URL}/billing/create-billing`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              plan: planId,
              method: 'PIX'
            })
          })

          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data?.url) {
            throw new Error(data?.error || 'Não foi possível iniciar o pagamento')
          }
          window.location.href = data.url
          return
        }

        if (emailToUse) {
          const res = await fetch(`${API_URL}/billing/create-billing-public`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              plan: planId,
              method: 'PIX',
              email: emailToUse
            })
          })

          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data?.url) {
            throw new Error(data?.error || 'Não foi possível iniciar o pagamento')
          }
          window.location.href = data.url
        }
      } catch (error) {
        console.error('Erro ao iniciar pagamento:', error)
        alert(error.message || 'Erro ao iniciar pagamento. Tente novamente.')
      } finally {
        setCheckoutLoading(false)
      }
      return
    }

    // Se nenhum método estiver configurado, redirecionar para trial
    handleStartTrial()
  }

  const handleEmailSubmit = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      alert('Por favor, insira um email válido')
      return
    }
    setShowEmailModal(false)
    handleCheckout(selectedPlan, email)
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="brand">
          <div className="brand-mark">LF</div>
          <div className="brand-text">
            <span className="brand-name">LifeFit</span>
            <span className="brand-tagline">Nutri + Treino + IA</span>
          </div>
        </div>
        <nav className="landing-nav">
          <a href="#benefits">Benefícios</a>
          <a href="#plans">Planos</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-actions">
          <button className="btn ghost" onClick={() => navigate('/login')}>
            Entrar
          </button>
          <button className="btn cta" onClick={handleStartTrial}>
            Começar grátis
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">B2C SaaS • 7 dias grátis</p>
            <h1>
              Dieta e treino personalizados, com check-ins diários e PWA pronto para uso.
            </h1>
            <p className="hero-sub">
              Tenha nutri e personal em um só app: gere dieta, acompanhe treino, registre fotos e localização,
              tudo em uma experiência mobile-first.
            </p>
            <div className="hero-actions">
              <button className="btn cta" onClick={handleStartTrial}>
                Começar teste grátis
              </button>
              <button className="btn outline" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver planos
              </button>
            </div>
            <div className="hero-metrics">
              <div>
                <strong>+10k</strong>
                <span>Check-ins registrados</span>
              </div>
              <div>
                <strong>97%</strong>
                <span>Adesão semanal</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Satisfação usuários</span>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <div className="card-header">
              <span className="dot green"></span> Sessão em andamento
            </div>
            <div className="card-body">
              <div className="card-row">
                <span>Próxima refeição</span>
                <strong>Almoço balanceado</strong>
              </div>
              <div className="card-row">
                <span>Treino de hoje</span>
                <strong>Full body (45min)</strong>
              </div>
              <div className="card-progress">
                <span>Check-ins da semana</span>
                <div className="progress">
                  <div className="progress-bar" style={{ width: '78%' }} />
                </div>
                <small>5 de 7 concluídos</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="benefits">
          <div className="section-header">
            <p className="eyebrow">Por que LifeFit</p>
            <h2>Tudo o que você precisa para manter consistência</h2>
            <p className="section-sub">
              Construa disciplina com check-ins, receba PDFs bonitos de treino e acompanhe sua dieta em tempo real.
            </p>
          </div>
          <div className="benefits-grid">
            {features.map((feat) => (
              <div key={feat} className="benefit-card">
                <div className="icon">✓</div>
                <p>{feat}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="section-header">
            <p className="eyebrow">Passo a passo</p>
            <h2>Em minutos você está usando como um app nativo</h2>
            <p className="section-sub">Zero fricção para iniciar: abra, instale PWA, preencha questionário e receba seus planos.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <div key={step.title} className="step-card">
                <div className="step-icon">{step.icon}</div>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section muted" id="plans">
          <div className="section-header">
            <p className="eyebrow">Planos</p>
            <h2>Comece com 7 dias grátis, escolha o plano depois</h2>
            <p className="section-sub">Assine quando quiser. Cancelamento simples.</p>
          </div>
          <div className="plans-grid">
            {planCards.map((plan) => (
              <div key={plan.id} className="plan-card">
                {plan.badge && <span className="plan-badge">{plan.badge}</span>}
                <h3>{plan.title}</h3>
                <p className="price">{plan.price}</p>
                <ul>
                  {plan.highlights.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
                <button
                  className={`btn ${plan.badge ? 'cta' : 'outline'}`}
                  disabled={checkoutLoading}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {ABACATEPAY_ENABLED ? 'Assinar' : 'Começar grátis'}
                </button>
                {!ABACATEPAY_ENABLED && <small className="note">Pagamento não configurado: seguiremos com teste grátis.</small>}
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="showcase">
          <div className="section-header">
            <p className="eyebrow">No dia a dia</p>
            <h2>O app em ação</h2>
          </div>
          <div className="showcase-grid">
            {appShowcase.map((item) => (
              <div key={item.title} className="showcase-card">
                <div className="showcase-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="testimonials">
          <div className="section-header">
            <p className="eyebrow">Resultados</p>
            <h2>Pacientes que permanecem no plano</h2>
          </div>
          <div className="testimonials">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card">
                <p className="quote">“{t.quote}”</p>
                <div className="author">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="faq">
          <div className="section-header">
            <p className="eyebrow">FAQ</p>
            <h2>Perguntas frequentes</h2>
          </div>
          <div className="faq-grid">
            {faqs.map((f) => (
              <div key={f.q} className="faq-card">
                <h4>{f.q}</h4>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section cta-final">
          <div className="cta-final-card">
            <div>
              <p className="eyebrow">Pronto para testar?</p>
              <h2>7 dias grátis. Dieta, treino, check-in e PWA em minutos.</h2>
              <p className="section-sub">Sem cartão para começar. Ative agora e mantenha consistência diária.</p>
              <div className="hero-actions">
                <button className="btn cta" onClick={handleStartTrial}>
                  Começar teste grátis
                </button>
                <button
                  className="btn outline"
                  onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver planos
                </button>
              </div>
            </div>
            <div className="cta-final-badge">
              <span className="dot green"></span>
              <div>
                <strong>Experiência PWA</strong>
                <p>Use como app nativo em iOS/Android</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-brand">
          <div className="brand-mark">LF</div>
          <div>
            <strong>LifeFit</strong>
            <p>Nutri + treino + IA. 7 dias grátis.</p>
          </div>
        </div>
        <div className="footer-actions">
          <button className="btn ghost" onClick={() => navigate('/login')}>Entrar</button>
          <button className="btn cta" onClick={handleStartTrial}>Começar grátis</button>
        </div>
      </footer>

      {/* Modal de Email para Checkout */}
      {showEmailModal && (
        <div className="email-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="email-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Informe seu email</h3>
            <p>Precisamos do seu email para processar o pagamento e criar sua conta.</p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <div className="email-modal-actions">
                <button type="button" className="btn outline" onClick={() => setShowEmailModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn cta" disabled={checkoutLoading}>
                  {checkoutLoading ? 'Processando...' : 'Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing
