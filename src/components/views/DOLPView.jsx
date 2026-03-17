import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK, calculateDOLPOrder, monthsToText } from '../../utils/math';

const DEBT_TYPES = [
  { value: '', label: 'Välj typ (valfritt)', emoji: '' },
  { value: 'kreditkort', label: 'Kreditkort', emoji: '💳' },
  { value: 'csn', label: 'CSN-lån', emoji: '📚' },
  { value: 'konsument', label: 'Konsumentlån', emoji: '💰' },
  { value: 'bil', label: 'Billån', emoji: '🚗' },
  { value: 'bostad', label: 'Bostadslån/Bolån', emoji: '🏠' },
  { value: 'ovrig', label: 'Övrigt', emoji: '📄' },
];
const TYPE_EMOJI = Object.fromEntries(DEBT_TYPES.filter(t => t.value).map(t => [t.value, t.emoji]));

export const DOLPView = ({
  debts, setDebts, totalDebt, debtFreeMonths, extraPayment, setExtraPayment,
  monthlyIncome, dolpPlan, editDebtId, setEditDebtId, editDebt, setEditDebt,
  saveDebt, setDeleteDebtId, setShowAddForm
}) => {
  const { S, C } = useTheme();
  const sorted = calculateDOLPOrder(debts);
  const paidDebts = debts.filter(d => d.paid_off);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#F4A261" }}>Skuldsläckaren 🔥</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>DOLP: minsta skuld först, bygg momentum</div>
      </div>

      <div style={{ ...S.card, background: C.gradDebt, border: "1px solid #E6394630" }}>
        <div style={S.g2}>
          <div><div style={S.label}>Total skuld</div><div style={{ ...S.bigNum("#E63946"), fontSize: 26 }}>{formatSEK(totalDebt)}</div></div>
          <div><div style={S.label}>Skuldfri om</div><div style={{ ...S.bigNum("#40916C"), fontSize: 24 }}>{monthsToText(debtFreeMonths)}</div></div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Extra betalning per månad</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#F4A261" }}>{formatSEK(extraPayment)}</div>
        </div>
        <input
          type="range" min="0" max={Math.max(extraPayment, Math.round(monthlyIncome * 0.5))} step="100"
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#F4A261", height: 6, borderRadius: 6 }}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        {sorted.length === 0 && paidDebts.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.textPrimary, marginBottom: 8 }}>Inga skulder tillagda ännu</div>
            <div style={{ fontSize: 13, color: C.textSecondary }}>Lägg till dina skulder nedan för att starta DOLP-planen.</div>
          </div>
        )}
        {sorted.map((debt, index) => {
          const isActive = index === 0;
          const plan = dolpPlan ? dolpPlan.history.find(h => h.id === debt.id) : null;
          const intensity = Math.max(0, 1 - (index * 0.2));
          return (
            <div key={debt.id} style={{ background: isActive ? C.gradActive : C.bgCard, borderRadius: 12, padding: 13, marginBottom: 9, border: `1px solid ${isActive ? "#40916C44" : C.border}`, position: "relative" }}>
              {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #40916C, #F4A261)", borderRadius: "12px 12px 0 0" }} />}
              {editDebtId === debt.id ? (
                <div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Namn</div>
                  <input style={{ ...S.input, marginBottom: 10 }} placeholder="t.ex. Klarna" value={editDebt.name} onChange={e => setEditDebt(p => ({ ...p, name: e.target.value }))} />

                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Skuld-typ</div>
                  <select
                    value={editDebt.type || ''}
                    onChange={e => setEditDebt(p => ({ ...p, type: e.target.value }))}
                    style={{ ...S.input, marginBottom: 10, cursor: 'pointer' }}
                  >
                    {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji ? `${t.emoji} ` : ''}{t.label}</option>)}
                  </select>

                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Nuvarande saldo (kr)</div>
                  <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="0" value={editDebt.balance} onChange={e => setEditDebt(p => ({ ...p, balance: e.target.value }))} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Ränta (%)</div>
                      <input style={S.input} type="number" placeholder="0" value={editDebt.interest_rate} onChange={e => setEditDebt(p => ({ ...p, interest_rate: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Minbetalning (kr)</div>
                      <input style={S.input} type="number" placeholder="200" value={editDebt.min_payment} onChange={e => setEditDebt(p => ({ ...p, min_payment: e.target.value }))} />
                    </div>
                  </div>

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
                        <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? C.textPrimary : C.textNear }}>
                          {debt.type && TYPE_EMOJI[debt.type] ? <span style={{ marginRight: 5 }}>{TYPE_EMOJI[debt.type]}</span> : null}{debt.name}
                        </div>
                        {isActive && <span style={{ ...S.badge("#40916C"), animation: "badgePulse 2s ease infinite" }}>NÄSTA</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: isActive ? "#F4A261" : C.textSecondary }}>{formatSEK(debt.balance)}</div>
                      <div style={{ fontSize: 12, color: C.textMed }}>{debt.interest_rate}% ränta</div>
                    </div>
                  </div>
                  <div style={{ ...S.progBar, marginBottom: 12 }}>
                    <div style={S.progFill(plan ? Math.max(0, 100 - (plan.remaining / debt.balance) * 100) : 0, isActive ? "#40916C" : C.bgElevated)} />
                  </div>
                  <div style={{ ...S.row, justifyContent: "space-between", paddingTop: 4 }}>
                    <div style={{ fontSize: 13, color: C.textMuted }}>Min: {formatSEK(debt.min_payment)}/mån</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#40916C" : C.textSecondary }}>{plan ? monthsToText(plan.months_to_payoff) : "–"}</div>
                    <div style={S.row}>
                      <button style={{ ...S.btn("ghost"), padding: "5px 8px" }} onClick={() => { setEditDebtId(debt.id); setEditDebt({ name: debt.name, balance: debt.balance, interest_rate: debt.interest_rate, min_payment: debt.min_payment, type: debt.type || '' }); }}><Icon name="pencil" size={12} color={C.textSecondary} /></button>
                      <button style={{ ...S.btn("success"), padding: "5px 8px" }} onClick={() => setDebts(p => p.map(d => d.id === debt.id ? { ...d, paid_off: true } : d))}><Icon name="check" size={12} color="#fff" /></button>
                      <button style={{ ...S.btn("danger"), padding: "5px 8px" }} onClick={() => setDeleteDebtId(debt.id)}><Icon name="trash" size={12} color="#fff" /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        <button onClick={() => setShowAddForm(true)} style={{ ...S.btn("primary"), width: "100%", justifyContent: "center", padding: 14, fontSize: 15 }}>
          + Lägg till skuld
        </button>

        {paidDebts.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 12, color: '#40916C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✅</span> Avbetalade skulder ({paidDebts.length})
            </div>
            {paidDebts.map(debt => (
              <div key={debt.id} style={{ background: '#40916C0C', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: '1px solid #40916C30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔥</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary, textDecoration: 'line-through' }}>{debt.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 14, color: '#40916C', fontWeight: 600 }}>{formatSEK(debt.balance)} ✓</div>
                  <button
                    style={{ ...S.btn("ghost"), padding: "4px 8px", fontSize: 11 }}
                    onClick={() => setDebts(p => p.map(d => d.id === debt.id ? { ...d, paid_off: false } : d))}
                  >Ångra</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
