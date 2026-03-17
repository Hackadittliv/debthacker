import { createContext, useContext, useState, useEffect } from 'react'
import { createTheme } from '../styles/theme.js'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dh_dark') ?? 'true') } catch { return true }
  })

  useEffect(() => {
    localStorage.setItem('dh_dark', JSON.stringify(isDark))
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const S = createTheme(isDark)

  return (
    <ThemeContext.Provider value={{ S, C: S.C, isDark, toggleTheme: () => setIsDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
