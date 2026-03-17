import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK, monthsToText } from '../../utils/math';

export const DashboardView = ({
    debts, subscriptions, extraPayment, monthlyIncome, dolpPlan, totalDebt,
    debtFreeMonths, consolidationUnlocked, setExtraPayment, setMonthlyIncome, setActiveTab
  }) => {
    const { S, C } = useTheme();
    const activeDebts = debts.filter(d => !d.paid_off).length;
    const activeCost = subscriptions.filter(s => s.active).reduce((sum, s) => sum + s.cost, 0);
    const monthlySavingsGoal = Math.round(monthlyIncome * 0.2);

    return (
      <div>
        <div style={{ ...S.card, padding: "28px 24px", background: C.gradHero, border: "1px solid #F4A26144" }}>
          <div style={S.label}>Total skuld</div>
          <div style={{ ...S.bigNum("#F4A261"), fontSize: 40, marginBottom: 12 }}>{formatSEK(totalDebt)}</div>
          <div style={{ fontSize: 15, color: C.textSecondary }}>
            Skuldfri om <strong style={{ color: "#F4A261" }}>{monthsToText(debtFreeMonths)}</strong> med {formatSEK(extraPayment)}/mån extra
          </div>
        </div>

        <div style={{ ...S.g2, marginBottom: 12 }}>
          <div style={{ ...S.card, marginBottom: 0, minHeight: 110 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>🔥</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Aktiva skulder</div>
            <div style={{ ...S.bigNum("#F4A261"), fontSize: 34 }}>{activeDebts}</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0, minHeight: 110 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{consolidationUnlocked ? '🔓' : '🔒'}</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Samlånslåset</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: consolidationUnlocked ? '#40916C' : C.textSecondary, marginTop: 6 }}>
              {consolidationUnlocked ? 'Upplåst' : 'Låst'}
            </div>
          </div>
          <div style={{ ...S.card, marginBottom: 0, minHeight: 110 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>🪣</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Sparmål/mån</div>
            <div style={{ ...S.bigNum("#40916C"), fontSize: 24, letterSpacing: -0.5 }}>{formatSEK(monthlySavingsGoal)}</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0, minHeight: 110 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>📱</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Prenumerationer</div>
            <div style={{ ...S.bigNum("#E63946"), fontSize: 24, letterSpacing: -0.5 }}>{formatSEK(activeCost)}<span style={{ fontSize: 15, color: C.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>/mån</span></div>
          </div>
        </div>

        <button
          className="card-clickable"
          onClick={() => setActiveTab("coach")}
          style={{ ...S.card, width: "100%", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", padding: "18px 20px" }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "#4A9ECC22", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="brain" size={24} color="#4A9ECC" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>Ekonomicoach</div>
            <div style={{ fontSize: 14, color: C.textSecondary }}>Fråga vad som helst</div>
          </div>
          <div style={{ color: C.textSecondary }}>→</div>
        </button>

        <div style={{ ...S.card, marginTop: 12, paddingBottom: 24 }}>
          <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: C.textMuted }}>Din månadsinkomst (netto)</div>
            <input
              type="number"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
              style={{ background: C.bgSunken, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: C.textPrimary, width: 110, textAlign: 'right', outline: 'none' }}
            />
          </div>
          <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 14, marginTop: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Extra betalning/mån</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#F4A261" }}>{formatSEK(extraPayment)}</div>
          </div>
          <input
            type="range" min="0" max={Math.round(monthlyIncome * 0.5)} step="500"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#F4A261", height: 6, borderRadius: 6, marginBottom: 14 }}
          />
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
            Skuldfri om <strong style={{ color: "#F4A261" }}>{monthsToText(debtFreeMonths)}</strong> med denna betalning
          </div>
        </div>
      </div>
    );
  };
