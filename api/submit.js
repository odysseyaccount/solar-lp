export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { name, phone, region } = req.body || {};
  const parts = (name || '').trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  try {
    const r = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        locationId: process.env.GHL_LOCATION_ID,
        tags: ['solar-lp', 'founding-cohort', region === 'au' ? 'AU' : 'NZ'],
        source: 'Solar LP — Founding Cohort',
      }),
    });

    if (!r.ok) {
      console.error('GHL error:', await r.text());
      return res.redirect(302, '/?error=1');
    }

    return res.redirect(302, '/?submitted=1');
  } catch (e) {
    console.error(e);
    return res.redirect(302, '/?error=1');
  }
}
