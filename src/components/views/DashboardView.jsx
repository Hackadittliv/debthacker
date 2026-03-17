import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK, monthsToText } from '../../utils/math';

export const DashboardView = ({
    debts, extraPayment, monthlyIncome, dolpPlan, totalDebt,
    debtFreeMonths, consolidationUnlocked, setExtraPayment, setActiveTab
  }) => {
    const { S, C } = useTheme();
    const activeDebts = debts.filter(d => !d.paid_off).length;

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
            <div style={{ ...S.bigNum(C.textSecondary), fontSize: 34 }}>0%</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0, minHeight: 110 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>🪣</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Sparande/mån</div>
            <div style={{ ...S.bigNum("#40916C"), fontSize: 24, letterSpacing: -0.5 }}>9k kr</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0, minHeight: 110 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>📱</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Prenumerationer</div>
            <div style={{ ...S.bigNum("#E63946"), fontSize: 24, letterSpacing: -0.5 }}>1k kr<span style={{ fontSize: 15, color: C.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>/mån</span></div>
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
          <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 20 }}>
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
