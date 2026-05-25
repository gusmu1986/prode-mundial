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
        max_tokens: 16000,
        messages: [{
          role: 'user',
          content: `Devolveme los 48 partidos de fase de grupos del Mundial 2026 en JSON minificado.
IMPORTANTE: responde UNICAMENTE con el JSON, sin ningun texto antes ni despues, sin markdown.
Usa este formato compacto (sin espacios extra):
{"m":[{"i":"g001","h":"MEX","a":"RSA","d":"2026-06-11T19:00:00Z","g":"A"},{"i":"g002","h":"KOR","a":"CZE","d":"2026-06-11T02:00:00Z","g":"A"},...]}
Donde h=local, a=visitante (codigo 3 letras), d=fecha UTC, g=grupo.
Codigos: MEX,RSA,KOR,CZE,CAN,BIH,QAT,SUI,BRA,MAR,HAI,SCO,USA,PAR,AUS,TUR,GER,CUW,CIV,ECU,NED,JPN,SWE,TUN,BEL,EGY,IRN,NZL,ESP,CPV,SAU,URU,FRA,SEN,IRQ,NOR,ARG,ALG,AUT,JOR,POR,COD,UZB,COL,ENG,CRO,GHA,PAN`
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: 'Anthropic error', detail: data });
    }

    const text = data.content?.[0]?.text || '';
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return res.status(500).json({ error: 'No JSON found', preview: text.substring(0, 300) });
    }
    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    const raw = JSON.parse(jsonStr);

    // Convert compact format to app format
    const matches = (raw.m || raw.matches || []).map(m => ({
      id: m.i || m.id,
      home_team: m.h || m.team1,
      away_team: m.a || m.team2,
      kickoff_utc: m.d || m.kickoff_utc,
      stage: 'group',
      group_name: `Grupo ${m.g || m.group}`,
      home_goals: null,
      away_goals: null,
      source: 'claude'
    }));

    return res.status(200).json({ matches });
  } catch (e) {
    console.error('Error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
