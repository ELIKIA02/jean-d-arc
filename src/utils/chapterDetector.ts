export interface DetectedChapter {
  id: string;
  number: number;
  title: string;
  startIndex: number;
  endIndex: number;
  text: string;
  charCount: number;
}

/**
 * Parses the book's text to find chapter headers or segment it into chunks.
 */
export const detectChaptersLocally = (text: string, isFrench: boolean): DetectedChapter[] => {
  if (!text || text.trim().length === 0) return [];

  const chapters: DetectedChapter[] = [];
  
  // Patterns matching typical chapter definitions
  const r1 = /^[ \t]*(?:chapitre|chapter|partie|part|section)\s+([ivxldm\d]+|[a-zA-Z]+)(?:\s*[:.-]\s*([^\n]+))?/i;
  const r2 = /^[ \t]*([ivxlmd\d]+)[.)-]\s+([a-zA-Z\u00C0-\u00DC\u00E0-\u00FC].*)/i; // e.g. "I. L'arrivée" or "1. Intro"
  
  const lines = text.split('\n');
  let currentChapter: Partial<DetectedChapter> | null = null;
  let charAccumulator = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const originalLineLength = line.length + 1; // +1 for the newline
    const cleanLine = line.trim();

    let matched = false;
    let chTitle = '';
    let chNumStr = '';

    // Check matches
    const m1 = cleanLine.match(r1);
    if (m1) {
      matched = true;
      chNumStr = m1[1];
      chTitle = m1[2] ? m1[2].trim() : `${isFrench ? 'Chapitre' : 'Chapter'} ${chNumStr}`;
    } else {
      const m2 = cleanLine.match(r2);
      // roman numerals or headers but not inside general paragraphs
      if (m2 && cleanLine.length < 120 && i > 0 && lines[i-1].trim() === '') {
        matched = true;
        chNumStr = m2[1];
        chTitle = m2[2].trim();
      }
    }

    if (matched && cleanLine.length < 150) { 
      if (currentChapter) {
        currentChapter.endIndex = charAccumulator - 1;
        currentChapter.charCount = Math.max(0, currentChapter.endIndex - currentChapter.startIndex);
        currentChapter.text = text.substring(currentChapter.startIndex, currentChapter.endIndex);
        chapters.push(currentChapter as DetectedChapter);
      }

      currentChapter = {
        id: `ch-local-${chapters.length + 1}-${Math.random().toString(36).substring(2, 6)}`,
        number: chapters.length + 1,
        title: chTitle || `${isFrench ? 'Chapitre' : 'Chapter'} ${chapters.length + 1}`,
        startIndex: charAccumulator,
      };
    }

    charAccumulator += originalLineLength;
  }

  // Handle final raw open chapter
  if (currentChapter) {
    currentChapter.endIndex = text.length;
    currentChapter.charCount = Math.max(0, currentChapter.endIndex - currentChapter.startIndex);
    currentChapter.text = text.substring(currentChapter.startIndex, currentChapter.endIndex);
    chapters.push(currentChapter as DetectedChapter);
  }

  // Fallback: If we found no clear chapter transitions (< 2 chapters), partition logically
  if (chapters.length < 2) {
    const desiredChunkSize = Math.max(10000, Math.floor(text.length / 8)); // 8 logical chunks by default
    const totalLength = text.length;
    const numChunks = Math.max(1, Math.ceil(totalLength / desiredChunkSize));
    const fallbackChapters: DetectedChapter[] = [];

    for (let c = 0; c < numChunks; c++) {
      const start = c * desiredChunkSize;
      const end = Math.min((c + 1) * desiredChunkSize, totalLength);
      fallbackChapters.push({
        id: `ch-chunk-${c + 1}`,
        number: c + 1,
        title: isFrench ? `Partie ${c + 1}` : `Part ${c + 1}`,
        startIndex: start,
        endIndex: end,
        text: text.substring(start, end),
        charCount: end - start
      });
    }
    return fallbackChapters;
  }

  // Clean small chapters/headers false positives (e.g. less than 300 chars)
  const filteredChapters = chapters.filter(ch => ch.charCount > 300);
  if (filteredChapters.length >= 2) {
    // Correct indices to keep complete continuity
    for (let j = 0; j < filteredChapters.length; j++) {
      filteredChapters[j].number = j + 1;
      filteredChapters[j].startIndex = j === 0 ? 0 : filteredChapters[j-1].endIndex;
      filteredChapters[j].endIndex = j === filteredChapters.length - 1 ? text.length : filteredChapters[j+1].startIndex;
      filteredChapters[j].charCount = filteredChapters[j].endIndex - filteredChapters[j].startIndex;
      filteredChapters[j].text = text.substring(filteredChapters[j].startIndex, filteredChapters[j].endIndex);
    }
    return filteredChapters;
  }

  return chapters;
};
