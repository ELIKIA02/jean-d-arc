import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
// @ts-expect-error - Vite handles ?url suffix dynamically
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up local worker via Vite's asset bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const useFileParser = () => {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = async (file: File): Promise<{ text: string; pages: number; title: string; author: string }> => {
    setParsing(true);
    setError(null);
    let extractedText = '';
    let pageCount = 1;
    let title = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
    let author = '';

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        pageCount = pdf.numPages;
        
        let fullText = [];
        // Extract up to 100 pages of text to prevent browser memory freezes or excessive tokens
        const pagesToParse = Math.min(pageCount, 120);
        for (let i = 1; i <= pagesToParse; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText.push(pageText);
        }
        extractedText = fullText.join('\n\n');
        
        // Simple regex heuristic for Title/Author extraction
        const headerSnippet = extractedText.substring(0, 1000);
        const byMatch = headerSnippet.match(/(?:by|par)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
        if (byMatch && byMatch[1]) {
          author = byMatch[1].trim();
        }
      } 
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
        // Estimate 1 page per 1800 characters
        pageCount = Math.max(1, Math.ceil(extractedText.length / 1800));
      } 
      else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.onerror = () => reject(new Error('Erreur de lecture du fichier texte'));
          reader.readAsText(file);
        });
        pageCount = Math.max(1, Math.ceil(extractedText.length / 1800));
      } 
      else {
        throw new Error('Format de fichier invalide. Veuillez téléverser un PDF, DOCX, TXT ou MD.');
      }

      if (extractedText.trim().length === 0) {
        throw new Error('Le fichier est vide ou sa protection empêche l\'extraction du texte.');
      }

      setParsing(false);
      return {
        text: extractedText,
        pages: pageCount,
        title: title,
        author: author,
      };

    } catch (err: any) {
      console.error('File parsing error:', err);
      const msg = err.message || 'Impossible d\'analyser le fichier. Assurez-vous qu\'il n\'est pas corrompu ou protégé.';
      setError(msg);
      setParsing(false);
      throw new Error(msg);
    }
  };

  return { parseFile, parsing, error };
};
