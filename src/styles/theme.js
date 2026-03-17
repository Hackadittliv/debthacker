export const isDesktop = () => window.innerWidth > 768

export function createTheme(isDark) {
  const C = isDark ? {
    bgApp:        '#0D1117',
    bgCard:       '#161B22',
    bgElevated:   '#21262D',
    bgSunken:     '#0D1117',
    border:       '#21262D',
    borderStrong: '#30363D',
    textPrimary:  '#E6EDF3',
    textSecondary:'#8B949E',
    textMuted:    '#7D8590',
    textDim:      '#4B5563',
    textNear:     '#C9D1D9',
    textMed:      '#A0A8B0',
    gradHero:     'linear-gradient(135deg, #1A1200, #161B22)',
    gradDebt:     'linear-gradient(135deg, #1A0A0A, #161B22)',
    gradGreen:    'linear-gradient(135deg, #0A1E10, #161B22)',
    gradLock:     'linear-gradient(135deg, #1A0D00, #161B22)',
    gradActive:   'linear-gradient(135deg, #1B2A1B, #161B22)',
    overlayBg:    'rgba(0,0,0,0.85)',
  } : {
    bgApp:        '#F0F2F5',
    bgCard:       '#FFFFFF',
    bgElevated:   '#E9ECEF',
    bgSunken:     '#F9FAFB',
    border:       '#E4E7EB',
    borderStrong: '#D1D5DB',
    textPrimary:  '#111827',
    textSecondary:'#6B7280',
    textMuted:    '#9CA3AF',
    textDim:      '#D1D5DB',
    textNear:     '#374151',
    textMed:      '#6B7280',
    gradHero:     'linear-gradient(135deg, #FFF8EF, #FFFFFF)',
    gradDebt:     'linear-gradient(135deg, #FFF5F5, #FFFFFF)',
    gradGreen:    'linear-gradient(135deg, #F0FFF4, #FFFFFF)',
    gradLock:     'linear-gradient(135deg, #FFFBEB, #FFFFFF)',
    gradActive:   'linear-gradient(135deg, #F0FFF4, #FFFFFF)',
    overlayBg:    'rgba(0,0,0,0.55)',
  }

  const S = {
    C,
    app: {
      fontFamily: "'DM Sans', sans-serif",
      background: C.bgApp,
      minHeight: '100vh',
      color: C.textPrimary,
      overflowX: 'hidden',
    },
    content: {
      padding: isDesktop() ? '32px 36px 48px' : '16px 16px 88px',
      maxWidth: isDesktop() ? 880 : '100%',
      margin: '0 auto',
    },
    card: {
      background: C.bgCard,
      borderRadius: 16,
      padding: '20px',
      marginBottom: 12,
      border: `1px solid ${C.border}`,
    },
    label: {
      fontSize: 12,
      color: C.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 5,
      fontWeight: 600,
    },
    bigNum: c => ({
      fontFamily: "'DM Serif Display', serif",
      fontSize: 32,
      color: c || '#F4A261',
      lineHeight: 1,
    }),
    badge: c => ({
      background: c,
      borderRadius: 20,
      padding: '3px 9px',
      fontSize: 11,
      fontWeight: 700,
      color: '#fff',
      display: 'inline-block',
      letterSpacing: 0.5,
    }),
    progBar: {
      height: 6,
      background: C.bgElevated,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progFill: (p, c) => ({
      height: '100%',
      width: `${Math.min(100, p)}%`,
      background: c,
      borderRadius: 6,
      transition: 'width 0.8s ease',
    }),
    btn: v => ({
      background:
        v === 'primary' ? '#F4A261' :
        v === 'danger'  ? '#E63946' :
        v === 'success' ? '#40916C' : C.bgElevated,
      color:
        v === 'ghost'   ? C.textSecondary :
        v === 'success' ? '#fff' : '#0D1117',
      border: 'none',
      borderRadius: 10,
      padding: '10px 15px',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      transition: 'all 0.15s',
    }),
    input: {
      background: C.bgSunken,
      border: `1px solid ${C.borderStrong}`,
      borderRadius: 10,
      padding: '12px 14px',
      fontSize: 15,
      color: C.textPrimary,
      width: '100%',
      outline: 'none',
      boxSizing: 'border-box',
    },
    row: { display: 'flex', alignItems: 'center', gap: 8 },
    g2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  }

  return S
}

// Default dark theme — kept for static imports during transition
export const S = createTheme(true)
