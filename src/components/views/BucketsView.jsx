import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK } from '../../utils/math';
import { MiniCompoundChart } from '../ui/MiniCompoundChart';

export const BucketsView = ({
  buckets, setBuckets, monthlyIncome, setMonthlyIncome,
  editBucketType, setEditBucketType, editBucket, setEditBucket, saveBucket
}) => {
  const { S, C } = useTheme();
  const allocs = { pension: 0.1, buffert: 0.05, drom: 0.05 };

  const [bucketSettings, setBucketSettings] = useState({});
  const [expandedBucket, setExpandedBucket] = useState(null);

  const getSettings = (type) => bucketSettings[type] || { rate: 8, years: 30 };
  const updateSetting = (type, key, value) =>
    setBucketSettings(prev => ({ ...prev, [type]: { ...getSettings(type), [key]: value } }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#40916C" }}>Tre Hinkar 🪣</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Automatisera din framtid</div>
      </div>
      <div style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Din månadsinkomst (netto)</div>
        <input
          type="number"
          value={monthlyIncome}
          onChange={e => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
          style={{ background: C.bgSunken, border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: '5px 10px', fontSize: 15, fontWeight: 700, color: '#40916C', width: 120, textAlign: 'right', outline: 'none' }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        {buckets.map(b => {
          const monthly = monthlyIncome * (allocs[b.type] || 0);
          const pct = Math.min(100, Math.round((b.current / b.goal) * 100)) || 0;
          const { rate, years } = getSettings(b.type);
          const annualRate = rate / 100;

          let bal = b.current;
          for (let i = 0; i < years * 12; i++) bal = bal * (1 + annualRate / 12) + monthly;

          const totalContrib = monthly * years * 12 + b.current;
          const interestEarned = Math.max(0, bal - totalContrib);
          const isExpanded = expandedBucket === b.type;

          return (
            <div key={b.type} style={{ ...S.card, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: b.color, borderRadius: "14px 0 0 14px" }} />
              {editBucketType === b.type ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{b.emoji} {b.label}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Nuvarande saldo (kr)</div>
                  <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="0" value={editBucket.current} onChange={e => setEditBucket(p => ({ ...p, current: e.target.value }))} />
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, fontWeight: 600 }}>Mål (kr)</div>
                  <input style={{ ...S.input, marginBottom: 10 }} type="number" placeholder="0" value={editBucket.goal} onChange={e => setEditBucket(p => ({ ...p, goal: e.target.value }))} />
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
                        <div style={{ fontSize: 11, color: C.textSecondary }}>av {formatSEK(b.goal)}</div>
                      </div>
                      <button style={{ ...S.btn("ghost"), padding: "5px 7px", marginTop: 1 }} onClick={() => { setEditBucketType(b.type); setEditBucket({ current: b.current, goal: b.goal }); }}><Icon name="pencil" size={12} color={C.textSecondary} /></button>
                    </div>
                  </div>
                  <div style={{ ...S.progBar, marginBottom: 10 }}><div style={S.progFill(pct, b.color)} /></div>

                  {/* Graf + prognos */}
                  <div style={{ background: C.bgSunken, borderRadius: 9, padding: "8px 10px" }}>
                    <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ fontSize: 11, color: C.textSecondary }}>
                        Om {years} år med {formatSEK(monthly)}/mån ({rate}% ränta/år)
                      </div>
                      <button
                        onClick={() => setExpandedBucket(isExpanded ? null : b.type)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: b.color, padding: 0 }}
                      >
                        Justera {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>

                    {/* Justera-panel */}
                    {isExpanded && (
                      <div style={{ marginBottom: 10, padding: "10px", background: C.bgCard, borderRadius: 8, border: `1px solid ${C.borderDefault}` }}>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                          Ränta på ränta innebär att du tjänar avkastning på din avkastning — inte bara på det du satt in. Ju längre tid, desto kraftigare effekt.
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>Årsränta (%)</div>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              step={0.5}
                              value={rate}
                              onChange={e => updateSetting(b.type, 'rate', Math.min(30, Math.max(0, Number(e.target.value))))}
                              style={{ ...S.input, textAlign: "center" }}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>Antal år</div>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              step={1}
                              value={years}
                              onChange={e => updateSetting(b.type, 'years', Math.min(50, Math.max(1, Number(e.target.value))))}
                              style={{ ...S.input, textAlign: "center" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <MiniCompoundChart monthly={monthly} years={years} color={b.color} rate={annualRate} initialBalance={b.current} />

                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: b.color, marginTop: 4 }}>{formatSEK(Math.round(bal))}</div>

                    {/* Uppdelning */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                      <div style={{ background: C.bgCard, borderRadius: 7, padding: "6px 8px" }}>
                        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>Totalt insatt</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{formatSEK(Math.round(totalContrib))}</div>
                      </div>
                      <div style={{ background: C.bgCard, borderRadius: 7, padding: "6px 8px" }}>
                        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>Räntevinst</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{formatSEK(Math.round(interestEarned))}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
