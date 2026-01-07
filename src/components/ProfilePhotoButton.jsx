import { useMemo, useRef, useState } from 'react'
import { API_URL } from '../config/api'
import ImageCropModal from './ImageCropModal'
import './ProfilePhotoButton.css'

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return '?'
  const parts = String(nameOrEmail).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfilePhotoButton({ user, onUserUpdated }) {
  const token = useMemo(() => localStorage.getItem('token'), [])
  const fileRef = useRef(null)
  const [pendingSrc, setPendingSrc] = useState('')
  const [showCrop, setShowCrop] = useState(false)
  const [saving, setSaving] = useState(false)

  const displayName = user?.name || user?.email

  const openFilePicker = () => fileRef.current?.click()

  const saveProfilePhoto = async (profilePhoto) => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profilePhoto })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar foto de perfil')

      const stored = localStorage.getItem('user')
      if (stored) {
        const storedUser = JSON.parse(stored)
        const updatedUser = { ...storedUser, profilePhoto: data?.user?.profilePhoto ?? profilePhoto }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        onUserUpdated?.(updatedUser)
      } else {
        onUserUpdated?.(data?.user)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="profile-photo-btn"
        onClick={openFilePicker}
        title="Alterar foto de perfil"
        disabled={saving}
      >
        {user?.profilePhoto ? (
          <img className="profile-photo-btn__img" src={user.profilePhoto} alt={displayName || 'Foto de perfil'} />
        ) : (
          <span className="profile-photo-btn__fallback">{getInitials(displayName)}</span>
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="profile-photo-btn__file"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (!file.type.startsWith('image/')) {
            // eslint-disable-next-line no-alert
            alert('Selecione uma imagem válida')
            return
          }
          if (file.size > 2 * 1024 * 1024) {
            // eslint-disable-next-line no-alert
            alert('A imagem deve ter no máximo 2MB')
            return
          }
          const reader = new FileReader()
          reader.onloadend = () => {
            setPendingSrc(reader.result)
            setShowCrop(true)
          }
          reader.readAsDataURL(file)
        }}
      />

      <ImageCropModal
        isOpen={showCrop}
        onClose={() => {
          setShowCrop(false)
          setPendingSrc('')
        }}
        imageSrc={pendingSrc}
        title="Ajustar foto de perfil"
        subtitle="Centralize o rosto e ajuste o zoom."
        aspect={1}
        onConfirm={async (dataUrl) => {
          await saveProfilePhoto(dataUrl)
          setShowCrop(false)
          setPendingSrc('')
        }}
      />
    </>
  )
}

export default ProfilePhotoButton


