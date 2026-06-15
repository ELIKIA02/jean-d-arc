import { useState, useMemo } from 'react';
import { Sparkles, SlidersHorizontal, ArrowUpDown, Check, Copy, CheckSquare, Square, RotateCcw, Search, Eye } from 'lucide-react';
import { Extrait, LivreMetadata } from '../types';
import ExtractCard from './ExtractCard';
import { getLangue } from '../utils/storage';
import { formatGroupedText } from '../utils/formatters';

interface ExtractSectionProps {
  extraits: Extrait[];
  metadata: LivreMetadata;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: () => void;
  onToggleFavorite: (id: string) => void;
  favoritesIds: Set<string>;
  onCopySingle: (extrait: Extrait) => void;
  onShareSingle: (extrait: Extrait) => void;
  onCopyBatch: (text: string) => void;
  onSaveNote: (id: string, noteText: string) => void;
  onGenerateCardImage?: (extrait: Extrait) => void;
}

export default function ExtractSection({
  extraits,
  metadata,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onToggleFavorite,
  favoritesIds,
  onCopySingle,
  onShareSingle,
  onCopyBatch,
  onSaveNote,
  onGenerateCardImage,
}: ExtractSectionProps) {
  const isFrench = getLangue() === 'FR';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'page' | 'alpha'>('page');
  const [showPreview, setShowPreview] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState(false);

  // Sorting / Filtering memo lists
  const filteredSortedExtraits = useMemo(() => {
    let result = [...extraits];

    // 1. Text filter
    if (searchTerm.trim().length > 0) {
      const query = searchTerm.toLowerCase();
      result = result.filter(ext => 
        ext.citation.toLowerCase().includes(query) ||
        (ext.auteur && ext.auteur.toLowerCase().includes(query))
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      if (sortBy === 'page') {
        const pageA = parseInt(a.page?.replace(/\D/g, '') || '0') || 0;
        const pageB = parseInt(b.page?.replace(/\D/g, '') || '0') || 0;
        return pageA - pageB; // Chronological pages
      }
      if (sortBy === 'alpha') {
        return a.citation.localeCompare(b.citation);
      }
      return 0;
    });

    return result;
  }, [extraits, searchTerm, sortBy]);

  // Extract ids helper
  const filteredIds = useMemo(() => {
    return filteredSortedExtraits.map(e => e.id);
  }, [filteredSortedExtraits]);

  // Selected array
  const selectedExcerpts = useMemo(() => {
    return extraits.filter(ext => selectedIds.has(ext.id));
  }, [extraits, selectedIds]);

  // Live aggregated clipboard preview text
  const groupedPreviewText = useMemo(() => {
    return formatGroupedText(selectedExcerpts, metadata.auteur, metadata.titre);
  }, [selectedExcerpts, metadata]);

  const handleSelectAllFiltered = () => {
    onSelectAll(filteredIds);
  };

  const handleCopyGrouped = () => {
    if (groupedPreviewText.trim().length === 0) return;
    onCopyBatch(groupedPreviewText);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2500);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6" id="extraction-results-wrapper">
      
      {/* FILTER CONTROL CARD */}
      <div className="rounded-2xl border border-gold/30 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:bg-zinc-900/80 dark:border-zinc-800">
        
        {/* Core numbers indicator heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gold/15 pb-4 mb-4 gap-3">
          <div>
            <span className="font-serif text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1">
              <Sparkles size={11} />
              {isFrench ? "COUP DE FILET" : "GOLDEN CAPTURE"}
            </span>
            <h3 className="font-serif text-2xl font-bold text-royal dark:text-gold mt-0.5">
              {isFrench ? "Pépites Littéraires Capturées" : "Captured Masterpieces"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isFrench 
                ? `${extraits.length} extraits uniques identifiés dans "${metadata.titre}"`
                : `${extraits.length} unique quotes spotted inside "${metadata.titre}"`}
            </p>
          </div>

          {/* Rapid multi select buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="select-all-filtered-btn"
              onClick={handleSelectAllFiltered}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-royal text-white hover:bg-royal-dark border border-gold/25 transition-all flex items-center gap-1 dark:bg-gold dark:text-royal"
            >
              <CheckSquare size={13} />
              {isFrench ? "Tout cocher" : "Select all filtered"}
            </button>
            
            <button
              id="deselect-all-filtered-btn"
              onClick={onDeselectAll}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all flex items-center gap-1 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
            >
              <RotateCcw size={13} />
              {isFrench ? "Tout vider" : "Clear selection"}
            </button>

            <span className="font-mono text-xs font-bold bg-gold/15 text-royal dark:text-gold rounded-full px-3 py-1 ml-1.5 shrink-0 border border-gold/20">
              {selectedIds.size} / {extraits.length} {isFrench ? "cochés" : "checked"}
            </span>
          </div>
        </div>

        {/* Search, Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-xs font-medium">
          
          {/* Keyword Query Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-400">
              <Search size={14} />
            </span>
            <input
              id="excerpts-keyword-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isFrench ? "Rechercher un mot clé..." : "Filter by keywords..."}
              className="w-full rounded-lg border border-gold/20 bg-white/60 py-2 pl-9 pr-3 text-xs outline-none focus:border-royal dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Sort By Select */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gold shrink-0" />
            <select
              id="excerpts-sort-selector"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-lg border border-gold/20 bg-white/60 p-2 text-xs dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
            >
              <option value="page">📍 {isFrench ? "Ordre chronologique des pages" : "Chronological Pages"}</option>
              <option value="alpha">🔤 {isFrench ? "Ordre alphabétique" : "Alphabetical Quote"}</option>
            </select>
          </div>

        </div>

      </div>

      {/* CARDS LISTING GRID CONTAINER */}
      {filteredSortedExtraits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gold/30 bg-white/30 p-12 text-center dark:bg-zinc-900/15">
          <p className="text-zinc-500 italic text-sm">
            {isFrench 
              ? "Aucun extrait ne correspond à votre filtre. Ajustez les critères de recherche." 
              : "No specific quotes match your active filtering setup. Try expanding targets."}
          </p>
          <button
            id="reset-filters-btn"
            type="button"
            onClick={() => {
              setSearchTerm('');
            }}
            className="text-xs font-bold text-gold underline mt-2 hover:text-royal transition-all uppercase tracking-widest block mx-auto"
          >
            {isFrench ? "Réinitialiser" : "Reset rules"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5" id="excerpts-cards-grid">
          {filteredSortedExtraits.map((ext) => (
            <ExtractCard
              key={ext.id}
              extrait={{ ...ext, auteur: ext.auteur || metadata.auteur, titreLivre: ext.titreLivre || metadata.titre }}
              onToggleSelect={onToggleSelect}
              selected={selectedIds.has(ext.id)}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoritesIds.has(ext.id)}
              onCopySingle={onCopySingle}
              onShareSingle={onShareSingle}
              onSaveNote={onSaveNote}
              onGenerateCardImage={onGenerateCardImage}
            />
          ))}
        </div>
      )}

      {/* REACTIVE BULK COPY BATCH PREVIEW ACCORDION */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 shadow-xs">
          
          <div className="flex items-center justify-between">
            <button
              id="toggle-batch-preview-btn"
              onClick={() => setShowPreview(!showPreview)}
              className="font-serif text-sm font-bold text-royal hover:text-royal-hover dark:text-gold dark:hover:text-gold-hover transition-all uppercase tracking-wider flex items-center gap-1.5"
            >
              <Eye size={14} />
              {isFrench 
                ? `Aperçu de la sélection groupée (${selectedIds.size} extraits)` 
                : `Aggregated Selection Preview (${selectedIds.size} items)`}
            </button>
            
            <button
              id="copy-batch-preview-btn"
              onClick={handleCopyGrouped}
              className="px-3.5 py-1.5 rounded-lg bg-royal text-white hover:bg-royal-dark text-xs font-semibold flex items-center gap-1 border border-gold/30 dark:bg-gold dark:text-royal"
            >
              {copiedBatch ? <Check size={12} /> : <Copy size={12} />}
              {copiedBatch ? (isFrench ? "Sélection copiée !" : "Batch copied!") : (isFrench ? "Copier le lot" : "Copy layout batch")}
            </button>
          </div>

          {showPreview && (
            <div className="mt-3 relative">
              <textarea
                id="batch-quotes-text-area"
                value={groupedPreviewText}
                readOnly
                rows={5}
                className="w-full text-xs font-mono p-3 border border-gold/20 rounded-lg bg-white/70 dark:bg-zinc-800/80 outline-none focus:ring-1 focus:ring-gold"
              />
              <p className="font-mono text-[9px] text-zinc-400 mt-1 italic text-right">
                {isFrench ? "Mise à jour en temps réel des citations sélectionnées" : "Reflects active checkboxes in real-time formatting"}
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
