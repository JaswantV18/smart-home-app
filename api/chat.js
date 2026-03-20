export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { provider, apiKey, messages, system } = req.body;

  if (!apiKey) return res.status(400).json({ error: 'No API key provided' });

  try {
    if (provider === 'groq') {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [{ role: 'system', content: system }, ...messages],
            max_tokens: 1000,
          }),
        }
      );
      const data = await response.json();
      if (data.error)
        return res.status(400).json({ error: data.error.message });
      return res
        .status(200)
        .json({ text: data.choices?.[0]?.message?.content });
    } else {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1000,
          system,
          messages,
        }),
      });
      const data = await response.json();
      if (data.error)
        return res.status(400).json({ error: data.error.message });
      return res.status(200).json({ text: data.content?.[0]?.text });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
