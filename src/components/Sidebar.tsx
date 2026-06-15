import { BookOpen, Heart, Trash2, Settings, ShieldCheck, Sparkles, X, Menu, BookMarked, Download } from 'lucide-react';
import { HistoriqueItem, Extrait } from '../types';
import { getLangue, getMistralKey } from '../utils/storage';

interface SidebarProps {
  history: HistoriqueItem[];
  favorites: Extrait[];
  onSelectHistory: (item: HistoriqueItem) => void;
  onDeleteHistory: (id: string) => void;
  onRemoveFavorite: (extraitId: string) => void;
  onExportFavorites: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function Sidebar({
  history,
  favorites,
  onSelectHistory,
  onDeleteHistory,
  onRemoveFavorite,
  onExportFavorites,
  onOpenSettings,
  isOpen,
  onToggleOpen,
}: SidebarProps) {
  const lang = getLangue();
  const isFrench = lang === 'FR';
  const hasMistralKey = getMistralKey().trim().length > 0;

  return (
    <>
      {/* Mobile Burger Toggle (Fixed top left) */}
      <button 
        id="mobile-sidebar-toggle-btn"
        onClick={onToggleOpen}
        className="fixed top-4 left-4 z-40 rounded-lg border border-gold/40 bg-paper p-2 shadow-md hover:bg-zinc-100 md:hidden dark:bg-zinc-900 dark:text-zinc-100"
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={20} className="text-gold" /> : <Menu size={20} className="text-royal dark:text-gold" />}
      </button>

      {/* Main Sidebar Drawer Container */}
      <aside
        id="main-app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-30 flex w-72 flex-col border-r border-[#D4AF37]/30 bg-[#1E3A5F] text-white transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } dark:bg-zinc-950 dark:border-zinc-800`}
      >
        {/* Branding header block */}
        <div className="flex flex-col items-center justify-center border-b border-white/10 py-6 px-4">
          <div className="text-4xl mb-2 animate-bounce" style={{ animationDuration: '3s' }}>⚜️</div>
          <h1 className="font-serif text-2xl font-bold tracking-widest text-[#D4AF37] uppercase mt-1">
            JEAN D'ARC
          </h1>
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/60 uppercase">
            {isFrench ? "Extraits Littéraires" : "Literary excerpt engine"}
          </p>
        </div>

        {/* Scrollable contents list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* HISTORY SECTION */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-3 flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-serif">
                <BookOpen size={13} />
                {isFrench ? "📚 Historique" : "📚 History"}
              </span>
              {history.length > 0 && (
                <span className="text-[10px] bg-[#D4AF37] text-[#1E3A5F] px-1.5 rounded-full font-bold">{history.length}</span>
              )}
            </h2>
            
            {history.length === 0 ? (
              <p className="p-3 text-xs italic text-white/60 text-center border border-dashed border-white/10 rounded-lg">
                {isFrench ? "Aucun livre analysé pour le moment" : "No analyzed books yet"}
              </p>
            ) : (
              <ul className="space-y-2" id="history-items-list">
                {history.map((item) => (
                  <li 
                    key={item.id} 
                    className="group flex items-center justify-between rounded-lg bg-white/10 hover:bg-white/15 p-2.5 transition-all text-xs border-l-2 border-[#D4AF37] border-t border-r border-b border-white/5 cursor-pointer text-white"
                    onClick={() => onSelectHistory(item)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <span className="text-base shrink-0">📖</span>
                      <div className="truncate">
                        <p className="font-serif font-semibold text-white truncate">{item.metadata.titre || (isFrench ? "Fichier" : "File")}</p>
                        <p className="text-[10px] text-white/60 truncate">{item.metadata.auteur || '?'}</p>
                      </div>
                    </div>
                    
                    <button
                      id={`delete-history-btn-${item.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistory(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-white/55 hover:text-red-300 hover:bg-white/10 transition-all shrink-0 ml-1"
                      title={isFrench ? "Retirer de l'historique" : "Remove from history"}
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* FAVORITES SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-3 flex items-center gap-1.5 font-serif">
                <Heart size={13} className="fill-[#D4AF37] text-[#D4AF37]" />
                {isFrench ? "❤️ Favoris" : "❤️ Favorites"}
                {favorites.length > 0 && (
                  <span className="rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[9px] font-bold">
                    {favorites.length}
                  </span>
                )}
              </h2>
              
              {favorites.length > 0 && (
                <button
                  id="quick-export-favorites-btn"
                  onClick={onExportFavorites}
                  className="p-1 rounded text-[#D4AF37] hover:bg-white/10 transition-all"
                  title={isFrench ? "Exporter les favoris" : "Export favorites"}
                >
                  <Download size={13} />
                </button>
              )}
            </div>

            {favorites.length === 0 ? (
              <p className="p-3 text-xs italic text-white/60 text-center border border-dashed border-white/10 rounded-lg">
                {isFrench ? "Aucun coup de cœur identifié" : "No favorites added yet"}
              </p>
            ) : (
              <ul className="space-y-2" id="favorites-items-list">
                {favorites.slice(0, 10).map((fav) => (
                  <li 
                    key={fav.id}
                    className="group flex flex-col gap-1 rounded-lg bg-white/5 hover:bg-white/10 p-2.5 border-b border-white/10 text-xs text-white/90"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <p className="italic text-white/95 line-clamp-2 font-serif">“{fav.citation}”</p>
                      <button
                        id={`remove-fav-btn-${fav.id}`}
                        onClick={() => onRemoveFavorite(fav.id)}
                        className="text-white/40 hover:text-red-300 transition-all shrink-0"
                        title={isFrench ? "Supprimer" : "Remove"}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <p className="text-[9px] font-mono text-white/55 truncate">
                      👤 {fav.auteur || 'Unknown'} {fav.page ? `• ${fav.page}` : ''}
                    </p>
                  </li>
                ))}
                {favorites.length > 10 && (
                  <p className="text-[10px] text-center text-white/60 italic">
                    {isFrench ? `Et ${favorites.length - 10} autres favoris...` : `And ${favorites.length - 10} more...`}
                  </p>
                )}
              </ul>
            )}
          </div>

        </div>

      </aside>

      {/* Dimmed mobile overlay */}
      {isOpen && (
        <div 
          onClick={onToggleOpen} 
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}
    </>
  );
}
