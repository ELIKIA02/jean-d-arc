import { buildExtractionPrompt, ConfigExtrait, LivreMetadata } from '../_prompt';

const DEFAULT_MISTRAL_KEY = 'kcrYWnijvNEMXT9P2be8izOFJSjZmeGq';

async function callMistral(prompt: string, apiKey: string): Promise<{ extraits: any[]; engine: string } | null> {
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

    try {
      const parsed = JSON.parse(content.trim());
      const extraits = Array.isArray(parsed) ? parsed : (parsed.extraits || parsed.data || []);
      return { extraits, engine: 'Mistral AI' };
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        const extraits = JSON.parse(match[0]);
        return { extraits, engine: 'Mistral AI' };
      }
      return null;
    }
  } catch {
    return null;
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<{ extraits: any[]; engine: string } | null> {
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
    const extraits = Array.isArray(parsed) ? parsed : (parsed.extraits || parsed.data || []);
    return { extraits, engine: 'Gemini (Inclus)' };
  } catch {
    return null;
  }
}

export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await context.request.json() as {
      text?: string;
      config?: ConfigExtrait;
      metadata?: Partial<LivreMetadata>;
      mistralApiKey?: string;
    };

    const { text, config, metadata, mistralApiKey } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 100) {
      return new Response(JSON.stringify({
        error: 'Texte trop court ou absent pour lancer l\'extraction (min 100 caractères).',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!config) {
      return new Response(JSON.stringify({ error: 'Configuration d\'extraction absente.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildExtractionPrompt(text, config, metadata || {});

    const hasCustomKey = mistralApiKey && mistralApiKey.trim().length > 0;
    const activeMistralKey = hasCustomKey ? mistralApiKey.trim() : DEFAULT_MISTRAL_KEY;

    if (activeMistralKey) {
      const mistralResult = await callMistral(prompt, activeMistralKey);
      if (mistralResult) {
        return new Response(JSON.stringify({
          extraits: mistralResult.extraits,
          engine: hasCustomKey ? 'Mistral AI (Clé perso)' : 'Mistral AI (Par défaut)',
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (hasCustomKey) {
        return new Response(JSON.stringify({
          error: 'Veuillez vérifier votre clé API Mistral dans les Paramètres.',
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (context.env.GEMINI_API_KEY) {
      const geminiResult = await callGemini(prompt, context.env.GEMINI_API_KEY);
      if (geminiResult) {
        return new Response(JSON.stringify(geminiResult), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      error: 'Veuillez saisir une clé API Mistral dans vos Paramètres pour extraire des citations.',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Erreur interne du serveur: ${err.message || err}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
