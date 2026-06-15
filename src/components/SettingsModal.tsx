import React, { useState } from 'react';
import { X, Key, Shield, HelpCircle, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { getLangue, getMistralKey, getTheme, saveLangue, saveMistralKey, saveTheme } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(getMistralKey());
  const [showKey, setShowKey] = useState(false);
  const [theme, setThemeState] = useState(getTheme());
  const [lang, setLangState] = useState(getLangue());
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMistralKey(apiKey);
    saveTheme(theme);
    saveLangue(lang);
    
    // Apply theme class to document body
    const bodyClass = document.body.classList;
    bodyClass.remove('light', 'dark', 'medieval');
    if (theme === 'clair') bodyClass.add('light');
    else if (theme === 'sombre') bodyClass.add('dark');
    else bodyClass.add('medieval');

    setShowSuccess(true);
    onSettingsSaved();
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1200);
  };

  const isFrench = lang === 'FR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div 
        id="settings-modal-container"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gold/40 bg-paper p-6 shadow-2xl transition-all duration-300 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {/* Banner header inside */}
        <div className="flex items-center justify-between border-b border-gold/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚜️</span>
            <h2 className="font-serif text-2xl font-bold tracking-wide text-royal dark:text-gold uppercase">
              {isFrench ? "Configuration" : "Settings"}
            </h2>
          </div>
          <button 
            id="close-settings-btn"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-gold/20 hover:text-gold dark:text-zinc-400"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          
          {/* Status du moteur d'extraction */}
          <div className="rounded-lg border border-gold/25 bg-gold/5 p-3.5 text-xs shadow-xs text-zinc-800 dark:text-zinc-200">
            <span className="font-serif font-bold text-royal dark:text-gold uppercase tracking-wider flex items-center gap-1.5 mb-1.5 text-[10px]">
              <Sparkles size={11} />
              {isFrench ? "Moteur d'extraction actif" : "Active extraction engine"}
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-zinc-950 dark:text-white font-medium text-xs">
                {apiKey.trim().length > 0 ? 'Mistral-Large (Custom)' : 'Mistral-Large (Default)'}
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                apiKey.trim().length > 0 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20' 
                  : 'bg-royal/10 text-royal dark:bg-white/10 dark:text-gold/80 border border-royal/20 dark:border-gold/20'
              }`}>
                {apiKey.trim().length > 0 ? (isFrench ? 'Clé perso' : 'Custom Key') : (isFrench ? 'Inclus par défaut' : 'Default Included')}
              </span>
            </div>
          </div>

          {/* Section API Key */}
          <div className="space-y-2">
            <label className="flex items-center justify-between font-medium text-zinc-800 dark:text-zinc-200">
              <span className="flex items-center gap-1.5 font-serif text-base uppercase">
                <Key size={16} className="text-gold" />
                {isFrench ? "Clé API Mistral AI" : "Mistral AI API Key"}
              </span>
              <span className="font-mono text-xs text-zinc-400">
                {isFrench ? "Optionnelle (Surcharger la clé incluse)" : "Optional (Override included key)"}
              </span>
            </label>
            <div className="relative">
              <input
                id="mistral-api-key-input"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isFrench ? "Entrez votre clé d'API Mistral AI..." : "Enter your Mistral AI API key..."}
                className="w-full rounded-lg border border-gold/30 bg-white/65 py-3 pl-4 pr-11 font-mono text-xs tracking-wider outline-none focus:border-royal focus:ring-2 focus:ring-royal/25 dark:bg-zinc-800/80 dark:focus:border-gold dark:focus:ring-gold/25"
              />
              <button
                type="button"
                id="toggle-visible-key-btn"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-3 text-zinc-500 hover:text-gold dark:text-zinc-400"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              <Shield size={14} className="text-gold shrink-0 mt-0.5" />
              <span>
                {isFrench 
                  ? "Par défaut, l'application utilise une clé d'API Mistral intégrée de manière transparente. Saisissez votre propre clé ici uniquement si vous souhaitez outrepasser le service par défaut."
                  : "By default, the app uses a seamlessly integrated Mistral API key. Enter your own key here only if you wish to override the default service."}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Theme selector */}
            <div className="space-y-2">
              <label className="block font-serif text-sm font-medium uppercase text-zinc-800 dark:text-zinc-200">
                🎨 {isFrench ? "Style Visuel" : "Visual Theme"}
              </label>
              <select
                id="theme-select-element"
                value={theme}
                onChange={(e) => setThemeState(e.target.value as any)}
                className="w-full rounded-lg border border-gold/30 bg-white/65 p-2.5 outline-none focus:border-royal dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="medieval">⚜️ {isFrench ? "Papier Médiéval" : "Medieval Parchment"}</option>
                <option value="clair">☀️ {isFrench ? "Clair Royal" : "Contemporary Light"}</option>
                <option value="sombre">🌙 {isFrench ? "Sombre Profond" : "Royal Night"}</option>
              </select>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="block font-serif text-sm font-medium uppercase text-zinc-800 dark:text-zinc-200">
                🌐 {isFrench ? "Langue Interface" : "UI Language"}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="flag-fr-btn"
                  onClick={() => setLangState('FR')}
                  className={`flex-1 rounded-lg py-2 font-bold transition-all ${
                    lang === 'FR' 
                      ? 'bg-royal text-white border-2 border-gold/80 dark:bg-gold dark:text-royal' 
                      : 'bg-white/40 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
                  }`}
                >
                  FR
                </button>
                <button
                  type="button"
                  id="flag-en-btn"
                  onClick={() => setLangState('EN')}
                  className={`flex-1 rounded-lg py-2 font-bold transition-all ${
                    lang === 'EN' 
                      ? 'bg-royal text-white border-2 border-gold/80 dark:bg-gold dark:text-royal' 
                      : 'bg-white/40 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
                  }`}
                >
                  ENG
                </button>
              </div>
            </div>
          </div>

          {/* About / Limitations */}
          <div className="rounded-lg bg-royal/5 p-3 border border-royal/10 dark:bg-zinc-800 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <span className="font-serif font-semibold text-royal dark:text-gold uppercase flex items-center gap-1">
              <Sparkles size={12} />
              {isFrench ? "À PROPOS DE JEAN D'ARC" : "ABOUT JEAN D'ARC"}
            </span>
            <p className="leading-relaxed">
              {isFrench 
                ? "Inspirée par la vaillance de l'étendard historique, l'application extrait, évalue et stylise les meilleures citations de vos ouvrages préférés pour l'évangélisation littéraire sur réseaux sociaux."
                : "Inspired by historical valor, the application extracts, scores, and formats the best passages from your books for literary engagement on social channels."}
            </p>
            <p className="font-mono text-[10px] text-zinc-400 flex items-center gap-1 pt-1 border-t border-royal/10 mt-2">
              <AlertCircle size={10} />
              {isFrench ? "Limite recommandée : 70k caractères par fichier." : "Recommended limit: 70k characters per text."}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gold/10">
            <button
              type="button"
              id="cancel-settings-btn"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isFrench ? "Annuler" : "Cancel"}
            </button>
            <button
              type="submit"
              id="save-settings-btn"
              className="rounded-lg bg-royal hover:bg-royal-dark text-white px-5 py-2 text-sm font-semibold border border-gold/30 shadow-md hover:shadow-lg transition-all dark:bg-gold dark:hover:bg-gold-hover dark:text-royal"
            >
              {showSuccess 
                ? (isFrench ? "✓ Enregistré !" : "✓ Saved!") 
                : (isFrench ? "Enregistrer les modifications" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
