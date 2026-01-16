import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import './Landing.css'

const EXTERNAL_CHECKOUT_ENABLED = Boolean(import.meta.env?.VITE_EXTERNAL_CHECKOUT_URL)

function Landing() {
  const navigate = useNavigate()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [email, setEmail] = useState('')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [activeFaq, setActiveFaq] = useState(null)

  // Detectar prompt de instalação PWA
  useEffect(() => {
    const handleInstallReady = (e) => {
      setInstallPrompt(e.detail.prompt)
    }
    
    window.addEventListener('pwainstallready', handleInstallReady)
    
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
    
    return () => window.removeEventListener('pwainstallready', handleInstallReady)
  }, [])

  const handleInstallApp = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setInstallPrompt(null)
  }

  const handleStartTrial = () => {
    navigate('/login')
  }

  const handleCheckout = async (planId, userEmail = null) => {
    if (EXTERNAL_CHECKOUT_ENABLED) {
      const checkoutUrl = import.meta.env?.VITE_EXTERNAL_CHECKOUT_URL
      if (checkoutUrl) {
        const url = new URL(checkoutUrl)
        url.searchParams.set('plan', planId)
        if (userEmail) url.searchParams.set('email', userEmail)
        window.location.href = url.toString()
        return
      }
    }
    handleStartTrial()
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="giba-landing">
      {/* ========== NAVBAR ========== */}
      <nav className="giba-landing-nav">
        <div className="giba-nav-brand">
          <span className="giba-nav-logo">💪</span>
          <span className="giba-nav-name">Giba</span>
        </div>
        <div className="giba-nav-links">
          <button onClick={() => scrollTo('funcionalidades')}>Funcionalidades</button>
          <button onClick={() => scrollTo('como-funciona')}>Como funciona</button>
          <button onClick={() => scrollTo('planos')}>Planos</button>
        </div>
        <div className="giba-nav-actions">
          <button className="giba-nav-login" onClick={() => navigate('/login')}>Entrar</button>
          <button className="giba-nav-cta" onClick={handleStartTrial}>Começar</button>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="giba-landing-hero">
        <div className="giba-hero-bg">
          <div className="giba-hero-glow giba-hero-glow-1"></div>
          <div className="giba-hero-glow giba-hero-glow-2"></div>
        </div>
        
        <div className="giba-hero-content">
          <div className="giba-hero-badge">
            <span className="giba-badge-dot"></span>
            <span>Análise visual do corpo</span>
          </div>
          
          <h1 className="giba-hero-title">
            Seu <span className="giba-highlight">corpo único</span> merece um plano <span className="giba-highlight">único</span>
          </h1>
          
          <p className="giba-hero-subtitle">
            Dieta personalizada + treino sob medida baseado no seu biotipo. Sem fórmulas genéricas. Resultados reais.
          </p>

          <div className="giba-hero-actions">
            <button className="giba-btn-primary giba-btn-glow" onClick={handleStartTrial}>
              <span>Criar meu plano</span>
              <span className="giba-btn-arrow">→</span>
            </button>
            {installPrompt && !isInstalled && (
              <button className="giba-btn-secondary" onClick={handleInstallApp}>
                <span>📲</span>
                <span>Instalar App</span>
              </button>
            )}
          </div>

          <div className="giba-hero-trust">
            <div className="giba-trust-item">
              <span className="giba-trust-check">✓</span>
              <span>7 dias grátis</span>
            </div>
            <div className="giba-trust-item">
              <span className="giba-trust-check">✓</span>
              <span>Cancele quando quiser</span>
            </div>
            <div className="giba-trust-item">
              <span className="giba-trust-check">✓</span>
              <span>App para celular</span>
            </div>
          </div>
        </div>

        <div className="giba-hero-visual">
          <div className="giba-phone-frame">
            <div className="giba-phone-notch"></div>
            <div className="giba-phone-screen">
              <div className="giba-app-preview">
                <div className="giba-preview-header">
                  <span className="giba-preview-emoji">👋</span>
                  <div>
                    <p className="giba-preview-hello">Olá!</p>
                    <p className="giba-preview-sub">Pronto para treinar?</p>
                  </div>
                </div>
                <div className="giba-preview-stats">
                  <div className="giba-preview-stat">
                    <span className="giba-stat-icon">🔥</span>
                    <span className="giba-stat-value">7</span>
                    <span className="giba-stat-label">dias</span>
                  </div>
                  <div className="giba-preview-stat">
                    <span className="giba-stat-icon">💪</span>
                    <span className="giba-stat-value">23</span>
                    <span className="giba-stat-label">treinos</span>
                  </div>
                </div>
                <div className="giba-preview-card">
                  <span className="giba-card-icon">🏋️</span>
                  <div className="giba-card-info">
                    <p className="giba-card-title">Treino A</p>
                    <p className="giba-card-sub">Superior</p>
                  </div>
                  <span className="giba-card-play">▶</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="giba-float-card giba-float-1">
            <span>📷</span>
            <div>
              <p className="giba-fc-title">Análise Visual</p>
              <p className="giba-fc-sub">Treino personalizado</p>
            </div>
          </div>
          
          <div className="giba-float-card giba-float-2">
            <span>🍎</span>
            <div>
              <p className="giba-fc-title">Dieta Flexível</p>
              <p className="giba-fc-sub">Substituições fáceis</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FUNCIONALIDADES ========== */}
      <section className="giba-landing-section" id="funcionalidades">
        <div className="giba-section-header">
          <span className="giba-section-badge">Funcionalidades</span>
          <h2 className="giba-section-title">Tudo em um só lugar</h2>
          <p className="giba-section-sub">Plataforma completa para transformar seu corpo</p>
        </div>

        <div className="giba-features-grid">
          <div className="giba-feature-card giba-feature-main">
            <div className="giba-feature-icon">📷</div>
            <h3>Análise Visual do Corpo</h3>
            <p>Envie suas fotos e receba um treino baseado no seu biotipo, pontos fortes e áreas que precisam de mais atenção.</p>
            <div className="giba-feature-demo">
              <div className="giba-demo-photo">📸</div>
              <div className="giba-demo-arrow">→</div>
              <div className="giba-demo-results">
                <span className="giba-demo-result">✓ Ombros: bom</span>
                <span className="giba-demo-result">↑ Pernas: foco</span>
              </div>
            </div>
          </div>

          <div className="giba-feature-card">
            <div className="giba-feature-icon">🍽️</div>
            <h3>Dieta Personalizada</h3>
            <p>Plano alimentar completo com todas as refeições, calorias e macros calculados.</p>
            <ul className="giba-feature-list">
              <li>Todas as refeições do dia</li>
              <li>Substituições para cada alimento</li>
              <li>Calorias e macros calculados</li>
            </ul>
          </div>

          <div className="giba-feature-card">
            <div className="giba-feature-icon">🏋️</div>
            <h3>Treino Sob Medida</h3>
            <p>Exercícios explicados de forma simples, sem jargões técnicos confusos.</p>
            <ul className="giba-feature-list">
              <li>Explicação clara de cada exercício</li>
              <li>Timer de descanso integrado</li>
              <li>Registre cada treino feito</li>
            </ul>
          </div>

          <div className="giba-feature-card">
            <div className="giba-feature-icon">📊</div>
            <h3>Dashboard de Progresso</h3>
            <p>Acompanhe sua evolução com calendário semanal e métricas que motivam.</p>
            <ul className="giba-feature-list">
              <li>Calendário visual de treinos</li>
              <li>Streak de dias seguidos</li>
              <li>Comparação de fotos</li>
            </ul>
          </div>

          <div className="giba-feature-card">
            <div className="giba-feature-icon">👥</div>
            <h3>Projetos em Grupo</h3>
            <p>Desafios com amigos. Pontuação, ranking e motivação coletiva.</p>
            <ul className="giba-feature-list">
              <li>Crie ou entre em grupos</li>
              <li>Sistema de pontos e ranking</li>
              <li>Desafios e conquistas</li>
            </ul>
          </div>

          <div className="giba-feature-card">
            <div className="giba-feature-icon">📱</div>
            <h3>App no Celular</h3>
            <p>Instale como app e use offline. Funciona em qualquer celular.</p>
            <ul className="giba-feature-list">
              <li>Instale em 2 toques</li>
              <li>Funciona offline</li>
              <li>Notificações de treino</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========== COMO FUNCIONA ========== */}
      <section className="giba-landing-section giba-section-alt" id="como-funciona">
        <div className="giba-section-header">
          <span className="giba-section-badge">Jornada</span>
          <h2 className="giba-section-title">Como funciona</h2>
          <p className="giba-section-sub">Em 4 passos simples</p>
        </div>

        <div className="giba-journey">
          <div className="giba-journey-line"></div>
          
          <div className="giba-journey-step">
            <div className="giba-step-number">1</div>
            <div className="giba-step-content">
              <span className="giba-step-icon">💬</span>
              <h3>Responda o questionário</h3>
              <p>Conversa simples sobre objetivos, rotina e preferências. Menos de 5 minutos.</p>
            </div>
          </div>

          <div className="giba-journey-step">
            <div className="giba-step-number">2</div>
            <div className="giba-step-content">
              <span className="giba-step-icon">📷</span>
              <h3>Envie suas fotos</h3>
              <p>Fotos de frente e costas para análise visual. Identificamos seu biotipo.</p>
            </div>
          </div>

          <div className="giba-journey-step">
            <div className="giba-step-number">3</div>
            <div className="giba-step-content">
              <span className="giba-step-icon">🎯</span>
              <h3>Receba seu plano</h3>
              <p>Dieta completa e treino semanal em segundos. Tudo explicado de forma clara.</p>
            </div>
          </div>

          <div className="giba-journey-step">
            <div className="giba-step-number">4</div>
            <div className="giba-step-content">
              <span className="giba-step-icon">🚀</span>
              <h3>Transforme seu corpo</h3>
              <p>Siga o plano, registre treinos e veja seu progresso no dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== DEPOIMENTOS ========== */}
      <section className="giba-landing-section">
        <div className="giba-section-header">
          <span className="giba-section-badge">Resultados</span>
          <h2 className="giba-section-title">Histórias de transformação</h2>
          <p className="giba-section-sub">Pessoas reais com resultados reais</p>
        </div>

        <div className="giba-testimonials">
          <div className="giba-testimonial">
            <p className="giba-testimonial-quote">"Perdi 12kg em 4 meses. A dieta tem substituições que me salvam quando não encontro algo. O treino é explicado de um jeito que até eu entendi!"</p>
            <div className="giba-testimonial-author">
              <div className="giba-author-avatar">R</div>
              <div>
                <strong>Renata, 32 anos</strong>
                <span>Objetivo: Emagrecimento</span>
              </div>
            </div>
            <div className="giba-testimonial-result">
              <span className="giba-result-badge">-12kg</span>
              <span>em 4 meses</span>
            </div>
          </div>

          <div className="giba-testimonial">
            <p className="giba-testimonial-quote">"A análise das fotos identificou que minhas pernas eram o ponto fraco. O treino focou nisso e em 3 meses já vejo diferença absurda."</p>
            <div className="giba-testimonial-author">
              <div className="giba-author-avatar">M</div>
              <div>
                <strong>Marcos, 28 anos</strong>
                <span>Objetivo: Hipertrofia</span>
              </div>
            </div>
            <div className="giba-testimonial-result">
              <span className="giba-result-badge">+8kg</span>
              <span>massa magra</span>
            </div>
          </div>

          <div className="giba-testimonial">
            <p className="giba-testimonial-quote">"Nunca consegui seguir dieta por mais de 2 semanas. Com as substituições e o app no celular, já são 6 meses mantendo meu peso ideal."</p>
            <div className="giba-testimonial-author">
              <div className="giba-author-avatar">C</div>
              <div>
                <strong>Carla, 35 anos</strong>
                <span>Objetivo: Manutenção</span>
              </div>
            </div>
            <div className="giba-testimonial-result">
              <span className="giba-result-badge">6 meses</span>
              <span>peso estável</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PLANOS ========== */}
      <section className="giba-landing-section giba-section-alt" id="planos">
        <div className="giba-section-header">
          <span className="giba-section-badge">Planos</span>
          <h2 className="giba-section-title">Invista na sua transformação</h2>
          <p className="giba-section-sub">Menos que um lanche por dia</p>
        </div>

        <div className="giba-pricing-compare">
          <div className="giba-compare-item giba-compare-bad">
            <span>❌</span>
            <span>Dieta da internet: R$0 + frustração</span>
          </div>
          <div className="giba-compare-item giba-compare-bad">
            <span>❌</span>
            <span>Personal + Nutricionista: R$500-1000/mês</span>
          </div>
          <div className="giba-compare-item giba-compare-good">
            <span>✓</span>
            <span>Giba App: A partir de R$2,23/dia</span>
          </div>
        </div>

        <div className="giba-pricing-grid">
          <div className="giba-pricing-card">
            <h3>Mensal</h3>
            <div className="giba-pricing-price">
              <span className="giba-price-currency">R$</span>
              <span className="giba-price-value">97</span>
              <span className="giba-price-period">/mês</span>
            </div>
            <ul className="giba-pricing-features">
              <li><span className="giba-check">✓</span> Dieta personalizada</li>
              <li><span className="giba-check">✓</span> Treino com análise visual</li>
              <li><span className="giba-check">✓</span> Dashboard de progresso</li>
              <li><span className="giba-check">✓</span> Projetos em grupo</li>
              <li><span className="giba-check">✓</span> Suporte via chat</li>
            </ul>
            <button className="giba-btn-secondary giba-btn-block" onClick={() => handleCheckout('monthly')}>
              Começar agora
            </button>
          </div>

          <div className="giba-pricing-card giba-pricing-featured">
            <div className="giba-pricing-badge">Mais escolhido</div>
            <h3>Trimestral</h3>
            <div className="giba-pricing-price">
              <span className="giba-price-currency">R$</span>
              <span className="giba-price-value">77</span>
              <span className="giba-price-period">/mês</span>
            </div>
            <p className="giba-pricing-billing">R$231 a cada 3 meses</p>
            <p className="giba-pricing-save">Economize R$60</p>
            <ul className="giba-pricing-features">
              <li><span className="giba-check">✓</span> Tudo do mensal</li>
              <li><span className="giba-check">✓</span> Economia de 20%</li>
              <li><span className="giba-check">✓</span> Suporte prioritário</li>
              <li><span className="giba-check">✓</span> Relatórios de evolução</li>
            </ul>
            <button className="giba-btn-primary giba-btn-block giba-btn-glow" onClick={() => handleCheckout('quarterly')}>
              Começar agora
            </button>
          </div>

          <div className="giba-pricing-card">
            <h3>Anual</h3>
            <div className="giba-pricing-price">
              <span className="giba-price-currency">R$</span>
              <span className="giba-price-value">67</span>
              <span className="giba-price-period">/mês</span>
            </div>
            <p className="giba-pricing-billing">R$804 por ano</p>
            <p className="giba-pricing-save">Economize R$360</p>
            <ul className="giba-pricing-features">
              <li><span className="giba-check">✓</span> Tudo do mensal</li>
              <li><span className="giba-check">✓</span> Economia de 31%</li>
              <li><span className="giba-check">✓</span> Acesso vitalício a updates</li>
              <li><span className="giba-check">✓</span> E-book de receitas</li>
            </ul>
            <button className="giba-btn-secondary giba-btn-block" onClick={() => handleCheckout('yearly')}>
              Começar agora
            </button>
          </div>
        </div>

        <div className="giba-guarantee">
          <span className="giba-guarantee-icon">🛡️</span>
          <div>
            <strong>Garantia de 7 dias</strong>
            <p>Não gostou? Devolvemos 100% do valor. Sem burocracia.</p>
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="giba-landing-section">
        <div className="giba-section-header">
          <span className="giba-section-badge">Dúvidas</span>
          <h2 className="giba-section-title">Perguntas frequentes</h2>
        </div>

        <div className="giba-faq">
          {[
            { q: 'Como a dieta é criada?', a: 'Suas respostas no questionário são analisadas para criar um plano alimentar personalizado com todas as refeições, calorias e macronutrientes calculados para você.' },
            { q: 'Como funciona a análise das fotos?', a: 'Você envia fotos de frente e costas. Analisamos seu biotipo e criamos um treino que respeita suas características. Suas fotos são privadas.' },
            { q: 'Posso trocar alimentos da dieta?', a: 'Sim! Cada alimento tem opções de substituição equivalentes. Não gosta de brócolis? Troque por outro vegetal sem problemas.' },
            { q: 'Preciso de academia?', a: 'Não necessariamente. No questionário você indica onde treina e o plano é adaptado para academia, casa ou ao ar livre.' },
            { q: 'O app funciona no celular?', a: 'Sim! Você pode instalar como app no seu celular e usar mesmo offline. Funciona em qualquer smartphone.' },
            { q: 'Posso cancelar quando quiser?', a: 'Sim! Cancele a qualquer momento na área de perfil. Sem taxas, sem burocracia.' }
          ].map((item, index) => (
            <div key={index} className={`giba-faq-item ${activeFaq === index ? 'active' : ''}`}>
              <button className="giba-faq-question" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                <span>{item.q}</span>
                <span className="giba-faq-icon">{activeFaq === index ? '−' : '+'}</span>
              </button>
              <div className="giba-faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="giba-landing-cta">
        <div className="giba-cta-bg">
          <div className="giba-cta-glow giba-cta-glow-1"></div>
          <div className="giba-cta-glow giba-cta-glow-2"></div>
        </div>
        <div className="giba-cta-content">
          <h2>Pronto para transformar seu corpo?</h2>
          <p>Comece agora com 7 dias grátis. Sem compromisso.</p>
          <button className="giba-btn-primary giba-btn-xl giba-btn-glow" onClick={handleStartTrial}>
            <span>Criar meu plano personalizado</span>
            <span className="giba-btn-arrow">→</span>
          </button>
          <p className="giba-cta-note">+3.200 pessoas começaram este mês</p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="giba-landing-footer">
        <div className="giba-footer-main">
          <div className="giba-footer-brand">
            <div className="giba-footer-logo">
              <span>💪</span>
              <span>Giba</span>
            </div>
            <p>Transforme seu corpo com ciência e praticidade.</p>
          </div>
          <div className="giba-footer-links">
            <div className="giba-footer-col">
              <h4>Produto</h4>
              <button onClick={() => scrollTo('funcionalidades')}>Funcionalidades</button>
              <button onClick={() => scrollTo('como-funciona')}>Como funciona</button>
              <button onClick={() => scrollTo('planos')}>Planos</button>
            </div>
            <div className="giba-footer-col">
              <h4>Suporte</h4>
              <a href="#">Central de Ajuda</a>
              <a href="#">Contato</a>
              <a href="#">Termos de Uso</a>
            </div>
            <div className="giba-footer-col">
              <h4>Redes</h4>
              <a href="#">Instagram</a>
              <a href="#">TikTok</a>
              <a href="#">YouTube</a>
            </div>
          </div>
        </div>
        <div className="giba-footer-bottom">
          <p>© 2026 Giba App. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* ========== STICKY CTA MOBILE ========== */}
      <div className="giba-sticky-cta">
        <button className="giba-btn-primary giba-btn-block" onClick={handleStartTrial}>
          <span>Começar agora</span>
          <span className="giba-sticky-badge">7 dias grátis</span>
        </button>
      </div>

      {/* ========== EMAIL MODAL ========== */}
      {showEmailModal && (
        <div className="giba-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="giba-modal" onClick={e => e.stopPropagation()}>
            <div className="giba-modal-header">
              <h3>Informe seu email</h3>
              <p>Para criar sua conta e processar o pagamento</p>
            </div>
            <div className="giba-modal-body">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="giba-modal-footer">
              <button className="giba-btn-secondary" onClick={() => setShowEmailModal(false)}>Cancelar</button>
              <button className="giba-btn-primary" disabled={checkoutLoading} onClick={() => {
                if (email?.includes('@')) {
                  setShowEmailModal(false)
                  handleCheckout(selectedPlan, email)
                }
              }}>
                {checkoutLoading ? 'Processando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing
