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
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}


