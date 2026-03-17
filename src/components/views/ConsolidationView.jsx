import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK, calculatePayoffPlan } from '../../utils/math';

export const ConsolidationView = ({
  consolidationUnlocked, behaviorProof, debts, extraPayment,
  consolidationRate, setConsolidationRate, setActiveTab
}) => {
  const { S, C } = useTheme();
  const lockTasks = [
    { id: "noCreditDays", label: "Tid utan nya krediter", progress: `${behaviorProof.noCreditDays}/30 dgr`, done: behaviorProof.noCreditDays >= 30 },
    { id: "extraPayments", label: "Gjorda extra amorteringar", progress: `${behaviorProof.extraPayments}/2 st`, done: behaviorProof.extraPayments >= 2 },
    { id: "cardClosed", label: "Kreditkort uppsagt/klippt", progress: behaviorProof.cardClosed ? "Klar" : "Väntar", done: behaviorProof.cardClosed },
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
            <div style={{ fontSize: 15, fontWeight: 600, color: "#F4A261" }}>Coach Bach säger:</div>
          </div>
          <div style={{ fontSize: 13, color: C.textNear, lineHeight: 1.5, marginBottom: 15 }}>
            "Ett samlingslån är livsfarligt om du inte först ändrat orsaken till lånen. Annars har du snart det stora samlånet PLUS nya småkrediter."
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 20 }}>Beteendekrav för upplåsning:</div>
        {lockTasks.map(t => (
          <div key={t.id} style={{ ...S.card, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: t.done ? 0.6 : 1, border: t.done ? "1px solid #40916C" : `1px solid ${C.border}` }}>
            <div style={S.row}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: t.done ? "#40916C" : C.bgSunken, border: t.done ? "none" : `2px solid ${C.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.done && <Icon name="check" size={12} color="#fff" />}
              </div>
              <div style={{ fontSize: 14 }}>{t.label}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.done ? "#40916C" : C.textSecondary }}>{t.progress}</div>
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

      <button onClick={() => setActiveTab("coach")} style={{ ...S.btn("primary"), width: "100%", justifyContent: "center", padding: 14, background: "#2D6A8F", color: "#fff" }}>
        Be coachen hjälpa dig ansöka
      </button>
    </div>
  );
};
