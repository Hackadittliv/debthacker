import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { formatSEK, calculateCompoundGrowth } from '../../utils/math';

export const SubsView = ({
  subscriptions, setSubscriptions, showSubForm, setShowSubForm,
  newSub, setNewSub, editSubId, setEditSubId, editSub, setEditSub,
  saveSub, setShowHuntGuide
}) => {
  const { S, C } = useTheme();
  const active = subscriptions.filter(s => s.active);
  const cancelled = subscriptions.filter(s => !s.active);
  const activeSubsCost = active.reduce((s, sub) => s + sub.cost, 0);
  const cancelledSubsCost = cancelled.reduce((s, sub) => s + sub.cost, 0);
  const potentialGrowth = calculateCompoundGrowth(cancelledSubsCost, 30)[30]?.amount || 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#C77B2A" }}>Prenumerationsjakten 🔍</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Varje avbruten prenumeration = investerat kapital</div>
      </div>

      <button
        onClick={() => setShowHuntGuide(true)}
        style={{ width: "100%", background: C.gradHero, border: "1px solid #C77B2A55", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", textAlign: "left", display: "block" }}
      >
        <div style={{ ...S.row, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>🕵️‍♂️</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#F4A261" }}>Jakten på läckorna</span>
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary }}>Klicka här för en steg-för-steg guide till att hitta glömda abonnemang i din bankapp.</div>
      </button>

      <div style={S.g2}>
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={S.label}>Aktiva Kostnader</div>
          <div style={{ ...S.bigNum("#E63946"), fontSize: 24 }}>{formatSEK(activeSubsCost)}<span style={{ fontSize: 14 }}>/mån</span></div>
        </div>
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={S.label}>Avbrutet (Besparing)</div>
          <div style={{ ...S.bigNum("#40916C"), fontSize: 24 }}>{formatSEK(cancelledSubsCost)}<span style={{ fontSize: 14 }}>/mån</span></div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Dina prenumerationer</span>
          <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 400 }}>{active.length} st</span>
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
                  <button style={{ ...S.btn("ghost"), padding: "6px 8px" }} onClick={() => { setEditSubId(sub.id); setEditSub({ name: sub.name, cost: sub.cost }); }}><Icon name="pencil" size={12} color={C.textSecondary} /></button>
                  <button style={{ ...S.btn("success"), padding: "6px 10px", fontSize: 12 }} onClick={() => setSubscriptions(p => p.map(s => s.id === sub.id ? { ...s, active: false } : s))}>Avbryt</button>
                  <button style={{ ...S.btn("danger"), padding: "6px 8px" }} onClick={() => setSubscriptions(p => p.filter(s => s.id !== sub.id))}><Icon name="trash" size={12} color="#fff" /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {cancelled.length > 0 && <>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Avbrutna (Bra jobbat!)</span>
            <span style={{ fontSize: 12, color: "#40916C", fontWeight: 400 }}>{cancelled.length} st</span>
          </div>
          {cancelled.map(sub => (
            <div key={sub.id} style={{ ...S.card, opacity: 0.7 }}>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary, textDecoration: "line-through" }}>{sub.name}</div>
                  <div style={{ fontSize: 13, color: "#40916C" }}>Sparar {formatSEK(sub.cost)}/mån</div>
                </div>
                <button style={{ ...S.btn("ghost"), padding: "6px 10px", fontSize: 12 }} onClick={() => setSubscriptions(p => p.map(s => s.id === sub.id ? { ...s, active: true } : s))}>Ångra</button>
              </div>
            </div>
          ))}
        </>}

        {showSubForm ? (
          <div style={S.card}>
            <input style={{ ...S.input, marginBottom: 10 }} placeholder="Namn (t.ex. Netflix)" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
            <input style={{ ...S.input, marginBottom: 15 }} type="number" placeholder="Kostnad per månad (kr)" value={newSub.cost} onChange={e => setNewSub({ ...newSub, cost: e.target.value })} />
            <div style={S.row}>
              <button style={S.btn("primary")} onClick={() => {
                if (newSub.name && newSub.cost) {
                  setSubscriptions(p => [...p, { id: Date.now().toString(), name: newSub.name, cost: parseFloat(newSub.cost), active: true }]);
                  setNewSub({ name: "", cost: "" });
                  setShowSubForm(false);
                }
              }}>Spara</button>
              <button style={S.btn("ghost")} onClick={() => setShowSubForm(false)}>Avbryt</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowSubForm(true)} style={{ ...S.btn("ghost"), width: "100%", justifyContent: "center", padding: 14, fontSize: 15, border: `1px dashed ${C.borderStrong}` }}>
            + Lägg till prenumeration
          </button>
        )}
      </div>

      {cancelledSubsCost > 0 && (
        <div style={{ ...S.card, background: C.gradGreen, border: "1px solid #40916C55" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#40916C", marginBottom: 5 }}>Du kan bli miljonär på detta 🤯</div>
          <div style={{ fontSize: 13, color: C.textNear, lineHeight: 1.5 }}>
            Om du tar de <strong>{formatSEK(cancelledSubsCost)}/mån</strong> som du just frigjort från avbrutna prenumerationer och lägger dem i "Pension & Investeringar" hinken med 8% årlig avkastning...
          </div>
          <div style={{ marginTop: 15 }}>
            <div style={{ fontSize: 11, color: "#40916C", textTransform: "uppercase" }}>Om 30 år har de vuxit till</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#40916C" }}>{formatSEK(potentialGrowth)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
