import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';

export const CoachView = ({
  chatMessages, chatInput, setChatInput, sendMessage, chatEndRef, isChatLoading
}) => {
  const { S, C } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#4A9ECC" }}>Ekonomicoach 🤖</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Baserad på David Bachs principer</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
        {chatMessages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{
              background: msg.role === "user" ? "#4A9ECC" : C.bgCard,
              color: msg.role === "user" ? "#fff" : C.textPrimary,
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              maxWidth: "85%",
              fontSize: 14,
              lineHeight: 1.5,
              border: msg.role === "assistant" ? `1px solid ${C.borderStrong}` : "none"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{ background: C.bgCard, color: C.textSecondary, padding: "12px 16px", borderRadius: "18px 18px 18px 4px", fontSize: 14, border: `1px solid ${C.borderStrong}` }}>
              Skriver...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={{ ...S.row, marginTop: 10 }}>
        <input
          style={{ ...S.input, flex: 1, padding: "14px 16px", borderRadius: 20 }}
          placeholder="Fråga om din ekonomi..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={{ width: 48, height: 48, borderRadius: "50%", background: "#4A9ECC", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginLeft: 8 }}>
          <Icon name="send" size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
};
