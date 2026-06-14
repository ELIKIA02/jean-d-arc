import { useState, useEffect } from 'react';
import { HelpCircle, Sparkles, Settings, ArrowRight, Loader2, X, RefreshCw, Volume2, Bookmark, CheckSquare } from 'lucide-react';

import Sidebar from './components/Sidebar';
import UploadSection from './components/UploadSection';
import ExtractSection from './components/ExtractSection';
import ExportPanel from './components/ExportPanel';
import SettingsModal from './components/SettingsModal';
import Dashboard from './components/Dashboard';
import QuoteCardGenerator from './components/QuoteCardGenerator';

import { Extrait, LivreMetadata, ConfigExtrait, HistoriqueItem, AppStateStatus } from './types';
import { 
  getHistorique, 
  getFavoris, 
  saveHistorique, 
  saveFavoris, 
  getLangue, 
  getTheme, 
  getMistralKey 
} from './utils/storage';

export default function App() {
  // Global App States
  const [extraits, setExtraits] = useState<Extrait[]>([]);
  const [metadata, setMetadata] = useState<LivreMetadata | null>(null);
  
  const [state, setAppState] = useState<AppStateStatus>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  // Selections
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Persistence States synced with Storage
  const [history, setHistory] = useState<HistoriqueItem[]>([]);
  const [favorites, setFavorites] = useState<Extrait[]>([]);
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [theme, setTheme] = useState<'clair' | 'sombre' | 'medieval'>('medieval');
  const [viewMode, setViewMode] = useState<'extraits' | 'dashboard'>('extraits');

  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activeQuoteForCard, setActiveQuoteForCard] = useState<Extrait | null>(null);

  // Synchronise custom setups on first mount
  useEffect(() => {
    setHistory(getHistorique());
    setFavorites(getFavoris());
    setLang(getLangue());
    
    const savedTheme = getTheme();
    setTheme(savedTheme);

    // Apply proper visual body stylesheet classes
    const bodyClass = document.body.classList;
    bodyClass.remove('light', 'dark', 'medieval');
    if (savedTheme === 'clair') bodyClass.add('light');
    else if (savedTheme === 'sombre') bodyClass.add('dark');
    else bodyClass.add('medieval');
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Reset visual themes after saving settings
  const handleSettingsSaved = () => {
    setLang(getLangue());
    setTheme(getTheme());
    showToast(getLangue() === 'FR' ? "✓ Paramètres enregistrés !" : "✓ Settings applied!");
  };

  // Bulk selector actions
  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleSelectCard = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  // Favorites trigger
  const handleToggleFavorite = (extraitId: string) => {
    const isAlreadyFav = favorites.some(fav => fav.id === extraitId);
    let updated: Extrait[];

    if (isAlreadyFav) {
      updated = favorites.filter(fav => fav.id !== extraitId);
      showToast(lang === 'FR' ? "Retiré des favoris" : "Removed from favorites");
    } else {
      const match = extraits.find(ext => ext.id === extraitId);
      if (match) {
        updated = [...favorites, match];
        showToast(lang === 'FR' ? "✨ Ajouté aux favoris !" : "✨ Saved to favorites!");
      } else {
        // Fallback search through previous histories if not currently displayed
        let foundFromHistory: Extrait | undefined;
        for (const item of history) {
          const itemMatch = item.extraits.find(e => e.id === extraitId);
          if (itemMatch) {
            foundFromHistory = itemMatch;
            break;
          }
        }
        if (foundFromHistory) {
          updated = [...favorites, foundFromHistory];
          showToast(lang === 'FR' ? "✨ Ajouté aux favoris !" : "✨ Saved to favorites!");
        } else {
          updated = favorites;
        }
      }
    }

    setFavorites(updated);
    saveFavoris(updated);
  };

  // Selector load item from sidebar history list
  const handleSelectHistoryItem = (item: HistoriqueItem) => {
    setExtraits(item.extraits);
    setMetadata(item.metadata);
    setSelectedIds(new Set(item.extraits.map(e => e.id)));
    setAppState('SUCCESS');
    setViewMode('extraits');
    setError(null);
    showToast(lang === 'FR' 
      ? `📖 Ouvrage réactivé : ${item.metadata.titre}` 
      : `📖 Reopened: ${item.metadata.titre}`
    );
    if (sidebarOpen) setSidebarOpen(false); // Close sidebar on mobile drawer after click
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    saveHistorique(updated);
    showToast(lang === 'FR' ? "Livre retiré de l'historique" : "Removed from history");
  };

  // Export Favorites bulk downloadable file
  const handleExportFavorites = () => {
    if (favorites.length === 0) return;
    
    let content = `========================================================\n`;
    content += `        ⚜️ COUPS DE CŒURS LITTÉRAIRES — JEAN D'ARC\n`;
    content += `========================================================\n\n`;
    content += `Sélection de coups de cœur archivés le : ${new Date().toLocaleDateString()}\n\n`;

    favorites.forEach((fav, i) => {
      content += `${i + 1}. « ${fav.citation} »\n`;
      content += `📍 ${fav.auteur || 'Inconnu'} — ${fav.titreLivre || 'Livre'}${fav.page ? `, ${fav.page}` : ''}\n`;
      content += `Thème: ${fav.theme.toUpperCase()} | Score original: ${fav.score}/10\n`;
      content += `--------------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jean-d-arc-favoris.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(lang === 'FR' ? "Favoris exportés au format TXT !" : "Favorites exported successfully!");
  };

  // COPY TRIGGERS FOR SINGLE ELEMENTS (CARDS OVERLAY)
  const handleCopySingle = (extrait: Extrait) => {
    const textFormat = `« ${extrait.citation} »\n\n— ${extrait.auteur || metadata?.auteur || 'Anonyme'}${extrait.page ? `, ${extrait.page}` : ''}`;
    navigator.clipboard.writeText(textFormat);
    showToast(lang === 'FR' ? "✓ Citation copiée !" : "✓ Excerpt copied!");
  };

  const handleShareSingle = (extrait: Extrait) => {
    const textFormat = `« ${extrait.citation} »\n— ${extrait.auteur || metadata?.auteur || 'Anonyme'}${extrait.page ? `, ${extrait.page}` : ''}`;
    if (navigator.share) {
      navigator.share({
        title: "Jean d'Arc Pépite littéraire",
        text: textFormat,
        url: window.location.href,
      }).catch(err => {
        navigator.clipboard.writeText(textFormat);
        showToast(lang === 'FR' ? "✓ Lien copié !" : "✓ Copy link fallback succeed!");
      });
    } else {
      navigator.clipboard.writeText(textFormat);
      showToast(lang === 'FR' ? "✓ Citation copiée !" : "✓ Copied!");
    }
  };

  const handleCopyBatch = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(lang === 'FR' ? "✓ Sélection groupée copiée !" : "✓ Selection batch copied!");
  };

  const handleSaveNote = (id: string, noteText: string) => {
    // 1. Update active extraits
    const updatedExtraits = extraits.map(ext => ext.id === id ? { ...ext, note: noteText } : ext);
    setExtraits(updatedExtraits);

    // 2. Update item in history
    if (metadata) {
      const updatedHistory = history.map(item => {
        if (item.metadata.titre === metadata.titre && item.metadata.auteur === metadata.auteur) {
          return {
            ...item,
            extraits: item.extraits.map(ext => ext.id === id ? { ...ext, note: noteText } : ext)
          };
        }
        return item;
      });
      setHistory(updatedHistory);
      saveHistorique(updatedHistory);
    }

    // 3. Update in favorites
    const updatedFavorites = favorites.map(fav => fav.id === id ? { ...fav, note: noteText } : fav);
    setFavorites(updatedFavorites);
    saveFavoris(updatedFavorites);

    showToast(lang === 'FR' ? "Note enregistrée !" : "Note updated!");
  };

  // CORE AI TRIGGER: CALL MISTRAL / GEMINI PROXY ENDPOINT
  const handleExtractSequence = async (fileText: string, config: ConfigExtrait, meta: LivreMetadata) => {
    setAppState('PROCESSING');
    setError(null);
    setProgressPercent(15);
    
    // Simulate gradual incremental progress percentage calculations to satisfy user visual processing
    const progressInterval = setInterval(() => {
      setProgressPercent(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 450);

    try {
      const slicedText = fileText.slice(0, 60000); // Send first 60k chars to maintain great speed and token safety
      
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: slicedText,
          config,
          metadata: meta,
          mistralApiKey: getMistralKey(),
        }),
      });

      clearInterval(progressInterval);
      setProgressPercent(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur serveur (${response.status})`);
      }

      const responseData = await response.json();
      const rawExtraits = responseData.extraits || [];
      const engineName = responseData.engine || "Jean d'Arc AI";

      if (!Array.isArray(rawExtraits) || rawExtraits.length === 0) {
        throw new Error(lang === 'FR' 
          ? "Aucun extrait n'a pu être structuré par l'intelligence artificielle. Re-vérifiez le texte de votre livre ou augmentez la longueur."
          : "The AI returned an empty roster. Make sure the document content has readable words."
        );
      }

      // Format clean quotes with IDs and locations
      const formattedElements: Extrait[] = rawExtraits.map((item: any, idx) => ({
        id: `ext-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        citation: item.citation?.replace(/['"«»""]/g, '').trim() || '',
        page: item.page || meta.pagesRange || `p. ${idx * 3 + 2}`,
        chapitre: item.chapitre || meta.chapitre || '1',
        auteur: item.auteur || meta.auteur,
        titreLivre: item.titreLivre || meta.titre,
        score: parseInt(item.score) || 8,
        tags: Array.isArray(item.tags) ? item.tags : ['pepite', 'jeandarc'],
        theme: item.theme || 'sagesse',
        typeContenu: item.typeContenu || 'citation',
      }));

      setExtraits(formattedElements);
      setMetadata(meta);
      setSelectedIds(new Set(formattedElements.map(e => e.id)));
      setViewMode('extraits');
      setAppState('SUCCESS');
      showToast(lang === 'FR' 
        ? `✓ ${formattedElements.length} Pépites générées via ${engineName} !` 
        : `✓ Spotting completed via ${engineName}!`
      );

      // Save in history roster
      const newHistoryItem: HistoriqueItem = {
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        metadata: meta,
        config,
        extraits: formattedElements,
      };

      const freshHistory = [newHistoryItem, ...history.filter(h => h.metadata.titre !== meta.titre)].slice(0, 20);
      setHistory(freshHistory);
      saveHistorique(freshHistory);

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Extraction flow error:', err);
      setError(err.message || "Erreur indéterminée durant la communication avec l'intelligence artificielle.");
      setAppState('ERROR');
    }
  };

  const isFrench = lang === 'FR';

  return (
    <div className="min-h-screen bg-pattern pb-16 transition-colors duration-300">
      
      {/* SIDEBAR FOR FAVORITES AND PREVIOUS LOGS */}
      <Sidebar
        history={history}
        favorites={favorites}
        onSelectHistory={handleSelectHistoryItem}
        onDeleteHistory={handleDeleteHistoryItem}
        onRemoveFavorite={handleToggleFavorite}
        onExportFavorites={handleExportFavorites}
        onOpenSettings={() => setSettingsOpen(true)}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* CORE WRAPPER container containing left spacing allowance for sidebar */}
      <div className="relative md:pl-72 transition-all">
        
        {/* UPPER BRANDING HERO BANNER BAR */}
        <header className="border-b border-gold/15 bg-white/60 py-5 px-6 backdrop-blur-md dark:bg-zinc-950/50">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            
            {/* Left margin spacing spacer on mobile */}
            <div className="w-12 md:hidden"></div>

            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-spin-slow">⚜️</span>
              <div>
                <h1 className="font-serif text-xl font-extrabold tracking-widest text-royal dark:text-gold uppercase">
                  JEAN D'ARC
                </h1>
                <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  {isFrench ? "Archivage & Partage de Citations" : "Curator of Literary Masterpieces"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="header-toggle-dashboard"
                onClick={() => setViewMode(viewMode === 'dashboard' ? 'extraits' : 'dashboard')}
                className={`rounded-lg border px-3 py-1.5 text-xs font-serif font-bold uppercase transition-all flex items-center gap-1.5 ${
                  viewMode === 'dashboard'
                    ? 'border-gold bg-gold text-white dark:bg-gold dark:text-royal'
                    : 'border-gold/30 bg-gold/10 text-royal hover:bg-gold hover:text-white dark:text-zinc-300 dark:hover:text-royal'
                }`}
                title={isFrench ? "Tableau de Bord Littéraire" : "Literary Dashboard"}
              >
                <span>📊</span>
                <span className="hidden sm:inline">{isFrench ? "Analyses" : "Analytics"}</span>
              </button>

              <button
                id="header-settings-btn"
                onClick={() => setSettingsOpen(true)}
                className="rounded-lg border border-gold/30 bg-gold/10 hover:bg-gold p-2 text-royal hover:text-white dark:text-zinc-200 dark:hover:text-royal transition-all"
                title={isFrench ? "Paramètres" : "Settings"}
              >
                <Settings size={18} />
              </button>
            </div>

          </div>
        </header>

        {/* MAIN ROUTER VISUAL FLOW BODY */}
        <main className="mx-auto max-w-6xl px-6 pt-10 space-y-12">
          
          {/* THE DASHBOARD VIEW IF ACTIVE */}
          {viewMode === 'dashboard' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/40 rounded-xl p-3 border border-gold/15 dark:bg-zinc-900/40">
                <span className="text-xs text-zinc-500 font-serif italic">
                  📊 {isFrench ? "Tableau de bord de votre bibliothèque d'extraits" : "Cumulative metrics for your extracts library"}
                </span>
                <button
                  id="dashboard-back-to-reading"
                  onClick={() => setViewMode('extraits')}
                  className="px-4 py-2 text-xs rounded-lg border border-gold text-royal hover:bg-gold hover:text-white dark:text-gold dark:hover:text-royal font-bold font-serif uppercase tracking-widest transition-all"
                >
                  {isFrench ? "Retourner à la lecture" : "Back to reading"}
                </button>
              </div>
              <Dashboard
                history={history}
                favorites={favorites}
                currentBookExtraits={extraits}
                currentBookMetadata={metadata}
              />
            </div>
          ) : (
            <>
              {/* STATE 1: LOADING/PROGRESSING */}
              {state === 'PROCESSING' && (
                <div className="rounded-2xl border border-gold/30 bg-white/70 p-12 text-center shadow-md dark:bg-zinc-900/80 max-w-2xl mx-auto space-y-6">
                  <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
                    <Loader2 className="animate-spin text-gold absolute inset-0 h-full w-full-custom" size={96} />
                    <span className="text-3xl">⚜️</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-bold text-royal dark:text-gold uppercase tracking-wide animate-pulse">
                      {isFrench ? "Vidé de l'esprit, Orné de mots" : "Forging Masterpieces"}
                    </h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                      {isFrench 
                        ? "Jean d'Arc lit chaque phrase de votre livre et évalue son score d'impact pour capturer la gloire littéraire..." 
                        : "Reviewing text records, categorizing contents with high relevance score thresholds..."}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 max-w-md mx-auto">
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden border border-gold/15 dark:bg-zinc-805">
                      <div 
                        className="h-full bg-gold transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>{isFrench ? "Décryptage littéraire" : "Scanning metadata"}</span>
                      <span>{progressPercent}%</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gold/10 text-xs text-gold font-serif italic">
                    “ {isFrench ? "La poésie ne s'explique pas, elle se contemple." : "Poetry is not meant to be deciphered, but was forged to be felt."} ”
                  </div>
                </div>
              )}

              {/* STATE 2: ERROR VIEW BANNER */}
              {state === 'ERROR' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-2xl mx-auto space-y-4 dark:bg-red-950/20 dark:border-red-900">
                  <span className="text-4xl">⚠️</span>
                  
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-xl font-bold text-red-700 dark:text-red-400 uppercase">
                      {isFrench ? "Erreur de génération" : "Extraction Failed"}
                    </h3>
                    <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed max-w-lg mx-auto">
                      {error}
                    </p>
                  </div>

                  <div className="bg-white/40 dark:bg-zinc-900/40 p-4 rounded-lg text-left text-xs leading-relaxed max-w-md mx-auto space-y-1">
                    <b className="font-serif text-royal dark:text-gold block mb-1">🛠️ {isFrench ? "Pistes de résolution :" : "Troubleshooting points:"}</b>
                    <p>• {isFrench ? "Assurez-vous qu'une clé d'API valide est configurée dans l'icône ⚙️ si vous utilisez le moteur Mistral." : "Provide an authenticated Mistral API Key in Settings ⚙️ if running personal key."}</p>
                    <p>• {isFrench ? "Si le texte du livre est très long, privilégiez le scope [Chapitre actuel]." : "Try shrinking target book size to a localized Target Chapter."}</p>
                    <p>• {isFrench ? "Le document PDF contient peut-être uniquement des images scannées illisibles." : "Make sure the file type isn't a locked image-only document."}</p>
                  </div>

                  <button
                    id="error-return-to-upload-btn"
                    onClick={() => setAppState('IDLE')}
                    className="px-6 py-2.5 rounded-lg border border-red-300 hover:bg-white text-xs font-bold transition-all uppercase tracking-widest text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {isFrench ? "Retourner à l'import" : "Try import again"}
                  </button>
                </div>
              )}

              {/* STATE 3: IDLE LANDING (Displays features and direct Drag zone) */}
              {(state === 'IDLE' || state === 'UPLOADING') && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Grand Showcase banner on blank landing */}
                  <div className="text-center space-y-4 py-8">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold text-2xl border border-gold/30 shadow-inner">⚜️</div>
                    <h2 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-royal dark:text-gold max-w-2xl mx-auto uppercase">
                      {isFrench ? "Sublimez vos Lectures littéraires" : "Elevate bookish influence"}
                    </h2>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-base sm:text-lg dark:text-zinc-400 leading-relaxed font-serif">
                      {isFrench 
                        ? "Façonnez de grandioses fiches de lectures et des dossiers filtrés de citations prestigieuses pour TikTok (BookTok), Instagram, LinkedIn et Twitter d'un simple geste."
                        : "Instantly translate books of any magnitude into high-value quote assets sorted, scored, and beautifully formatted for social delivery."}
                    </p>
                  </div>

                  {/* Upload form container space */}
                  <UploadSection
                    onExtract={handleExtractSequence}
                    loading={state === 'PROCESSING'}
                    appError={error}
                    onSetError={setError}
                    lang={lang}
                  />

                  {/* Standard features listing bullets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 border-t border-gold/15">
                    <div className="p-4 rounded-xl border border-gold/15 bg-white/40 text-center dark:bg-zinc-900/30">
                      <div className="text-xl mb-1.5">🎓</div>
                      <h4 className="font-serif font-bold text-royal text-sm uppercase dark:text-gold">{isFrench ? "Score Littéraire" : "AI Scoring"}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{isFrench ? "Notre modèle évalue la pertinence de chaque phrase sur un score de 5 à 10 pour ne garder que les meilleures." : "Quotes are scored 5-10 out of 10 to ensure only memorable fragments make the cut."}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-gold/15 bg-white/40 text-center dark:bg-zinc-900/30">
                      <div className="text-xl mb-1.5">💾</div>
                      <h4 className="font-serif font-bold text-royal text-sm uppercase dark:text-gold">{isFrench ? "Exports Certifiés" : "Certified Exports"}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{isFrench ? "Téléchargez instantanément vos citations sous forme de rapports Word formatés ou de PDF A4 élégants." : "Deliver assets into professional Word reports, ready-to-print PDFs, or plain text templates."}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-gold/15 bg-white/40 text-center dark:bg-zinc-900/30">
                      <div className="text-xl mb-1.5">📱</div>
                      <h4 className="font-serif font-bold text-royal text-sm uppercase dark:text-gold">{isFrench ? "Prêt-à-poster" : "Post-Ready Creator"}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{isFrench ? "Copiez en un clic des formats préconfigurés adaptés aux structures de LinkedIn, Twitter, Instagram et TikTok." : "Templates ready with curated emoticons, catchy hooks, CTA requests, and trending hashtags."}</p>
                    </div>
                  </div>

                </div>
              )}

              {/* STATE 4: SUCCESS VIEW (Filters grid + exporter options cards) */}
              {state === 'SUCCESS' && extraits.length > 0 && metadata && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Return link selector back to dragzone */}
                  <div className="flex justify-between items-center bg-white/40 rounded-xl p-3 border border-gold/15 dark:bg-zinc-900/40">
                    <span className="text-xs text-zinc-500 font-serif italic">
                      🔮 {isFrench ? "Citations affichées pour : " : "Actively displaying excerpts for : "} <b>{metadata.titre}</b>
                    </span>
                    <button
                      id="relaunch-analysis-return-btn"
                      onClick={() => setAppState('IDLE')}
                      className="px-4 py-2 text-xs rounded-lg border border-gold text-royal hover:bg-gold hover:text-white dark:text-gold dark:hover:text-royal font-bold font-serif uppercase tracking-widest transition-all"
                    >
                      {isFrench ? "Importer un autre livre" : "Upload another book"}
                    </button>
                  </div>

                  {/* Excerpt Cards and Filtration space */}
                  <ExtractSection
                    extraits={extraits}
                    metadata={metadata}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelectCard}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onToggleFavorite={handleToggleFavorite}
                    favoritesIds={new Set(favorites.map(f => f.id))}
                    onCopySingle={handleCopySingle}
                    onShareSingle={handleShareSingle}
                    onCopyBatch={handleCopyBatch}
                    onSaveNote={handleSaveNote}
                    onGenerateCardImage={setActiveQuoteForCard}
                  />

                  {/* Exports panel triggers */}
                  <ExportPanel
                    selectedExtraits={extraits.filter(ext => selectedIds.has(ext.id))}
                    allExtraits={extraits}
                    metadata={metadata}
                    onShowToast={showToast}
                  />

                </div>
              )}
            </>
          )}

        </main>

      </div>

      {/* PARAMETERS CONFIG MODAL LAYER */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsSaved={handleSettingsSaved}
      />

      {/* STYLIZED SHAREABLE QUOTE CARD GENERATOR MODAL */}
      {activeQuoteForCard && (
        <QuoteCardGenerator
          extrait={activeQuoteForCard}
          metadata={metadata}
          onClose={() => setActiveQuoteForCard(null)}
        />
      )}

      {/* GLOBAL TOAST INTERACTION ALERTS */}
      {toastMessage && (
        <div 
          id="global-portal-app-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-royal text-white py-3.5 px-6 shadow-2xl border border-gold animate-slideIn dark:bg-zinc-950"
        >
          <span className="text-gold">⚜️</span>
          <span className="font-serif text-xs font-semibold uppercase tracking-wider">{toastMessage}</span>
          <button 
            id="close-toast-banner-btn"
            onClick={() => setToastMessage(null)} 
            className="text-zinc-400 hover:text-white shrink-0 ml-3"
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
}
