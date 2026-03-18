import { useTheme } from '../context/ThemeContext'

function Section({ title, children, C }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#F4A261', margin: '0 0 12px' }}>{title}</h2>
      <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

function Row({ label, value, C }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontWeight: 600, color: C.textPrimary, minWidth: 160, fontSize: 13 }}>{label}</div>
      <div style={{ color: C.textSecondary, fontSize: 13 }}>{value}</div>
    </div>
  )
}

export function PrivacyPage({ onBack }) {
  const { C } = useTheme()

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bgApp, color: C.textPrimary, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: C.bgApp, borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px', height: 52,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          ← Tillbaka
        </button>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#F4A261' }}>
          🔥 DebtHacker
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.textPrimary, margin: '0 0 10px' }}>
            Integritetspolicy
          </h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            Senast uppdaterad: mars 2025 · DebtHacker.se drivs av Conversify.io
          </div>
        </div>

        {/* Ansvarsfriskrivning - placeras överst då det är viktigt */}
        <div style={{ background: '#F4A26115', border: '1px solid #F4A26140', borderRadius: 14, padding: '20px 24px', marginBottom: 40 }}>
          <div style={{ fontWeight: 700, color: '#F4A261', marginBottom: 8, fontSize: 15 }}>⚠️ Viktig ansvarsfriskrivning</div>
          <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>
            DebtHacker är ett <strong style={{ color: C.textPrimary }}>planeringsverktyg</strong>, inte en finansiell rådgivningstjänst.
            Innehållet i appen - inklusive DOLP-planer, AI-coachens svar och beräkningar - utgör
            <strong style={{ color: C.textPrimary }}> inte finansiell, juridisk eller skattemässig rådgivning</strong>.
            Konsultera alltid en auktoriserad finansiell rådgivare innan du fattar ekonomiska beslut.
            Conversify.io ansvarar inte för förluster som uppstår till följd av användning av appen.
          </div>
        </div>

        <Section title="1. Personuppgiftsansvarig" C={C}>
          <p style={{ margin: '0 0 8px' }}>
            Conversify.io ansvarar för behandlingen av dina personuppgifter inom DebtHacker.se.
          </p>
          <p style={{ margin: 0 }}>
            Kontakt: <a href="mailto:hej@conversify.io" style={{ color: '#4A9ECC' }}>hej@conversify.io</a>
          </p>
        </Section>

        <Section title="2. Vilken data vi samlar in" C={C}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <Row label="E-postadress" value="Om du väljer att skapa konto eller logga in" C={C} />
            <Row label="Skuldinformation" value="Namn, saldo, ränta och minbetalning - du matar in detta frivilligt" C={C} />
            <Row label="Månadsinkomst" value="Du anger detta frivilligt för att beräkna planer" C={C} />
            <Row label="Prenumerationer" value="Namn och kostnad - du matar in detta frivilligt" C={C} />
            <Row label="Sparmål (hinkar)" value="Namn, målbelopp och nuvarande saldo" C={C} />
            <Row label="Framstegsdata" value="Achievements, 100-dagarsutmaning, beteendebevis" C={C} />
          </div>
          <p style={{ margin: 0, color: C.textMuted, fontSize: 13 }}>
            Vi samlar aldrig in kontonummer, personnummer, lösenord (hanteras av Supabase Auth) eller betalningsinformation.
          </p>
        </Section>

        <Section title="3. Var din data lagras" C={C}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <Row label="Din webbläsare" value="All data sparas lokalt (localStorage) om du inte är inloggad. Lämnar aldrig din enhet." C={C} />
            <Row label="Supabase (EU)" value="Om du skapar konto synkas din data till Supabase servrar inom EU. Krypterad i transit och vila." C={C} />
          </div>
        </Section>

        <Section title="4. Tredjeparter vi delar data med" C={C}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <Row
              label="Supabase"
              value="Datalagring och autentisering. Servrar inom EU. Databehandlingsavtal (DPA) tecknat. supabase.com/privacy"
              C={C}
            />
            <Row
              label="Anthropic (USA)"
              value="Driver AI-coachen. Din finansiella kontext (inkomst, skulder) skickas vid chatten. Standardavtalsklausuler (SCC) tillämpas för GDPR-överensstämmelse. anthropic.com/privacy"
              C={C}
            />
            <Row
              label="Resend"
              value="Skickar välkomstmejl. Enbart din e-postadress delas. resend.com/privacy"
              C={C}
            />
          </div>
          <p style={{ margin: 0, color: C.textMuted, fontSize: 13 }}>
            Vi säljer aldrig din data till tredje part och använder den inte för marknadsföringsändamål.
          </p>
        </Section>

        <Section title="5. Rättslig grund för behandling" C={C}>
          <p style={{ margin: '0 0 8px' }}>
            Vi behandlar dina uppgifter med stöd av:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}><strong style={{ color: C.textPrimary }}>Avtal</strong> - för att tillhandahålla tjänsten (kontoinloggning, molnsynk)</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: C.textPrimary }}>Berättigat intresse</strong> - för att förbättra tjänsten och säkerställa säkerhet</li>
            <li><strong style={{ color: C.textPrimary }}>Samtycke</strong> - för välkomstmejlet (du anger frivilligt din e-post)</li>
          </ul>
        </Section>

        <Section title="6. Cookies och lokal lagring" C={C}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <Row label="Supabase Auth-cookie" value="Strikt nödvändig. Håller dig inloggad. Kräver inte samtycke." C={C} />
            <Row label="localStorage (dh_*)" value="Sparar din finansiella data lokalt i webbläsaren. Rensas om du tömmer webbläsarens data." C={C} />
          </div>
          <p style={{ margin: 0, color: C.textMuted, fontSize: 13 }}>
            Vi använder inga spårningscookies, analytikverktyg (Google Analytics m.m.) eller reklamcookies.
          </p>
        </Section>

        <Section title="7. Dina rättigheter under GDPR" C={C}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}><strong style={{ color: C.textPrimary }}>Rätt till tillgång</strong> - begär ut en kopia av all data vi har om dig</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: C.textPrimary }}>Rätt till radering</strong> - begär att vi raderar ditt konto och all tillhörande data</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: C.textPrimary }}>Rätt till rättelse</strong> - korrigera felaktiga uppgifter (du kan göra detta direkt i appen)</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: C.textPrimary }}>Rätt till dataportabilitet</strong> - begär din data i maskinläsbart format</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: C.textPrimary }}>Rätt att invända</strong> - invända mot behandling baserad på berättigat intresse</li>
            <li><strong style={{ color: C.textPrimary }}>Rätt att lämna klagomål</strong> - till Integritetsskyddsmyndigheten (IMY): imy.se</li>
          </ul>
          <p style={{ margin: '16px 0 0', color: C.textMuted, fontSize: 13 }}>
            Skicka förfrågningar till <a href="mailto:hej@conversify.io" style={{ color: '#4A9ECC' }}>hej@conversify.io</a>. Vi svarar inom 30 dagar.
          </p>
        </Section>

        <Section title="8. Hur länge vi sparar data" C={C}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <Row label="Kontodata" value="Tills du begär radering eller avslutar kontot" C={C} />
            <Row label="E-postadress" value="Tills du avslutar kontot" C={C} />
            <Row label="Lokal data" value="Tills du tömmer webbläsarens data eller rensar manuellt" C={C} />
          </div>
        </Section>

        <Section title="9. Ändringar i denna policy" C={C}>
          <p style={{ margin: 0 }}>
            Vi kan uppdatera denna policy. Väsentliga ändringar meddelas via e-post (om du är registrerad) eller via ett meddelande i appen.
            Datumet längst upp på sidan uppdateras alltid.
          </p>
        </Section>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>Kontakt</div>
          <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>
            Frågor om integritet och dataskydd:<br />
            <a href="mailto:hej@conversify.io" style={{ color: '#4A9ECC' }}>hej@conversify.io</a><br />
            Conversify.io - ansvarig för DebtHacker.se
          </div>
        </div>
      </div>
    </div>
  )
}
