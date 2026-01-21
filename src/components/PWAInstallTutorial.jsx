import { useState, useEffect } from 'react'
import { 
  DeviceMobile, 
  Lightning, 
  Sparkle, 
  AppleLogo, 
  AndroidLogo, 
  Rocket, 
  CheckCircle,
  X,
  ArrowUp,
  DotsThreeVertical
} from '@phosphor-icons/react'
import './PWAInstallTutorial.css'

function PWAInstallTutorial() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Verificar se já viu o tutorial
    const hasSeenTutorial = localStorage.getItem('pwa_tutorial_seen')
    
    // Verificar se já está instalado como PWA
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    
    // Se já viu ou já está instalado, não mostrar
    if (hasSeenTutorial === 'true' || isInstalled) {
      return
    }

    // Detectar dispositivo
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream
    const isAndroidDevice = /android/i.test(userAgent)

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)

    // Mostrar tutorial apenas em dispositivos móveis
    if (isIOSDevice || isAndroidDevice) {
      // Aguardar um pouco antes de mostrar
      const timer = setTimeout(() => {
        setShowTutorial(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setShowTutorial(false)
    localStorage.setItem('pwa_tutorial_seen', 'true')
  }

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  if (!showTutorial) return null

  return (
    <div className="pwa-tutorial-overlay" onClick={handleClose}>
      <div className="pwa-tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pwa-tutorial-close" onClick={handleClose}>
          <X size={20} weight="bold" />
        </button>

        {currentStep === 0 && (
          <div className="pwa-tutorial-step">
            <div className="pwa-tutorial-icon">
              <DeviceMobile size={64} weight="duotone" />
            </div>
            <h2 className="pwa-tutorial-title">Instale o App na Tela Inicial</h2>
            <p className="pwa-tutorial-text">
              Instale o Giba App na tela inicial do seu celular para acesso rápido e uma experiência melhor!
            </p>
            <div className="pwa-tutorial-benefits">
              <div className="pwa-benefit-item">
                <span className="pwa-benefit-icon">
                  <Lightning size={24} weight="fill" />
                </span>
                <span>Acesso mais rápido</span>
              </div>
              <div className="pwa-benefit-item">
                <span className="pwa-benefit-icon">
                  <DeviceMobile size={24} weight="fill" />
                </span>
                <span>Funciona offline</span>
              </div>
              <div className="pwa-benefit-item">
                <span className="pwa-benefit-icon">
                  <Sparkle size={24} weight="fill" />
                </span>
                <span>Experiência nativa</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && isIOS && (
          <div className="pwa-tutorial-step">
            <div className="pwa-tutorial-icon">
              <AppleLogo size={64} weight="duotone" />
            </div>
            <h2 className="pwa-tutorial-title">Como Instalar no iPhone</h2>
            <div className="pwa-tutorial-instructions">
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">1</div>
                <div className="pwa-instruction-text">
                  Toque no botão <strong>compartilhar</strong> <span className="pwa-icon-emoji"><ArrowUp size={20} weight="bold" /></span> na parte inferior da tela
                </div>
              </div>
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">2</div>
                <div className="pwa-instruction-text">
                  Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                </div>
              </div>
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">3</div>
                <div className="pwa-instruction-text">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito
                </div>
              </div>
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">4</div>
                <div className="pwa-instruction-text">
                  Pronto! O app aparecerá na sua tela inicial <CheckCircle size={20} weight="fill" />
                </div>
              </div>
            </div>
            <div className="pwa-tutorial-note">
              <Sparkle size={16} weight="fill" /> <strong>Dica:</strong> Use o Safari para instalar. Não funciona no Chrome iOS.
            </div>
          </div>
        )}

        {currentStep === 1 && isAndroid && (
          <div className="pwa-tutorial-step">
            <div className="pwa-tutorial-icon">
              <AndroidLogo size={64} weight="duotone" />
            </div>
            <h2 className="pwa-tutorial-title">Como Instalar no Android</h2>
            <div className="pwa-tutorial-instructions">
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">1</div>
                <div className="pwa-instruction-text">
                  Toque no menu <strong>três pontos</strong> <span className="pwa-icon-emoji"><DotsThreeVertical size={20} weight="bold" /></span> no canto superior direito
                </div>
              </div>
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">2</div>
                <div className="pwa-instruction-text">
                  Toque em <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong>
                </div>
              </div>
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">3</div>
                <div className="pwa-instruction-text">
                  Confirme clicando em <strong>"Adicionar"</strong> ou <strong>"Instalar"</strong>
                </div>
              </div>
              <div className="pwa-instruction-item">
                <div className="pwa-instruction-number">4</div>
                <div className="pwa-instruction-text">
                  Pronto! O app aparecerá na sua tela inicial <CheckCircle size={20} weight="fill" />
                </div>
              </div>
            </div>
            <div className="pwa-tutorial-note">
              <Sparkle size={16} weight="fill" /> <strong>Dica:</strong> Se não aparecer a opção, acesse o site mais uma vez e tente novamente.
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="pwa-tutorial-step">
            <div className="pwa-tutorial-icon">
              <Sparkle size={64} weight="duotone" />
            </div>
            <h2 className="pwa-tutorial-title">Tudo Pronto!</h2>
            <p className="pwa-tutorial-text">
              Agora você pode acessar o Giba App diretamente da tela inicial do seu celular.
            </p>
            <div className="pwa-tutorial-features">
              <div className="pwa-feature-item">
                <span className="pwa-feature-icon">
                  <Rocket size={24} weight="fill" />
                </span>
                <div>
                  <strong>Acesso Rápido</strong>
                  <p>Abra o app com um toque</p>
                </div>
              </div>
              <div className="pwa-feature-item">
                <span className="pwa-feature-icon">
                  <DeviceMobile size={24} weight="fill" />
                </span>
                <div>
                  <strong>Experiência Nativa</strong>
                  <p>Funciona como um app nativo</p>
                </div>
              </div>
              <div className="pwa-feature-item">
                <span className="pwa-feature-icon">
                  <Lightning size={24} weight="fill" />
                </span>
                <div>
                  <strong>Mais Rápido</strong>
                  <p>Carregamento instantâneo</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pwa-tutorial-footer">
          <div className="pwa-tutorial-progress">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`pwa-progress-dot ${currentStep === step ? 'active' : ''}`}
              />
            ))}
          </div>
          <div className="pwa-tutorial-actions">
            {currentStep > 0 && (
              <button className="pwa-tutorial-btn-secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                Voltar
              </button>
            )}
            <button className="pwa-tutorial-btn-skip" onClick={handleSkip}>
              Pular
            </button>
            <button className="pwa-tutorial-btn-primary" onClick={handleNext}>
              {currentStep === 2 ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallTutorial
