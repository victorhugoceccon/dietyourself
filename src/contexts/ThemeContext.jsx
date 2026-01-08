import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
<<<<<<< HEAD
  // Sempre light mode - dark mode removido
  const isDarkMode = false

  useEffect(() => {
    // Garantir que dark-mode nunca seja aplicado
    document.documentElement.classList.remove('dark-mode')
    localStorage.removeItem('darkMode')
  }, [])

  const toggleDarkMode = () => {
    // Função desabilitada - não faz nada
    console.log('Dark mode foi removido. Apenas light mode está disponível.')
=======
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Verificar se há uma preferência salva válida
    const saved = localStorage.getItem('darkMode')
    
    // Se não há valor salvo, iniciar em light mode
    if (saved === null) {
      return false
    }
    
    // Se o valor salvo é 'true', limpar e forçar light mode (reset de dark mode antigo)
    if (saved === 'true') {
      localStorage.removeItem('darkMode')
      return false
    }
    
    // Se o valor é 'false', usar light mode
    return false
  })

  useEffect(() => {
    // Aplicar classe ao documento imediatamente
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}


