import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK, calculatePayoffPlan } from '../../utils/math';

export const ConsolidationView = ({
  consolidationUnlocked, behaviorProof, setBehaviorProof, debts, extraPayment,
  consolidationRate, setConsolidationRate, setActiveTab
}) => {
  const { S, C } = useTheme();
  const lockTasks = [
    {
      id: "cardClosed",
      label: "Kreditkort uppsagt/klippt",
      progress: behaviorProof.cardClosed ? "Klar ✓" : "Väntar",
      done: behaviorProof.cardClosed,
      btnLabel: "Bekräfta - jag har klippt kortet",
      onAction: () => setBehaviorProof(p => ({ ...p, cardClosed: true })),
    },
    {
      id: "extraPayments",
      label: "Gjorda extra amorteringar",
      progress: `${behaviorProof.extraPayments}/2 st`,
      done: behaviorProof.extraPayments >= 2,
      btnLabel: "+ Registrera en extra amortering",
      onAction: () => setBehaviorProof(p => ({ ...p, extraPayments: Math.min(2, p.extraPayments + 1) })),
    },
    {
      id: "noCreditDays",
      label: "Dagar utan ny kredit",
      progress: `${behaviorProof.noCreditDays}/30 dgr`,
      done: behaviorProof.noCreditDays >= 30,
      btnLabel: "+ 5 dagar utan ny kredit",
      onAction: () => setBehaviorProof(p => ({ ...p, noCreditDays: Math.min(30, p.noCreditDays + 5) })),
    },
  ];

  if (!consolidationUnlocked) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.textSecondary }}>Samlånslåset 🔒</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Beteendet måste ändras innan verktyget används</div>
        </div>
        <div style={{ ...S.card, background: C.gradLock, border: "1px solid #F4A26125" }}>
          <div style={{ ...S.row, marginBottom: 10 }}>
            <Icon name="brain" size={20} color="#F4A261" />
            <div style={{ fontSize: 15, fontWeight: 600, color: "#F4A261" }}>Skuldhackaren säger:</div>
          </div>
          <div style={{ fontSize: 13, color: C.textNear, lineHeight: 1.5 }}>
            "Ett samlingslån är livsfarligt om du inte först ändrat orsaken till lånen. Annars har du snart det stora samlånet PLUS nya småkrediter."
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 20 }}>Beteendekrav för upplåsning:</div>
        {lockTasks.map(t => (
          <div key={t.id} style={{ ...S.card, padding: '14px 16px', marginBottom: 10, border: t.done ? "1px solid #40916C" : `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: t.done ? 0 : 10 }}>
              <div style={S.row}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: t.done ? "#40916C" : C.bgSunken, border: t.done ? "none" : `2px solid ${C.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.done && <Icon name="check" size={12} color="#fff" />}
                </div>
                <div style={{ fontSize: 14, color: t.done ? C.textSecondary : C.textPrimary, textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.done ? "#40916C" : C.textSecondary }}>{t.progress}</div>
            </div>
            {!t.done && (
              <button
                onClick={t.onAction}
                style={{ width: "100%", background: C.bgSunken, border: `1px solid ${C.borderStrong}`, borderRadius: 9, padding: "9px 12px", fontSize: 13, fontWeight: 600, color: C.textNear, cursor: "pointer", textAlign: "center" }}
              >
                {t.btnLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  const totalDebt = debts.filter(d => !d.paid_off).reduce((s, d) => s + d.balance, 0);
  const totalMin = debts.filter(d => !d.paid_off).reduce((s, d) => s + d.min_payment, 0);
  const currentPlan = calculatePayoffPlan(debts, extraPayment);
  const consDebt = [{ id: 'cons1', name: 'Samlingslån', balance: totalDebt, interest_rate: consolidationRate, min_payment: totalMin }];
  const consPlan = calculatePayoffPlan(consDebt, extraPayment);
  const savedMonths = currentPlan && consPlan ? currentPlan.total_months - consPlan.total_months : 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#40916C" }}>Samlånslåset 🔓</div>
        <div style={{ fontSize: 13, color: "#40916C", marginTop: 2 }}>Du har bevisat att du är redo</div>
      </div>
      <div style={{ ...S.card, background: C.gradGreen, border: "1px solid #40916C44" }}>
        <div style={S.row}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#40916C22", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={20} color="#40916C" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#40916C" }}>Beteende säkrat</div>
            <div style={{ fontSize: 13, color: C.textSecondary }}>Verktyget är upplåst</div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Jämför samlingslån</div>
        <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 5 }}>
          <div style={{ fontSize: 13, color: C.textMuted }}>Ny ränta (%)</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{consolidationRate}%</div>
        </div>
        <input
          type="range" min="2" max="25" step="0.5"
          value={consolidationRate}
          onChange={(e) => setConsolidationRate(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#4A9ECC", marginBottom: 20 }}
        />
        <div style={S.g2}>
          <div style={{ background: C.bgSunken, borderRadius: 10, padding: 12, border: `1px solid ${C.borderStrong}` }}>
            <div style={{ fontSize: 11, color: C.textSecondary, textTransform: "uppercase", marginBottom: 4 }}>Nuvarande</div>
            <div style={{ fontSize: 20, fontFamily: "'DM Serif Display', serif", color: C.textPrimary }}>{currentPlan?.total_months} mån</div>
          </div>
          <div style={{ background: C.bgSunken, borderRadius: 10, padding: 12, border: "1px solid #40916C44" }}>
            <div style={{ fontSize: 11, color: "#40916C", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>Med samlån</div>
            <div style={{ fontSize: 20, fontFamily: "'DM Serif Display', serif", color: "#40916C" }}>{consPlan?.total_months} mån</div>
          </div>
        </div>
        {savedMonths > 0 && (
          <div style={{ marginTop: 15, textAlign: "center", fontSize: 14, color: "#40916C", background: "#40916C15", padding: 10, borderRadius: 10 }}>
            Du skulle bli skuldfri <strong>{savedMonths} månader snabbare</strong> med denna ränta.
          </div>
        )}
      </div>

      {/* ── Affiliate-partners ── */}
      <div style={{ marginTop: 20, marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 }}>
          Jämför samlingslån hos våra partners
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { name: "Zmarta", desc: "Jämför upp till 40 banker - en ansökan", badge: "Populärast", color: "#40916C", url: "https://www.zmarta.se/lan/samlingslaan?utm_source=debthacker&utm_medium=affiliate&utm_campaign=consolidation" },
            { name: "Lendo", desc: "Utan UC-förfrågan · Svar på 1 minut", badge: "Snabbast", color: "#4A9ECC", url: "https://www.lendo.se/samla-lan?utm_source=debthacker&utm_medium=affiliate&utm_campaign=consolidation" },
            { name: "Brocc", desc: "P2P-lån med låg ränta · Etisk bank", badge: "Lägst ränta", color: "#C77B2A", url: "https://www.brocc.se?utm_source=debthacker&utm_medium=affiliate&utm_campaign=consolidation" },
          ].map(p => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noreferrer noopener"
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: C.bgCard, border: `1px solid ${p.color}30`,
                borderRadius: 12, padding: "14px 16px", textDecoration: "none",
                borderLeft: `3px solid ${p.color}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{p.name}</span>
                  <span style={{ fontSize: 10, background: `${p.color}20`, color: p.color, borderRadius: 6, padding: "2px 7px", fontWeight: 700, letterSpacing: 0.3 }}>{p.badge}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary }}>{p.desc}</div>
              </div>
              <div style={{ fontSize: 18, color: p.color }}>→</div>
            </a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 8, lineHeight: 1.6 }}>
          * Dessa är affiliatelänkar - DebtHacker kan få ersättning om du ansöker. Det kostar dig inget extra och påverkar inte vår rekommendation.
        </div>
      </div>

      <button onClick={() => setActiveTab("coach")} style={{ ...S.btn("primary"), width: "100%", justifyContent: "center", padding: 14, background: "#2D6A8F", color: "#fff", marginTop: 16 }}>
        Be coachen hjälpa dig ansöka
      </button>
    </div>
  );
};
