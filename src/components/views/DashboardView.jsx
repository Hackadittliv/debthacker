import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK, monthsToText } from '../../utils/math';

export const DashboardView = ({
    debts, subscriptions, extraPayment, monthlyIncome, totalDebt,
    debtFreeMonths, consolidationUnlocked, setExtraPayment, setMonthlyIncome,
    setActiveTab, interestSaved, monthsSaved, sendSummary, summaryStatus
  }) => {
    const { S, C } = useTheme();
    const activeDebts = debts.filter(d => !d.paid_off).length;
    const activeCost = subscriptions.filter(s => s.active).reduce((sum, s) => sum + s.cost, 0);
    const monthlySavingsGoal = Math.round(monthlyIncome * 0.2);
    const hasDebts = activeDebts > 0;

    return (
      <div>
        {/* ── Onboarding för nya användare ── */}
        {!hasDebts && (
          <div style={{ ...S.card, background: 'linear-gradient(135deg, #1a1000, #161B22)', border: '1px solid #F4A26144', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔥</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#F4A261', marginBottom: 8 }}>
              Välkommen till DebtHacker
            </div>
            <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 24px' }}>
              Lägg in dina skulder och se exakt när du är skuldfri - och hur mycket du sparar med DOLP-metoden.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280, margin: '0 auto' }}>
              <button
                onClick={() => setActiveTab('dolp')}
                style={{ padding: '13px 24px', background: 'linear-gradient(135deg, #F4A261, #E8833A)', border: 'none', borderRadius: 12, color: '#0D1117', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
              >
                Lägg in din första skuld →
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setActiveTab('subs')} style={{ flex: 1, padding: '10px', background: C.bgSunken, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSecondary, fontSize: 13, cursor: 'pointer' }}>
                  📱 Hitta prenumerationer
                </button>
                <button onClick={() => setActiveTab('buckets')} style={{ flex: 1, padding: '10px', background: C.bgSunken, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSecondary, fontSize: 13, cursor: 'pointer' }}>
                  🪣 Sätt sparmål
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Hero-kort: total skuld ── */}
        {hasDebts && (
          <div style={{ ...S.card, padding: "28px 24px", background: C.gradHero, border: "1px solid #F4A26144" }}>
            <div style={S.label}>Total skuld</div>
            <div style={{ ...S.bigNum("#F4A261"), fontSize: 40, marginBottom: 12 }}>{formatSEK(totalDebt)}</div>
            <div style={{ fontSize: 15, color: C.textSecondary }}>
              Skuldfri om <strong style={{ color: "#F4A261" }}>{monthsToText(debtFreeMonths)}</strong> med {formatSEK(extraPayment)}/mån extra
            </div>
          </div>
        )}

        {/* ── Räntebesparing vs minimumbetalningar ── */}
        {hasDebts && interestSaved > 0 && (
          <div style={{ ...S.card, background: 'linear-gradient(135deg, #0A1E10, #161B22)', border: '1px solid #40916C44', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, color: '#40916C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
              💰 Din DOLP-besparing vs bara minimumbetalningar
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: '#40916C15', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Räntebesparing</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#40916C' }}>
                  {formatSEK(interestSaved)}
                </div>
              </div>
              <div style={{ flex: 1, background: '#40916C15', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Tid sparad</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#40916C' }}>
                  {monthsToText(monthsSaved)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ ...S.g2, marginBottom: 12 }}>
          <button className="card-clickable" onClick={() => setActiveTab('dolp')} style={{ ...S.card, marginBottom: 0, minHeight: 110, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>🔥</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Aktiva skulder</div>
            <div style={{ ...S.bigNum("#F4A261"), fontSize: 34 }}>{activeDebts}</div>
          </button>
          <button className="card-clickable" onClick={() => setActiveTab('consolidation')} style={{ ...S.card, marginBottom: 0, minHeight: 110, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{consolidationUnlocked ? '🔓' : '🔒'}</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Samlånslåset</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: consolidationUnlocked ? '#40916C' : C.textSecondary, marginTop: 6 }}>
              {consolidationUnlocked ? 'Upplåst' : 'Låst'}
            </div>
          </button>
          <button className="card-clickable" onClick={() => setActiveTab('buckets')} style={{ ...S.card, marginBottom: 0, minHeight: 110, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>🪣</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Sparmål/mån</div>
            <div style={{ ...S.bigNum("#40916C"), fontSize: 24, letterSpacing: -0.5 }}>{formatSEK(monthlySavingsGoal)}</div>
          </button>
          <button className="card-clickable" onClick={() => setActiveTab('subs')} style={{ ...S.card, marginBottom: 0, minHeight: 110, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>📱</div>
            <div style={{ ...S.label, fontSize: 11, fontWeight: 700 }}>Prenumerationer</div>
            <div style={{ ...S.bigNum("#E63946"), fontSize: 24, letterSpacing: -0.5 }}>{formatSEK(activeCost)}<span style={{ fontSize: 15, color: C.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>/mån</span></div>
          </button>
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
              inputMode="decimal"
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

        {sendSummary && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={sendSummary}
              disabled={summaryStatus === 'loading' || summaryStatus === 'sent'}
              style={{
                width: '100%', padding: '14px 20px',
                background: summaryStatus === 'sent' ? '#40916C22' : summaryStatus === 'error' ? '#E6394622' : C.bgElevated,
                border: `1px solid ${summaryStatus === 'sent' ? '#40916C66' : summaryStatus === 'error' ? '#E6394666' : C.borderStrong}`,
                borderRadius: 12, color: summaryStatus === 'sent' ? '#40916C' : summaryStatus === 'error' ? '#E63946' : C.textPrimary,
                fontSize: 14, fontWeight: 600, cursor: summaryStatus ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span>{summaryStatus === 'loading' ? '⏳' : summaryStatus === 'sent' ? '✅' : summaryStatus === 'error' ? '❌' : '📧'}</span>
              {summaryStatus === 'loading' ? 'Skickar...' : summaryStatus === 'sent' ? 'Sammanfattning skickad!' : summaryStatus === 'error' ? 'Kunde inte skicka - försök igen' : 'Skicka sammanfattning till din e-post'}
            </button>
            <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 1.5 }}>
              Få din skuldplan, sparprognos och DOLP-beräkning direkt i inkorgen.
            </div>
          </div>
        )}
      </div>
    );
  };
