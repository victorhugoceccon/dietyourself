import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import ImageCropModal from './ImageCropModal'
import './BrandingSettings.css'

function BrandingSettings() {
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    logoUrl: '',
    bannerUrl: '',
    primaryColor: '#4CAF50',
    secondaryColor: '#8BC34A',
    accentColor: '#66BB6A',
    brandName: ''
  })
  const [pendingImageSrc, setPendingImageSrc] = useState('')
  const [pendingField, setPendingField] = useState(null) // 'logoUrl' | 'bannerUrl'
  const [showCrop, setShowCrop] = useState(false)

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/branding`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          setBranding(data.branding)
          setFormData({
            logoUrl: data.branding.logoUrl || '',
            bannerUrl: data.branding.bannerUrl || '',
            primaryColor: data.branding.primaryColor || '#4CAF50',
            secondaryColor: data.branding.secondaryColor || '#8BC34A',
            accentColor: data.branding.accentColor || '#66BB6A',
            brandName: data.branding.brandName || ''
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar branding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = async (field, file) => {
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida')
      return
    }

    // Limitar tamanho antes de abrir o crop (evita travar)
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo de 2MB.')
      return
    }

    // Converter para base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setPendingField(field)
      setPendingImageSrc(base64String)
      setShowCrop(true)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/branding`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setBranding(data.branding)
        alert('Configurações de branding salvas com sucesso!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar branding:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="branding-settings-loading">Carregando...</div>
  }

  return (
    <div className="branding-settings">
      <div className="branding-header">
        <h2>Configurações de Branding</h2>
        <p className="branding-subtitle">
          Personalize a aparência da sua área e da área dos seus pacientes
        </p>
      </div>

      <div className="branding-content">
        {/* Logo */}
        <div className="branding-section">
          <label className="branding-label">Logo</label>
          <div className="image-upload-container">
            {formData.logoUrl && (
              <div className="image-preview">
                <img src={formData.logoUrl} alt="Logo preview" />
                <button
                  className="remove-image-btn"
                  onClick={() => handleInputChange('logoUrl', '')}
                >
                  ✕
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('logoUrl', e.target.files[0])}
              className="file-input"
            />
            <input
              type="text"
              placeholder="Ou cole a URL da imagem"
              value={formData.logoUrl}
              onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              className="url-input"
            />
          </div>
        </div>

        {/* Banner */}
        <div className="branding-section">
          <label className="branding-label">Banner</label>
          <div className="image-upload-container">
            {formData.bannerUrl && (
              <div className="image-preview banner-preview">
                <img src={formData.bannerUrl} alt="Banner preview" />
                <button
                  className="remove-image-btn"
                  onClick={() => handleInputChange('bannerUrl', '')}
                >
                  ✕
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('bannerUrl', e.target.files[0])}
              className="file-input"
            />
            <input
              type="text"
              placeholder="Ou cole a URL da imagem"
              value={formData.bannerUrl}
              onChange={(e) => handleInputChange('bannerUrl', e.target.value)}
              className="url-input"
            />
          </div>
        </div>

        <ImageCropModal
          isOpen={showCrop}
          onClose={() => {
            setShowCrop(false)
            setPendingField(null)
            setPendingImageSrc('')
          }}
          imageSrc={pendingImageSrc}
          title={pendingField === 'logoUrl' ? 'Ajustar logo' : 'Ajustar banner'}
          subtitle={pendingField === 'logoUrl'
            ? 'Centralize e recorte a área que vai aparecer como logo.'
            : 'Selecione a área que vai aparecer no banner.'}
          aspect={pendingField === 'logoUrl' ? 1 : 3 / 1}
          confirmLabel="USAR ESTA IMAGEM"
          output={pendingField === 'logoUrl'
            ? { maxWidth: 512, mimeType: 'image/jpeg', quality: 0.9 }
            : { maxWidth: 1400, mimeType: 'image/jpeg', quality: 0.88 }}
          onConfirm={(dataUrl) => {
            if (pendingField) {
              handleInputChange(pendingField, dataUrl)
            }
            setShowCrop(false)
            setPendingField(null)
            setPendingImageSrc('')
          }}
        />

        {/* Nome da Marca */}
        <div className="branding-section">
          <label className="branding-label">Nome da Marca</label>
          <input
            type="text"
            placeholder="Ex: Academia Fitness"
            value={formData.brandName}
            onChange={(e) => handleInputChange('brandName', e.target.value)}
            className="text-input"
          />
          <p className="input-hint">Usado quando não houver logo</p>
        </div>


        {/* Preview removido (evita poluição visual na tela) */}

        {/* Botão Salvar */}
        <div className="branding-actions">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrandingSettings





