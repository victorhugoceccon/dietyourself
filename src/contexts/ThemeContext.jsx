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
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}


