module.exports = async function handler(req, res) {
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
        model: 'claude-opus-4-5',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: 'Devolveme el fixture completo del Mundial 2026 — todos los 48 partidos de fase de grupos. SOLO JSON puro, sin markdown, sin bloques de codigo, sin texto antes ni despues. Empeza directamente con { y termina con }. Formato: {"matches":[{"id":"g001","team1":"Mexico","team2":"South Africa","date":"2026-06-11","kickoff_utc":"2026-06-11T19:00:00Z","group":"A","stage":"group"}]}'
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Anthropic API error', detail: data });
    }

    const text = data.content?.[0]?.text || '';
    // Extract JSON robustly - find first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('No JSON found in response:', text.substring(0, 200));
      return res.status(500).json({ error: 'No JSON in response', preview: text.substring(0, 200) });
    }
    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonStr);
    return res.status(200).json(parsed);
  } catch (e) {
    console.error('Handler error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
