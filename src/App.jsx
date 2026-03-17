import { useState, useEffect } from 'react'
import DebtHacker from './DebtHacker.jsx'
import { supabase } from './supabase.js'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'

const TABS = [
  { id: 'dashboard',    label: 'Översikt', emoji: '🏠' },
  { id: 'dolp',         label: 'Skulder',  emoji: '🔥' },
  { id: 'consolidation',label: 'Samlån',   emoji: null },
  { id: 'buckets',      label: 'Hinkar',   emoji: '🪣' },
  { id: 'subs',         label: 'Subs',     emoji: '📱' },
  { id: 'progress',     label: 'Framsteg', emoji: '🏆' },
  { id: 'coach',        label: 'Coach',    emoji: '🤖' },
]

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isDesktop
}

function ThemeToggle() {
  const { isDark, toggleTheme, C } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
      style={{
        background: C.bgElevated,
        border: `1px solid ${C.borderStrong}`,
        borderRadius: 8,
        cursor: 'pointer',
        padding: '5px 8px',
        fontSize: 16,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

function LoginModal({ onClose }) {
  const { C } = useTheme()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlayBg, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: 20, padding: 28, maxWidth: 360, width: '100%' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F4A261', marginBottom: 6 }}>🔥 Logga in</div>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
          Logga in för att din data ska sparas i molnet och synkas mellan enheter.
        </div>
        {sent ? (
          <div>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>📬</div>
            <div style={{ fontSize: 14, color: C.textPrimary, textAlign: 'center', marginBottom: 6 }}>Kolla din mejl!</div>
            <div style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Vi skickade en inloggningslänk till <strong style={{ color: C.textPrimary }}>{email}</strong>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: 12, background: C.bgElevated, border: 'none', borderRadius: 10, color: C.textSecondary, cursor: 'pointer', fontSize: 14 }}>Stäng</button>
          </div>
        ) : (
          <div>
            <input
              style={{ width: '100%', padding: '10px 13px', background: C.bgSunken, border: `1px solid ${C.borderStrong}`, borderRadius: 10, color: C.textPrimary, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
              type="email"
              placeholder="din@mejl.se"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            {error && <div style={{ fontSize: 12, color: '#E63946', marginBottom: 8 }}>{error}</div>}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', padding: 12, background: '#F4A261', border: 'none', borderRadius: 10, color: '#0D1117', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginBottom: 8 }}
            >
              {loading ? 'Skickar...' : 'Skicka inloggningslänk'}
            </button>
            <button onClick={onClose} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 13 }}>
              Fortsätt utan konto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AppShell() {
  const { C, isDark } = useTheme()
  const isDesktop = useIsDesktop()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [consolidationUnlocked, setConsolidationUnlocked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dh_cons_unlocked') || 'false') } catch { return false }
  })
  const [user, setUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    localStorage.setItem('dh_cons_unlocked', JSON.stringify(consolidationUnlocked))
  }, [consolidationUnlocked])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const tabsWithDynamic = TABS.map(t =>
    t.id === 'consolidation'
      ? { ...t, emoji: consolidationUnlocked ? '🔓' : '🔒' }
      : t
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bgApp }}>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {/* ── DESKTOP SIDEBAR ── */}
      {isDesktop && (
        <aside style={{
          width: 220,
          background: C.bgApp,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
          padding: '24px 0 32px',
        }}>
          {/* Logo */}
          <div style={{ padding: '0 20px 28px' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F4A261', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <span>DebtHacker</span>
              <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>.se</span>
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>Hacka dina skulder.</div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1 }}>
            {tabsWithDynamic.map(t => {
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`sidebar-nav-btn${active ? ' active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '11px 20px',
                    background: active ? C.bgCard : 'transparent',
                    border: 'none',
                    borderRight: active ? '2px solid #F4A261' : '2px solid transparent',
                    color: active ? '#F4A261' : C.textSecondary,
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 20, minWidth: 24, textAlign: 'center' }}>{t.emoji}</span>
                  {t.label}
                </button>
              )
            })}
          </nav>

          {/* Footer — auth + branding + theme toggle */}
          <div style={{ padding: '0 20px' }}>
            {/* Theme toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>{isDark ? 'Mörkt läge' : 'Ljust läge'}</span>
              <ThemeToggle />
            </div>

            {user ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#40916C', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>☁️</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                </div>
                <button onClick={handleLogout} style={{ fontSize: 11, color: C.textDim, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Logga ut
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{ fontSize: 12, color: C.textSecondary, background: 'none', border: `1px solid ${C.borderStrong}`, borderRadius: 8, cursor: 'pointer', padding: '7px 12px', width: '100%', textAlign: 'left', marginBottom: 12 }}
              >
                ☁️ Logga in för molnsynk
              </button>
            )}
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
              Baserad på David Bachs DOLP-metod<br />
              <span style={{ color: C.borderStrong }}>Powered by <a href="https://conversify.io" target="_blank" rel="noreferrer" style={{ color: '#4A9ECC', textDecoration: 'none' }}>Conversify.io</a></span>
            </div>
          </div>
        </aside>
      )}

      {/* ── MOBILE TOP BAR ── */}
      {!isDesktop && (
        <header style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: 48,
          background: C.bgApp,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 100,
        }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F4A261', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔥</span>
            <span>DebtHacker</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!user && (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{ fontSize: 11, color: C.textSecondary, background: 'none', border: `1px solid ${C.borderStrong}`, borderRadius: 7, cursor: 'pointer', padding: '4px 9px' }}
              >
                ☁️ Logga in
              </button>
            )}
            {user && (
              <span style={{ fontSize: 11, color: '#40916C' }}>☁️</span>
            )}
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex: 1,
        marginLeft: isDesktop ? 220 : 0,
        marginTop: isDesktop ? 0 : 48,
        marginBottom: isDesktop ? 0 : 60,
        minHeight: '100vh',
      }}>
        <DebtHacker
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDesktop={isDesktop}
          consolidationUnlocked={consolidationUnlocked}
          setConsolidationUnlocked={setConsolidationUnlocked}
          user={user}
        />
      </main>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      {!isDesktop && (
        <nav style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: C.bgApp,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          zIndex: 100,
        }}>
          {tabsWithDynamic.map(t => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: '7px 2px',
                  background: 'none',
                  border: 'none',
                  borderTop: active ? '2px solid #F4A261' : '2px solid transparent',
                  color: active ? '#F4A261' : C.textSecondary,
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ fontSize: 20 }}>{t.emoji}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 52 }}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
