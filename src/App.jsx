import { useState, useEffect, Component } from 'react'
import DebtHacker from './DebtHacker.jsx'
import { supabase } from './supabase.js'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { LandingPage } from './components/LandingPage.jsx'
import { PrivacyPage } from './components/PrivacyPage.jsx'

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

function LoginModal({ onClose, onShowPrivacy }) {
  const { C } = useTheme()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inputStyle = { width: '100%', padding: '10px 13px', background: C.bgSunken, border: `1px solid ${C.borderStrong}`, borderRadius: 10, color: C.textPrimary, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }

  const handleSubmit = async () => {
    if (!email.trim() || !password) return
    if (mode === 'signup' && password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      setLoading(false)
      if (err) { setError('Fel e-post eller lösenord.'); return }
      onClose()
    } else {
      const { error: err } = await supabase.auth.signUp({ email: email.trim(), password })
      setLoading(false)
      if (err) { setError(err.message); return }
      setSuccess('Konto skapat! Kolla din mejl för att bekräfta adressen, logga sedan in.')
    }
  }

  const handleForgot = async () => {
    if (!email.trim()) { setError('Ange din e-postadress.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Kolla din mejl! Vi har skickat en länk för att återställa lösenordet.')
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (err) { setError(err.message); setLoading(false) }
  }

  if (mode === 'forgot') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: C.overlayBg, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: 20, padding: 28, maxWidth: 360, width: '100%' }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F4A261', marginBottom: 6 }}>🔑 Glömt lösenord</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
            Ange din e-postadress så skickar vi en länk för att sätta ett nytt lösenord.
          </div>
          {success ? (
            <div>
              <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 14, color: C.textPrimary, textAlign: 'center', marginBottom: 16 }}>{success}</div>
              <button onClick={() => { setSuccess(''); setMode('login') }} style={{ width: '100%', padding: 12, background: '#F4A261', border: 'none', borderRadius: 10, color: '#0D1117', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Tillbaka till inloggning</button>
            </div>
          ) : (
            <>
              <input style={inputStyle} type="email" placeholder="din@mejl.se" value={email} onChange={e => setEmail(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleForgot()} />
              {error && <div style={{ fontSize: 12, color: '#E63946', marginBottom: 8 }}>{error}</div>}
              <button onClick={handleForgot} disabled={loading} style={{ width: '100%', padding: 12, background: '#F4A261', border: 'none', borderRadius: 10, color: '#0D1117', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginBottom: 8 }}>
                {loading ? '...' : 'Skicka återställningslänk'}
              </button>
              <button onClick={() => { setMode('login'); setError('') }} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 13 }}>
                ← Tillbaka
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlayBg, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: 20, padding: 28, maxWidth: 360, width: '100%' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F4A261', marginBottom: 6 }}>
          🔥 {mode === 'login' ? 'Logga in' : 'Skapa konto'}
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
          Spara din data i molnet och synka mellan enheter.
        </div>

        {success ? (
          <div>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>📬</div>
            <div style={{ fontSize: 14, color: C.textPrimary, textAlign: 'center', marginBottom: 8 }}>{success}</div>
            <button onClick={() => { setSuccess(''); setMode('login') }} style={{ width: '100%', padding: 12, background: '#F4A261', border: 'none', borderRadius: 10, color: '#0D1117', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Logga in</button>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div style={{ display: 'flex', background: C.bgSunken, borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {['login', 'signup'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: mode === m ? C.bgCard : 'transparent', color: mode === m ? C.textPrimary : C.textSecondary, fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m === 'login' ? 'Logga in' : 'Skapa konto'}
                </button>
              ))}
            </div>

            {/* Google */}
            <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: 12, background: C.bgElevated, border: `1px solid ${C.borderStrong}`, borderRadius: 10, color: C.textPrimary, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxSizing: 'border-box' }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Fortsätt med Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 12, color: C.textMuted }}>eller med e-post</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <input style={inputStyle} type="email" placeholder="din@mejl.se" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            <input style={inputStyle} type="password" placeholder="Lösenord" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

            {error && <div style={{ fontSize: 12, color: '#E63946', marginBottom: 8 }}>{error}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: 12, background: '#F4A261', border: 'none', borderRadius: 10, color: '#0D1117', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginBottom: 8 }}>
              {loading ? '...' : mode === 'login' ? 'Logga in' : 'Skapa konto'}
            </button>

            {mode === 'login' && (
              <button onClick={() => { setMode('forgot'); setError('') }} style={{ width: '100%', padding: '6px 0', background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 12 }}>
                Glömt lösenord?
              </button>
            )}

            <button onClick={onClose} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 13 }}>
              Fortsätt utan konto
            </button>
            {mode === 'signup' && (
              <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 1.6, marginTop: 4 }}>
                Genom att skapa konto godkänner du vår{' '}
                <button onClick={onShowPrivacy} style={{ background: 'none', border: 'none', color: '#4A9ECC', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}>
                  integritetspolicy
                </button>.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function NewPasswordModal({ onDone }) {
  const { C } = useTheme()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const inputStyle = { width: '100%', padding: '10px 13px', background: C.bgSunken, border: `1px solid ${C.borderStrong}`, borderRadius: 10, color: C.textPrimary, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }

  const handleSave = async () => {
    if (password.length < 8) { setError('Lösenordet måste vara minst 8 tecken.'); return }
    if (password !== confirm) { setError('Lösenorden matchar inte.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(onDone, 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: 20, padding: 28, maxWidth: 360, width: '100%' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#40916C' }}>Lösenord uppdaterat!</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F4A261', marginBottom: 6 }}>🔑 Nytt lösenord</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>Välj ett nytt lösenord för ditt konto.</div>
            <input style={inputStyle} type="password" placeholder="Nytt lösenord (min. 8 tecken)" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            <input style={inputStyle} type="password" placeholder="Upprepa lösenord" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} />
            {error && <div style={{ fontSize: 12, color: '#E63946', marginBottom: 8 }}>{error}</div>}
            <button onClick={handleSave} disabled={loading} style={{ width: '100%', padding: 12, background: '#F4A261', border: 'none', borderRadius: 10, color: '#0D1117', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? '...' : 'Spara nytt lösenord'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AppShell({ onShowPrivacy, onLogout }) {
  const { C, isDark } = useTheme()
  const isDesktop = useIsDesktop()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [consolidationUnlocked, setConsolidationUnlocked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dh_cons_unlocked') || 'false') } catch { return false }
  })
  const [user, setUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    localStorage.setItem('dh_cons_unlocked', JSON.stringify(consolidationUnlocked))
  }, [consolidationUnlocked])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setShowNewPassword(true)
      if (event === 'SIGNED_OUT') onLogout()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    onLogout()
  }

  const tabsWithDynamic = TABS.map(t =>
    t.id === 'consolidation'
      ? { ...t, emoji: consolidationUnlocked ? '🔓' : '🔒' }
      : t
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bgApp }}>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onShowPrivacy={onShowPrivacy} />}
      {showNewPassword && <NewPasswordModal onDone={() => setShowNewPassword(false)} />}

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
              DOLP-skuldsläckningsmetoden<br />
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

