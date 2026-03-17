import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

function calculateDOLPOrder(debts) {
  return [...debts].filter(d => !d.paid_off).sort((a, b) => a.balance - b.balance).map((d, i) => ({ ...d, dolp_order: i + 1 }));
}

function calculatePayoffPlan(debts, extraPayment) {
  const sorted = calculateDOLPOrder(debts);
  if (!sorted.length) return [];
  let plan = sorted.map(d => ({ ...d, remaining: d.balance, months_to_payoff: 0 }));
  let month = 0, freed = 0;
  while (plan.some(d => d.remaining > 0) && month < 600) {
    month++;
    const ai = plan.findIndex(d => d.remaining > 0);
    plan.forEach((d, i) => {
      if (d.remaining <= 0) return;
      const interest = (d.interest_rate / 100 / 12) * d.remaining;
      const payment = i === ai ? Math.min(d.min_payment + extraPayment + freed, d.remaining + interest) : Math.min(d.min_payment, d.remaining + interest);
      d.remaining = Math.max(0, d.remaining + interest - payment);
      if (d.remaining <= 0 && d.months_to_payoff === 0) { d.months_to_payoff = month; freed += d.min_payment; }
    });
  }
  return plan;
}

function calculateConsolidationSavings(debts, newRate) {
  const active = debts.filter(d => !d.paid_off);
  const totalBalance = active.reduce((s, d) => s + d.balance, 0);
  const totalMinPayment = active.reduce((s, d) => s + d.min_payment, 0);
  let currentTotalInterest = 0;
  active.forEach(d => { const months = d.balance / d.min_payment; currentTotalInterest += (d.balance / 2) * (d.interest_rate / 100) * (months / 12); });
  const monthlyRate = newRate / 100 / 12;
  const months = monthlyRate > 0 ? Math.log(totalMinPayment / (totalMinPayment - totalBalance * monthlyRate)) / Math.log(1 + monthlyRate) : totalBalance / totalMinPayment;
  const consolidatedTotalInterest = (totalMinPayment * months) - totalBalance;
  return {
    totalBalance,
    totalMinPayment,
    currentInterest: Math.round(currentTotalInterest),
    consolidatedInterest: Math.round(Math.max(0, consolidatedTotalInterest)),
    saving: Math.round(currentTotalInterest - Math.max(0, consolidatedTotalInterest)),
    newMonthlyPayment: Math.round(totalMinPayment * 0.85),
  };
}

function calculateCompoundGrowth(monthly, years, rate = 0.10) {
  const pts = [];
  for (let y = 0; y <= years; y++) {
    const n = y * 12;
    const amount = monthly > 0 ? monthly * ((Math.pow(1 + rate / 12, n) - 1) / (rate / 12)) : 0;
    pts.push({ year: y, amount: Math.round(amount) });
  }
  return pts;
}

function formatSEK(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M kr`;
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

function monthsToText(m) {
  if (m <= 0) return "Betald!";
  const y = Math.floor(m / 12), mo = m % 12;
  if (y === 0) return `${mo} mån`;
  if (mo === 0) return `${y} år`;
  return `${y} år ${mo} mån`;
}

const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    flame: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2s-5 5.5-5 10a5 5 0 0 0 10 0c0-2-1-4-2-5 0 2-1 3-2 3s-2-1.5-2-3c0-1.5 1-3 1-5z"/></svg>,
    bucket: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M7 8h10l-1 12H8L7 8z"/><path d="M5 8h14"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/></svg>,
    robot: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/><circle cx="9" cy="14" r="1" fill={color}/><circle cx="15" cy="14" r="1" fill={color}/><path d="M9 18h6"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    unlock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
    warning: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H4a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4"/><path d="M17 4h3a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4"/><rect x="7" y="2" width="10" height="9" rx="1"/></svg>,
    brain: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/></svg>,
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    pencil: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  };
  return icons[name] || null;
};

const MiniCompoundChart = ({ monthly, years = 30, color = "#40916C" }) => {
  if (!monthly || monthly <= 0) return null;
  const data = calculateCompoundGrowth(monthly, years);
  const max = data[data.length - 1].amount || 1;
  const w = 280, h = 70;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.amount / max) * h}`).join(" ");
  const gid = `g${Math.abs(color.charCodeAt(1))}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx={w} cy={0} r="4" fill={color}/>
    </svg>
  );
};

const UnlockCeremony = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const steps = [
    { emoji: "🎉", title: "Du har bevisat något viktigt", text: "Du har stängt kort, gjort extra betalningar och hållit dig från ny kredit. Det är inte lätt. Det är faktiskt det svåraste steget." },
    { emoji: "🧠", title: "Nu förstår du varför det funkar", text: "De flesta som tar ett samlån misslyckas. Inte för att räntan är fel, utan för att beteendet inte förändrats. Du har gjort det annorlunda." },
    { emoji: "⚠️", title: "Ett löfte till dig själv", text: "Samlånet fungerar bara om korten förblir stängda. Om du öppnar ny kredit startar du om från noll, fast med ett nytt lån ovanpå." },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 24, padding: 28, maxWidth: 380, width: "100%", textAlign: "center", animation: "unlockIn 0.3s ease" }}>
        {step < steps.length ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{steps[step].emoji}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#E6EDF3", marginBottom: 12, lineHeight: 1.3 }}>{steps[step].title}</div>
            <div style={{ fontSize: 14, color: "#8B949E", lineHeight: 1.7, marginBottom: 24 }}>{steps[step].text}</div>
            <button onClick={() => setStep(s => s + 1)} style={{ background: "#F4A261", color: "#0D1117", border: "none", borderRadius: 12, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
              {step < steps.length - 1 ? "Jag förstår →" : "Jag förstår och lovar →"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔓</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#40916C", marginBottom: 12 }}>Samlånskalkylatorn är upplåst</div>
            <div style={{ fontSize: 14, color: "#8B949E", lineHeight: 1.6, marginBottom: 20 }}>Du har tjänat rätten att använda det här verktyget. Använd det klokt.</div>
            <div onClick={() => setConfirmed(c => !c)} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#0D1117", borderRadius: 12, padding: 14, marginBottom: 20, cursor: "pointer", border: `1px solid ${confirmed ? "#40916C" : "#30363D"}`, textAlign: "left" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${confirmed ? "#40916C" : "#30363D"}`, background: confirmed ? "#40916C" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                {confirmed && <Icon name="check" size={12} color="#fff" />}
              </div>
              <div style={{ fontSize: 13, color: "#8B949E", lineHeight: 1.5 }}>Jag förstår att ett samlån bara fungerar om mina kort förblir stängda. Ny kredit = börja om från noll.</div>
            </div>
            <button disabled={!confirmed} onClick={onClose} style={{ background: confirmed ? "#40916C" : "#21262D", color: confirmed ? "#fff" : "#8B949E", border: "none", borderRadius: 12, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: confirmed ? "pointer" : "not-allowed", width: "100%", transition: "all 0.3s" }}>
              Visa kalkylatorn
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const HUNT_STEPS = [
  {
    emoji: "📱",
    title: "iPhone: Inbyggd prenumerationslista",
    platform: "Apple",
    color: "#4A9ECC",
    steps: [
      "Öppna Inställningar på din iPhone",
      "Tryck på ditt namn högst upp",
      "Välj Prenumerationer",
      "Här ser du ALLA aktiva App Store-prenumerationer med pris och förnyelsedatum",
    ],
    tip: "Det är den snabbaste och mest kompletta listan för iPhone-användare. Börja alltid här.",
  },
  {
    emoji: "🤖",
    title: "Android: Google Play",
    platform: "Android",
    color: "#40916C",
    steps: [
      "Öppna Google Play",
      "Tryck på din profilbild uppe till höger",
      "Välj Betalningar och prenumerationer",
      "Tryck på Prenumerationer",
    ],
    tip: "Obs: Visar bara appar köpta via Google Play, inte externa tjänster som Netflix eller Spotify.",
  },
  {
    emoji: "🏦",
    title: "Din bank: Återkommande betalningar",
    platform: "Banken",
    color: "#C77B2A",
    steps: [
      "Logga in på din banks app eller internet",
      "Gå till transaktionshistoriken",
      "Filtrera på de senaste 2-3 månaderna",
      "Leta efter belopp som upprepas exakt varje månad",
      "Glöm inte att kolla KORTET separat, inte bara kontot",
    ],
    tip: "Många prenumerationer betalas på kredit- eller betalkort och syns inte på kontot. Kolla båda.",
  },
  {
    emoji: "📧",
    title: "Din mejl: Kvittojakten",
    platform: "E-post",
    color: "#8B5CF6",
    steps: [
      'Sök på "prenumeration" i din inkorg',
      'Sök på "kvitto" och "faktura"',
      'Sök på "invoice" och "receipt" (för utländska tjänster)',
      'Sök på "din betalning bekräftad"',
      "Gå igenom de senaste 3 månaderna av träffar",
    ],
    tip: "Det här är det mest tidskrävande steget men hittar saker banken missar, till exempel årsbetalda tjänster.",
  },
  {
    emoji: "💳",
    title: "Ditt kreditkort: Separat genomgång",
    platform: "Kort",
    color: "#E63946",
    steps: [
      "Logga in på kortets portal (Visa, Mastercard, Amex)",
      "Titta på senaste 3 månaders transaktioner",
      "Sortera eller filtrera på belopp",
      "Markera allt som återkommer med samma belopp",
    ],
    tip: "Kreditkort är vanligaste platsen för prenumerationer eftersom de sällan avvisas vid förnyelse, till skillnad från bankkonton.",
  },
  {
    emoji: "🧾",
    title: "Kontoutdraget: Strukturerad genomgång",
    platform: "PDF",
    color: "#F4A261",
    steps: [
      "Ladda ned tre månaders kontoutdrag som PDF",
      "Öppna i ett kalkylblad eller skriv ut",
      "Gå rad för rad och markera återkommande poster",
      "Jämför månad 1 mot månad 2 och 3",
      "Allt som dyker upp tre gånger är troligen en prenumeration",
    ],
    tip: "Det här tar 20-30 minuter men är det ENDA sättet att vara helt säker på att du inte missar något. Eget ansvar ger full kontroll.",
  },
];

