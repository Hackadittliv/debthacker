import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabase.js';

// Simple animated counter hook
function useCounter(target, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatCounter({ value, suffix, label }) {
  const count = useCounter(value);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#F4A261', lineHeight: 1 }}>
        {count.toLocaleString('sv-SE')}{suffix}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function FeatureCard({ emoji, title, desc, accent }) {
  const { C } = useTheme();
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '20px',
      borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

function PainPoint({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 16, marginTop: 1 }}>❌</span>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function SolutionPoint({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 16, marginTop: 1 }}>✅</span>
      <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>{text}</span>
    </div>
  );
}

function Step({ num, title, desc, accent }) {
  const { C } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: accent, color: '#0D1117',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Serif Display', serif", fontSize: 16, fontWeight: 700,
        flexShrink: 0, marginTop: 2,
      }}>{num}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

export function LandingPage({ onStart }) {
  const { C, isDark } = useTheme();
  const [showFomo, setShowFomo] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setShowFomo(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleEmailStart = async () => {
    const trimmed = email.trim();
    if (!trimmed) { onStart(); return; }
    if (!/\S+@\S+\.\S+/.test(trimmed)) { setEmailError('Ange en giltig e-postadress'); return; }
    setEmailLoading(true);
    setEmailError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    });
    setEmailLoading(false);
    if (error) { setEmailError('Något gick fel. Försök igen.'); return; }
    // Fire welcome email — non-blocking, failure is silent
    fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed }),
    }).catch(() => {});
    setEmailSent(true);
    setTimeout(() => onStart(), 1800);
  };

  const maxW = 680;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bgApp, color: C.textPrimary, minHeight: '100vh' }}>

      {/* ── STICKY NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isDark ? 'rgba(13,17,23,0.92)' : 'rgba(240,242,245,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 52,
      }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#F4A261', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span>🔥</span>
          <span>DebtHacker</span>
          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>.se</span>
        </div>
        <button
          onClick={onStart}
          style={{
            background: '#F4A261', color: '#0D1117', border: 'none', borderRadius: 20,
            padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Starta gratis →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, #1a1000 0%, #0D1117 40%, #0a1a0a 100%)',
        padding: '72px 20px 64px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#F4A26118', border: '1px solid #F4A26144',
            borderRadius: 20, padding: '5px 14px', fontSize: 12,
            color: '#F4A261', fontWeight: 600, letterSpacing: 0.5,
            marginBottom: 24, textTransform: 'uppercase',
          }}>
            🔥 Gratis · Ingen registrering krävs
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 8vw, 52px)',
            color: '#FFFFFF',
            lineHeight: 1.15,
            marginBottom: 20,
            margin: '0 0 20px',
          }}>
            Vet du exakt när<br />du är <span style={{ color: '#F4A261' }}>skuldfri</span>?
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            De flesta betalar skulder i fel ordning och slösar tusentals kronor på onödig ränta.
            DebtHacker visar dig den exakta vägen ut — med den beprövade DOLP-skuldsläckningsmetoden.
          </p>

          {emailSent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📬</div>
              <div style={{ fontSize: 15, color: '#fff', fontWeight: 600, marginBottom: 4 }}>Kolla din mejl!</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Vi skickade en inloggningslänk. Tar dig till appen nu...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 420 }}>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <input
                  type="email"
                  placeholder="din@mejl.se (valfritt)"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailStart()}
                  style={{
                    flex: 1, padding: '14px 16px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12, fontSize: 15, color: '#fff', outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button
                  onClick={handleEmailStart}
                  disabled={emailLoading}
                  style={{
                    background: 'linear-gradient(135deg, #F4A261, #E8833A)',
                    color: '#0D1117', border: 'none', borderRadius: 12,
                    padding: '14px 22px', fontSize: 15, fontWeight: 800,
                    cursor: emailLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 6px 24px #F4A26145',
                  }}
                >
                  {emailLoading ? '...' : 'Starta →'}
                </button>
              </div>
              {emailError && <div style={{ fontSize: 12, color: '#F4A261' }}>{emailError}</div>}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                100% gratis · Ingen spam · <span style={{ cursor: 'pointer', textDecoration: 'underline', color: 'rgba(255,255,255,0.4)' }} onClick={onStart}>Hoppa över, starta utan konto</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1B2A1B, #0D1117)',
        borderTop: '1px solid #40916C30', borderBottom: '1px solid #40916C30',
        padding: '32px 20px',
      }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <StatCounter value={847} suffix="+" label="Skulder hackade" />
          <StatCounter value={2340} suffix=" kr" label="Snittbesparing/mån" />
          <StatCounter value={100} suffix=" dagar" label="Till ny vana" />
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding: '56px 20px', maxWidth: maxW, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: '#E63946', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Känner du igen dig?</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.textPrimary, margin: '0 0 16px' }}>Så betalar de flesta skulder — <span style={{ color: '#E63946' }}>fel</span></h2>
          <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7, maxWidth: 460, margin: '0 auto' }}>
            Banker tjänar pengar på att du inte förstår ordningen. DOLP-metoden kostar dem miljarder.
          </p>
        </div>

        <div style={{ background: C.bgCard, border: '1px solid #E6394630', borderRadius: 16, padding: '24px 20px', borderLeft: '4px solid #E63946', color: C.textSecondary }}>
          <PainPoint text="Betalar lite på alla skulder varje månad utan plan" />
          <PainPoint text="Vet inte vilken skuld som faktiskt är dyrast i längden" />
          <PainPoint text="Glömmer bort prenumerationer som tömmer kontot i bakgrunden" />
          <PainPoint text="Har ingen koll på exakt när den sista skulden är betald" />
          <PainPoint text="Betalar minst 3 år mer än nödvändigt" />
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section style={{ padding: '0 20px 56px', maxWidth: maxW, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #0A1E10, #161B22)', border: '1px solid #40916C30', borderRadius: 20, padding: '28px 24px' }}>
          <div style={{ fontSize: 12, color: '#40916C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>DOLP-SKULDSLÄCKNINGSMETODEN</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: '#FFFFFF', margin: '0 0 8px' }}>
            Minsta skuld först. Bygg <span style={{ color: '#40916C' }}>momentum</span>.
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
            DOLP (Done On Last Payment): betala av den minsta skulden fullt ut, rulla sedan betalningen till nästa. Psykologiskt kraftfull och matematiskt optimal.
          </p>
          <SolutionPoint text="Exakt ordning på dina skulder — automatiskt beräknad" />
          <SolutionPoint text="Ser precis hur många månader varje skuld tar att lösa" />
          <SolutionPoint text="Snöbollseffekten: varje betald skuld frigör mer till nästa" />
          <SolutionPoint text="Betalar av skulder upp till 40% snabbare" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '0 20px 56px', maxWidth: maxW, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: '#4A9ECC', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Allt du behöver</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.textPrimary, margin: 0 }}>Din kompletta skuldhackare</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          <FeatureCard
            emoji="🔥"
            title="Skuldsläckaren"
            desc="DOLP-planen beräknar automatiskt i vilken ordning du ska betala av dina skulder för maximal hastighet och minimal ränta."
            accent="#F4A261"
          />
          <FeatureCard
            emoji="📱"
            title="Prenumerationsjakten"
            desc="Avslöja exakt hur mycket dina prenumerationer kostar per månad. De flesta hittar 500–2000 kr att frigöra direkt."
            accent="#E63946"
          />
          <FeatureCard
            emoji="🔒"
            title="Samlånslåset"
            desc="Lås upp möjligheten att slå ihop skulder. Kräver att du betalar av minst en skuld — ger incitament att komma igång."
            accent="#4A9ECC"
          />
          <FeatureCard
            emoji="🪣"
            title="Pengahinkar"
            desc="Dela upp din ekonomi i hinkar: nödfond, skulder, sparande, nöjen. Tydlig struktur ger kontroll och lugn."
            accent="#40916C"
          />
          <FeatureCard
            emoji="🏆"
            title="100-dagarsutmaningen"
            desc="Bygg skuldhackarvanan dag för dag. Milstolpar, achievement-badges och levels håller motivationen uppe hela vägen."
            accent="#F4A261"
          />
          <FeatureCard
            emoji="🤖"
            title="Ekonomicoach"
            desc="Ställ frågor om din skuldsituation och få personliga råd baserade på DOLP-principerna — dygnet runt."
            accent="#4A9ECC"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '0 20px 56px', maxWidth: maxW, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: '#F4A261', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Tre steg</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.textPrimary, margin: 0 }}>Kom igång på 5 minuter</h2>
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 24px' }}>
          <Step
            num="1"
            title="Lägg in dina skulder"
            desc="Namn, saldo, ränta och minbetalning. Tar 2 minuter om du har dem framme."
            accent="#F4A261"
          />
          <Step
            num="2"
            title="Se din DOLP-plan"
            desc="DebtHacker rangordnar automatiskt dina skulder och beräknar exakt datum för varje. Du ser direkt hur lång tid det tar."
            accent="#40916C"
          />
          <Step
            num="3"
            title="Följ planen — dag för dag"
            desc="Sätt en extra betalning per månad. Kryssa av skulder när de är klara. Bygg momentum med 100-dagarsutmaningen."
            accent="#4A9ECC"
          />
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section style={{ padding: '0 20px 56px', maxWidth: maxW, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1A1200, #0D1117)',
          border: '1px solid #F4A26130',
          borderRadius: 20, padding: '32px 28px', textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{ fontSize: 48, color: '#F4A26140', fontFamily: "'DM Serif Display', serif", lineHeight: 1, marginBottom: 4 }}>"</div>
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20, color: '#E6EDF3', lineHeight: 1.5,
            margin: '0 0 20px',
            fontStyle: 'italic',
          }}>
            Skuldfrihet börjar inte med höjd inkomst — det börjar med rätt ordning på dina betalningar.
          </p>
          <div style={{ fontSize: 13, color: '#F4A261', fontWeight: 600 }}>DOLP-principen</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Grunden för DebtHacker · Skuldsläckningsmetoden</div>
        </div>
      </section>

      {/* ── FOMO BANNER ── */}
      {showFomo && (
        <section style={{
          background: '#E63946', padding: '16px 20px', textAlign: 'center',
          position: 'sticky', bottom: 60, zIndex: 50,
        }}>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, lineHeight: 1.5 }}>
            ⚡ Varje månad du väntar betalar du onödig ränta. Starta nu — tar 5 minuter.
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <section style={{
        background: 'linear-gradient(160deg, #0a1a0a, #1a1000)',
        padding: '64px 20px 80px', textAlign: 'center',
        borderTop: '1px solid #40916C20',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔥</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.2 }}>
            Börja hacka dina skulder idag
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.7 }}>
            Gratis. Ingen registrering. Inga tricks. Bara en tydlig plan för att bli skuldfri snabbare.
          </p>
          <button
            onClick={onStart}
            style={{
              background: 'linear-gradient(135deg, #F4A261, #E8833A)',
              color: '#0D1117', border: 'none', borderRadius: 14,
              padding: '18px 40px', fontSize: 18, fontWeight: 800,
              cursor: 'pointer', letterSpacing: -0.3,
              boxShadow: '0 8px 40px #F4A26150',
              display: 'inline-block',
            }}
          >
            Starta gratis nu →
          </button>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 14 }}>
            Din data sparas lokalt i webbläsaren. Logga in för molnsynk.
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '20px', textAlign: 'center', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textDim, lineHeight: 2 }}>
          DebtHacker.se · DOLP-skuldsläckningsmetoden<br />
          <a href="https://conversify.io" target="_blank" rel="noreferrer" style={{ color: '#4A9ECC', textDecoration: 'none' }}>Powered by Conversify.io</a>
        </div>
      </footer>
    </div>
  );
}