function AppRoot() {
  const [authLoading, setAuthLoading] = useState(true)
  const [showApp, setShowApp] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(() => window.location.pathname === '/integritet')
  const [showLandingLogin, setShowLandingLogin] = useState(false)

  // Check active session on startup — logged-in users go straight to app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setShowApp(true)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) { setShowLandingLogin(false); setShowApp(true) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleStart = () => setShowApp(true)
  const handleLogout = () => setShowApp(false)

  const handleShowPrivacy = () => {
    window.history.pushState({}, '', '/integritet')
    setShowPrivacy(true)
  }
  const handleBackFromPrivacy = () => {
    window.history.pushState({}, '', '/')
    setShowPrivacy(false)
  }

  if (authLoading) return <div style={{ background: '#0D1117', minHeight: '100vh' }} />
  if (showPrivacy) return <PrivacyPage onBack={handleBackFromPrivacy} />
  if (!showApp) return (
    <>
      {showLandingLogin && <LoginModal onClose={() => setShowLandingLogin(false)} onShowPrivacy={handleShowPrivacy} />}
      <LandingPage onStart={handleStart} onShowPrivacy={handleShowPrivacy} onLogin={() => setShowLandingLogin(true)} />
    </>
  )
  return <AppShell onShowPrivacy={handleShowPrivacy} onLogout={handleLogout} />
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0D1117', color: '#E6EDF3', fontFamily: 'sans-serif', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 36 }}>🔥</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Något gick fel</div>
          <div style={{ fontSize: 14, color: '#8B949E', textAlign: 'center' }}>Ladda om sidan för att försöka igen. Din data är sparad.</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '10px 24px', background: '#F4A261', border: 'none', borderRadius: 10, color: '#0D1117', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            Ladda om
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppRoot />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
