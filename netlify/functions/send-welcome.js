const WELCOME_HTML = (email) => `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Välkommen till DebtHacker</title>
</head>
<body style="margin:0;padding:0;background:#0D1117;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:28px;">🔥</span>
              <span style="font-size:22px;font-weight:700;color:#F4A261;letter-spacing:-0.5px;vertical-align:middle;margin-left:8px;">DebtHacker</span>
              <span style="font-size:13px;color:#4B5563;vertical-align:middle;">.se</span>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#161B22;border-radius:20px;padding:36px 32px;border:1px solid #30363D;">
              <p style="margin:0 0 8px;font-size:13px;color:#40916C;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Du är med nu 🎉</p>
              <h1 style="margin:0 0 16px;font-size:28px;color:#E6EDF3;font-weight:800;line-height:1.2;">
                Dags att hacka<br />dina skulder
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#8B949E;line-height:1.7;">
                Välkommen till DebtHacker — appen som visar dig exakt i vilken ordning du ska betala av dina skulder för att bli skuldfri så fort som möjligt.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#F4A261,#E8833A);border-radius:12px;padding:0;">
                    <a href="https://debthacker.se" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#0D1117;text-decoration:none;letter-spacing:-0.3px;">
                      Öppna appen →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 3 steps -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#21262D;border-radius:12px;padding:20px 20px 4px;">
                    <p style="margin:0 0 14px;font-size:11px;color:#4B5563;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Kom igång på 5 minuter</p>
                    ${[
                      ['1', '#F4A261', 'Lägg in dina skulder', 'Namn, saldo och ränta — tar 2 minuter.'],
                      ['2', '#40916C', 'Se DOLP-planen', 'Exakt ordning och datum för varje skuld.'],
                      ['3', '#4A9ECC', 'Följ planen dag för dag', 'Bygg momentum med 100-dagarsutmaningen.'],
                    ].map(([n, c, title, desc]) => `
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:2px;">
                          <span style="display:inline-block;width:22px;height:22px;background:${c};border-radius:50%;font-size:12px;font-weight:700;color:#0D1117;text-align:center;line-height:22px;">${n}</span>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#E6EDF3;">${title}</p>
                          <p style="margin:0;font-size:13px;color:#8B949E;">${desc}</p>
                        </td>
                      </tr>
                    </table>`).join('')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quote -->
          <tr>
            <td style="padding:24px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#161B22;border-radius:16px;padding:24px 24px;border:1px solid #21262D;border-left:3px solid #F4A261;">
                    <p style="margin:0 0 10px;font-size:15px;color:#C9D1D9;line-height:1.6;font-style:italic;">
                      "Skuldfrihet börjar inte med höjd inkomst — det börjar med rätt ordning på dina betalningar."
                    </p>
                    <p style="margin:0;font-size:12px;color:#F4A261;font-weight:700;">DOLP-principen · Grunden för DebtHacker</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#4B5563;">
                Du får det här mejlet för att du registrerade dig på debthacker.se
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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Resend API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { email } = body
  if (!email || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'DebtHacker <noreply@debthacker.se>',
      to: [email],
      subject: 'Välkommen till DebtHacker 🔥 — din skuldfria resa börjar nu',
      html: WELCOME_HTML(email),
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Resend error:', data)
    return new Response(JSON.stringify({ error: data.message || 'Failed to send email' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = {
  path: '/api/send-welcome',
}
