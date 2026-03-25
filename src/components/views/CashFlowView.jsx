import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { formatSEK } from '../../utils/math';

const COST_CATEGORIES = [
  { id: 'housing', label: 'Boende', emoji: '🏠', placeholder: 'Hyra/lån' },
  { id: 'food', label: 'Mat & hushåll', emoji: '🛒', placeholder: 'Matvaror' },
  { id: 'transport', label: 'Transport', emoji: '🚗', placeholder: 'Bil/kollektivt' },
  { id: 'insurance', label: 'Försäkringar', emoji: '🛡️', placeholder: 'Hemförsäkring etc.' },
  { id: 'other', label: 'Övrigt', emoji: '📦', placeholder: 'Övriga kostnader' },
]

export const CashFlowView = ({ monthlyIncome, setMonthlyIncome, debts }) => {
  const { S, C } = useTheme()
  const [costs, setCosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dh_cashflow_costs') || '{}') } catch { return {} }
  })
  const [bufferPct, setBufferPct] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dh_cashflow_buffer') || '10') } catch { return 10 }
  })

  const updateCost = (id, val) => {
    const updated = { ...costs, [id]: val }
    setCosts(updated)
    localStorage.setItem('dh_cashflow_costs', JSON.stringify(updated))
  }

  const updateBuffer = (val) => {
    setBufferPct(val)
    localStorage.setItem('dh_cashflow_buffer', JSON.stringify(val))
  }

  const totalFixed = COST_CATEGORIES.reduce((sum, c) => sum + (parseFloat(costs[c.id]) || 0), 0)
  const totalDebtPayments = debts.filter(d => !d.paid_off).reduce((sum, d) => sum + (parseFloat(d.min_payment) || 0), 0)
  const bufferAmount = Math.round(monthlyIncome * (bufferPct / 100))
  const leftover = monthlyIncome - totalFixed - totalDebtPayments - bufferAmount

  const rows = [
    { label: 'Månadsinkomst', value: monthlyIncome, positive: true, bold: true },
    { label: 'Fasta kostnader', value: -totalFixed, positive: false },
    { label: 'Skuld-DOLP (minbetalningar)', value: -totalDebtPayments, positive: false },
    { label: `Buffert (${bufferPct}%)`, value: -bufferAmount, positive: false },
  ]

  const leftoverColor = leftover >= 0 ? '#4CAF50' : '#F44336'

  return (
    <div>
      {/* Inkomst */}
      <div style={S.card}>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Månadsinkomst (netto)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="number"
            value={monthlyIncome || ''}
            onChange={e => setMonthlyIncome(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="35000"
            style={{ ...S.input, flex: 1, fontSize: 20, fontWeight: 700 }}
          />
          <span style={{ color: C.textSecondary, fontSize: 15 }}>kr/mån</span>
        </div>
      </div>

      {/* Fasta kostnader */}
      <div style={S.card}>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Fasta kostnader
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COST_CATEGORIES.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, width: 28 }}>{cat.emoji}</span>
              <span style={{ flex: 1, fontSize: 14, color: C.text }}>{cat.label}</span>
              <input
                type="number"
                value={costs[cat.id] || ''}
                onChange={e => updateCost(cat.id, e.target.value)}
                placeholder="0"
                style={{ ...S.input, width: 110, textAlign: 'right' }}
              />
              <span style={{ fontSize: 13, color: C.textSecondary, width: 20 }}>kr</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buffert */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: C.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Buffert
          </div>
          <span style={{ fontSize: 14, color: C.accent, fontWeight: 700 }}>{formatSEK(bufferAmount)} kr/mån</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={bufferPct}
            onChange={e => updateBuffer(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: C.accent }}
          />
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, width: 40 }}>{bufferPct}%</span>
        </div>
      </div>

      {/* Sammanställning */}
      <div style={{ ...S.card, background: 'linear-gradient(135deg, #0d1117, #161B22)', border: `1px solid ${C.borderStrong}` }}>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Pengaflöde
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, color: row.bold ? C.text : C.textSecondary, fontWeight: row.bold ? 700 : 400 }}>
                {row.label}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: row.positive ? '#4CAF50' : C.textSecondary }}>
                {row.positive ? '+' : ''}{formatSEK(row.value)} kr
              </span>
            </div>
          ))}

          {/* Kvar att leva på */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
              Kvar att leva på
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: leftoverColor }}>
              {formatSEK(leftover)} kr
            </span>
          </div>
        </div>

        {leftover < 0 && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#F4433620', borderRadius: 10, border: '1px solid #F4433640' }}>
            <div style={{ fontSize: 13, color: '#F44336', fontWeight: 600 }}>
              ⚠️ Underskott på {formatSEK(Math.abs(leftover))} kr/mån
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
              Dina kostnader överstiger inkomsten. Titta över fasta kostnader eller prenumerationer.
            </div>
          </div>
        )}

        {leftover >= 0 && leftover < 3000 && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#FF980020', borderRadius: 10, border: '1px solid #FF980040' }}>
            <div style={{ fontSize: 13, color: '#FF9800', fontWeight: 600 }}>
              💡 Tight marginal
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
              Under 3 000 kr kvar ger lite rörelseutrymme. Kan du minska någon fast kostnad?
            </div>
          </div>
        )}

        {leftover >= 3000 && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#4CAF5020', borderRadius: 10, border: '1px solid #4CAF5040' }}>
            <div style={{ fontSize: 13, color: '#4CAF50', fontWeight: 600 }}>
              ✅ Bra marginal
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
              Överväg att lägga {formatSEK(Math.round(leftover * 0.5))} kr extra på skulder — det kortar din skuldfria tid.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
