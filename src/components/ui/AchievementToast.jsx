import { useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { ACHIEVEMENTS } from '../../utils/achievements'

export function AchievementToast({ achievement, onDone }) {
  const { C } = useTheme()
  const def = ACHIEVEMENTS.find(a => a.id === achievement.id)

  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [achievement.id]) // eslint-disable-line

  if (!def) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      background: C.bgCard,
      border: `1px solid ${def.color}55`,
      borderRadius: 16,
      padding: '12px 18px',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${def.color}22`,
      animation: 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      minWidth: 220,
      maxWidth: 320,
      whiteSpace: 'nowrap',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${def.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {def.emoji}
      </div>
      <div>
        <div style={{ fontSize: 10, color: def.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
          Achievement unlocked!
        </div>
        <div style={{ fontSize: 14, color: C.textPrimary, fontWeight: 700 }}>{def.title}</div>
        <div style={{ fontSize: 12, color: C.textSecondary }}>{def.desc}</div>
      </div>
    </div>
  )
}
