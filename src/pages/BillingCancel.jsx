import { useNavigate } from 'react-router-dom'
import './BillingCancel.css'

function BillingCancel() {
  const navigate = useNavigate()

  return (
    <div className="billing-cancel">
      <div className="billing-cancel-content">
        <div className="cancel-icon">✕</div>
        <h1>Pagamento cancelado</h1>
        <p>Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.</p>
        <p className="sub-text">Você ainda pode usar o teste grátis de 7 dias!</p>
        <div className="cancel-actions">
          <button className="btn cta" onClick={() => navigate('/landing')}>
            Ver planos novamente
          </button>
          <button className="btn outline" onClick={() => navigate('/login')}>
            Começar teste grátis
          </button>
        </div>
      </div>
    </div>
  )
}

export default BillingCancel
