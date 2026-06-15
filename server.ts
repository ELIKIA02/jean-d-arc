import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { buildExtractionPrompt } from './src/utils/mistralPrompt';

// Load environment variables
dotenv.config();

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a generous size limit (for book text chunks)
app.use(express.json({ limit: '20mb' }));

// API endpoint to analyze book metadata (Title, Author, and Chapters) dynamically
app.post('/api/analyze-book', async (req, res) => {
  try {
    const { text, mistralApiKey } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return res.status(400).json({ error: 'Texte d\'ouvrage manquant ou invalide.' });
    }

    const snippet = text.slice(0, 30000); // Analyze the first 30k characters

    // Default values if no AI response succeeds
    const result = {
      title: '',
      author: '',
      detectedChapters: [] as string[]
    };

    const DEFAULT_MISTRAL_KEY = 'kcrYWnijvNEMXT9P2be8izOFJSjZmeGq';
    const hasCustomKey = mistralApiKey && mistralApiKey.trim().length > 0;
    const activeMistralKey = hasCustomKey ? mistralApiKey.trim() : DEFAULT_MISTRAL_KEY;
    let analyzedWithMistral = false;

    if (activeMistralKey) {
      console.log(hasCustomKey ? 'Analyse d\'ouvrage via l\'API Mistral (Clé perso)...' : 'Analyse d\'ouvrage via l\'API Mistral (Clé par défaut)...');
      try {
        const prompt = `
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

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeMistralKey}`,
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content.trim());
            result.title = parsed.title || '';
            result.author = parsed.author || '';
            result.detectedChapters = Array.isArray(parsed.detectedChapters) ? parsed.detectedChapters : (parsed.chapters || []);
            analyzedWithMistral = true;
          }
        } else {
          console.warn(`Mistral analysis failed with status: ${response.status}`);
        }
      } catch (e) {
        console.warn('Mistral book analysis failed: ', e);
      }
    }

    if (!analyzedWithMistral && ai) {
      console.log('Utilisation du moteur de secours Gemini pour l\'analyse du livre...');
      try {
        const prompt = `
You are a expert literary scholar. Analyze the following book beginning snippet and detect:
1. The official book Title (Titre).
2. The official book Author name (Auteur - e.g. Victor Hugo, Jane Austen, Alexandre Dumas, etc.).
3. If visible, a short list of chapter names or titles mentioned in the Table of Contents or early headers.

Snippet:
${snippet}

Provide a strictly valid JSON response containing these three fields.
JSON format:
{
  "title": "Detected Book Title",
  "author": "Detected Author Name",
  "detectedChapters": ["Chapter Title 1", "Chapter Title 2", ...]
}
`;

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const content = geminiResponse.text;
        if (content) {
          const parsed = JSON.parse(content.trim());
          result.title = parsed.title || '';
          result.author = parsed.author || '';
          result.detectedChapters = Array.isArray(parsed.detectedChapters) ? parsed.detectedChapters : (parsed.chapters || []);
        }
      } catch (e) {
        console.warn('Gemini book analysis failed: ', e);
      }
    }

    return res.json(result);

  } catch (err: any) {
    console.error('Erreur analyze-book:', err);
    return res.status(500).json({ error: `Erreur interne du serveur: ${err.message}` });
  }
});

// API endpoint for excerpt extraction
app.post('/api/extract', async (req, res) => {
  try {
    const { text, config, metadata, mistralApiKey } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 100) {
      return res.status(400).json({
        error: 'Texte trop court ou absent pour lancer l\'extraction (min 100 caractères).',
      });
    }

    if (!config) {
      return res.status(400).json({ error: 'Configuration d\'extraction absente.' });
    }

    // Build the instruction prompt
    const prompt = buildExtractionPrompt(text, config, metadata || {});

    const DEFAULT_MISTRAL_KEY = 'kcrYWnijvNEMXT9P2be8izOFJSjZmeGq';
    const hasCustomKey = mistralApiKey && mistralApiKey.trim().length > 0;
    const activeMistralKey = hasCustomKey ? mistralApiKey.trim() : DEFAULT_MISTRAL_KEY;
    let extractedWithMistral = false;

    if (activeMistralKey) {
      console.log(hasCustomKey ? 'Utilisation du moteur Mistral AI avec clé utilisateur...' : 'Utilisation du moteur Mistral AI avec clé par défaut...');
      try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeMistralKey}`,
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              const parsed = JSON.parse(content.trim());
              const extraits = Array.isArray(parsed) ? parsed : (parsed.extraits || parsed.data || []);
              extractedWithMistral = true;
              return res.json({ extraits, engine: hasCustomKey ? 'Mistral AI (Clé perso)' : 'Mistral AI (Par défaut)' });
            } catch (parseErr) {
              console.error('Erreur parsing réponse Mistral JSON:', content);
              const match = content.match(/\[[\s\S]*\]/);
              if (match) {
                try {
                  const indexParsed = JSON.parse(match[0]);
                  extractedWithMistral = true;
                  return res.json({ extraits: indexParsed, engine: hasCustomKey ? 'Mistral AI (Clé perso)' : 'Mistral AI (Par défaut)' });
                } catch (_) {}
              }
              
              if (hasCustomKey) {
                return res.status(500).json({
                  error: 'Impossible de parser les extraits générés au format JSON par Mistral. Essayez une autre extraction.',
                  rawContent: content.substring(0, 500),
                });
              }
            }
          }
        } else {
          const errorText = await response.text();
          console.error('Erreur API Mistral:', errorText);

          if (hasCustomKey) {
            if (response.status === 401) {
              return res.status(401).json({
                error: 'Clé API Mistral invalide. Veuillez vérifier votre clé dans les Paramètres.',
              });
            } else if (response.status === 429) {
              return res.status(429).json({
                error: 'Trop de requêtes sur l\'API Mistral (Rate Limit). Réessayez dans 30 secondes.',
              });
            } else {
              return res.status(502).json({
                error: `Mistral API a retourné une erreur (${response.status}): ${errorText.substring(0, 100)}...`,
              });
            }
          }
        }
      } catch (err: any) {
        console.error('Exception extract Mistral:', err);
        if (hasCustomKey) {
          return res.status(500).json({ error: `Erreur d'appel API Mistral: ${err.message || err}` });
        }
      }
    }

    // Otherwise, fall back to our server-side Gemini API (if available)
    if (!extractedWithMistral && ai) {
      console.log('Utilisation du moteur Gemini intégré par défaut...');
      try {
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const content = geminiResponse.text;
        if (!content) {
          throw new Error('Réponse vide de Gemini.');
        }

        const parsed = JSON.parse(content.trim());
        const extraits = Array.isArray(parsed) ? parsed : (parsed.extraits || parsed.data || []);
        return res.json({ extraits, engine: 'Gemini (Inclus)' });
      } catch (geminiErr: any) {
        console.error('Erreur API Gemini:', geminiErr);
        return res.status(502).json({
          error: `Erreur durant la génération avec le moteur de secours Gemini : ${geminiErr.message || geminiErr}`,
        });
      }
    }

    // No core key and no user key supplied/functional
    return res.status(400).json({
      error: 'Veuillez saisir une clé API Mistral dans vos Paramètres ⚙️ pour extraire des citations.',
    });

  } catch (err: any) {
    console.error('Erreur globale extract:', err);
    return res.status(500).json({ error: `Erreur interne du serveur: ${err.message || err}` });
  }
});

// Start function handling Express and Vite assets integration
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Jean d'Arc Server] Listening on http://localhost:${PORT}`);
  });
}

startServer();
