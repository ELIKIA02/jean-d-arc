const DEFAULT_MISTRAL_KEY = 'kcrYWnijvNEMXT9P2be8izOFJSjZmeGq';

async function callMistral(prompt: string, apiKey: string): Promise<{ title: string; author: string; detectedChapters: string[] } | null> {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content.trim());
    return {
      title: parsed.title || '',
      author: parsed.author || '',
      detectedChapters: Array.isArray(parsed.detectedChapters) ? parsed.detectedChapters : (parsed.chapters || []),
    };
  } catch {
    return null;
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<{ title: string; author: string; detectedChapters: string[] } | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) return null;

    const data: any = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    const parsed = JSON.parse(content.trim());
    return {
      title: parsed.title || '',
      author: parsed.author || '',
      detectedChapters: Array.isArray(parsed.detectedChapters) ? parsed.detectedChapters : (parsed.chapters || []),
    };
  } catch {
    return null;
  }
}

function buildAnalyzePrompt(snippet: string): string {
  return `
You are a expert literary scholar. Analyze the following book beginning snippet and detect:
1. The official book Title (Titre).
2. The official book Author name (Auteur).
3. If visible, a short list of chapter names or titles mentioned in the Table of Contents or early headers.

Snippet:
${snippet}

Provide a strictly valid JSON response containing these three fields. Do not include markdown wraps.
JSON format:
{
  "title": "Detected Book Title",
  "author": "Detected Author Name",
  "detectedChapters": ["Chapter Title 1", "Chapter Title 2", ...]
}
`;
}

export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { text, mistralApiKey } = await context.request.json() as { text?: string; mistralApiKey?: string };

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return new Response(JSON.stringify({ error: 'Texte d\'ouvrage manquant ou invalide.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const snippet = text.slice(0, 30000);
    const prompt = buildAnalyzePrompt(snippet);

    const hasCustomKey = mistralApiKey && mistralApiKey.trim().length > 0;
    const activeMistralKey = hasCustomKey ? mistralApiKey.trim() : DEFAULT_MISTRAL_KEY;

    const mistralResult = await callMistral(prompt, activeMistralKey);
    if (mistralResult) {
      return new Response(JSON.stringify(mistralResult), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (hasCustomKey) {
      return new Response(JSON.stringify({
        title: '', author: '', detectedChapters: [],
        warning: 'Mistral API key may be invalid. A default key was not used as fallback.',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (context.env.GEMINI_API_KEY) {
      const geminiResult = await callGemini(prompt, context.env.GEMINI_API_KEY);
      if (geminiResult) {
        return new Response(JSON.stringify(geminiResult), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ title: '', author: '', detectedChapters: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Erreur interne du serveur: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
