import React, { useState } from 'react';
import { Heart, Copy, Share2, Bookmark, CheckSquare, Square, Volume2, VolumeX, FileText, Check, Save, Image as ImageIcon } from 'lucide-react';
import { Extrait } from '../types';
import { getLangue } from '../utils/storage';

interface ExtractCardProps {
  key?: string;
  extrait: Extrait;
  onToggleSelect: (id: string) => void;
  selected: boolean;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  onCopySingle: (extrait: Extrait) => void;
  onShareSingle: (extrait: Extrait) => void;
  onSaveNote: (id: string, noteText: string) => void;
  onGenerateCardImage?: (extrait: Extrait) => void;
}

export default function ExtractCard({
  extrait,
  onToggleSelect,
  selected,
  onToggleFavorite,
  isFavorite,
  onCopySingle,
  onShareSingle,
  onSaveNote,
  onGenerateCardImage,
}: ExtractCardProps) {
  const isFrench = getLangue() === 'FR';
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(extrait.note || '');

  const handleCopyClick = () => {
    onCopySingle(extrait);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(extrait.citation);
        utterance.lang = isFrench ? 'fr-FR' : 'en-US';
        utterance.onend = () => {
          setIsPlaying(false);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
        };
        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleToggleEditNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingNote(!isEditingNote);
  };

  const handleSaveNoteSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveNote(extrait.id, noteValue);
    setIsEditingNote(false);
  };

  return (
    <div
      onClick={() => onToggleSelect(extrait.id)}
      id={`extract-card-${extrait.id}`}
      className={`relative overflow-hidden rounded-xl border-t border-r border-b border-l-4 bg-zinc-50/90 dark:bg-zinc-950 p-6 shadow-md hover:shadow-lg cursor-pointer transition-all hover:-translate-y-0.5 border-l-gold group ${
        selected ? 'ring-2 ring-gold bg-amber-50/20 dark:ring-gold dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      
      {/* Top action row with highly premium, theme-free label */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-serif font-bold text-royal dark:text-gold uppercase tracking-wider">
          ⚜️ {extrait.typeContenu || 'Extrait'}
        </span>
        
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* TTS button always visible for ease of access */}
          <button
            id={`toggle-tts-card-${extrait.id}`}
            onClick={handleSpeak}
            className={`rounded p-1 transition-all ${
              isPlaying 
                ? 'text-gold bg-gold/10 animate-pulse' 
                : 'text-zinc-400 hover:text-gold hover:bg-gold/10 dark:text-zinc-600'
            }`}
            title={isPlaying ? (isFrench ? "Arrêter la lecture" : "Stop listening") : (isFrench ? "Écouter la citation" : "Listen aloud")}
          >
            {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Add/Edit personal note button */}
          <button
            id={`toggle-note-card-${extrait.id}`}
            onClick={handleToggleEditNote}
            className={`rounded p-1 transition-all ${
              extrait.note 
                ? 'text-gold bg-gold/5' 
                : 'text-zinc-400 hover:text-gold hover:bg-gold/10 dark:text-zinc-600'
            }`}
            title={isFrench ? "Ajouter/Modifier une réflexion" : "Add/Edit personal note"}
          >
            <Bookmark size={14} className={extrait.note ? 'fill-gold' : ''} />
          </button>

          <button
            id={`toggle-fav-card-${extrait.id}`}
            onClick={() => onToggleFavorite(extrait.id)}
            className="rounded p-1 text-zinc-400 hover:text-rose-500 dark:text-zinc-600 hover:bg-rose-500/10 transition-all"
            title={isFrench ? "Ajouter aux favoris" : "Add to favorites"}
          >
            <Heart size={14} className={isFavorite ? 'fill-rose-500 text-rose-500' : ''} />
          </button>

          {onGenerateCardImage && (
            <button
              id={`generate-image-card-${extrait.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onGenerateCardImage(extrait);
              }}
              className="rounded p-1 text-zinc-400 hover:text-gold dark:text-zinc-600 hover:bg-gold/10 transition-all animate-fadeIn"
              title={isFrench ? "Générer une carte de citation pour image" : "Generate Quote Card"}
            >
              <ImageIcon size={14} />
            </button>
          )}

          <button
            id={`toggle-select-checkbox-${extrait.id}`}
            onClick={() => onToggleSelect(extrait.id)}
            className="text-zinc-400 hover:text-gold dark:text-zinc-600 transition-all font-semibold"
          >
            {selected ? (
              <CheckSquare size={16} className="text-gold" />
            ) : (
              <Square size={16} className="text-zinc-300 group-hover:text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main citation quotation (enhanced spacing & high-contrast deep color) */}
      <blockquote className="my-5 font-serif text-base md:text-[17px] leading-relaxed text-zinc-950 dark:text-zinc-100 font-semibold border-l-2 border-gold/40 pl-4 py-1 pr-1 whitespace-pre-line">
        “ {extrait.citation} ”
      </blockquote>

      {/* Inline personal note editor if toggled */}
      {isEditingNote && (
        <div className="my-4 bg-gold/5 p-3 rounded-lg border border-gold/20" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-serif text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
              <FileText size={10} />
              {isFrench ? "Note personnelle" : "Personal Ref"}
            </span>
            <button
              onClick={handleSaveNoteSubmit}
              className="text-[10px] bg-royal text-white dark:bg-gold dark:text-royal px-2 py-0.5 rounded font-serif font-bold uppercase transition-all flex items-center gap-1"
            >
              <Check size={10} />
              {isFrench ? "Sauver" : "Save"}
            </button>
          </div>
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder={isFrench ? "Saisissez votre commentaire..." : "Write your own reflection..."}
            rows={2}
            className="w-full text-xs p-2 rounded border border-gold/15 bg-white/90 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-gold"
          />
        </div>
      )}

      {/* Render personal reflection if it exists (not in editing mode) */}
      {!isEditingNote && extrait.note && (
        <div className="my-4 bg-gold/5 border-l-2 border-gold/60 p-3 rounded-r-lg">
          <div className="font-serif text-[9px] font-bold text-gold uppercase tracking-wider flex items-center gap-1 mb-1">
            <FileText size={10} />
            {isFrench ? "Votre Réflexion" : "Your Reflection"}
          </div>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 italic font-serif leading-relaxed">
            {extrait.note}
          </p>
        </div>
      )}

      {/* Metadata tagging line (Theme, stars and hashtags are completely removed) */}
      <div className="border-t border-gold/10 pt-3.5 flex flex-col gap-1.5 mt-4">
        
        {/* Core Location info */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 font-semibold font-serif">
          <span className="text-gold">📍</span>
          <span className="text-royal dark:text-gold truncate max-w-[140px]" title={extrait.auteur}>
            {extrait.auteur || 'Anonyme'}
          </span>
          {extrait.page && <span className="text-zinc-400 dark:text-zinc-500 font-mono">• p. {extrait.page}</span>}
          {extrait.chapitre && <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-[100px] font-mono">• Ch. {extrait.chapitre}</span>}
        </div>

      </div>

      {/* Hover action bar overlays */}
      <div 
        className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 bg-white/95 dark:bg-zinc-900/95 shadow-md rounded-lg p-1 border border-gold/15 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id={`copy-single-btn-${extrait.id}`}
          onClick={handleCopyClick}
          className="rounded p-1 text-zinc-500 hover:text-gold hover:bg-gold/10 dark:text-zinc-400 transition-all"
          title={isFrench ? "Copier le texte" : "Copy to clipboard"}
        >
          <Copy size={12} />
        </button>
        <button
          id={`share-single-btn-${extrait.id}`}
          onClick={() => onShareSingle(extrait)}
          className="rounded p-1 text-zinc-500 hover:text-gold hover:bg-gold/10 dark:text-zinc-400 transition-all"
          title={isFrench ? "Partager" : "Share passage"}
        >
          <Share2 size={12} />
        </button>
        {onGenerateCardImage && (
          <button
            id={`hover-generate-image-card-${extrait.id}`}
            onClick={() => onGenerateCardImage(extrait)}
            className="rounded p-1 text-zinc-500 hover:text-gold hover:bg-gold/10 dark:text-zinc-400 transition-all"
            title={isFrench ? "Créer une Carte Image" : "Make Quote Card"}
          >
            <ImageIcon size={12} />
          </button>
        )}
      </div>

      {copied && (
        <span className="absolute bottom-2 left-2 text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 rounded px-1 animate-pulse">
          {isFrench ? "Copié !" : "Copied!"}
        </span>
      )}

    </div>
  );
}
