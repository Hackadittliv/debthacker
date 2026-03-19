const fmtSEK = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return '0 kr'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M kr`
  return `${Math.round(n).toLocaleString('sv-SE')} kr`
}

const monthsToText = (m) => {
  if (!m || m <= 0) return '0 mån'
  if (m >= 1200) return '100+ år'
  const y = Math.floor(m / 12)
  const mo = Math.round(m % 12)
  if (y > 0 && mo > 0) return `${y} år ${mo} mån`
  if (y > 0) return `${y} år`
  return `${mo} mån`
}

const debtFreeDate = (months) => {
  const d = new Date()
  d.setMonth(d.getMonth() + (months || 0))
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })
}

const SUMMARY_HTML = ({ totalDebt, debtFreeMonths, extraPayment, interestSaved, monthsSaved, debts }) => {
  const activeDebts = debts.filter(d => !d.paid_off)
  const paidCount = debts.filter(d => d.paid_off).length
  const TYPE_LABELS = { kreditkort: 'Kreditkort', csn: 'CSN-lån', konsument: 'Konsumentlån', bil: 'Billån', bostad: 'Bostadslån', ovrig: 'Övrigt' }

  const debtRows = activeDebts.slice(0, 5).map(d => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #21262D;font-size:14px;color:#E6EDF3;">${d.name}${d.type && TYPE_LABELS[d.type] ? ` <span style="font-size:11px;color:#8B949E;">(${TYPE_LABELS[d.type]})</span>` : ''}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #21262D;font-size:14px;color:#F4A261;text-align:right;">${fmtSEK(d.balance)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #21262D;font-size:13px;color:#8B949E;text-align:right;">${d.interest_rate}%</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Din DebtHacker-sammanfattning</title>
</head>
<body style="margin:0;padding:0;background:#0D1117;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-size:26px;">🔥</span>
              <span style="font-size:20px;font-weight:700;color:#F4A261;letter-spacing:-0.5px;vertical-align:middle;margin-left:8px;">DebtHacker</span>
              <span style="font-size:12px;color:#4B5563;vertical-align:middle;">.se</span>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#161B22;border-radius:20px;padding:32px;border:1px solid #30363D;">
              <p style="margin:0 0 6px;font-size:12px;color:#F4A261;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Din framstegsrapport</p>
              <h1 style="margin:0 0 20px;font-size:26px;color:#E6EDF3;font-weight:800;line-height:1.2;">
                Skuldfri om ${monthsToText(debtFreeMonths)}
              </h1>

              <!-- Stats grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48%" style="background:#0D1117;border-radius:12px;padding:16px;border:1px solid #21262D;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;color:#8B949E;text-transform:uppercase;letter-spacing:1px;">Total skuld</p>
                    <p style="margin:0;font-size:24px;font-weight:800;color:#E63946;">${fmtSEK(totalDebt)}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#0D1117;border-radius:12px;padding:16px;border:1px solid #21262D;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;color:#8B949E;text-transform:uppercase;letter-spacing:1px;">Skuldfri datum</p>
                    <p style="margin:0;font-size:18px;font-weight:800;color:#40916C;">${debtFreeDate(debtFreeMonths)}</p>
                  </td>
                </tr>
              </table>

              ${interestSaved > 0 ? `
              <!-- Savings row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#0A1E10;border-radius:12px;padding:16px;border:1px solid #40916C44;">
                    <p style="margin:0 0 10px;font-size:11px;color:#40916C;text-transform:uppercase;letter-spacing:1px;font-weight:700;">💰 Din DOLP-besparing vs enbart minimum</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48%">
                          <p style="margin:0 0 2px;font-size:11px;color:#8B949E;">Räntebesparing</p>
                          <p style="margin:0;font-size:22px;font-weight:800;color:#40916C;">${fmtSEK(interestSaved)}</p>
                        </td>
                        <td width="4%"></td>
                        <td width="48%">
                          <p style="margin:0 0 2px;font-size:11px;color:#8B949E;">Tid sparad</p>
                          <p style="margin:0;font-size:22px;font-weight:800;color:#40916C;">${monthsToText(monthsSaved)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Debt table -->
              ${activeDebts.length > 0 ? `
              <p style="margin:0 0 10px;font-size:13px;color:#8B949E;font-weight:600;">Aktiva skulder (${activeDebts.length} st · extra ${fmtSEK(extraPayment)}/mån)</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #21262D;">
                <thead>
                  <tr style="background:#21262D;">
                    <th style="padding:8px 14px;font-size:11px;color:#8B949E;text-align:left;font-weight:600;">Skuld</th>
                    <th style="padding:8px 14px;font-size:11px;color:#8B949E;text-align:right;font-weight:600;">Saldo</th>
                    <th style="padding:8px 14px;font-size:11px;color:#8B949E;text-align:right;font-weight:600;">Ränta</th>
                  </tr>
                </thead>
                <tbody>
                  ${debtRows}
                  ${activeDebts.length > 5 ? `<tr><td colspan="3" style="padding:8px 14px;font-size:12px;color:#8B949E;text-align:center;">+ ${activeDebts.length - 5} skulder till</td></tr>` : ''}
                </tbody>
              </table>` : ''}

              ${paidCount > 0 ? `<p style="margin:16px 0 0;font-size:14px;color:#40916C;font-weight:600;">✅ Du har redan betalat av ${paidCount} skuld${paidCount > 1 ? 'er' : ''}! Fortsätt så!</p>` : ''}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#F4A261,#E8833A);border-radius:12px;padding:0;">
                    <a href="https://debthacker.se" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#0D1117;text-decoration:none;">
                      Öppna appen →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#4B5563;">
                Du fick det här mejlet för att du bad om en sammanfattning på debthacker.se
              </p>
              <p style="margin:0;font-size:12px;color:#4B5563;">
                Powered by <a href="https://conversify.io" style="color:#4A9ECC;text-decoration:none;">Conversify.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const token = authHeader.slice(7)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey }
  })
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const { email } = await userRes.json()

  // ── Resend key ────────────────────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Email not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { totalDebt = 0, debtFreeMonths = 0, extraPayment = 0, interestSaved = 0, monthsSaved = 0, debts = [] } = body

  // ── Send ──────────────────────────────────────────────────────────────────
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Din ekonomiplan <hej@debthacker.se>',
      reply_to: 'hej@debthacker.se',
      to: [email],
      subject: `Din skuldfria resa: ${totalDebt > 0 ? `${Math.round(totalDebt / 1000)}k kr kvar` : 'Du är skuldfri!'}`,
      html: SUMMARY_HTML({ totalDebt, debtFreeMonths, extraPayment, interestSaved, monthsSaved, debts }),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.message || 'Failed to send' }), { status: res.status, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export const config = {
  path: '/api/send-summary',
}
