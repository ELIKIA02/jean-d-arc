import { ConfigExtrait, LivreMetadata } from '../types';

export const buildExtractionPrompt = (
  text: string,
  config: ConfigExtrait,
  metadata: Partial<LivreMetadata>
): string => {
  const languageLabel = config.langue === 'FR' ? 'français' : 'anglais';
  const themeFilter = config.themes.length > 0 
    ? `Prioritize these literary themes: ${config.themes.join(', ')}.` 
    : 'Select various high-impact literary themes (such as deep insight, philosophy, emotion, suspense, wit, humor).';

  return `
You are a highly sophisticated literary archivist and social media strategist named "JEAN D'ARC Extraits". Your task is to extract the absolute best literary gems (quotes, dialogues, reflections) from the provided book text.

--- BOOK METADATA ---
Title: ${metadata.titre || 'Unknown'}
Author: ${metadata.auteur || 'Unknown'}
Chapter/Context: ${metadata.chapitre || 'Unknown'}

--- EXTRACTION PARAMETERS ---
1. Quantity: Extract EXACTLY ${config.nombre} remarkable extracts.
2. Language: Output everything in ${languageLabel}.
3. Themes: ${themeFilter}
4. Excerpt Length & Structure: The length of each quote should depend on the complete intellectual, narrative, or philosophical idea, potentially containing up to two paragraphs to fully frame and capture the passage beautifully without arbitrary truncation.
5. Tone: The social formatting or secondary commentary must align with the tone: "${config.tonalite}".
6. Min Quality Score: Only return extracts with a high relevance score of ${config.scoreMin}/10 or above.

--- STRICT OUTPUT INSTRUCTIONS & FORMAT ---
You MUST respond with a JSON array AND NOTHING ELSE. Do not include markdown code block formatting like \`\`\`json. Your response must be parsed directly by JSON.parse.

JSON Schema to return:
[
  {
    "citation": "The exact literal quote from the text. DO NOT rewrite or modernize the quote. Keep the elegance of the original text.",
    "page": "Page number or location indicator (e.g. 'p. 42' or 'Loc 241' or leave blank if not detectable)",
    "chapitre": "The chapter details if detectable, otherwise use '${metadata.chapitre || ''}'",
    "score": 9, // integer between 5 and 10 representing literary punchiness, depth and appropriateness for sharing.
    "tags": ["at least 2 relevant hashtags, e.g. #sagesse, #philosophie, #amour, #epoque, lowercase without hashes in terms but can have hashes"],
    "theme": "one of: 'sagesse', 'amour', 'humour', 'intrigue', 'philosophie'",
    "typeContenu": "one of: 'citation', 'dialogue', 'reflexion', 'poetique', 'charniere'"
  }
]

--- THE BOOK TEXT TO PARSE ---
${text.slice(0, 50000)} // safely sliced to fit context limits
`;
};
