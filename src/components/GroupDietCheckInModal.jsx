import { useState } from 'react'
import { Modal } from './ui'
import PhotoMealCapture from './PhotoMealCapture'
import { API_URL } from '../config/api'
import './GroupDietCheckInModal.css'

function GroupDietCheckInModal({ isOpen, onClose, grupoId, onCreated }) {
  const [step, setStep] = useState('capture') // 'capture' ou 'details'
  const [photoMealData, setPhotoMealData] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoSuccess = (data) => {
    setPhotoMealData(data)
    setStep('details')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!photoMealData) return

    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/groups/${grupoId}/dieta-checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          photoMealId: photoMealData.photoMeal?.id || null,
          photoUrl: photoMealData.photoUrl,
          title: title.trim() || null,
          description: description.trim() || null,
          totalKcal: photoMealData.totalKcal,
          totalProtein: photoMealData.totalProtein,
          totalCarbs: photoMealData.totalCarbs,
          totalFat: photoMealData.totalFat,
          mealName: photoMealData.mealName || photoMealData.photoMeal?.mealName || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar check-in de dieta')
      }

      // Limpar formulário
      setPhotoMealData(null)
      setTitle('')
      setDescription('')
      setStep('capture')

      if (onCreated) {
        onCreated()
      }
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Erro ao criar check-in de dieta:', error)
      setError(error.message || 'Erro ao criar check-in de dieta')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    setStep('capture')
    setPhotoMealData(null)
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'capture' ? 'Check-in de Dieta' : 'Detalhes do Check-in'}
      subtitle={step === 'capture' ? 'Tire uma foto do seu prato' : 'Adicione informações opcionais'}
      size="lg"
      closeOnOverlay={false}
      className="lifefit-modal--scroll-body"
      footer={step === 'details' ? (
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={saving}
          >
            Voltar
          </button>
          <button
            type="submit"
            form="diet-checkin-form"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Publicando...' : 'Publicar'}
          </button>
        </>
      ) : null}
    >
      {step === 'capture' ? (
        <div className="group-diet-checkin-capture">
          <PhotoMealCapture
            onClose={onClose}
            onSuccess={handlePhotoSuccess}
            showCloseButton={false}
          />
        </div>
      ) : (
        <form id="diet-checkin-form" onSubmit={handleSubmit} className="group-diet-checkin-form">
          {error && (
            <div className="group-diet-checkin-error">{error}</div>
          )}

          {photoMealData && (
            <>
              <div className="group-diet-checkin-preview">
                <img src={photoMealData.photoUrl} alt="Prato" />
                <div className="group-diet-checkin-nutrition">
                  <h3>{photoMealData.mealName || 'Refeição'}</h3>
                  <div className="group-diet-checkin-macros">
                    <div className="group-diet-macro">
                      <span className="macro-icon">🔥</span>
                      <span className="macro-value">{Math.round(photoMealData.totalKcal)}</span>
                      <span className="macro-label">kcal</span>
                    </div>
                    <div className="group-diet-macro">
                      <span className="macro-icon">💪</span>
                      <span className="macro-value">{Math.round(photoMealData.totalProtein)}g</span>
                      <span className="macro-label">proteína</span>
                    </div>
                    <div className="group-diet-macro">
                      <span className="macro-icon">🍞</span>
                      <span className="macro-value">{Math.round(photoMealData.totalCarbs)}g</span>
                      <span className="macro-label">carboidratos</span>
                    </div>
                    <div className="group-diet-macro">
                      <span className="macro-icon">🥑</span>
                      <span className="macro-value">{Math.round(photoMealData.totalFat)}g</span>
                      <span className="macro-label">gordura</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group-diet-checkin-field">
                <label>
                  Título <span className="optional">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Almoço delicioso!"
                  maxLength={100}
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="group-diet-checkin-field">
                <label>
                  Descrição <span className="optional">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte sobre sua refeição..."
                  rows={3}
                  maxLength={500}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </>
          )}
        </form>
      )}
    </Modal>
  )
}

export default GroupDietCheckInModal
