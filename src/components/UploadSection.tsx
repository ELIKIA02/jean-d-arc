import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Settings2, Sliders, ChevronDown, ChevronUp, FileText, Info, Loader2, Sparkles } from 'lucide-react';
import { useFileParser } from '../hooks/useFileParser';
import { ConfigExtrait, LivreMetadata } from '../types';
import { getLangue, getMistralKey } from '../utils/storage';
import { detectChaptersLocally, DetectedChapter } from '../utils/chapterDetector';

interface UploadSectionProps {
  onExtract: (fileText: string, config: ConfigExtrait, metadata: LivreMetadata) => void;
  loading: boolean;
  appError: string | null;
  onSetError: (err: string | null) => void;
  lang: 'FR' | 'EN';
}

export default function UploadSection({
  onExtract,
  loading,
  appError,
  onSetError,
  lang,
}: UploadSectionProps) {
  const isFrench = lang === 'FR';
  const { parseFile, parsing, error: parserError } = useFileParser();
  
  // File state
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    text: string;
    charCount: number;
  } | null>(null);

  // Book Metadata state
  const [titre, setTitre] = useState('');
  const [auteur, setAuteur] = useState('');
  const [chapitre, setChapitre] = useState('');
  const [pagesRange, setPagesRange] = useState('');
  const [estimatedPages, setEstimatedPages] = useState<number>(0);

  // Chapter Detection and selection state parameters
  const [chapters, setChapters] = useState<DetectedChapter[]>([]);
  const [chapterMode, setChapterMode] = useState<'all' | 'single'>('all');
  const [singleChapterId, setSingleChapterId] = useState<string>('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [analyzingBook, setAnalyzingBook] = useState(false);

  // Extraction Slider & Selection Configuration
  const [scope, setScope] = useState<'chapitre' | 'livre'>('livre');
  const [nombre, setNombre] = useState<number>(5);
  const [extractionLang, setExtractionLang] = useState<'FR' | 'EN'>(lang);
  
  // Advanced options panel state
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced elements
  const [themes, setThemes] = useState<string[]>(['sagesse', 'philosophie']);
  const [charLimits, setCharLimits] = useState<[number, number]>([40, 1000]);
  const [scoreMin, setScoreMin] = useState<number>(7);
  const [tonalite, setTonalite] = useState<'Neutre' | 'Inspirant' | 'Provocant' | 'Calme'>('Inspirant');
  const [typeExtraction, setTypeExtraction] = useState<'rapide' | 'approfondie'>('approfondie');
  const [extractionMode, setExtractionMode] = useState<'auto' | 'manual'>('auto');

  // Drag and drop focus visual state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handles slider boundary adjustments when changing scope
  const handleScopeChange = (newScope: 'chapitre' | 'livre') => {
    setScope(newScope);
    if (newScope === 'chapitre') {
      setNombre(Math.min(nombre, 7));
    } else {
      setNombre(Math.max(nombre, 5));
    }
  };

  // Drag listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle files dropped
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    onSetError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      await handleFileProcess(droppedFile);
    }
  };

  // Handle file input select click
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      await handleFileProcess(selectedFile);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileProcess = async (file: File) => {
    try {
      const sizeStr = formatBytes(file.size);
      const parsedValues = await parseFile(file);
      
      setFileDetails({
        name: file.name,
        size: sizeStr,
        text: parsedValues.text,
        charCount: parsedValues.text.length,
      });

      // Update metadata fields from parsed results
      let initialTitle = parsedValues.title || file.name.split('.')[0];
      let initialAuthor = parsedValues.author || '';
      
      setTitre(initialTitle);
      setAuteur(initialAuthor);
      setEstimatedPages(parsedValues.pages);
      setPagesRange(`1-${parsedValues.pages}`);
      setChapitre(isFrench ? 'Chapitre 1' : 'Chapter 1');

      // Segment book into chapters locally
      const localChapters = detectChaptersLocally(parsedValues.text, isFrench);
      setChapters(localChapters);
      if (localChapters.length > 0) {
        setSingleChapterId(localChapters[0].id);
      }

      // Trigger server-side book analysis for dynamic author and structural detection
      setAnalyzingBook(true);
      try {
        const response = await fetch('/api/analyze-book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: parsedValues.text,
            mistralApiKey: getMistralKey() || '',
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.title) {
            setTitre(result.title);
            initialTitle = result.title;
          }
          if (result.author) {
            setAuteur(result.author);
            initialAuthor = result.author;
          }
          
          if (result.detectedChapters && result.detectedChapters.length > 0 && localChapters.length > 0) {
            // Refine local chapter titles with those detected by the AI model
            setChapters(prev => {
              const updated = [...prev];
              for (let i = 0; i < Math.min(updated.length, result.detectedChapters.length); i++) {
                updated[i].title = result.detectedChapters[i];
              }
              return updated;
            });
            setSingleChapterId(localChapters[0].id);
          }
        }
      } catch (e) {
        console.warn('Silent fallback: AI Book analyzer unavailable, relying on clean local regex engine.', e);
      } finally {
        setAnalyzingBook(false);
      }

      // ⚡ Improvement 1: Lancement automatique de l'extraction après téléversement (si mode auto activé)
      if (extractionMode === 'auto') {
        const activeChapters = localChapters;
        const combinedText = activeChapters.map(ch => ch.text).join('\n\n');
        const finalMetadata: LivreMetadata = {
          titre: initialTitle,
          auteur: initialAuthor || (isFrench ? "Inconnu" : "Unknown"),
          chapitre: isFrench ? "Ouvrage complet" : "Entire book",
          pagesRange: `1-${parsedValues.pages}`,
          totalChars: combinedText.length,
          fileName: file.name,
          fileSize: sizeStr,
          estimatedPages: parsedValues.pages,
        };

        const finalConfig: ConfigExtrait = {
          scope: 'livre',
          nombre,
          langue: extractionLang,
          themes,
          charLimits,
          scoreMin,
          tonalite,
          typeExtraction,
        };

        onExtract(combinedText, finalConfig, finalMetadata);
      }
      
    } catch (err: any) {
      onSetError(err.message || 'Erreur lors du traitement du fichier.');
    }
  };

  // Toggle checklist themes
  const handleThemeToggle = (theme: string) => {
    if (themes.includes(theme)) {
      setThemes(themes.filter(t => t !== theme));
    } else {
      setThemes([...themes, theme]);
    }
  };

  // Handle finalize submit button
  const handleTriggerExtract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileDetails || !fileDetails.text) {
      onSetError(isFrench 
        ? "Veuillez téléverser d'abord un fichier de livre valide (.pdf, .docx, .txt, .md)."
        : "Please upload a valid book file (.pdf, .docx, .txt, .md) first."
      );
      return;
    }

    const activeChapters = chapterMode === 'all'
      ? chapters
      : chapters.filter(ch => ch.id === singleChapterId);

    if (activeChapters.length === 0) {
      onSetError(isFrench 
        ? "Veuillez sélectionner au moins un chapitre/section à analyser."
        : "Please select at least one chapter/section to analyze."
      );
      return;
    }

    // Sort chapters by order of appearance
    const sortedChapters = [...activeChapters].sort((a, b) => a.number - b.number);
    const combinedText = sortedChapters.map(ch => ch.text).join('\n\n');

    // Automatically calculate a target chapter name for metadata formatting
    let finalChapterLabel = chapitre;
    if (!chapitre || chapitre.trim() === '' || chapitre === 'Chapitre 1' || chapitre === 'Chapter 1' || chapitre === 'Ouvrage entier' || chapitre === 'Entire book') {
      if (sortedChapters.length === chapters.length) {
        finalChapterLabel = isFrench ? "Ouvrage complet" : "Entire book";
      } else if (sortedChapters.length === 1) {
        finalChapterLabel = sortedChapters[0].title;
      } else {
        const listStr = sortedChapters.map(ch => ch.title).join(', ');
        finalChapterLabel = listStr.length > 50 ? listStr.substring(0, 47) + '...' : listStr;
      }
    }

    const fullMetadata: LivreMetadata = {
      titre: titre || fileDetails.name.split('.')[0],
      auteur: auteur || (isFrench ? "Inconnu" : "Unknown"),
      chapitre: finalChapterLabel,
      pagesRange: pagesRange || `1-${estimatedPages}`,
      totalChars: combinedText.length,
      fileName: fileDetails.name,
      fileSize: fileDetails.size,
      estimatedPages: estimatedPages,
    };

    const finalConfig: ConfigExtrait = {
      scope: sortedChapters.length === 1 ? 'chapitre' : 'livre',
      nombre,
      langue: extractionLang,
      themes,
      charLimits,
      scoreMin,
      tonalite,
      typeExtraction,
    };

    onExtract(combinedText, finalConfig, fullMetadata);
  };

  // Theme list helper
  const availableThemes = [
    { id: 'sagesse', labelFr: 'Sagesse', labelEn: 'Wisdom', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'amour', labelFr: 'Amour', labelEn: 'Love', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    { id: 'humour', labelFr: 'Humour', labelEn: 'Wit / Humour', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: 'intrigue', labelFr: 'Intrigue / Drame', labelEn: 'Intrigue', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { id: 'philosophie', labelFr: 'Philosophie', labelEn: 'Philosophy', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* SECTION HEADER CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-white/70 p-6 shadow-md backdrop-blur-md dark:bg-zinc-900/80 dark:border-zinc-800">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-gold text-9xl select-none leading-none">⚜️</div>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div>
            <span className="font-serif text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1">
              <Sparkles size={11} className="animate-spin-slow" />
              {isFrench ? "PREMIÈRE ÉTAPE" : "FIRST STEP"}
            </span>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-royal dark:text-gold mt-1">
              {isFrench ? "Téléverser votre Ouvrage" : "Upload your Book"}
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl mt-1 dark:text-zinc-400">
              {isFrench 
                ? "Chargez vos fichiers PDF, Word ou texte brut. Notre algorithme en extrait le texte et structure les métadonnées automatiquement." 
                : "Import your PDF, DOCX, TXT, or markdown files. Our algorithm extracts plain text and organizes book details."}
            </p>
          </div>
          
          <button
            id="trigger-file-select-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg bg-royal hover:bg-royal-dark text-white font-serif font-bold text-sm uppercase px-5 py-3 border border-gold/35 shadow-md hover:shadow-lg transition-all dark:bg-gold dark:hover:bg-gold-hover dark:text-royal shrink-0"
          >
            <Upload size={16} />
            {isFrench ? "Choisir un fichier" : "Browse computer"}
          </button>
        </div>

        {/* WORKFLOW MODE SELECTOR */}
        <div className="mt-5 pt-4 border-t border-gold/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <div>
              <p className="font-serif font-bold text-xs text-royal dark:text-gold uppercase tracking-wider">
                {isFrench ? "Méthode d'analyse" : "Analysis Workflow"}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                {isFrench ? "Décidez comment déclencher la recherche de citations" : "Determine how to trigger quote hunting"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-royal/5 dark:bg-zinc-800/40 border border-gold/15 rounded-lg max-w-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setExtractionMode('auto')}
              className={`text-[10px] font-serif font-bold uppercase py-1.5 px-3.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                extractionMode === 'auto'
                  ? 'bg-royal text-white dark:bg-gold dark:text-royal shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-350'
              }`}
            >
              <span>🚀</span>
              <span>{isFrench ? "Mode Auto" : "Auto Mode"}</span>
            </button>
            <button
              type="button"
              onClick={() => setExtractionMode('manual')}
              className={`text-[10px] font-serif font-bold uppercase py-1.5 px-3.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                extractionMode === 'manual'
                  ? 'bg-royal text-white dark:bg-gold dark:text-royal shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-350'
              }`}
            >
              <span>🎯</span>
              <span>{isFrench ? "Mode Manuel" : "Manual Mode"}</span>
            </button>
          </div>
        </div>

        {/* DRAG & DROP ZONE */}
        <div
          id="dropzone-area"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-gold bg-gold/5 shadow-inner scale-[0.99]' 
              : 'border-gold/30 bg-white/40 hover:bg-gold/5 dark:bg-zinc-900/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
          />

          {parsing ? (
            <div className="flex flex-col items-center py-4 space-y-3">
              <Loader2 className="animate-spin text-gold" size={40} />
              <div>
                <p className="font-serif font-bold text-royal dark:text-gold">
                  {isFrench ? "Décryptage en cours..." : "Parsing file details..."}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {isFrench ? "Extraction des caractères et calcul de structure" : "Scanning characters and layout structures"}
                </p>
              </div>
            </div>
          ) : fileDetails ? (
            <div className="flex items-center gap-4 text-left p-2">
              <span className="text-4xl">📖</span>
              <div>
                <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide text-sm truncate max-w-md">
                  {fileDetails.name}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono dark:text-zinc-400">
                  {fileDetails.size} • ~{estimatedPages} {isFrench ? "pages calculées" : "estimated pages"} • {fileDetails.charCount.toLocaleString()} {isFrench ? "caractères" : "characters"}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/55 rounded-full px-2 py-0.5 mt-2">
                  ✓ {isFrench ? "PRÊT POUR EXTRACTION" : "LITERARY TEXT CAPTURED"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-zinc-700 font-serif font-medium dark:text-zinc-300">
                  {isFrench ? "Déposez votre livre ici, ou cliquez pour parcourir" : "Drag & drop your file here, or click to browse"}
                </p>
                <p className="text-xs text-zinc-450 mt-1.5 leading-relaxed">
                  PDF, DOCX, TXT ou MD (Max. 50 MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ERROR VIEWER */}
        {(parserError || appError) && (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-red-50 p-3.5 border border-red-200 text-xs text-red-600 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
            <Info size={16} className="shrink-0" />
            <p className="leading-relaxed">
              <strong>{isFrench ? "Incident : " : "Notice: "}</strong> {parserError || appError}
            </p>
          </div>
        )}
      </div>

      {/* METADATA & CONFIGURATION FORM */}
      <form onSubmit={handleTriggerExtract} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL 1: BOOK DETAILS / IDENTITÉ */}
        <div className="rounded-2xl border border-gold/30 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:bg-zinc-900/80 dark:border-zinc-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-royal dark:text-gold flex items-center justify-between border-b border-gold/15 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-gold" />
                {isFrench ? "Identité du Livre" : "Book Metadata"}
              </div>
              {analyzingBook && (
                <span className="text-[9px] bg-gold/15 text-royal dark:text-gold flex items-center gap-1 rounded-md px-2 py-0.5 border border-gold/25 animate-pulse">
                  <Loader2 className="animate-spin" size={10} />
                  {isFrench ? "Analyse IA..." : "AI Sync..."}
                </span>
              )}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                  {isFrench ? "Titre de l'ouvrage" : "Book Title"}
                </label>
                <input
                  id="book-metadata-title-input"
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  required
                  placeholder={isFrench ? "Ex: Les Misérables" : "Ex: Pride and Prejudice"}
                  className="w-full rounded-lg border border-gold/25 bg-white/50 py-2 px-3 text-xs outline-hidden focus:border-royal dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#A47E1F] dark:text-gold font-semibold mb-1 flex items-center gap-1">
                  ✍️ {isFrench ? "Auteur(e) " : "Author "}
                  {analyzingBook && <span className="text-[9px] font-normal italic lowercase">({isFrench ? "détection..." : "detecting..."})</span>}
                </label>
                <input
                  id="book-metadata-author-input"
                  type="text"
                  value={auteur}
                  onChange={(e) => setAuteur(e.target.value)}
                  required
                  placeholder={isFrench ? "Ex: Victor Hugo" : "Ex: Jane Austen"}
                  className="w-full rounded-lg border border-gold/30 bg-white/70 py-2 px-3 text-xs outline-hidden focus:border-royal dark:bg-zinc-800 font-bold text-royal dark:text-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                    {isFrench ? "Chapitre cible" : "Target Chapter"}
                  </label>
                  <input
                    id="book-metadata-chapter-input"
                    type="text"
                    value={chapitre}
                    onChange={(e) => setChapitre(e.target.value)}
                    placeholder="Ex: Ch. 3"
                    className="w-full rounded-lg border border-gold/25 bg-white/50 py-2 px-3 text-xs outline-hidden focus:border-royal dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                    {isFrench ? "Pages (Range)" : "Pages Range"}
                  </label>
                  <input
                    id="book-metadata-pagesrange-input"
                    type="text"
                    value={pagesRange}
                    onChange={(e) => setPagesRange(e.target.value)}
                    placeholder="Ex: 40-52"
                    className="w-full rounded-lg border border-gold/25 bg-white/50 py-2 px-3 text-xs outline-hidden focus:border-royal dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gold/15 pt-3">
            <p className="font-mono text-[9px] text-zinc-400 italic">
              * {isFrench ? "Ces informations seront embarquées dans l'affichage des cartes d'extraits et dans les exports finaux." : "These details tag with each quote and format perfectly in custom download assets."}
            </p>
          </div>
        </div>

        {/* PANEL 2: CHAPTERS SELECTION */}
        <div className="rounded-2xl border border-gold/30 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:bg-zinc-900/80 dark:border-zinc-800 flex flex-col justify-between min-h-[350px]">
          <div className="space-y-4 flex-1 flex flex-col">
            <h3 className="font-serif font-bold text-lg text-royal dark:text-gold flex items-center justify-between border-b border-gold/15 pb-2">
              <div className="flex items-center gap-2">
                <span>⚜️</span>
                {isFrench ? "Portée de l'analyse" : "Scope of Analysis"}
              </div>
            </h3>

            {!fileDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20">
                <span className="text-3xl mb-2 opacity-50">📑</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-serif leading-relaxed">
                  {isFrench 
                    ? "Importez un livre ou manuscrit ci-dessus pour définir la portée de l'analyse." 
                    : "Upload a book or manuscript above to define target scope."}
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4 justify-center">
                
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-royal/5 p-1 rounded-lg border border-gold/15 dark:bg-zinc-800/40">
                  <button
                    type="button"
                    onClick={() => {
                      setChapterMode('all');
                      setScope('livre');
                    }}
                    className={`text-xs py-2 rounded-md font-serif font-bold uppercase transition-all ${
                      chapterMode === 'all'
                        ? 'bg-royal text-white dark:bg-gold dark:text-royal shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    🚀 {isFrench ? "Tout l'ouvrage" : "Entire Book"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChapterMode('single');
                      setScope('chapitre');
                      if (chapters.length > 0 && !singleChapterId) {
                        setSingleChapterId(chapters[0].id);
                      }
                    }}
                    className={`text-xs py-2 rounded-md font-serif font-bold uppercase transition-all ${
                      chapterMode === 'single'
                        ? 'bg-royal text-white dark:bg-gold dark:text-royal shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    🎯 {isFrench ? "Chapitre ciblé" : "Single Chapter"}
                  </button>
                </div>

                {/* Conditional UI based on Mode */}
                {chapterMode === 'all' ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-gold/20 rounded-xl bg-gold/5 space-y-2 animate-fadeIn py-6">
                    <span className="text-2xl">📖</span>
                    <h4 className="font-serif font-bold text-royal dark:text-gold text-xs uppercase tracking-wider">
                      {isFrench ? "Extraction Globale" : "Global Extraction"}
                    </h4>
                    <p className="text-[11px] text-zinc-500 max-w-xs dark:text-zinc-400">
                      {isFrench 
                        ? `L'intelligence artificielle parcourra l'ensemble des ${chapters.length} chapitres détectés pour dégager les citations reines.`
                        : `The artificial intelligence will scan all ${chapters.length} segments to pinpoint crowning quotes.`}
                    </p>
                    <div className="text-[10px] font-mono text-gold-hover border border-gold/20 bg-gold/5 px-2.5 py-1 rounded-md">
                      ~ {Math.round(fileDetails.charCount / 6).toLocaleString()} {isFrench ? "mots au total" : "total words"}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center space-y-2.5 p-3 border border-gold/20 rounded-xl bg-gold/5 animate-fadeIn">
                    <label className="block text-xs font-serif uppercase tracking-wider text-zinc-550 font-bold">
                      🎯 {isFrench ? "Choisir le chapitre d'étude :" : "Select Studied Chapter:"}
                    </label>
                    <select
                      value={singleChapterId}
                      onChange={(e) => {
                        setSingleChapterId(e.target.value);
                        const match = chapters.find(c => c.id === e.target.value);
                        if (match) {
                          setChapitre(match.title);
                        }
                      }}
                      className="w-full rounded-lg border border-gold/25 bg-white py-2 px-3 text-xs outline-hidden focus:border-royal dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 font-serif font-semibold shadow-xs"
                    >
                      {chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title} (~{Math.round(ch.charCount / 6).toLocaleString()} {isFrench ? 'mots' : 'words'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-450 italic leading-relaxed">
                      💡 {isFrench 
                        ? "Idéal pour extraire des citations ultra-denses sur un passage précis d'un ouvrage."
                        : "Perfect for mining concentrated passages with targeted precision."}
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>

          <div className="border-t border-gold/15 pt-3">
            <p className="font-mono text-[9px] text-zinc-400 italic">
              * {isFrench 
                ? `Mode actuel : ${chapterMode === 'all' ? "Analyse complète du livre" : "Analyse d'un chapitre clé"}`
                : `Current scope: ${chapterMode === 'all' ? "Full volume scanning" : "Isolated passage targeting"}`}
            </p>
          </div>
        </div>

        {/* PANEL 3: PARAMS OF EXTRACTION */}
        <div className="rounded-2xl border border-gold/30 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:bg-zinc-900/80 dark:border-zinc-800 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-royal dark:text-gold flex items-center justify-between border-b border-gold/15 pb-2">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-gold" />
                {isFrench ? "Paramètres" : "Settings"}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  id="target-lang-fr-btn"
                  onClick={() => setExtractionLang('FR')}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${extractionLang === 'FR' ? 'bg-royal text-white dark:bg-gold dark:text-royal' : 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500'}`}
                >
                  FR
                </button>
                <button
                  type="button"
                  id="target-lang-en-btn"
                  onClick={() => setExtractionLang('EN')}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${extractionLang === 'EN' ? 'bg-royal text-white dark:bg-gold dark:text-royal' : 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500'}`}
                >
                  EN
                </button>
              </div>
            </h3>

            {/* PRESETS */}
            <div className="space-y-2 pb-1">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold mb-1">
                ⚡ Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'light', labelFr: '🍃 Léger (5)', labelEn: '🍃 Light (5)', nombre: 5, tonalite: 'Inspirant', typeExtraction: 'rapide' },
                  { id: 'intense', labelFr: '🔥 Intense (10)', labelEn: '🔥 Intense (10)', nombre: 10, tonalite: 'Provocant', typeExtraction: 'approfondie' },
                  { id: 'social', labelFr: '📱 BookTok', labelEn: '📱 BookTok', nombre: 7, tonalite: 'Inspirant', typeExtraction: 'approfondie' },
                ].map((p) => {
                  const isActive = nombre === p.nombre && tonalite === p.tonalite && typeExtraction === p.typeExtraction;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setNombre(p.nombre);
                        setTonalite(p.tonalite as any);
                        setTypeExtraction(p.typeExtraction as any);
                      }}
                      className={`py-1.5 px-1 rounded-lg border text-[10px] font-serif font-bold uppercase transition-all flex items-center justify-center text-center leading-tight ${
                        isActive
                          ? 'bg-royal border-gold text-white dark:bg-gold dark:text-royal'
                          : 'bg-zinc-50 border-zinc-250 text-zinc-650 hover:bg-gold/10 dark:bg-zinc-805/30 dark:border-zinc-700'
                      }`}
                    >
                      {isFrench ? p.labelFr : p.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-serif uppercase tracking-wider text-zinc-500 font-semibold">
                <span>📊 {isFrench ? "Nombre d'Extraits" : "Quantity of Excerpts"}</span>
                <span className="font-mono text-royal font-bold text-sm bg-gold/15 dark:text-gold rounded-md px-2 py-0.5">{nombre}</span>
              </div>
              <input
                id="number-extracts-slider"
                type="range"
                min="1"
                max={chapterMode === 'single' ? "7" : "15"}
                value={nombre}
                onChange={(e) => setNombre(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-gold my-2"
              />
              <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                <span>1</span>
                <span>{chapterMode === 'single' ? '7 (max ch.)' : '15 (max list)'}</span>
              </div>
            </div>

            {/* ADVANCED OPTION TOGGLE */}
            <div className="border-t border-gold/15 pt-3">
              <button
                type="button"
                id="advanced-panel-toggle-btn"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-serif font-bold text-gold uppercase hover:text-royal-hover dark:hover:text-gold-hover transition-all"
              >
                <Settings2 size={13} />
                {isFrench ? "Options de Style" : "Style Options"}
                {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showAdvanced && (
                <div className="space-y-4 mt-3 p-3 rounded-xl bg-gold/5 border border-gold/15 animate-fadeIn">
                  
                  {/* Themes checkboxes */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-serif uppercase tracking-widest text-zinc-500 font-semibold">
                      🏷️ {isFrench ? "Thèmes prioritaires" : "Priority Themes"}
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {availableThemes.map((thm) => {
                        const active = themes.includes(thm.id);
                        return (
                          <button
                            type="button"
                            key={thm.id}
                            id={`theme-pill-${thm.id}`}
                            onClick={() => handleThemeToggle(thm.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                              active 
                                ? 'bg-royal border-gold text-white dark:bg-gold dark:text-royal' 
                                : 'bg-white border-zinc-250 text-zinc-650 hover:bg-gold/10 dark:bg-zinc-800 dark:border-zinc-700'
                            }`}
                          >
                            {isFrench ? thm.labelFr : thm.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Length limits */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-serif uppercase tracking-widest text-zinc-500 font-semibold">
                      📏 {isFrench ? "Longueur" : "Char Boundaries"}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[8px] text-zinc-400 font-mono">Min</span>
                        <input
                          id="min-char-limit-input"
                          type="number"
                          value={charLimits[0]}
                          onChange={(e) => setCharLimits([parseInt(e.target.value) || 20, charLimits[1]])}
                          className="w-full rounded-md border border-gold/20 bg-white py-1 pl-6 pr-1 text-[11px] font-mono dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[8px] text-zinc-400 font-mono">Max</span>
                        <input
                          id="max-char-limit-input"
                          type="number"
                          value={charLimits[1]}
                          onChange={(e) => setCharLimits([charLimits[0], parseInt(e.target.value) || 400])}
                          className="w-full rounded-md border border-gold/20 bg-white py-1 pl-6 pr-1 text-[11px] font-mono dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quality score */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-serif uppercase tracking-widest text-zinc-550 font-semibold">
                      <span>⭐ {isFrench ? "Score min." : "Min Quality"}</span>
                      <span className="font-mono text-royal font-bold bg-gold/10 dark:text-gold rounded px-1">{scoreMin}/10</span>
                    </div>
                    <input
                      id="min-score-slider"
                      type="range"
                      min="5"
                      max="10"
                      value={scoreMin}
                      onChange={(e) => setScoreMin(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-gold animate-fadeIn"
                    />
                  </div>

                  {/* Tone */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-serif uppercase tracking-widest text-zinc-550 font-semibold">
                      🎭 {isFrench ? "Tonalité" : "Creative Tone"}
                    </label>
                    <select
                      id="target-tone-select"
                      value={tonalite}
                      onChange={(e) => setTonalite(e.target.value as any)}
                      className="w-full rounded-md border border-gold/25 bg-white p-1.5 text-[11px] dark:bg-zinc-800 dark:text-zinc-200 text-zinc-800"
                    >
                      <option value="Neutre">⚖️ {isFrench ? "Neutre" : "Neutral"}</option>
                      <option value="Inspirant">✨ {isFrench ? "Inspirant" : "Inspirational"}</option>
                      <option value="Provocant">🔥 {isFrench ? "Provocant" : "Provocative"}</option>
                      <option value="Calme">🍃 {isFrench ? "Zen" : "Calm"}</option>
                    </select>
                  </div>

                  {/* Speed */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-serif uppercase tracking-widest text-zinc-500 font-semibold">
                      ⚡ {isFrench ? "Type d'analyse" : "Analysis Strategy"}
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        id="analysis-rapide-btn"
                        onClick={() => setTypeExtraction('rapide')}
                        className={`flex-1 rounded-md py-1 border transition-all ${typeExtraction === 'rapide' ? 'bg-royal text-white border-gold dark:bg-gold dark:text-royal font-bold' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}
                      >
                        {isFrench ? "Rapide" : "Fast"}
                      </button>
                      <button
                        type="button"
                        id="analysis-approfondie-btn"
                        onClick={() => setTypeExtraction('approfondie')}
                        className={`flex-1 rounded-md py-1 border transition-all ${typeExtraction === 'approfondie' ? 'bg-royal text-white border-gold dark:bg-gold dark:text-royal font-bold' : 'bg-white text-zinc-500 dark:bg-zinc-800'}`}
                      >
                        {isFrench ? "Approfondie" : "Deep"}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gold/15">
            <button
              type="submit"
              id="submit-extraction-btn"
              disabled={loading || !fileDetails}
              className={`w-full font-serif text-sm uppercase tracking-wider font-extrabold py-3 border-2 border-gold rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                loading || !fileDetails 
                  ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700' 
                   : 'bg-gold hover:bg-gold-hover text-royal animate-pulse-gold hover:scale-[1.01]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-royal" size={15} />
                  <span>{isFrench ? "EXTRACTION DE LA GLOIRE..." : "EXTRACTING MASTERPIECES..."}</span>
                </>
              ) : (
                <>
                  <span>⚜️</span>
                  <span>{isFrench ? "Extraire les pépites" : "Extract gems"}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
      
    </div>
  );
}
