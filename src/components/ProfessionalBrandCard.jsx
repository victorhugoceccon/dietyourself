import { useBranding } from '../hooks/useBranding'
import './ProfessionalBrandCard.css'

function getInitials(text) {
  if (!text) return '?'
  const parts = String(text).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfessionalBrandCard({ professionalUserId, roleLabel }) {
  const { branding, loading } = useBranding(professionalUserId)

  if (!professionalUserId) return null
  if (loading) return null
  if (!branding) return null

  const brandTitle = branding.brandName || roleLabel || 'Profissional'

  return (
    <div className="pro-brand-card">
      {branding.bannerUrl ? (
        <div className="pro-brand-card__banner">
          <img src={branding.bannerUrl} alt={`Banner de ${brandTitle}`} />
        </div>
      ) : (
        <div className="pro-brand-card__banner pro-brand-card__banner--fallback" />
      )}

      <div className="pro-brand-card__content">
        <div className="pro-brand-card__logo">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={`Logo de ${brandTitle}`} />
          ) : (
            <div className="pro-brand-card__logo-fallback">
              {getInitials(brandTitle)}
            </div>
          )}
        </div>

        <div className="pro-brand-card__text">
          <div className="pro-brand-card__title">{brandTitle}</div>
          {roleLabel && <div className="pro-brand-card__subtitle">{roleLabel}</div>}
        </div>
      </div>
    </div>
  )
}

export default ProfessionalBrandCard