const HuntGuide = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState({});
  const current = HUNT_STEPS[step];
  const isLast = step === HUNT_STEPS.length - 1;

  const toggleCheck = (i) => setChecked(prev => ({ ...prev, [`${step}-${i}`]: !prev[`${step}-${i}`] }));
  const stepDone = current.steps.every((_, i) => checked[`${step}-${i}`]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 480, animation: "slideUp 0.3s ease", maxHeight: "90vh", overflowY: "auto" }}>
        
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {HUNT_STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i < step ? "#40916C" : i === step ? current.color : "#21262D", transition: "all 0.3s", cursor: "pointer" }} />
          ))}
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${current.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
            {current.emoji}
          </div>
          <div>
            <div style={{ fontSize: 10, color: current.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{current.platform}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#E6EDF3", lineHeight: 1.3 }}>{current.title}</div>
          </div>
        </div>

        {/* Steps as checklist */}
        <div style={{ marginTop: 16, marginBottom: 14 }}>
          {current.steps.map((s, i) => (
            <div key={i} onClick={() => toggleCheck(i)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < current.steps.length - 1 ? "1px solid #21262D" : "none", cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${checked[`${step}-${i}`] ? current.color : "#30363D"}`, background: checked[`${step}-${i}`] ? current.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.2s" }}>
                {checked[`${step}-${i}`] && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <div style={{ fontSize: 14, color: checked[`${step}-${i}`] ? "#8B949E" : "#E6EDF3", textDecoration: checked[`${step}-${i}`] ? "line-through" : "none", lineHeight: 1.5, transition: "all 0.2s" }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Tip box */}
        <div style={{ background: "#0D1117", borderRadius: 12, padding: 12, marginBottom: 20, border: `1px solid ${current.color}30` }}>
          <div style={{ fontSize: 11, color: current.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>💡 Tips</div>
          <div style={{ fontSize: 13, color: "#8B949E", lineHeight: 1.6 }}>{current.tip}</div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ background: "#21262D", color: "#8B949E", border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              ←
            </button>
          )}
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            style={{ flex: 1, background: stepDone ? current.color : "#21262D", color: stepDone ? "#fff" : "#8B949E", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}
          >
            {isLast ? (stepDone ? "✓ Jakten är klar, lägg till det du hittade!" : "Avsluta guiden") : (stepDone ? `Nästa: ${HUNT_STEPS[step + 1].platform} →` : "Nästa källa →")}
          </button>
        </div>

        <button onClick={onClose} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#8B949E", fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
          Stäng guiden
        </button>
      </div>
    </div>
  );
};

const DEFAULT_DEBTS = [
  { id: 1, name: "Klarna", balance: 4200, interest_rate: 29.9, min_payment: 300, paid_off: false },
  { id: 2, name: "Mastercard", balance: 18500, interest_rate: 22.5, min_payment: 500, paid_off: false },
  { id: 3, name: "Konsumentlån", balance: 45000, interest_rate: 8.9, min_payment: 1200, paid_off: false },
];

const DEFAULT_SUBS = [
  { id: 1, name: "Netflix", cost: 149, active: true },
  { id: 2, name: "Spotify", cost: 119, active: true },
  { id: 3, name: "HBO Max", cost: 99, active: true },
  { id: 4, name: "iCloud+", cost: 39, active: true },
  { id: 5, name: "Gym (används ej)", cost: 349, active: true },
  { id: 6, name: "Adobe", cost: 599, active: true },
];

const DEFAULT_BUCKETS = [
  { type: "pension", label: "Pension & Investeringar", emoji: "🌲", color: "#40916C", current: 45000, goal: 500000 },
  { type: "buffert", label: "Buffert", emoji: "🛡️", color: "#2D6A8F", current: 12000, goal: 50000 },
  { type: "drom", label: "Drömhinken", emoji: "⭐", color: "#C77B2A", current: 8000, goal: 80000 },
];

function lsGet(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}

export default function DebtHacker({ activeTab, setActiveTab, isDesktop, consolidationUnlocked, setConsolidationUnlocked, user }) {
  const [debts, setDebts] = useState(() => lsGet('dh_debts', DEFAULT_DEBTS));
  const [extraPayment, setExtraPayment] = useState(() => lsGet('dh_extra', 2000));
  const [monthlyIncome, setMonthlyIncome] = useState(() => lsGet('dh_income', 38000));
  const [subscriptions, setSubscriptions] = useState(() => lsGet('dh_subs', DEFAULT_SUBS));
  const [buckets, setBuckets] = useState(() => lsGet('dh_buckets', DEFAULT_BUCKETS));
  const [editBucketType, setEditBucketType] = useState(null);
  const [editBucket, setEditBucket] = useState({ current: "", goal: "" });
  const [behaviorProof, setBehaviorProof] = useState(() => lsGet('dh_behavior', { cardClosed: false, extraPayments: 0, noCreditDays: 0 }));
  const [showUnlockCeremony, setShowUnlockCeremony] = useState(false);
  const [consolidationRate, setConsolidationRate] = useState(() => lsGet('dh_consrate', 8.9));
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [showHuntGuide, setShowHuntGuide] = useState(false);
  const [deleteDebtId, setDeleteDebtId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newDebt, setNewDebt] = useState({ name: "", balance: "", interest_rate: "", min_payment: "" });
  const [newSub, setNewSub] = useState({ name: "", cost: "" });
  const [editDebtId, setEditDebtId] = useState(null);
  const [editDebt, setEditDebt] = useState({ name: "", balance: "", interest_rate: "", min_payment: "" });
  const [editSubId, setEditSubId] = useState(null);
  const [editSub, setEditSub] = useState({ name: "", cost: "" });
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hej! Jag är din ekonomicoach baserad på David Bachs principer. Fråga mig om DOLP, sparande eller om samlån är rätt för dig." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  useEffect(() => { localStorage.setItem('dh_debts', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('dh_subs', JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { localStorage.setItem('dh_extra', JSON.stringify(extraPayment)); }, [extraPayment]);
  useEffect(() => { localStorage.setItem('dh_income', JSON.stringify(monthlyIncome)); }, [monthlyIncome]);
  useEffect(() => { localStorage.setItem('dh_behavior', JSON.stringify(behaviorProof)); }, [behaviorProof]);
  useEffect(() => { localStorage.setItem('dh_consrate', JSON.stringify(consolidationRate)); }, [consolidationRate]);
  useEffect(() => { localStorage.setItem('dh_buckets', JSON.stringify(buckets)); }, [buckets]);

  // Load from Supabase when user logs in
  useEffect(() => {
    if (!user) return;
    supabase.from('dh_user_data').select('data').eq('user_id', user.id).single().then(({ data }) => {
      if (!data?.data) return;
      const d = data.data;
      if (d.debts) setDebts(d.debts);
      if (d.subscriptions) setSubscriptions(d.subscriptions);
      if (d.extraPayment !== undefined) setExtraPayment(d.extraPayment);
      if (d.monthlyIncome !== undefined) setMonthlyIncome(d.monthlyIncome);
      if (d.behaviorProof) setBehaviorProof(d.behaviorProof);
      if (d.consolidationRate !== undefined) setConsolidationRate(d.consolidationRate);
      if (d.consolidationUnlocked !== undefined) setConsolidationUnlocked(d.consolidationUnlocked);
      if (d.buckets) setBuckets(d.buckets);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save to Supabase on any state change
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      supabase.from('dh_user_data').upsert({
        user_id: user.id,
        data: { debts, subscriptions, extraPayment, monthlyIncome, behaviorProof, consolidationRate, consolidationUnlocked, buckets },
        updated_at: new Date().toISOString(),
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, debts, subscriptions, extraPayment, monthlyIncome, behaviorProof, consolidationRate, consolidationUnlocked, buckets]);

  const dolpPlan = calculatePayoffPlan(debts, extraPayment);
  const totalDebt = debts.filter(d => !d.paid_off).reduce((s, d) => s + d.balance, 0);
  const debtFreeMonths = dolpPlan.length > 0 ? Math.max(...dolpPlan.map(d => d.months_to_payoff)) : 0;
  const totalSubsCost = subscriptions.filter(s => s.active).reduce((s, sub) => s + sub.cost, 0);
  const cancelledSubsCost = subscriptions.filter(s => !s.active).reduce((s, sub) => s + sub.cost, 0);
  const alloc = { pension: monthlyIncome * 0.125, buffert: monthlyIncome * 0.05, drom: monthlyIncome * 0.05 };

  const lockTasks = [
    { label: "Stängt minst ett kort", done: behaviorProof.cardClosed, action: () => setBehaviorProof(p => ({ ...p, cardClosed: true })), btnLabel: "Bekräfta" },
    { label: `Extra betalningar gjorda (${behaviorProof.extraPayments}/3)`, done: behaviorProof.extraPayments >= 3, action: () => setBehaviorProof(p => ({ ...p, extraPayments: Math.min(3, p.extraPayments + 1) })), btnLabel: "+1 betalning" },
    { label: `Dagar utan ny kredit (${behaviorProof.noCreditDays}/30)`, done: behaviorProof.noCreditDays >= 30, action: () => setBehaviorProof(p => ({ ...p, noCreditDays: Math.min(30, p.noCreditDays + 5) })), btnLabel: "+5 dagar" },
  ];
  const lockPct = Math.round((lockTasks.filter(t => t.done).length / lockTasks.length) * 100);
  const fullyProven = lockTasks.every(t => t.done);

  const resetAllData = () => {
    const keys = ['dh_debts', 'dh_subs', 'dh_extra', 'dh_income', 'dh_behavior', 'dh_consrate', 'dh_cons_unlocked', 'dh_buckets'];
    keys.forEach(k => localStorage.removeItem(k));
    setDebts(DEFAULT_DEBTS);
    setSubscriptions(DEFAULT_SUBS);
    setBuckets(DEFAULT_BUCKETS);
    setExtraPayment(2000);
    setMonthlyIncome(38000);
    setBehaviorProof({ cardClosed: false, extraPayments: 0, noCreditDays: 0 });
    setConsolidationRate(8.9);
    setConsolidationUnlocked(false);
  };

  const addDebt = () => {
    if (!newDebt.name || !newDebt.balance) return;
    setDebts(p => [...p, { id: Date.now(), name: newDebt.name, balance: parseFloat(newDebt.balance), interest_rate: parseFloat(newDebt.interest_rate) || 0, min_payment: parseFloat(newDebt.min_payment) || 200, paid_off: false }]);
    setNewDebt({ name: "", balance: "", interest_rate: "", min_payment: "" });
    setShowDebtForm(false);
  };
  const addSub = () => {
    if (!newSub.name || !newSub.cost) return;
    setSubscriptions(p => [...p, { id: Date.now(), name: newSub.name, cost: parseFloat(newSub.cost), active: true }]);
    setNewSub({ name: "", cost: "" });
    setShowSubForm(false);
  };
  const saveDebt = () => {
    if (!editDebt.name || !editDebt.balance) return;
    setDebts(p => p.map(d => d.id === editDebtId ? { ...d, name: editDebt.name, balance: parseFloat(editDebt.balance), interest_rate: parseFloat(editDebt.interest_rate) || 0, min_payment: parseFloat(editDebt.min_payment) || 200 } : d));
    setEditDebtId(null);
  };
  const saveSub = () => {
    if (!editSub.name || !editSub.cost) return;
    setSubscriptions(p => p.map(s => s.id === editSubId ? { ...s, name: editSub.name, cost: parseFloat(editSub.cost) } : s));
    setEditSubId(null);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(p => [...p, { role: "user", text: userMsg }]);
    setIsTyping(true);
    try {
      const ctx = `Inkomst: ${monthlyIncome} SEK. Skulder: ${debts.filter(d => !d.paid_off).map(d => `${d.name} ${d.balance}kr ${d.interest_rate}%`).join(", ")}. Skuldfri om: ${monthsToText(debtFreeMonths)}. Samlånslåset: ${lockPct}% bevisat, ${consolidationUnlocked ? "upplåst" : "låst"}.`;
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: `Du är ekonomicoach på debthacker.se, baserad på David Bachs DOLP-metod. Svara på svenska, max 3 meningar, konkret och uppmuntrande. Inga listor. Kontext: ${ctx}`,
          messages: [...chatMessages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })), { role: "user", content: userMsg }]
        })
      });
      const data = await res.json();
      setChatMessages(p => [...p, { role: "assistant", text: data.content?.[0]?.text || "Håll kursen! Minsta skuld alltid först." }]);
    } catch { setChatMessages(p => [...p, { role: "assistant", text: "Håll kursen! Minsta skuld alltid först." }]); }
    setIsTyping(false);
  };

  const S = {
    app: { fontFamily: "'DM Sans', sans-serif", background: "#0D1117", minHeight: "100vh", color: "#E6EDF3", overflowX: "hidden" },
    content: { padding: isDesktop ? "32px 36px 48px" : "16px 16px 88px", maxWidth: isDesktop ? 880 : "100%", margin: "0 auto" },
    card: { background: "#161B22", borderRadius: 16, padding: "20px", marginBottom: 12, border: "1px solid #21262D" },
    label: { fontSize: 12, color: "#7D8590", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5, fontWeight: 600 },
    bigNum: c => ({ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: c || "#F4A261", lineHeight: 1 }),
    badge: c => ({ background: c, borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700, color: "#fff", display: "inline-block", letterSpacing: 0.5 }),
    progBar: { height: 6, background: "#21262D", borderRadius: 6, overflow: "hidden" },
    progFill: (p, c) => ({ height: "100%", width: `${Math.min(100, p)}%`, background: c, borderRadius: 6, transition: "width 0.8s ease" }),
    btn: v => ({ background: v === "primary" ? "#F4A261" : v === "danger" ? "#E63946" : v === "success" ? "#40916C" : "#21262D", color: v === "ghost" ? "#8B949E" : v === "success" ? "#fff" : "#0D1117", border: "none", borderRadius: 10, padding: "10px 15px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }),
    input: { background: "#0D1117", border: "1px solid #30363D", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#E6EDF3", width: "100%", outline: "none", boxSizing: "border-box" },
    row: { display: "flex", alignItems: "center", gap: 8 },
    g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  };

  const Dashboard = () => (
    <div>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A1000, #161B22)", border: "1px solid #F4A26130", padding: "22px 20px" }}>
        <div style={S.label}>Total skuld</div>
        <div style={{ ...S.bigNum(), fontSize: 40, marginTop: 2 }}>{formatSEK(totalDebt)}</div>
        <div style={{ fontSize: 13, color: "#8B949E", marginTop: 8, lineHeight: 1.5 }}>Skuldfri om <span style={{ color: "#F4A261", fontWeight: 600 }}>{monthsToText(debtFreeMonths)}</span> med {formatSEK(extraPayment)}/mån extra</div>
      </div>
      <div style={S.g2}>
        <div style={{ ...S.card, cursor: "pointer", minHeight: 110 }} className="card-clickable" onClick={() => setActiveTab("dolp")}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>🔥</div>
          <div style={{ ...S.label, marginBottom: 6 }}>Aktiva skulder</div>
          <div style={{ ...S.bigNum("#F4A261"), fontSize: 34 }}>{debts.filter(d => !d.paid_off).length}</div>
        </div>
        <div style={{ ...S.card, cursor: "pointer", minHeight: 110 }} className="card-clickable" onClick={() => setActiveTab("consolidation")}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>{consolidationUnlocked ? "🔓" : "🔒"}</div>
          <div style={{ ...S.label, marginBottom: 6 }}>Samlånslåset</div>
          <div style={{ ...S.bigNum(consolidationUnlocked ? "#40916C" : "#8B949E"), fontSize: consolidationUnlocked ? 18 : 34 }}>{consolidationUnlocked ? "Upplåst" : `${lockPct}%`}</div>
        </div>
      </div>
      <div style={S.g2}>
        <div style={{ ...S.card, cursor: "pointer", minHeight: 110 }} className="card-clickable" onClick={() => setActiveTab("buckets")}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>🪣</div>
          <div style={{ ...S.label, marginBottom: 6 }}>Sparande/mån</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#40916C", lineHeight: 1 }}>{formatSEK(alloc.pension + alloc.buffert + alloc.drom)}</div>
        </div>
        <div style={{ ...S.card, cursor: "pointer", minHeight: 110 }} className="card-clickable" onClick={() => setActiveTab("subs")}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>📱</div>
          <div style={{ ...S.label, marginBottom: 6 }}>Prenumerationer</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#E63946", lineHeight: 1 }}>{formatSEK(totalSubsCost)}<span style={{ fontSize: 14, fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>/mån</span></div>
        </div>
      </div>
      <div style={{ ...S.card, cursor: "pointer" }} className="card-clickable" onClick={() => setActiveTab("coach")}>
        <div style={S.row}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "#2D6A8F22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="robot" size={22} color="#4A9ECC" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ekonomicoach</div>
            <div style={{ fontSize: 13, color: "#8B949E" }}>Fråga vad som helst</div>
          </div>
          <Icon name="arrow" size={16} color="#8B949E" />
        </div>
      </div>
      <div style={S.card}>
        <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Extra betalning/mån</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#F4A261" }}>{formatSEK(extraPayment)}</div>
        </div>
        <input type="range" min={0} max={10000} step={500} value={extraPayment} onChange={e => setExtraPayment(+e.target.value)} style={{ width: "100%", accentColor: "#F4A261" }} />
        <div style={{ fontSize: 12, color: "#7D8590", marginTop: 8 }}>Skuldfri om <span style={{ color: extraPayment > 0 ? "#F4A261" : "#8B949E", fontWeight: 600 }}>{monthsToText(debtFreeMonths)}</span> med denna betalning</div>
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button onClick={() => setShowResetConfirm(true)} style={{ background: "none", border: "none", fontSize: 11, color: "#30363D", cursor: "pointer", padding: "4px 8px" }}>
          Rensa all data
        </button>
      </div>
    </div>
  );

  const DOLPView = () => {
    const sorted = calculateDOLPOrder(debts);
    return (
      <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#F4A261" }}>Skuldsläckaren 🔥</div>
        <div style={{ fontSize: 13, color: "#7D8590", marginTop: 2 }}>DOLP: minsta skuld först, bygg momentum</div>
      </div>
        <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0A0A, #161B22)", border: "1px solid #E6394630" }}>
          <div style={S.g2}>
            <div><div style={S.label}>Total skuld</div><div style={{ ...S.bigNum("#E63946"), fontSize: 26 }}>{formatSEK(totalDebt)}</div></div>
            <div><div style={S.label}>Skuldfri om</div><div style={{ ...S.bigNum("#40916C"), fontSize: 24 }}>{monthsToText(debtFreeMonths)}</div></div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Extra betalning per månad</div>
          <div style={S.row}>
            <input type="range" min={0} max={10000} step={500} value={extraPayment} onChange={e => setExtraPayment(+e.target.value)} style={{ flex: 1, accentColor: "#F4A261" }} />
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#F4A261", minWidth: 76, textAlign: "right" }}>{formatSEK(extraPayment)}</div>
          </div>
        </div>
        {sorted.map((debt, i) => {
          const plan = dolpPlan.find(p => p.id === debt.id);
          const intensity = debt.balance / Math.max(...debts.map(d => d.balance));
          const isActive = i === 0;
          return (
            <div key={debt.id} style={{ background: isActive ? "linear-gradient(135deg, #1B2A1B, #161B22)" : "#161B22", borderRadius: 12, padding: 13, marginBottom: 9, border: `1px solid ${isActive ? "#40916C44" : "#21262D"}`, position: "relative" }}>
              {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #40916C, #F4A261)", borderRadius: "12px 12px 0 0" }} />}
              {editDebtId === debt.id ? (
                <div>
                  <input style={{ ...S.input, marginBottom: 7 }} placeholder="Namn" value={editDebt.name} onChange={e => setEditDebt(p => ({ ...p, name: e.target.value }))} />
                  <input style={{ ...S.input, marginBottom: 7 }} type="number" placeholder="Saldo (kr)" value={editDebt.balance} onChange={e => setEditDebt(p => ({ ...p, balance: e.target.value }))} />
                  <input style={{ ...S.input, marginBottom: 7 }} type="number" placeholder="Ränta (%)" value={editDebt.interest_rate} onChange={e => setEditDebt(p => ({ ...p, interest_rate: e.target.value }))} />
                  <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="Minbetalning (kr)" value={editDebt.min_payment} onChange={e => setEditDebt(p => ({ ...p, min_payment: e.target.value }))} />
                  <div style={S.row}>
                    <button style={S.btn("primary")} onClick={saveDebt}><Icon name="check" size={13} color="#0D1117" />Spara</button>
                    <button style={S.btn("ghost")} onClick={() => setEditDebtId(null)}>Avbryt</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={S.row}>
                      <span style={{ fontSize: 14 + intensity * 16, filter: isActive ? "drop-shadow(0 0 5px #F4A261)" : "none", animation: isActive ? "flamePulse 1.5s ease-in-out infinite" : "none" }}>🔥</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "#E6EDF3" : "#C9D1D9" }}>{debt.name}</div>
                        {isActive && <span style={{ ...S.badge("#40916C"), animation: "badgePulse 2s ease infinite" }}>NÄSTA</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: isActive ? "#F4A261" : "#8B949E" }}>{formatSEK(debt.balance)}</div>
                      <div style={{ fontSize: 12, color: "#A0A8B0" }}>{debt.interest_rate}% ränta</div>
                    </div>
                  </div>
                  <div style={{ ...S.progBar, marginBottom: 12 }}>
                    <div style={S.progFill(plan ? Math.max(0, 100 - (plan.remaining / debt.balance) * 100) : 0, isActive ? "#40916C" : "#21262D")} />
                  </div>
                  <div style={{ ...S.row, justifyContent: "space-between", paddingTop: 4 }}>
                    <div style={{ fontSize: 13, color: "#7D8590" }}>Min: {formatSEK(debt.min_payment)}/mån</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#40916C" : "#8B949E" }}>{plan ? monthsToText(plan.months_to_payoff) : "–"}</div>
                    <div style={S.row}>
                      <button style={{ ...S.btn("ghost"), padding: "5px 8px" }} onClick={() => { setEditDebtId(debt.id); setEditDebt({ name: debt.name, balance: debt.balance, interest_rate: debt.interest_rate, min_payment: debt.min_payment }); }}><Icon name="pencil" size={12} color="#8B949E" /></button>
                      <button style={{ ...S.btn("success"), padding: "5px 8px" }} onClick={() => setDebts(p => p.map(d => d.id === debt.id ? { ...d, paid_off: true } : d))}><Icon name="check" size={12} color="#fff" /></button>
                      <button style={{ ...S.btn("danger"), padding: "5px 8px" }} onClick={() => setDeleteDebtId(debt.id)}><Icon name="trash" size={12} color="#fff" /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {debts.filter(d => d.paid_off).map(d => (
          <div key={d.id} style={{ ...S.card, opacity: 0.5, border: "1px solid #40916C33" }}>
            <div style={{ ...S.row, justifyContent: "space-between" }}>
              <div style={S.row}><span>✅</span><span style={{ fontSize: 13, color: "#40916C" }}>{d.name}</span></div>
              <span style={S.badge("#40916C")}>DOLP!</span>
            </div>
          </div>
        ))}
        {showDebtForm ? (
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Lägg till skuld</div>
            <input style={{ ...S.input, marginBottom: 7 }} placeholder="Namn" value={newDebt.name} onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))} />
            <input style={{ ...S.input, marginBottom: 7 }} type="number" placeholder="Saldo (kr)" value={newDebt.balance} onChange={e => setNewDebt(p => ({ ...p, balance: e.target.value }))} />
            <input style={{ ...S.input, marginBottom: 7 }} type="number" placeholder="Ränta (%)" value={newDebt.interest_rate} onChange={e => setNewDebt(p => ({ ...p, interest_rate: e.target.value }))} />
            <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="Minbetalning (kr)" value={newDebt.min_payment} onChange={e => setNewDebt(p => ({ ...p, min_payment: e.target.value }))} />
            <div style={S.row}>
              <button style={S.btn("primary")} onClick={addDebt}><Icon name="check" size={13} color="#0D1117" />Spara</button>
              <button style={S.btn("ghost")} onClick={() => setShowDebtForm(false)}>Avbryt</button>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btn("primary"), width: "100%", justifyContent: "center", padding: 13 }} onClick={() => setShowDebtForm(true)}>
            <Icon name="plus" size={14} color="#0D1117" />Lägg till skuld
          </button>
        )}
      </div>
    );
  };

  const ConsolidationView = () => {
    const savings = calculateConsolidationSavings(debts, consolidationRate);
    if (!consolidationUnlocked) {
      return (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#8B949E" }}>Samlånslåset 🔒</div>
            <div style={{ fontSize: 13, color: "#7D8590", marginTop: 2 }}>Beteendet måste ändras innan verktyget används</div>
          </div>
          <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D00, #161B22)", border: "1px solid #F4A26125" }}>
            <div style={{ ...S.row, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F4A26115", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="brain" size={18} color="#F4A261" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F4A261" }}>Varför är det låst?</div>
            </div>
            <div style={{ fontSize: 13, color: "#8B949E", lineHeight: 1.7 }}>
              De flesta som tar ett samlån hamnar i <span style={{ color: "#E63946", fontWeight: 600 }}>ännu mer skuld</span> inom två år. Inte för att räntan är fel, utan för att beteendet inte förändrats.
            </div>
            <div style={{ marginTop: 10, padding: 12, background: "#0D1117", borderRadius: 10, fontSize: 13, color: "#8B949E", lineHeight: 1.6 }}>
              💡 <span style={{ color: "#E6EDF3" }}>David Bach:</span> "Problemet är aldrig räntan. Problemet är att folk betalar av kortet och sedan börjar använda det igen."
            </div>
          </div>

          {/* BLURRED PREVIEW */}
          <div style={{ ...S.card, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(13,17,23,0.88)", backdropFilter: "blur(4px)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 14, gap: 6 }}>
              <Icon name="lock" size={28} color="#8B949E" />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8B949E" }}>Slutför beteendebevis för att se</div>
              <div style={{ fontSize: 12, color: "#8B949E" }}>{lockPct}% av {lockTasks.length} bevis klara</div>
            </div>
            <div style={{ filter: "blur(6px)", pointerEvents: "none" }}>
              <div style={S.label}>Potentiell räntebesparing</div>
              <div style={S.bigNum("#40916C")}>{formatSEK(80000)}</div>
              <div style={{ fontSize: 13, color: "#8B949E", marginTop: 4 }}>Om du samlar till 9% ränta</div>
              <div style={{ marginTop: 8 }}>
                <div style={S.g2}>
                  <div><div style={S.label}>Utan samlån</div><div style={{ fontFamily: "'DM Serif Display', serif", color: "#E63946", fontSize: 18 }}>180k kr ränta</div></div>
                  <div><div style={S.label}>Med samlån</div><div style={{ fontFamily: "'DM Serif Display', serif", color: "#40916C", fontSize: 18 }}>95k kr ränta</div></div>
                </div>
              </div>
            </div>
          </div>

          {/* BEHAVIOR TASKS */}
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#E6EDF3", margin: "14px 0 10px" }}>Bevisa förändringen</div>
          <div style={S.card}>
            <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Framsteg</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: lockPct === 100 ? "#40916C" : "#F4A261" }}>{lockPct}%</div>
            </div>
            <div style={S.progBar}><div style={S.progFill(lockPct, lockPct === 100 ? "#40916C" : "#F4A261")} /></div>
          </div>
          {lockTasks.map((task, i) => (
            <div key={i} style={{ ...S.card, border: `1px solid ${task.done ? "#40916C44" : "#21262D"}`, background: task.done ? "linear-gradient(135deg, #0A1E10, #161B22)" : "#161B22" }}>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div style={S.row}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: task.done ? "#40916C" : "#21262D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {task.done ? <Icon name="check" size={13} color="#fff" /> : <span style={{ fontSize: 11, color: "#8B949E" }}>{i + 1}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: task.done ? "#40916C" : "#E6EDF3", fontWeight: task.done ? 600 : 400 }}>{task.label}</div>
                </div>
                {!task.done && <button style={{ ...S.btn("primary"), padding: "5px 11px", fontSize: 12 }} onClick={task.action}>{task.btnLabel}</button>}
                {task.done && <span style={{ fontSize: 16 }}>✅</span>}
              </div>
            </div>
          ))}
          {fullyProven && !consolidationUnlocked && (
            <button onClick={() => setShowUnlockCeremony(true)} style={{ ...S.btn("success"), width: "100%", justifyContent: "center", padding: 15, fontSize: 14, fontWeight: 700, marginTop: 6, boxShadow: "0 0 24px #40916C44" }}>
              <Icon name="unlock" size={17} color="#fff" />
              🎉 Lås upp samlånskalkylatorn
            </button>
          )}
        </div>
      );
    }

    return (
      <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#40916C" }}>Samlånslåset 🔓</div>
        <div style={{ fontSize: 13, color: "#40916C", marginTop: 2 }}>Du har bevisat att du är redo</div>
      </div>
        <div style={{ ...S.card, background: "linear-gradient(135deg, #0A1E10, #161B22)", border: "1px solid #40916C44" }}>
          <div style={S.row}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#40916C22", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="trophy" size={16} color="#40916C" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#40916C" }}>Beteendet är bevisat ✓</div>
              <div style={{ fontSize: 12, color: "#8B949E" }}>Du är en av få som faktiskt klarat detta</div>
            </div>
          </div>
        </div>
        <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D0D, #161B22)", border: "1px solid #E6394625" }}>
          <div style={S.row}>
            <Icon name="warning" size={16} color="#E63946" />
            <div style={{ fontSize: 13, color: "#E63946", fontWeight: 600 }}>Permanent påminnelse</div>
          </div>
          <div style={{ fontSize: 13, color: "#8B949E", marginTop: 8, lineHeight: 1.6 }}>Samlånet fungerar bara om korten förblir stängda. Öppnar du ny kredit startar du om från noll, fast med ett nytt lån ovanpå.</div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Samlånsränta att jämföra med</div>
          <div style={S.row}>
            <input type="range" min={4} max={20} step={0.5} value={consolidationRate} onChange={e => setConsolidationRate(+e.target.value)} style={{ flex: 1, accentColor: "#40916C" }} />
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#40916C", minWidth: 58, textAlign: "right" }}>{consolidationRate}%</div>
          </div>
          <div style={{ fontSize: 12, color: "#8B949E", marginTop: 4 }}>Jämför på Lendo.se eller Sambla.se</div>
        </div>
        <div style={S.g2}>
          <div style={{ ...S.card, border: "1px solid #E6394625" }}>
            <div style={S.label}>Utan samlån</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#E63946" }}>{formatSEK(savings.currentInterest)}</div>
            <div style={{ fontSize: 11, color: "#8B949E" }}>total ränta</div>
          </div>
          <div style={{ ...S.card, border: "1px solid #40916C44" }}>
            <div style={S.label}>Med {consolidationRate}%</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#40916C" }}>{formatSEK(savings.consolidatedInterest)}</div>
            <div style={{ fontSize: 11, color: "#8B949E" }}>total ränta</div>
          </div>
        </div>
        <div style={{ ...S.card, background: "linear-gradient(135deg, #0A1E10, #161B22)", border: "1px solid #40916C44" }}>
          <div style={S.label}>Du sparar totalt</div>
          <div style={S.bigNum("#40916C")}>{formatSEK(savings.saving)}</div>
          <div style={{ fontSize: 13, color: "#8B949E", marginTop: 6 }}>Ny månadsbetalning: <span style={{ color: "#40916C", fontWeight: 600 }}>{formatSEK(savings.newMonthlyPayment)}/mån</span> (vs {formatSEK(savings.totalMinPayment)}/mån)</div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Alla skulder att samla</div>
          {debts.filter(d => !d.paid_off).map(d => (
            <div key={d.id} style={{ ...S.row, justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid #21262D" }}>
              <div style={{ fontSize: 13, color: "#8B949E" }}>{d.name}</div>
              <div style={S.row}><span style={{ fontSize: 12, color: "#E63946" }}>{d.interest_rate}%</span><span style={{ fontSize: 13 }}>{formatSEK(d.balance)}</span></div>
            </div>
          ))}
          <div style={{ ...S.row, justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid #30363D" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Totalt</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#F4A261" }}>{formatSEK(savings.totalBalance)}</div>
          </div>
        </div>
        <div style={{ ...S.card, background: "#0D1117", border: "1px solid #21262D" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Nästa steg</div>
          <div style={{ fontSize: 13, color: "#8B949E", lineHeight: 1.8 }}>
            1. Jämför erbjudanden på <span style={{ color: "#4A9ECC" }}>Lendo.se</span> eller <span style={{ color: "#4A9ECC" }}>Sambla.se</span><br/>
            2. Ta bara lån som täcker exakt ditt skuldsaldo<br/>
            3. Klipp korten direkt när lånet betalas ut<br/>
            4. Sätt hela gamla månadsbetalningen mot det nya lånet
          </div>
        </div>
      </div>
    );
  };

  const BucketsView = () => {
    const allocs = { pension: alloc.pension, buffert: alloc.buffert, drom: alloc.drom };
    const saveBucket = () => {
      setBuckets(p => p.map(b => b.type === editBucketType ? { ...b, current: parseFloat(editBucket.current) || 0, goal: parseFloat(editBucket.goal) || 0 } : b));
      setEditBucketType(null);
    };
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#40916C" }}>Tre Hinkar 🪣</div>
          <div style={{ fontSize: 13, color: "#7D8590", marginTop: 2 }}>Automatisera din framtid</div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Din månadsinkomst</div>
          <div style={S.row}>
            <input type="range" min={10000} max={100000} step={1000} value={monthlyIncome} onChange={e => setMonthlyIncome(+e.target.value)} style={{ flex: 1, accentColor: "#40916C" }} />
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#40916C", minWidth: 86, textAlign: "right" }}>{formatSEK(monthlyIncome)}</div>
          </div>
        </div>
        {buckets.map(b => {
          const monthly = allocs[b.type];
          const pct = Math.min(100, (b.current / b.goal) * 100);
          const g30 = calculateCompoundGrowth(monthly, 30)[30].amount;
          return (
            <div key={b.type} style={{ ...S.card, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: b.color, borderRadius: "14px 0 0 14px" }} />
              {editBucketType === b.type ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{b.emoji} {b.label}</div>
                  <input style={{ ...S.input, marginBottom: 7 }} type="number" placeholder="Nuvarande saldo (kr)" value={editBucket.current} onChange={e => setEditBucket(p => ({ ...p, current: e.target.value }))} />
                  <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="Mål (kr)" value={editBucket.goal} onChange={e => setEditBucket(p => ({ ...p, goal: e.target.value }))} />
                  <div style={S.row}>
                    <button style={S.btn("primary")} onClick={saveBucket}><Icon name="check" size={13} color="#0D1117" />Spara</button>
                    <button style={S.btn("ghost")} onClick={() => setEditBucketType(null)}>Avbryt</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={S.row}>
                      <span style={{ fontSize: 26 }}>{b.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</div>
                        <div style={{ fontSize: 12, color: b.color }}>{formatSEK(monthly)}/mån automatiskt</div>
                      </div>
                    </div>
                    <div style={{ ...S.row, alignItems: "flex-start", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: b.color }}>{formatSEK(b.current)}</div>
                        <div style={{ fontSize: 11, color: "#8B949E" }}>av {formatSEK(b.goal)}</div>
                      </div>
                      <button style={{ ...S.btn("ghost"), padding: "5px 7px", marginTop: 1 }} onClick={() => { setEditBucketType(b.type); setEditBucket({ current: b.current, goal: b.goal }); }}><Icon name="pencil" size={12} color="#8B949E" /></button>
                    </div>
                  </div>
                  <div style={{ ...S.progBar, marginBottom: 10 }}><div style={S.progFill(pct, b.color)} /></div>
                  <div style={{ background: "#0D1117", borderRadius: 9, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, color: "#8B949E", marginBottom: 5 }}>Om 30 år med {formatSEK(monthly)}/mån</div>
                    <MiniCompoundChart monthly={monthly} years={30} color={b.color} />
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: b.color, marginTop: 4 }}>{formatSEK(g30)}</div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        <div style={{ ...S.card, background: "linear-gradient(135deg, #0A1E10, #161B22)", border: "1px solid #40916C33" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>1 timmes lön per dag 💡</div>
          <div style={{ fontSize: 13, color: "#8B949E" }}>Du tjänar {formatSEK(monthlyIncome / (40 * 4.33))}/tim. En timme om dagen = {formatSEK(alloc.pension)}/mån till pension.</div>
        </div>
      </div>
    );
  };

  const SubsView = () => {
    const active = subscriptions.filter(s => s.active);
    const cancelled = subscriptions.filter(s => !s.active);
    const potentialGrowth = calculateCompoundGrowth(cancelledSubsCost, 30)[30].amount;
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#C77B2A" }}>Prenumerationsjakten 🔍</div>
          <div style={{ fontSize: 13, color: "#7D8590", marginTop: 2 }}>Varje avbruten prenumeration = investerat kapital</div>
        </div>

        {/* HUNT GUIDE BANNER */}
        <button
          onClick={() => setShowHuntGuide(true)}
          style={{ width: "100%", background: "linear-gradient(135deg, #1A1200, #161B22)", border: "1px solid #C77B2A55", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", textAlign: "left", display: "block" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#C77B2A18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              🗺️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#C77B2A" }}>Starta prenumerationsjakten</div>
              <div style={{ fontSize: 12, color: "#8B949E", marginTop: 2 }}>6 platser att leta, steg för steg. iPhone, Android, bank, mejl, kort och kontoutdrag.</div>
            </div>
            <div style={{ fontSize: 18, color: "#C77B2A" }}>→</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {["📱 iPhone", "🤖 Android", "🏦 Banken", "📧 Mejlen", "💳 Kortet", "🧾 Utdraget"].map(label => (
              <span key={label} style={{ background: "#21262D", borderRadius: 20, padding: "3px 9px", fontSize: 11, color: "#8B949E" }}>{label}</span>
            ))}
          </div>
        </button>

        <div style={{ fontSize: 11, color: "#8B949E", margin: "4px 0 10px", textAlign: "center" }}>
          ↑ Inte säker på var du ska leta? Guiden visar dig steg för steg.
        </div>

        <div style={S.g2}>
          <div style={S.card}><div style={S.label}>Aktiva</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#E63946" }}>{formatSEK(totalSubsCost)}/mån</div></div>
          <div style={{ ...S.card, border: "1px solid #40916C44" }}><div style={S.label}>Frigjort</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#40916C" }}>{formatSEK(cancelledSubsCost)}/mån</div></div>
        </div>
        {active.map(sub => (
          <div key={sub.id} style={{ ...S.card, border: "1px solid #E6394620" }}>
            {editSubId === sub.id ? (
              <div>
                <input style={{ ...S.input, marginBottom: 7 }} placeholder="Namn" value={editSub.name} onChange={e => setEditSub(p => ({ ...p, name: e.target.value }))} />
                <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="Kostnad per månad (kr)" value={editSub.cost} onChange={e => setEditSub(p => ({ ...p, cost: e.target.value }))} />
                <div style={S.row}>
                  <button style={S.btn("primary")} onClick={saveSub}><Icon name="check" size={13} color="#0D1117" />Spara</button>
                  <button style={S.btn("ghost")} onClick={() => setEditSubId(null)}>Avbryt</button>
                </div>
              </div>
            ) : (
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{sub.name}</div>
                  <div style={{ fontSize: 13, color: "#E63946" }}>{formatSEK(sub.cost)}/mån · {formatSEK(sub.cost * 12)}/år</div>
                </div>
                <div style={S.row}>
                  <button style={{ ...S.btn("ghost"), padding: "6px 8px" }} onClick={() => { setEditSubId(sub.id); setEditSub({ name: sub.name, cost: sub.cost }); }}><Icon name="pencil" size={12} color="#8B949E" /></button>
                  <button style={{ ...S.btn("success"), padding: "6px 10px", fontSize: 12 }} onClick={() => setSubscriptions(p => p.map(s => s.id === sub.id ? { ...s, active: false } : s))}>Avbryt</button>
                  <button style={{ ...S.btn("danger"), padding: "6px 8px" }} onClick={() => setSubscriptions(p => p.filter(s => s.id !== sub.id))}><Icon name="trash" size={12} color="#fff" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {cancelled.length > 0 && <>
          <div style={{ fontSize: 11, color: "#40916C", fontWeight: 700, margin: "10px 0 7px", textTransform: "uppercase", letterSpacing: 1 }}>Avbrutna ✓</div>
          {cancelled.map(sub => (
            <div key={sub.id} style={{ ...S.card, opacity: 0.65, border: "1px solid #40916C33" }}>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 13, color: "#40916C", textDecoration: "line-through" }}>{sub.name}</div><div style={{ fontSize: 11, color: "#40916C" }}>+{formatSEK(sub.cost)}/mån frigjort</div></div>
                <button style={{ ...S.btn("ghost"), padding: "5px 10px", fontSize: 12 }} onClick={() => setSubscriptions(p => p.map(s => s.id === sub.id ? { ...s, active: true } : s))}>Återaktivera</button>
              </div>
            </div>
          ))}
        </>}
        {cancelledSubsCost > 0 && (
          <div style={{ ...S.card, background: "linear-gradient(135deg, #0A1E10, #161B22)", border: "1px solid #40916C44" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💰 Om du investerar {formatSEK(cancelledSubsCost)}/mån</div>
            <MiniCompoundChart monthly={cancelledSubsCost} years={30} color="#40916C" />
            <div style={{ ...S.g2, marginTop: 8 }}>
              <div><div style={{ fontSize: 11, color: "#8B949E" }}>Om 10 år</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#40916C" }}>{formatSEK(calculateCompoundGrowth(cancelledSubsCost, 10)[10].amount)}</div></div>
              <div><div style={{ fontSize: 11, color: "#8B949E" }}>Om 30 år</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#40916C" }}>{formatSEK(potentialGrowth)}</div></div>
            </div>
          </div>
        )}
        {showSubForm ? (
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Lägg till prenumeration</div>
            <input style={{ ...S.input, marginBottom: 7 }} placeholder="Namn" value={newSub.name} onChange={e => setNewSub(p => ({ ...p, name: e.target.value }))} />
            <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="Kostnad per månad (kr)" value={newSub.cost} onChange={e => setNewSub(p => ({ ...p, cost: e.target.value }))} />
            <div style={S.row}>
              <button style={S.btn("primary")} onClick={addSub}><Icon name="check" size={13} color="#0D1117" />Spara</button>
              <button style={S.btn("ghost")} onClick={() => setShowSubForm(false)}>Avbryt</button>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btn("primary"), width: "100%", justifyContent: "center", padding: 13, marginTop: 4 }} onClick={() => setShowSubForm(true)}>
            <Icon name="plus" size={14} color="#0D1117" />Lägg till prenumeration
          </button>
        )}
      </div>
    );
  };

  const CoachView = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#4A9ECC" }}>Ekonomicoach 🤖</div>
        <div style={{ fontSize: 13, color: "#7D8590", marginTop: 2 }}>Baserad på David Bachs principer</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
        {chatMessages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 9, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: 8, background: "#2D6A8F22", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 7, flexShrink: 0 }}><Icon name="robot" size={14} color="#4A9ECC" /></div>}
            <div style={{ maxWidth: "80%", padding: "9px 13px", borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: msg.role === "user" ? "#F4A261" : "#161B22", color: msg.role === "user" ? "#0D1117" : "#E6EDF3", fontSize: 14, lineHeight: 1.5, border: msg.role === "assistant" ? "1px solid #21262D" : "none" }}>{msg.text}</div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#2D6A8F22", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="robot" size={14} color="#4A9ECC" /></div>
            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 14, padding: "9px 14px" }}>
              <span style={{ animation: "dot 1.2s ease-in-out infinite", fontSize: 18 }}>·</span>
              <span style={{ animation: "dot 1.2s ease-in-out 0.2s infinite", fontSize: 18 }}>·</span>
              <span style={{ animation: "dot 1.2s ease-in-out 0.4s infinite", fontSize: 18 }}>·</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={{ ...S.row, paddingTop: 8, borderTop: "1px solid #21262D" }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="Fråga din ekonomicoach..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
        <button style={{ ...S.btn("primary"), padding: "10px 13px", flexShrink: 0 }} onClick={sendMessage}><Icon name="send" size={14} color="#0D1117" /></button>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
        {["Vilken skuld först?", "Ska jag ta samlån?", "Hur börjar jag spara?"].map(q => (
          <button key={q} style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 20, padding: "5px 11px", fontSize: 12, color: "#8B949E", cursor: "pointer" }} onClick={() => setChatInput(q)}>{q}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      {showUnlockCeremony && <UnlockCeremony onClose={() => { setShowUnlockCeremony(false); setConsolidationUnlocked(true); }} />}
      {showHuntGuide && <HuntGuide onClose={() => setShowHuntGuide(false)} />}
      {showResetConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 16, padding: 24, maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#E6EDF3", marginBottom: 8 }}>Rensa all data?</div>
            <div style={{ fontSize: 13, color: "#8B949E", marginBottom: 20 }}>Alla skulder, prenumerationer och framsteg återställs till exempeldata. Det går inte att ångra.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("ghost"), flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setShowResetConfirm(false)}>Avbryt</button>
              <button style={{ ...S.btn("danger"), flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => { resetAllData(); setShowResetConfirm(false); }}>Rensa allt</button>
            </div>
          </div>
        </div>
      )}
      {deleteDebtId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 16, padding: 24, maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#E6EDF3", marginBottom: 8 }}>Ta bort skulden?</div>
            <div style={{ fontSize: 13, color: "#8B949E", marginBottom: 20 }}>Det går inte att ångra.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("ghost"), flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setDeleteDebtId(null)}>Avbryt</button>
              <button style={{ ...S.btn("danger"), flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => { setDebts(p => p.filter(d => d.id !== deleteDebtId)); setDeleteDebtId(null); }}>Ta bort</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.content} className="content-view">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "dolp" && <DOLPView />}
        {activeTab === "consolidation" && <ConsolidationView />}
        {activeTab === "buckets" && <BucketsView />}
        {activeTab === "subs" && <SubsView />}
        {activeTab === "coach" && <CoachView />}
      </div>
    </div>
  );
}
