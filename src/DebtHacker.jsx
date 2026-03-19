import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase.js'
import { calculatePayoffPlan, monthsToText, calculateInterestComparison } from './utils/math.js'
import { checkAchievements } from './utils/achievements.js'
import { useTheme } from './context/ThemeContext.jsx'
import { DashboardView } from './components/views/DashboardView.jsx'
import { DOLPView } from './components/views/DOLPView.jsx'
import { ConsolidationView } from './components/views/ConsolidationView.jsx'
import { BucketsView } from './components/views/BucketsView.jsx'
import { SubsView } from './components/views/SubsView.jsx'
import { CoachView } from './components/views/CoachView.jsx'
import { ProgressView } from './components/views/ProgressView.jsx'
import { AchievementToast } from './components/ui/AchievementToast.jsx'
import { Icon } from './components/ui/Icon.jsx'

// ── Unlock ceremony modal ──────────────────────────────────────────────────
function UnlockCeremony({ onClose }) {
  const { C } = useTheme()
  const [step, setStep] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const steps = [
    { emoji: '🎉', title: 'Du har bevisat något viktigt', text: 'Du har stängt kort, gjort extra betalningar och hållit dig från ny kredit. Det är inte lätt. Det är faktiskt det svåraste steget.' },
    { emoji: '🧠', title: 'Nu förstår du varför det funkar', text: 'De flesta som tar ett samlån misslyckas. Inte för att räntan är fel, utan för att beteendet inte förändrats. Du har gjort det annorlunda.' },
    { emoji: '⚠️', title: 'Ett löfte till dig själv', text: 'Samlånet fungerar bara om korten förblir stängda. Om du öppnar ny kredit startar du om från noll, fast med ett nytt lån ovanpå.' },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlayBg, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: 24, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        {step < steps.length ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{steps[step].emoji}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.textPrimary, marginBottom: 12, lineHeight: 1.3 }}>{steps[step].title}</div>
            <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>{steps[step].text}</div>
            <button onClick={() => setStep(s => s + 1)} style={{ background: '#F4A261', color: '#0D1117', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              {step < steps.length - 1 ? 'Jag förstår →' : 'Jag förstår och lovar →'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔓</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#40916C', marginBottom: 12 }}>Samlånskalkylatorn är upplåst</div>
            <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>Du har tjänat rätten att använda det här verktyget. Använd det klokt.</div>
            <div onClick={() => setConfirmed(c => !c)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: C.bgSunken, borderRadius: 12, padding: 14, marginBottom: 20, cursor: 'pointer', border: `1px solid ${confirmed ? '#40916C' : C.borderStrong}`, textAlign: 'left' }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${confirmed ? '#40916C' : C.borderStrong}`, background: confirmed ? '#40916C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {confirmed && <Icon name="check" size={12} color="#fff" />}
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>Jag förstår att ett samlån bara fungerar om mina kort förblir stängda. Ny kredit = börja om från noll.</div>
            </div>
            <button disabled={!confirmed} onClick={onClose} style={{ background: confirmed ? '#40916C' : C.bgElevated, color: confirmed ? '#fff' : C.textSecondary, border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: confirmed ? 'pointer' : 'not-allowed', width: '100%', transition: 'all 0.3s' }}>
              Visa kalkylatorn
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Hunt guide modal ───────────────────────────────────────────────────────
const HUNT_STEPS = [
  { emoji: '📱', title: 'iPhone: Inbyggd prenumerationslista', platform: 'Apple', color: '#4A9ECC', steps: ['Öppna Inställningar på din iPhone', 'Tryck på ditt namn högst upp', 'Välj Prenumerationer', 'Här ser du ALLA aktiva App Store-prenumerationer med pris och förnyelsedatum'], tip: 'Det är den snabbaste och mest kompletta listan för iPhone-användare. Börja alltid här.' },
  { emoji: '🤖', title: 'Android: Google Play', platform: 'Android', color: '#40916C', steps: ['Öppna Google Play', 'Tryck på din profilbild uppe till höger', 'Välj Betalningar och prenumerationer', 'Tryck på Prenumerationer'], tip: 'Obs: Visar bara appar köpta via Google Play, inte externa tjänster som Netflix eller Spotify.' },
  { emoji: '🏦', title: 'Din bank: Återkommande betalningar', platform: 'Banken', color: '#C77B2A', steps: ['Logga in på din banks app eller internet', 'Gå till transaktionshistoriken', 'Filtrera på de senaste 2-3 månaderna', 'Leta efter belopp som upprepas exakt varje månad', 'Glöm inte att kolla KORTET separat, inte bara kontot'], tip: 'Många prenumerationer betalas på kredit- eller betalkort och syns inte på kontot. Kolla båda.' },
  { emoji: '📧', title: 'Din mejl: Kvittojakten', platform: 'E-post', color: '#8B5CF6', steps: ['Sök på "prenumeration" i din inkorg', 'Sök på "kvitto" och "faktura"', 'Sök på "invoice" och "receipt" (för utländska tjänster)', 'Sök på "din betalning bekräftad"', 'Gå igenom de senaste 3 månaderna av träffar'], tip: 'Det här är det mest tidskrävande steget men hittar saker banken missar, till exempel årsbetalda tjänster.' },
  { emoji: '💳', title: 'Ditt kreditkort: Separat genomgång', platform: 'Kort', color: '#E63946', steps: ['Logga in på kortets portal (Visa, Mastercard, Amex)', 'Titta på senaste 3 månaders transaktioner', 'Sortera eller filtrera på belopp', 'Markera allt som återkommer med samma belopp'], tip: 'Kreditkort är vanligaste platsen för prenumerationer eftersom de sällan avvisas vid förnyelse.' },
]

function HuntGuide({ onClose }) {
  const { C } = useTheme()
  const [step, setStep] = useState(0)
  const [checked, setChecked] = useState({})
  const current = HUNT_STEPS[step]
  const isLast = step === HUNT_STEPS.length - 1
  const toggleCheck = (i) => setChecked(prev => ({ ...prev, [`${step}-${i}`]: !prev[`${step}-${i}`] }))
  const stepDone = current.steps.every((_, i) => checked[`${step}-${i}`])
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlayBg, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {HUNT_STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i < step ? '#40916C' : i === step ? current.color : C.bgElevated, transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${current.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{current.emoji}</div>
          <div>
            <div style={{ fontSize: 10, color: current.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{current.platform}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.textPrimary, lineHeight: 1.3 }}>{current.title}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, marginBottom: 14 }}>
          {current.steps.map((s, i) => (
            <div key={i} onClick={() => toggleCheck(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < current.steps.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${checked[`${step}-${i}`] ? current.color : C.borderStrong}`, background: checked[`${step}-${i}`] ? current.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                {checked[`${step}-${i}`] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div style={{ fontSize: 14, color: checked[`${step}-${i}`] ? C.textSecondary : C.textPrimary, textDecoration: checked[`${step}-${i}`] ? 'line-through' : 'none', lineHeight: 1.5, transition: 'all 0.2s' }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.bgSunken, borderRadius: 12, padding: 12, marginBottom: 20, border: `1px solid ${current.color}30` }}>
          <div style={{ fontSize: 11, color: current.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>💡 Tips</div>
          <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{current.tip}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ background: C.bgElevated, color: C.textSecondary, border: 'none', borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>←</button>}
          <button onClick={() => isLast ? onClose() : setStep(s => s + 1)} style={{ flex: 1, background: stepDone ? current.color : C.bgElevated, color: stepDone ? '#fff' : C.textSecondary, border: 'none', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}>
            {isLast ? (stepDone ? '✓ Jakten är klar!' : 'Avsluta guiden') : (stepDone ? `Nästa: ${HUNT_STEPS[step + 1].platform} →` : 'Nästa källa →')}
          </button>
        </div>
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: C.textSecondary, fontSize: 13, cursor: 'pointer', padding: '6px 0' }}>Stäng guiden</button>
      </div>
    </div>
  )
}

// ── Debt types ─────────────────────────────────────────────────────────────
const DEBT_TYPES = [
  { value: '', label: 'Välj typ (valfritt)', emoji: '' },
  { value: 'kreditkort', label: 'Kreditkort', emoji: '💳' },
  { value: 'csn', label: 'CSN-lån', emoji: '📚' },
  { value: 'konsument', label: 'Konsumentlån', emoji: '💰' },
  { value: 'bil', label: 'Billån', emoji: '🚗' },
  { value: 'bostad', label: 'Bostadslån/Bolån', emoji: '🏠' },
  { value: 'ovrig', label: 'Övrigt', emoji: '📄' },
]

// ── Default data ───────────────────────────────────────────────────────────
const DEFAULT_DEBTS = []
const DEFAULT_SUBS = []
const DEFAULT_BUCKETS = [
  { type: 'pension', label: 'Pension & Investeringar', emoji: '🌲', color: '#40916C', current: 0, goal: 500000 },
  { type: 'buffert', label: 'Buffert', emoji: '🛡️', color: '#2D6A8F', current: 0, goal: 50000 },
  { type: 'drom', label: 'Drömhinken', emoji: '⭐', color: '#C77B2A', current: 0, goal: 80000 },
]

function lsGet(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function DebtHacker({ activeTab, setActiveTab, isDesktop, consolidationUnlocked, setConsolidationUnlocked, user }) {
  const { S, C } = useTheme()

  const [debts, setDebts] = useState(() => lsGet('dh_debts', DEFAULT_DEBTS))
  const [extraPayment, setExtraPayment] = useState(() => lsGet('dh_extra', 2000))
  const [monthlyIncome, setMonthlyIncome] = useState(() => lsGet('dh_income', 38000))
  const [subscriptions, setSubscriptions] = useState(() => lsGet('dh_subs', DEFAULT_SUBS))
  const [buckets, setBuckets] = useState(() => lsGet('dh_buckets', DEFAULT_BUCKETS))
  const [behaviorProof, setBehaviorProof] = useState(() => lsGet('dh_behavior', { cardClosed: false, extraPayments: 0, noCreditDays: 0 }))
  const [consolidationRate, setConsolidationRate] = useState(() => lsGet('dh_consrate', 8.9))
  const [achievements, setAchievements] = useState(() => lsGet('dh_achievements', []))
  const [toastQueue, setToastQueue] = useState([])

  // UI state
  const [showUnlockCeremony, setShowUnlockCeremony] = useState(false)
  const [showHuntGuide, setShowHuntGuide] = useState(false)
  const [showAddDebtForm, setShowAddDebtForm] = useState(false)
  const [deleteDebtId, setDeleteDebtId] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Edit state
  const [newDebt, setNewDebt] = useState({ name: '', balance: '', interest_rate: '', min_payment: '', type: '' })
  const [editDebtId, setEditDebtId] = useState(null)
  const [editDebt, setEditDebt] = useState({ name: '', balance: '', interest_rate: '', min_payment: '', type: '' })
  const [showSubForm, setShowSubForm] = useState(false)
  const [newSub, setNewSub] = useState({ name: '', cost: '' })
  const [editSubId, setEditSubId] = useState(null)
  const [editSub, setEditSub] = useState({ name: '', cost: '' })
  const [editBucketType, setEditBucketType] = useState(null)
  const [editBucket, setEditBucket] = useState({ current: '', goal: '' })

  // Chat
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hej! Jag är din ekonomicoach och använder DOLP-skuldsläckningsmetoden. Fråga mig om skulder, sparande eller om samlån är rätt för dig.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  const DAILY_CHAT_LIMIT = 10
  const getChatUsage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('dh_chat_usage') || '{}')
      const today = new Date().toISOString().slice(0, 10)
      if (stored.date !== today) return { date: today, count: 0 }
      return stored
    } catch { return { date: new Date().toISOString().slice(0, 10), count: 0 } }
  }
  const incrementChatUsage = () => {
    const usage = getChatUsage()
    localStorage.setItem('dh_chat_usage', JSON.stringify({ ...usage, count: usage.count + 1 }))
  }
  const chatQuestionsLeft = DAILY_CHAT_LIMIT - getChatUsage().count

  // ── Achievement check ────────────────────────────────────────────────────
  // Ref stays current every render — no stale closure when effect runs
  const achievementsRef = useRef(achievements)
  achievementsRef.current = achievements

  useEffect(() => {
    const existingIds = achievementsRef.current.map(a => a.id)
    const newIds = checkAchievements(
      { debts, subscriptions, behaviorProof, consolidationUnlocked, buckets },
      existingIds
    )
    if (newIds.length === 0) return
    const now = Date.now()
    const toAdd = newIds.map(id => ({ id, unlockedAt: now }))
    setAchievements(p => {
      const existing = new Set(p.map(a => a.id))
      const filtered = toAdd.filter(a => !existing.has(a.id))
      return filtered.length > 0 ? [...p, ...filtered] : p
    })
    setToastQueue(q => [...q, ...toAdd])
  }, [debts, subscriptions, behaviorProof, consolidationUnlocked, buckets]) // eslint-disable-line

  // ── LocalStorage persist ─────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('dh_debts', JSON.stringify(debts)) }, [debts])
  useEffect(() => { localStorage.setItem('dh_subs', JSON.stringify(subscriptions)) }, [subscriptions])
  useEffect(() => { localStorage.setItem('dh_extra', JSON.stringify(extraPayment)) }, [extraPayment])
  useEffect(() => { localStorage.setItem('dh_income', JSON.stringify(monthlyIncome)) }, [monthlyIncome])
  useEffect(() => { localStorage.setItem('dh_behavior', JSON.stringify(behaviorProof)) }, [behaviorProof])
  useEffect(() => { localStorage.setItem('dh_consrate', JSON.stringify(consolidationRate)) }, [consolidationRate])
  useEffect(() => { localStorage.setItem('dh_buckets', JSON.stringify(buckets)) }, [buckets])
  useEffect(() => { localStorage.setItem('dh_achievements', JSON.stringify(achievements)) }, [achievements])

  // ── Supabase sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase.from('dh_user_data').select('data, updated_at').eq('user_id', user.id).single().then(({ data, error }) => {
      if (error && error.code !== 'PGRST116') return // PGRST116 = no rows, expected for new users

      if (!data?.data) {
        // Ingen molndata finns — spara lokal data om den innehåller något
        const hasLocalData = debts.length > 0 || subscriptions.length > 0 || monthlyIncome > 0
        if (!hasLocalData) return // spara inte tom data
        const now = new Date().toISOString()
        localStorage.setItem('dh_sync_at', now)
        supabase.from('dh_user_data').upsert({
          user_id: user.id,
          data: { debts, subscriptions, extraPayment, monthlyIncome, behaviorProof, consolidationRate, consolidationUnlocked, buckets, achievements },
          updated_at: now,
        })
        return
      }

      // Molndata finns — ladda alltid ner den (molnet är källan till sanning)
      const d = data.data
      if (d.debts?.length > 0) setDebts(d.debts)
      if (d.subscriptions?.length > 0) setSubscriptions(d.subscriptions)
      if (d.extraPayment !== undefined) setExtraPayment(d.extraPayment)
      if (d.monthlyIncome) setMonthlyIncome(d.monthlyIncome)
      if (d.behaviorProof) setBehaviorProof(d.behaviorProof)
      if (d.consolidationRate !== undefined) setConsolidationRate(d.consolidationRate)
      if (d.consolidationUnlocked !== undefined) setConsolidationUnlocked(d.consolidationUnlocked)
      if (d.buckets) setBuckets(d.buckets)
      if (d.achievements) setAchievements(d.achievements)
      if (data.updated_at) localStorage.setItem('dh_sync_at', data.updated_at)
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      const now = new Date().toISOString()
      localStorage.setItem('dh_sync_at', now)
      supabase.from('dh_user_data').upsert({
        user_id: user.id,
        data: { debts, subscriptions, extraPayment, monthlyIncome, behaviorProof, consolidationRate, consolidationUnlocked, buckets, achievements },
        updated_at: now,
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [user, debts, subscriptions, extraPayment, monthlyIncome, behaviorProof, consolidationRate, consolidationUnlocked, buckets, achievements]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chat scroll ──────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  // ── Derived values ───────────────────────────────────────────────────────
  const dolpPlan = calculatePayoffPlan(debts, extraPayment)
  const totalDebt = debts.filter(d => !d.paid_off).reduce((s, d) => s + d.balance, 0)
  const interestComparison = calculateInterestComparison(debts, extraPayment)
  const debtFreeMonths = dolpPlan?.total_months ?? 0

  const fullyProven = behaviorProof.cardClosed && behaviorProof.extraPayments >= 2 && behaviorProof.noCreditDays >= 30

  useEffect(() => {
    if (fullyProven && !consolidationUnlocked) setShowUnlockCeremony(true)
  }, [fullyProven, consolidationUnlocked])

  // ── Clamp extraPayment om inkomsten sänks ────────────────────────────────
  useEffect(() => {
    const max = Math.round(monthlyIncome * 0.5)
    if (extraPayment > max) setExtraPayment(max)
  }, [monthlyIncome]) // eslint-disable-line

  // ── Handlers ─────────────────────────────────────────────────────────────
  const addDebt = () => {
    const name = newDebt.name.trim()
    const balance = parseFloat(newDebt.balance)
    if (!name || !balance || balance <= 0) return
    const interestRate = Math.min(100, Math.max(0, parseFloat(newDebt.interest_rate) || 0))
    const minPayment = Math.max(1, parseFloat(newDebt.min_payment) || 200)
    setDebts(p => [...p, { id: crypto.randomUUID(), name: name.slice(0, 100), balance, interest_rate: interestRate, min_payment: minPayment, type: newDebt.type || '', paid_off: false }])
    setNewDebt({ name: '', balance: '', interest_rate: '', min_payment: '', type: '' })
    setShowAddDebtForm(false)
  }

  const saveDebt = () => {
    const name = editDebt.name.trim()
    const balance = parseFloat(editDebt.balance)
    if (!name || !balance || balance <= 0) return
    const interestRate = Math.min(100, Math.max(0, parseFloat(editDebt.interest_rate) || 0))
    const minPayment = Math.max(1, parseFloat(editDebt.min_payment) || 200)
    setDebts(p => p.map(d => d.id === editDebtId ? { ...d, name: name.slice(0, 100), balance, interest_rate: interestRate, min_payment: minPayment, type: editDebt.type || '' } : d))
    setEditDebtId(null)
  }

  const saveSub = () => {
    if (!editSub.name || !editSub.cost) return
    setSubscriptions(p => p.map(s => s.id === editSubId ? { ...s, name: editSub.name, cost: parseFloat(editSub.cost) } : s))
    setEditSubId(null)
  }

  const saveBucket = () => {
    if (editBucket.current === '' || editBucket.goal === '') return
    setBuckets(p => p.map(b => b.type === editBucketType ? { ...b, current: parseFloat(editBucket.current), goal: parseFloat(editBucket.goal) } : b))
    setEditBucketType(null)
  }

  const resetAllData = () => {
    ['dh_debts', 'dh_subs', 'dh_extra', 'dh_income', 'dh_behavior', 'dh_consrate', 'dh_cons_unlocked', 'dh_buckets', 'dh_achievements'].forEach(k => localStorage.removeItem(k))
    setDebts(DEFAULT_DEBTS)
    setSubscriptions(DEFAULT_SUBS)
    setBuckets(DEFAULT_BUCKETS)
    setExtraPayment(2000)
    setMonthlyIncome(38000)
    setBehaviorProof({ cardClosed: false, extraPayments: 0, noCreditDays: 0 })
    setConsolidationRate(8.9)
    setConsolidationUnlocked(false)
    setAchievements([])
    setToastQueue([])
  }

  const sendMessage = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setChatMessages(p => [...p, { role: 'user', text: userMsg }, { role: 'assistant', text: 'Logga in för att chatta med AI-coachen.' }])
      setChatInput('')
      return
    }

    const usage = getChatUsage()
    if (usage.count >= DAILY_CHAT_LIMIT) {
      setChatMessages(p => [...p, { role: 'user', text: userMsg }, { role: 'assistant', text: `Du har använt dina ${DAILY_CHAT_LIMIT} frågor för idag. Kom tillbaka imorgon — håll kursen! 🔥` }])
      setChatInput('')
      return
    }

    setChatInput('')
    setChatMessages(p => [...p, { role: 'user', text: userMsg }])
    setIsChatLoading(true)
    incrementChatUsage()

    try {
      const ctx = `Inkomst: ${monthlyIncome} SEK/mån. Skulder: ${debts.filter(d => !d.paid_off).map(d => `${d.name} ${d.balance}kr @ ${d.interest_rate}%`).join(', ') || 'inga inlagda'}. Skuldfri om: ${monthsToText(debtFreeMonths)}. Samlånslåset: ${consolidationUnlocked ? 'upplåst' : 'låst'}.`
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: `Du är en strikt ekonomicoach på debthacker.se och använder DOLP-skuldsläckningsmetoden (minsta skuld först, snöbollseffekt).

REGLER:
- Svara ALLTID på svenska
- Max 3 meningar, konkret och uppmuntrande
- Inga punktlistor
- Om frågan INTE handlar om privatekonomi, skulder, sparande, ränta, budget eller DOLP-metoden — svara: "Jag är specialiserad på ekonomi och skuldfrihet. Fråga mig om dina skulder, sparande eller DOLP-planen!"
- Referera alltid till användarens faktiska siffror när det är relevant

Användarens kontext: ${ctx}`,
          messages: [...chatMessages.slice(-6).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })), { role: 'user', content: userMsg }]
        })
      })
      if (res.status === 401) {
        setChatMessages(p => [...p, { role: 'assistant', text: 'Logga in för att använda AI-coachen.' }])
        setIsChatLoading(false)
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setChatMessages(p => [...p, { role: 'assistant', text: `Fel ${res.status}: ${data.error?.message || data.message || 'Okänt fel från AI-tjänsten.'}` }])
      } else {
        setChatMessages(p => [...p, { role: 'assistant', text: data.content?.[0]?.text || 'Håll kursen! Minsta skuld alltid först.' }])
      }
    } catch (err) {
      setChatMessages(p => [...p, { role: 'assistant', text: `Tekniskt fel: ${err.message}` }])
    }
    setIsChatLoading(false)
  }

  const [summaryStatus, setSummaryStatus] = useState(null) // null | 'loading' | 'sent' | 'error'

  const sendSummary = async () => {
    setSummaryStatus('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setSummaryStatus('error'); return }
      const res = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ totalDebt, debtFreeMonths, extraPayment, interestSaved: interestComparison.interestSaved, monthsSaved: interestComparison.monthsSaved, debts }),
      })
      setSummaryStatus(res.ok ? 'sent' : 'error')
    } catch {
      setSummaryStatus('error')
    }
    setTimeout(() => setSummaryStatus(null), 4000)
  }

  const contentStyle = {
    padding: isDesktop ? '32px 36px 48px' : '16px 16px 88px',
    maxWidth: isDesktop ? 880 : '100%',
    margin: '0 auto',
  }

  const overlayStyle = { position: 'fixed', inset: 0, background: C.overlayBg, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
  const modalBoxStyle = { background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: 16, padding: 24, maxWidth: 320, width: '100%', textAlign: 'center' }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bgApp, minHeight: '100vh', color: C.textPrimary, overflowX: 'hidden' }}>

      {/* ── Achievement toast ── */}
      {toastQueue.length > 0 && (
        <AchievementToast
          achievement={toastQueue[0]}
          onDone={() => setToastQueue(q => q.slice(1))}
        />
      )}

      {/* ── Modals ── */}
      {showUnlockCeremony && <UnlockCeremony onClose={() => { setShowUnlockCeremony(false); setConsolidationUnlocked(true) }} />}
      {showHuntGuide && <HuntGuide onClose={() => setShowHuntGuide(false)} />}

      {/* Add debt modal */}
      {showAddDebtForm && (
        <div style={overlayStyle}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.borderStrong}`, borderRadius: 20, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#F4A261', marginBottom: 16 }}>Lägg till skuld</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Namn</div>
            <input style={{ ...S.input, marginBottom: 10 }} placeholder="t.ex. Klarna" value={newDebt.name} onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))} />
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Skuld-typ</div>
            <select value={newDebt.type} onChange={e => setNewDebt(p => ({ ...p, type: e.target.value }))} style={{ ...S.input, marginBottom: 10, cursor: 'pointer' }}>
              {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji ? `${t.emoji} ` : ''}{t.label}</option>)}
            </select>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Nuvarande saldo (kr)</div>
            <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="0" value={newDebt.balance} onChange={e => setNewDebt(p => ({ ...p, balance: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Ränta (%)</div>
                <input style={S.input} type="number" placeholder="0" value={newDebt.interest_rate} onChange={e => setNewDebt(p => ({ ...p, interest_rate: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Minbetalning (kr)</div>
                <input style={S.input} type="number" placeholder="200" value={newDebt.min_payment} onChange={e => setNewDebt(p => ({ ...p, min_payment: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...S.btn('primary'), flex: 1, justifyContent: 'center' }} onClick={addDebt}><Icon name="check" size={13} color="#0D1117" />Spara</button>
              <button style={{ ...S.btn('ghost'), flex: 1, justifyContent: 'center' }} onClick={() => setShowAddDebtForm(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete debt confirmation */}
      {deleteDebtId !== null && (
        <div style={overlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.textPrimary, marginBottom: 8 }}>Ta bort skulden?</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>Det går inte att ångra.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...S.btn('ghost'), flex: 1, justifyContent: 'center', padding: '10px 0' }} onClick={() => setDeleteDebtId(null)}>Avbryt</button>
              <button style={{ ...S.btn('danger'), flex: 1, justifyContent: 'center', padding: '10px 0' }} onClick={() => { setDebts(p => p.filter(d => d.id !== deleteDebtId)); setDeleteDebtId(null) }}>Ta bort</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div style={overlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.textPrimary, marginBottom: 8 }}>Rensa all data?</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>Alla skulder, prenumerationer och framsteg återställs. Det går inte att ångra.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...S.btn('ghost'), flex: 1, justifyContent: 'center', padding: '10px 0' }} onClick={() => setShowResetConfirm(false)}>Avbryt</button>
              <button style={{ ...S.btn('danger'), flex: 1, justifyContent: 'center', padding: '10px 0' }} onClick={() => { resetAllData(); setShowResetConfirm(false) }}>Rensa allt</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div style={contentStyle} className="content-view">
        {activeTab === 'dashboard' && (
          <DashboardView
            debts={debts}
            subscriptions={subscriptions}
            extraPayment={extraPayment}
            monthlyIncome={monthlyIncome}
            totalDebt={totalDebt}
            debtFreeMonths={debtFreeMonths}
            consolidationUnlocked={consolidationUnlocked}
            setExtraPayment={setExtraPayment}
            setMonthlyIncome={setMonthlyIncome}
            setActiveTab={setActiveTab}
            interestSaved={interestComparison.interestSaved}
            monthsSaved={interestComparison.monthsSaved}
            sendSummary={user ? sendSummary : null}
            summaryStatus={summaryStatus}
          />
        )}
        {activeTab === 'dolp' && (
          <DOLPView
            debts={debts}
            setDebts={setDebts}
            totalDebt={totalDebt}
            debtFreeMonths={debtFreeMonths}
            extraPayment={extraPayment}
            setExtraPayment={setExtraPayment}
            monthlyIncome={monthlyIncome}
            dolpPlan={dolpPlan}
            editDebtId={editDebtId}
            setEditDebtId={setEditDebtId}
            editDebt={editDebt}
            setEditDebt={setEditDebt}
            saveDebt={saveDebt}
            setDeleteDebtId={setDeleteDebtId}
            setShowAddForm={setShowAddDebtForm}
          />
        )}
        {activeTab === 'consolidation' && (
          <ConsolidationView
            consolidationUnlocked={consolidationUnlocked}
            behaviorProof={behaviorProof}
            setBehaviorProof={setBehaviorProof}
            debts={debts}
            extraPayment={extraPayment}
            consolidationRate={consolidationRate}
            setConsolidationRate={setConsolidationRate}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'buckets' && (
          <BucketsView
            buckets={buckets}
            setBuckets={setBuckets}
            monthlyIncome={monthlyIncome}
            setMonthlyIncome={setMonthlyIncome}
            editBucketType={editBucketType}
            setEditBucketType={setEditBucketType}
            editBucket={editBucket}
            setEditBucket={setEditBucket}
            saveBucket={saveBucket}
          />
        )}
        {activeTab === 'subs' && (
          <SubsView
            subscriptions={subscriptions}
            setSubscriptions={setSubscriptions}
            showSubForm={showSubForm}
            setShowSubForm={setShowSubForm}
            newSub={newSub}
            setNewSub={setNewSub}
            editSubId={editSubId}
            setEditSubId={setEditSubId}
            editSub={editSub}
            setEditSub={setEditSub}
            saveSub={saveSub}
            setShowHuntGuide={setShowHuntGuide}
          />
        )}
        {activeTab === 'coach' && (
          <CoachView
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendMessage={sendMessage}
            chatEndRef={chatEndRef}
            isChatLoading={isChatLoading}
            isDesktop={isDesktop}
            chatQuestionsLeft={chatQuestionsLeft}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressView
            achievements={achievements}
            behaviorProof={behaviorProof}
            setBehaviorProof={setBehaviorProof}
            debts={debts}
            subscriptions={subscriptions}
            consolidationUnlocked={consolidationUnlocked}
            buckets={buckets}
          />
        )}

        {activeTab === 'dashboard' && (
          <div style={{ textAlign: 'center', marginTop: 8, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button onClick={() => setShowResetConfirm(true)} style={{ background: 'none', border: 'none', fontSize: 11, color: C.border, cursor: 'pointer', padding: '4px 8px' }}>
              Rensa all data
            </button>
            <button
              onClick={() => { try { localStorage.removeItem('dh_skipped_landing') } catch {} window.location.reload() }}
              style={{ background: 'none', border: 'none', fontSize: 11, color: C.border, cursor: 'pointer', padding: '4px 8px' }}
            >
              Visa startsidan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
