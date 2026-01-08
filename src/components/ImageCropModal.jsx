import { useCallback, useMemo, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Modal } from './ui'
import { getCroppedBannerDataUrl } from '../utils/imageCrop'
import './ImageCropModal.css'

function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onConfirm,
  title = 'Ajustar banner',
  subtitle = 'Arraste e dê zoom para escolher a área que vai aparecer.',
  aspect = 3 / 1,
  confirmLabel = 'USAR ESTA IMAGEM',
  output = { maxWidth: 1200, mimeType: 'image/jpeg', quality: 0.88 }
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  const canSave = useMemo(() => !!imageSrc && !!croppedAreaPixels && !saving, [imageSrc, croppedAreaPixels, saving])

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = async () => {
    try {
      if (!croppedAreaPixels || !imageSrc) return
      setSaving(true)
      const dataUrl = await getCroppedBannerDataUrl(imageSrc, croppedAreaPixels, {
        rotation,
        maxWidth: output?.maxWidth ?? 1200,
        mimeType: output?.mimeType ?? 'image/jpeg',
        quality: output?.quality ?? 0.88
      })
      onConfirm?.(dataUrl)
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || 'Erro ao recortar imagem')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="lg"
      footer={(
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!canSave}>
            {saving ? 'Salvando...' : confirmLabel}
          </button>
        </>
      )}
    >
      {!imageSrc ? (
        <div className="crop-empty">Selecione uma imagem para ajustar.</div>
      ) : (
        <>
          <div className="crop-area">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              objectFit="horizontal-cover"
            />
          </div>

          <div className="crop-controls">
            <label className="crop-control">
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
            <label className="crop-control">
              <span>Girar</span>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
              />
            </label>
          </div>
        </>
      )}
    </Modal>
  )
}

export default ImageCropModal


