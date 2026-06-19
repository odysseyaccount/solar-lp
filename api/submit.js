const { URLSearchParams } = require('url');

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const raw = await getRawBody(req);
    const params = new URLSearchParams(raw);
    const name = params.get('name') || '';
    const phone = params.get('phone') || '';
    const region = params.get('region') || '';

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    console.log('Submitting to GHL:', { firstName, lastName, phone, region });

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

    const responseText = await r.text();
    console.log('GHL response:', r.status, responseText);

    // 400 duplicate = contact already in system, treat as success
    if (!r.ok && r.status !== 400) return res.redirect(302, '/?error=1');
    return res.redirect(302, '/?submitted=1');
  } catch (e) {
    console.error('Submit error:', e);
    return res.redirect(302, '/?error=1');
  }
};
