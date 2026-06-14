import { useMemo } from 'react';
import { BookOpen, Heart, Award, PieChart, Sparkles, TrendingUp, Bookmark, Star, CheckSquare } from 'lucide-react';
import { HistoriqueItem, Extrait, LivreMetadata } from '../types';
import { getLangue } from '../utils/storage';

interface DashboardProps {
  history: HistoriqueItem[];
  favorites: Extrait[];
  currentBookExtraits: Extrait[];
  currentBookMetadata: LivreMetadata | null;
}

export default function Dashboard({
  history,
  favorites,
  currentBookExtraits,
  currentBookMetadata
}: DashboardProps) {
  const isFrench = getLangue() === 'FR';

  const stats = useMemo(() => {
    // 1. Total books analyzed
    const booksCount = history.length;

    // 2. Total quotes extracted ever (sum of extraits in history)
    let totalQuotesCount = 0;
    const bookTitleSet = new Set<string>();
    history.forEach(item => {
      totalQuotesCount += item.extraits.length;
      bookTitleSet.add(item.metadata.titre);
    });

    // Fallback if current extraits are shown but not in history yet
    if (currentBookExtraits.length > 0 && currentBookMetadata) {
      if (!bookTitleSet.has(currentBookMetadata.titre)) {
        totalQuotesCount += currentBookExtraits.length;
      }
    }

    // 3. Favorites count
    const favCount = favorites.length;

    // 4. Current book calculations
    const activeExtraits = currentBookExtraits.length > 0 ? currentBookExtraits : (history[0]?.extraits || []);
    const activeMetadata = currentBookMetadata || history[0]?.metadata || null;

    let averageScore = 0;
    const themeCounts: { [key: string]: number } = {};
    const typeCounts: { [key: string]: number } = {};

    if (activeExtraits.length > 0) {
      let scoreSum = 0;
      activeExtraits.forEach(ext => {
        scoreSum += ext.score || 8;
        
        // Theme counts
        const t = ext.theme || (isFrench ? 'sagesse' : 'wisdom');
        themeCounts[t] = (themeCounts[t] || 0) + 1;

        // Type counts
        const type = ext.typeContenu || 'citation';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      averageScore = scoreSum / activeExtraits.length;
    }

    // Sort themes for ranking
    const themeList = Object.entries(themeCounts).map(([name, count]) => ({
      name,
      count,
      percent: activeExtraits.length > 0 ? Math.round((count / activeExtraits.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Sort type of contents
    const typeList = Object.entries(typeCounts).map(([name, count]) => ({
      name,
      count,
      percent: activeExtraits.length > 0 ? Math.round((count / activeExtraits.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Filter Top Quotes (score >= 9)
    const topQuotes = [...activeExtraits]
      .sort((a, b) => (b.score || 8) - (a.score || 8))
      .slice(0, 3);

    return {
      booksCount,
      totalQuotesCount,
      favCount,
      averageScore: averageScore.toFixed(1),
      themeList,
      typeList,
      topQuotes,
      activeMetadata
    };
  }, [history, favorites, currentBookExtraits, currentBookMetadata, isFrench]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fadeIn" id="dashboard-statistics">
      
      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-gold/30 bg-white/75 p-6 shadow-sm backdrop-blur-md dark:bg-zinc-900/80 dark:border-zinc-800">
        <span className="font-serif text-[10px] font-bold uppercase tracking-widest text-gold flex items-center gap-1">
          <Award size={12} />
          {isFrench ? "TABLEAU DE BORD LITTÉRAIRE" : "LITERARY DASHBOARD"}
        </span>
        <h2 className="font-serif text-3xl font-bold text-royal dark:text-gold mt-1 uppercase">
          {isFrench ? "Statistiques & Analyses" : "Metrics & Cognitive Insights"}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          {isFrench 
            ? "Visualisez l'impact cognitif, la répartition thématique et la gloire de vos lectures archivées."
            : "Visualize theme ratios, content distribution and cumulative score metrics of your library."}
        </p>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Stat 1: Books */}
        <div className="rounded-xl border border-gold/20 bg-white/60 p-5 dark:bg-zinc-900/60 dark:border-zinc-800 text-center space-y-1">
          <BookOpen className="mx-auto text-gold" size={22} />
          <p className="text-2xl font-serif font-extrabold text-royal dark:text-gold">{stats.booksCount}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
            {isFrench ? "Ouvrages Analysés" : "Books Processed"}
          </p>
        </div>

        {/* Stat 2: Total Quotes */}
        <div className="rounded-xl border border-gold/20 bg-white/60 p-5 dark:bg-zinc-900/60 dark:border-zinc-800 text-center space-y-1">
          <Sparkles className="mx-auto text-gold" size={22} />
          <p className="text-2xl font-serif font-extrabold text-royal dark:text-gold">{stats.totalQuotesCount}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
            {isFrench ? "Pépites Extraites" : "Total Quotes"}
          </p>
        </div>

        {/* Stat 3: Favorites */}
        <div className="rounded-xl border border-gold/20 bg-white/60 p-5 dark:bg-zinc-900/60 dark:border-zinc-800 text-center space-y-1">
          <Heart className="mx-auto text-rose-500 fill-rose-500/10" size={22} />
          <p className="text-2xl font-serif font-extrabold text-royal dark:text-gold">{stats.favCount}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
            {isFrench ? "Coups de Cœur" : "Bookmarked Favoris"}
          </p>
        </div>

        {/* Stat 4: Average impact score */}
        <div className="rounded-xl border border-gold/20 bg-white/60 p-5 dark:bg-zinc-900/60 dark:border-zinc-800 text-center space-y-1">
          <TrendingUp className="mx-auto text-gold" size={22} />
          <p className="text-2xl font-serif font-extrabold text-royal dark:text-gold">{stats.averageScore} <span className="text-xs text-zinc-400">/10</span></p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
            {isFrench ? "Impact Littéraire Moyen" : "Avg Impact Score"}
          </p>
        </div>

      </div>

      {currentBookExtraits.length === 0 && history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gold/30 bg-white/30 p-12 text-center dark:bg-zinc-900/15 max-w-xl mx-auto">
          <p className="text-zinc-500 italic text-sm">
            {isFrench 
              ? "Uploadez ou sélectionnez un livre pour afficher des statistiques d'analyse précises." 
              : "Upload or reactivate a book to trigger visual statistics calculations."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* THEMATIC DISTRIBUTION AND CATEGORIZATION */}
          <div className="rounded-2xl border border-gold/20 bg-white/70 p-6 shadow-xs dark:bg-zinc-900/80 dark:border-zinc-800 space-y-6">
            
            <div className="border-b border-gold/15 pb-3">
              <h3 className="font-serif text-lg font-bold text-royal dark:text-gold flex items-center gap-1.5 uppercase">
                <PieChart size={18} className="text-gold" />
                {isFrench ? "Répartition Thématique" : "Thematic Spectrum"}
              </h3>
              <p className="text-[10px] text-zinc-400 truncate">
                {isFrench 
                  ? `Analyse des thèmes clés de : "${stats.activeMetadata?.titre || 'Vile-Marie'}"`
                  : `Core values computed from: "${stats.activeMetadata?.titre || 'Current Book'}"`}
              </p>
            </div>

            {stats.themeList.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-6">{isFrench ? "Aucune thématique détectée." : "Zero themes tracked."}</p>
            ) : (
              <div className="space-y-4">
                {stats.themeList.map((item, index) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-serif font-bold uppercase text-zinc-850 dark:text-zinc-200">
                        ⚜️ {item.name}
                      </span>
                      <span className="font-mono text-zinc-400">
                        {item.count} {isFrench ? "pépites" : "quotes"} ({item.percent}%)
                      </span>
                    </div>
                    {/* Visual Bar indicator representing proportion */}
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      <div 
                        className="h-full bg-gold rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${item.percent}%`,
                          filter: `brightness(${100 - index * 8}%)`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TYPES OF CONTENT BREAKDOWN */}
            <div className="border-t border-gold/15 pt-5 space-y-4">
              <h4 className="font-serif text-xs font-bold uppercase text-zinc-750 dark:text-zinc-300 tracking-wider">
                {isFrench ? "Typologies Littéraires" : "Structural Taxonomy"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {stats.typeList.slice(0, 4).map((type) => (
                  <div key={type.name} className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 flex items-center justify-between">
                    <div>
                      <p className="font-serif text-[10px] font-bold uppercase text-royal dark:text-gold">{type.name}</p>
                      <p className="font-mono text-[9px] text-zinc-400 uppercase mt-0.5">{type.percent}%</p>
                    </div>
                    <span className="font-mono font-bold text-xs bg-gold/10 text-royal dark:text-gold border border-gold/20 px-2 py-0.5 rounded-md">
                      {type.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* TOP IMPACT PHRASES */}
          <div className="rounded-2xl border border-gold/20 bg-white/70 p-6 shadow-xs dark:bg-zinc-900/80 dark:border-zinc-800 flex flex-col justify-between space-y-6">
            
            <div>
              <div className="border-b border-gold/15 pb-3 mb-4">
                <h3 className="font-serif text-lg font-bold text-royal dark:text-gold flex items-center gap-1.5 uppercase">
                  <Star size={16} className="text-gold fill-gold/20" />
                  {isFrench ? "Pépites au plus Haut Impact" : "Top Impact Excerpts"}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {isFrench 
                    ? "Les énoncés ayant récolté les meilleurs scores d'analyse d'impact."
                    : "The highest rated quotes by the Jean d'Arc impact algorithm."}
                </p>
              </div>

              {stats.topQuotes.length === 0 ? (
                <p className="text-xs text-zinc-400 italic text-center py-12">{isFrench ? "Aucune citation trouvée." : "No entries logged."}</p>
              ) : (
                <div className="space-y-4">
                  {stats.topQuotes.map((ext, idx) => (
                    <div 
                      key={ext.id}
                      className="p-3 border border-gold/15 rounded-xl bg-gold/5 flex gap-3 text-xs"
                    >
                      <div className="font-serif font-extrabold text-gold text-lg leading-none pt-0.5 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <p className="font-serif text-zinc-950 dark:text-zinc-100 italic leading-relaxed line-clamp-3">
                          “ {ext.citation} ”
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400">
                          <span className="font-serif font-semibold">{ext.auteur || 'Anonyme'} {ext.page ? `• p. ${ext.page}` : ''}</span>
                          <span className="font-mono text-gold font-bold bg-gold/10 px-1.5 py-0.2 rounded">
                            {ext.score}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gold/15 pt-4 text-center text-[10px] text-zinc-400 font-mono italic">
              ⚜️ {isFrench ? "L'analyse est mise à jour dynamiquement selon vos lectures actives." : "Analytics adjust automatically with your active records."}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
