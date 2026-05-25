export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: `Devolveme el fixture completo del Mundial 2026 — todos los partidos de fase de grupos (48 partidos) y eliminatorias hasta la final (56 partidos en total, 104 en total).

Respondé SOLO con un JSON válido, sin markdown, sin texto extra. Formato exacto:
{
  "matches": [
    {"id": "g001", "team1": "Mexico", "team2": "South Africa", "date": "2026-06-11", "kickoff_utc": "2026-06-11T19:00:00Z", "group": "A", "stage": "group"},
    ...
  ]
}

Para fase de grupos: incluí group (A-L) y stage="group".
Para eliminatorias: group=null y stage con el nombre de la ronda (ej: "Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Third place", "Final").
Para eliminatorias donde no se conocen los equipos aún, usá "TBD" como team1 y team2.
Todos los kickoff_utc en formato ISO 8601 UTC.
Solo el JSON, nada más.`
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data });

    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
