import { useEffect, useState } from 'react'
import { useBranding } from '../hooks/useBranding'

function BrandingProvider({ children, professionalUserId = null }) {
  const { branding, loading } = useBranding(professionalUserId)
  const [stylesApplied, setStylesApplied] = useState(false)

  useEffect(() => {
    if (loading || !branding) {
      // Remover estilos personalizados se não houver branding
      if (!loading && !branding) {
        removeBrandingStyles()
        setStylesApplied(false)
      }
      return
    }

    applyBrandingStyles(branding)
    setStylesApplied(true)

    return () => {
      // Limpar estilos ao desmontar se necessário
    }
  }, [branding, loading])

  const applyBrandingStyles = (brandingData) => {
    const root = document.documentElement

    // Aplicar cores personalizadas
    if (brandingData.primaryColor) {
      root.style.setProperty('--accent-color', brandingData.primaryColor)
      root.style.setProperty('--accent-hover', darkenColor(brandingData.primaryColor, 10))
      
      // Criar gradiente com cor primária
      const gradient = `linear-gradient(135deg, ${brandingData.primaryColor} 0%, ${lightenColor(brandingData.primaryColor, 20)} 100%)`
      root.style.setProperty('--gradient-primary', gradient)
    }

    if (brandingData.secondaryColor) {
      root.style.setProperty('--bg-secondary', lightenColor(brandingData.secondaryColor, 95))
    }

    if (brandingData.accentColor) {
      root.style.setProperty('--accent-color', brandingData.accentColor)
    }

    // Aplicar logo e banner se existirem
    if (brandingData.logoUrl) {
      root.style.setProperty('--brand-logo-url', `url(${brandingData.logoUrl})`)
    }

    if (brandingData.bannerUrl) {
      root.style.setProperty('--brand-banner-url', `url(${brandingData.bannerUrl})`)
    }
  }

  const removeBrandingStyles = () => {
    const root = document.documentElement
    root.style.removeProperty('--accent-color')
    root.style.removeProperty('--accent-hover')
    root.style.removeProperty('--gradient-primary')
    root.style.removeProperty('--bg-secondary')
    root.style.removeProperty('--brand-logo-url')
    root.style.removeProperty('--brand-banner-url')
  }

  // Funções auxiliares para manipular cores
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  const lightenColor = (hex, percent) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex
    
    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * (percent / 100)))
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * (percent / 100)))
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * (percent / 100)))
    
    return rgbToHex(r, g, b)
  }

  const darkenColor = (hex, percent) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex
    
    const r = Math.max(0, Math.floor(rgb.r * (1 - percent / 100)))
    const g = Math.max(0, Math.floor(rgb.g * (1 - percent / 100)))
    const b = Math.max(0, Math.floor(rgb.b * (1 - percent / 100)))
    
    return rgbToHex(r, g, b)
  }

  return children
}

export default BrandingProvider




