export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { email } = body
  if (!email || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const apiKey = process.env.HACKADITTLIV_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CRM API key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const res = await fetch('https://fcgjhzccucyyrpgggjwj.supabase.co/functions/v1/subscribe-lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      email,
      source: 'debthacker',
      tags: ['hdl_newsletter'],
      track: 'debthacker',
    }),
  })

  const data = await res.json()
  console.log('Hackadittliv CRM response:', data)

  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = {
  path: '/api/subscribe-crm',
}
