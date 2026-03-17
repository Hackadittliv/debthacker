import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK } from '../../utils/math';
import { MiniCompoundChart } from '../ui/MiniCompoundChart';

export const BucketsView = ({
  buckets, setBuckets, monthlyIncome,
  editBucketType, setEditBucketType, editBucket, setEditBucket, saveBucket
}) => {
  const { S, C } = useTheme();
  const allocs = { pension: 0.1, buffert: 0.05, drom: 0.05 };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#40916C" }}>Tre Hinkar 🪣</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Automatisera din framtid</div>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Din månadsinkomst</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#40916C" }}>{formatSEK(monthlyIncome)}</div>
      </div>

      <div style={{ marginTop: 20 }}>
        {buckets.map(b => {
          const monthly = monthlyIncome * (allocs[b.type] || 0);
          const pct = Math.min(100, Math.round((b.current / b.goal) * 100)) || 0;
          let bal = b.current;
          for (let i = 0; i < 30 * 12; i++) bal = bal * (1 + 0.08 / 12) + monthly;

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
                        <div style={{ fontSize: 11, color: C.textSecondary }}>av {formatSEK(b.goal)}</div>
                      </div>
                      <button style={{ ...S.btn("ghost"), padding: "5px 7px", marginTop: 1 }} onClick={() => { setEditBucketType(b.type); setEditBucket({ current: b.current, goal: b.goal }); }}><Icon name="pencil" size={12} color={C.textSecondary} /></button>
                    </div>
                  </div>
                  <div style={{ ...S.progBar, marginBottom: 10 }}><div style={S.progFill(pct, b.color)} /></div>
                  <div style={{ background: C.bgSunken, borderRadius: 9, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 5 }}>Om 30 år med {formatSEK(monthly)}/mån</div>
                    <MiniCompoundChart monthly={monthly} years={30} color={b.color} />
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: b.color, marginTop: 4 }}>{formatSEK(bal)}</div>
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
