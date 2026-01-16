import { useState, useEffect, useRef } from 'react'
import { API_URL } from '../config/api'
import './ChefVirtual.css'

function ChefVirtual({ refeicao }) {
  const [showModal, setShowModal] = useState(false)
  const [ingredientes, setIngredientes] = useState('')
  const [loading, setLoading] = useState(false)
  const [receita, setReceita] = useState(null)
  const [alternativas, setAlternativas] = useState([])
  const [mensagem, setMensagem] = useState('')
  const modalRef = useRef(null)
  const modalBodyRef = useRef(null)
  const overlayRef = useRef(null)
  
  const handleSuggest = async () => {
    if (!ingredientes.trim()) {
      alert('Digite os ingredientes que você tem!')
      return
    }
    
    setLoading(true)
    setReceita(null)
    setAlternativas([])
    
    try {
      const token = localStorage.getItem('token')
      const ingredientesList = ingredientes
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0)
      
      // Calcular macros alvo da refeição
      const macrosAlvo = {
        kcal: refeicao.totalRefeicaoKcal || 0,
        proteina_g: refeicao.itens?.reduce((sum, item) => sum + (item.macros?.proteina_g || 0), 0) || 0,
        carbo_g: refeicao.itens?.reduce((sum, item) => sum + (item.macros?.carbo_g || 0), 0) || 0,
        gordura_g: refeicao.itens?.reduce((sum, item) => sum + (item.macros?.gordura_g || 0), 0) || 0
      }
      
      const res = await fetch(`${API_URL}/chef/suggest-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          refeicaoNome: refeicao.nome,
          ingredientesDisponiveis: ingredientesList,
          macrosAlvo
        })
      })
      
      const data = await res.json()
      
      if (data.sucesso) {
        setReceita(data.receita)
        setAlternativas(data.alternativas || [])
        setMensagem(data.mensagem || '')
      } else {
        alert(data.mensagem || 'Não foi possível sugerir uma receita')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao buscar receita')
    } finally {
      setLoading(false)
    }
  }
  
  // Função removida - não aplicamos receita na dieta
  
  // #region agent log
  useEffect(() => {
    if (showModal) {
      // Delay para garantir que o DOM esteja renderizado
      const timeoutId = setTimeout(() => {
        if (modalRef.current && modalBodyRef.current && overlayRef.current) {
          const logData = {
            location: 'ChefVirtual.jsx:useEffect',
            message: 'Modal dimensions check',
            data: {
              viewportHeight: window.innerHeight,
              viewportWidth: window.innerWidth,
              modalHeight: modalRef.current.offsetHeight,
              modalScrollHeight: modalRef.current.scrollHeight,
              modalClientHeight: modalRef.current.clientHeight,
              modalScrollTop: modalRef.current.scrollTop,
              bodyHeight: modalBodyRef.current.offsetHeight,
              bodyScrollHeight: modalBodyRef.current.scrollHeight,
              bodyClientHeight: modalBodyRef.current.clientHeight,
              bodyScrollTop: modalBodyRef.current.scrollTop,
              overlayHeight: overlayRef.current.offsetHeight,
              overlayScrollHeight: overlayRef.current.scrollHeight,
              overlayScrollTop: overlayRef.current.scrollTop,
              bodyPaddingBottom: window.getComputedStyle(modalBodyRef.current).paddingBottom,
              modalOverflow: window.getComputedStyle(modalRef.current).overflowY,
              bodyOverflow: window.getComputedStyle(modalBodyRef.current).overflowY,
              modalDisplay: window.getComputedStyle(modalRef.current).display,
              modalFlexDirection: window.getComputedStyle(modalRef.current).flexDirection,
              bodyFlex: window.getComputedStyle(modalBodyRef.current).flex,
              hasReceita: !!receita,
              hasAlternativas: alternativas.length > 0,
              canScrollModal: modalRef.current.scrollHeight > modalRef.current.clientHeight,
              canScrollBody: modalBodyRef.current.scrollHeight > modalBodyRef.current.clientHeight,
              canScrollOverlay: overlayRef.current.scrollHeight > overlayRef.current.clientHeight
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A,B,C,D,E,F'
          }
          fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
          }).catch(() => {})
        }
      }, 100)
      
      // Listener de scroll
      const handleScroll = () => {
        if (modalRef.current && modalBodyRef.current && overlayRef.current) {
          const scrollData = {
            location: 'ChefVirtual.jsx:handleScroll',
            message: 'Scroll position check',
            data: {
              modalScrollTop: modalRef.current.scrollTop,
              modalScrollMax: modalRef.current.scrollHeight - modalRef.current.clientHeight,
              bodyScrollTop: modalBodyRef.current.scrollTop,
              bodyScrollMax: modalBodyRef.current.scrollHeight - modalBodyRef.current.clientHeight,
              overlayScrollTop: overlayRef.current.scrollTop,
              overlayScrollMax: overlayRef.current.scrollHeight - overlayRef.current.clientHeight
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A,B'
          }
          fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scrollData)
          }).catch(() => {})
        }
      }
      
      const modalEl = modalRef.current
      const bodyEl = modalBodyRef.current
      const overlayEl = overlayRef.current
      
      if (modalEl) modalEl.addEventListener('scroll', handleScroll)
      if (bodyEl) bodyEl.addEventListener('scroll', handleScroll)
      if (overlayEl) overlayEl.addEventListener('scroll', handleScroll)
      
      return () => {
        clearTimeout(timeoutId)
        if (modalEl) modalEl.removeEventListener('scroll', handleScroll)
        if (bodyEl) bodyEl.removeEventListener('scroll', handleScroll)
        if (overlayEl) overlayEl.removeEventListener('scroll', handleScroll)
      }
    }
  }, [showModal, receita, alternativas])
  // #endregion
  
  return (
    <>
      <button 
        className="giba-chef-btn"
        onClick={() => setShowModal(true)}
      >
        <span className="giba-chef-btn-icon">🍳</span>
        <span>O que fazer agora?</span>
      </button>
      
      {showModal && (
        <div 
          ref={overlayRef}
          className="giba-chef-modal-overlay" 
          onClick={() => setShowModal(false)}
        >
          <div 
            ref={modalRef}
            className="giba-chef-modal" 
            onClick={e => e.stopPropagation()}
          >
            <div className="giba-chef-header">
              <button 
                className="giba-chef-close"
                onClick={() => setShowModal(false)}
              >×</button>
              <h2>Chef Virtual</h2>
              <p className="giba-chef-subtitle">
                {refeicao.nome} - {refeicao.totalRefeicaoKcal} kcal
              </p>
            </div>
            
            <div className="giba-chef-input-section">
              <label className="giba-chef-label">O que você tem em casa?</label>
              <input
                type="text"
                className="giba-chef-input"
                placeholder="Ex: frango, arroz, brócolis, ovo..."
                value={ingredientes}
                onChange={e => setIngredientes(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !loading && handleSuggest()}
                disabled={loading}
              />
              <small className="giba-chef-hint">Separe os ingredientes por vírgula</small>
            </div>
            
            <div ref={modalBodyRef} className="giba-chef-modal-body">
              <button 
                className="giba-btn-primary giba-btn-block"
                onClick={handleSuggest}
                disabled={loading || !ingredientes.trim()}
              >
                {loading ? '🍳 Pensando...' : 'Sugerir receita'}
              </button>
              
              {receita && (
                <div className="giba-chef-recipe">
                  <div className={`giba-chef-badge giba-chef-badge-${receita.tipo || 'reducao_danos'}`}>
                    <span className="giba-chef-badge-icon">
                      {receita.tipo === 'perfeito' ? '🎯' : '⚖️'}
                    </span>
                    <div>
                      <strong>
                        {receita.tipo === 'perfeito' ? 'Perfeito!' : 'Redução de danos'}
                      </strong>
                      <span>{Math.round(receita.score)}% compatível</span>
                    </div>
                  </div>
                  
                  <h3 className="giba-chef-recipe-title">{receita.nome}</h3>
                  {receita.descricao && (
                    <p className="giba-chef-recipe-desc">{receita.descricao}</p>
                  )}
                  
                  {mensagem && (
                    <div className="giba-chef-mensagem">{mensagem}</div>
                  )}
                  
                  <div className="giba-chef-macros">
                    <div className="giba-chef-macro-item">
                      <span className="giba-chef-macro-value">{receita.valoresNutricionais.kcal}</span>
                      <span className="giba-chef-macro-label">kcal</span>
                    </div>
                    <div className="giba-chef-macro-item">
                      <span className="giba-chef-macro-value">{Math.round(receita.valoresNutricionais.proteina_g)}g</span>
                      <span className="giba-chef-macro-label">proteína</span>
                    </div>
                    <div className="giba-chef-macro-item">
                      <span className="giba-chef-macro-value">{Math.round(receita.valoresNutricionais.carbo_g)}g</span>
                      <span className="giba-chef-macro-label">carbo</span>
                    </div>
                    <div className="giba-chef-macro-item">
                      <span className="giba-chef-macro-value">{Math.round(receita.valoresNutricionais.gordura_g)}g</span>
                      <span className="giba-chef-macro-label">gordura</span>
                    </div>
                  </div>
                  
                  {receita.ajusteNecessario && Math.abs(receita.ajusteNecessario.kcal) > 20 && (
                    <div className="giba-chef-ajuste">
                      <strong>Ajuste necessário:</strong>
                      {receita.ajusteNecessario.kcal > 0 ? (
                        <span className="giba-chef-ajuste-pos">+{Math.round(receita.ajusteNecessario.kcal)} kcal</span>
                      ) : (
                        <span className="giba-chef-ajuste-neg">{Math.round(receita.ajusteNecessario.kcal)} kcal</span>
                      )}
                    </div>
                  )}
                  
                  <div className="giba-chef-ingredientes">
                    <h4>Ingredientes:</h4>
                    <ul>
                      {receita.ingredientes?.map((ing, i) => {
                        const ingNome = typeof ing === 'string' ? ing : ing.nome
                        const quantidade = typeof ing === 'string' ? '150g' : (ing.quantidade || '150g')
                        const tem = typeof ing === 'string' 
                          ? ingredientes.toLowerCase().includes(ing.toLowerCase())
                          : (ing.tem !== false)
                        
                        return (
                          <li key={i} className={tem ? 'giba-chef-ing-tem' : 'giba-chef-ing-falta'}>
                            <span className="giba-chef-ing-icon">{tem ? '✓' : '✗'}</span>
                            <span>{ingNome} - {quantidade}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  
                  {receita.passos && receita.passos.length > 0 && (
                    <div className="giba-chef-passos">
                      <h4>Modo de preparo:</h4>
                      <ol>
                        {receita.passos.map((passo, i) => (
                          <li key={i}>{passo}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  <div className="giba-chef-info-box">
                    <p>💡 Esta receita é uma sugestão para quando você não conseguir seguir a refeição planejada. Use como alternativa quando necessário!</p>
                  </div>
                </div>
              )}
              
              {alternativas && alternativas.length > 0 && (
                <div className="giba-chef-alternativas">
                  <h4>Outras opções:</h4>
                  {alternativas.map((alt, i) => (
                    <div 
                      key={i} 
                      className="giba-chef-alt-card"
                      onClick={() => {
                        setReceita(alt)
                        setAlternativas(alternativas.filter((_, idx) => idx !== i))
                      }}
                    >
                      <strong>{alt.nome}</strong>
                      <span>{Math.round(alt.score)}% compatível</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChefVirtual
