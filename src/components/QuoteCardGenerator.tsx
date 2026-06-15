import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ShieldAlert, Sparkles, Sliders, Type, Palette, Eye, Check } from 'lucide-react';
import { Extrait, LivreMetadata } from '../types';
import { getLangue } from '../utils/storage';

interface QuoteCardGeneratorProps {
  extrait: Extrait;
  metadata: LivreMetadata | null;
  onClose: () => void;
}

interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  cssUrl?: string;
}

interface AspectRatioOption {
  id: string;
  name: string;
  ratio: string;
  width: number;
  height: number;
}

interface ThemePreset {
  id: string;
  nameFr: string;
  nameEn: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
}

export default function QuoteCardGenerator({
  extrait,
  metadata,
  onClose
}: QuoteCardGeneratorProps) {
  const isFrench = getLangue() === 'FR';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Customizer States
  const [selectedFont, setSelectedFont] = useState<string>('serif-elegant');
  const [selectedTheme, setSelectedTheme] = useState<string>('parchment');
  const [selectedRatio, setSelectedRatio] = useState<string>('square'); // 'square', 'story', 'landscape'
  const [fontSize, setFontSize] = useState<number>(36); // Base font size
  const [lineHeight, setLineHeight] = useState<number>(1.5);
  const [showAuthor, setShowAuthor] = useState<boolean>(true);
  const [showSource, setShowSource] = useState<boolean>(true);
  const [showOrnament, setShowOrnament] = useState<string>('fleur-de-lys'); // 'none', 'fleur-de-lys', 'quotes', 'line'
  const [showFraming, setShowFraming] = useState<boolean>(true);
  const [showNoteFlag, setShowNoteFlag] = useState<boolean>(extrait.note ? true : false);
  const [customTitle, setCustomTitle] = useState<string>(extrait.titreLivre || metadata?.titre || '');
  const [customAuthor, setCustomAuthor] = useState<string>(extrait.auteur || metadata?.auteur || 'Anonyme');
  const [customPage, setCustomPage] = useState<string>(extrait.page || '');
  const [customCitation, setCustomCitation] = useState<string>(extrait.citation || '');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [useCustomColors, setUseCustomColors] = useState<boolean>(false);
  const [customBg, setCustomBg] = useState<string>('#FFFCF3');
  const [customText, setCustomText] = useState<string>('#1B263B');
  const [customAccent, setCustomAccent] = useState<string>('#D4AF37');

  // Load elegant display Google Fonts dynamically (once only)
  useEffect(() => {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;700&family=Special+Elite&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;600&family=Alex+Brush&display=swap';
    
    if (!document.querySelector(`link[href="${fontUrl}"]`)) {
      const link = document.createElement('link');
      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // Set up font options
  const FONTS: FontOption[] = [
    { id: 'serif-elegant', name: isFrench ? 'Sagesse Classique (Garamond)' : 'Classic Wisdom (Garamond)', fontFamily: '"Cormorant Garamond", Georgia, serif' },
    { id: 'philosophe', name: isFrench ? 'Grande Philosophie (Playfair)' : 'Playfair Display', fontFamily: '"Playfair Display", serif' },
    { id: 'medieval', name: isFrench ? 'Gothique Royal (Cinzel)' : 'Imperial Majesty (Cinzel)', fontFamily: '"Cinzel", serif' },
    { id: 'calligraphy', name: isFrench ? 'Manuscrit Flamboyant' : 'Calligraphy Express', fontFamily: '"Alex Brush", cursive, serif' },
    { id: 'machine', name: isFrench ? 'Machine d\'Écrivain' : 'Artisan Typewriter', fontFamily: '"Special Elite", Courier, monospace' },
    { id: 'modern', name: isFrench ? 'Minimaliste Moderne' : 'Modern Clean', fontFamily: '"Montserrat", "Inter", sans-serif' }
  ];

  // Ratios for Social Media sizes
  const RATIOS: AspectRatioOption[] = [
    { id: 'square', name: isFrench ? 'Carré (1:1 - Insta/Post)' : 'Square (1:1 - Post)', ratio: '1/1', width: 1080, height: 1080 },
    { id: 'story', name: isFrench ? 'Vertical (9:16 - Story/TikTok)' : 'Story (9:16 - Vertical)', ratio: '9/16', width: 1080, height: 1920 },
    { id: 'landscape', name: isFrench ? 'Paysage (16:9 - Twitter/FB)' : 'Landscape (16:9)', ratio: '16/9', width: 1200, height: 675 }
  ];

  // Exquisite design presets with custom color palettes
  const THEMES: ThemePreset[] = [
    {
      id: 'parchment',
      nameFr: 'Parchemin Sacré',
      nameEn: 'Sacred Parchment',
      bgColor: '#FFFCF3',
      textColor: '#1B263B',
      accentColor: '#D4AF37',
      borderColor: '#E6DFD1'
    },
    {
      id: 'royal-navy',
      nameFr: 'Bleu Royal & Or',
      nameEn: 'Royal Blue & Gold',
      bgColor: '#101D38',
      textColor: '#FDFBF7',
      accentColor: '#E6C665',
      borderColor: '#D4AF37'
    },
    {
      id: 'sage',
      nameFr: 'Vert Sauge / Apothicare',
      nameEn: 'Sage Herbalist',
      bgColor: '#ECF1EC',
      textColor: '#2E3A2F',
      accentColor: '#8C9C8D',
      borderColor: '#CBD5CC'
    },
    {
      id: 'dusty-rose',
      nameFr: 'Rose d\'Antan',
      nameEn: 'Vellum Rose',
      bgColor: '#FAF0EB',
      textColor: '#4E2C22',
      accentColor: '#C88373',
      borderColor: '#E8D4CC'
    },
    {
      id: 'charcoal',
      nameFr: 'La Nuit Littéraire',
      nameEn: 'The Library Night',
      bgColor: '#161618',
      textColor: '#F3F4F6',
      accentColor: '#A3A3A3',
      borderColor: '#2D2D30'
    },
    {
      id: 'ivory-minimal',
      nameFr: 'Or Blanc Épuré',
      nameEn: 'Pure Ivory Slate',
      bgColor: '#FFFFFF',
      textColor: '#0A0A0A',
      accentColor: '#D4AF37',
      borderColor: '#E5E5E5'
    }
  ];

  const presetTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];
  const currentTheme = useCustomColors ? {
    id: 'custom',
    nameFr: 'Couleurs Sur-Mesure',
    nameEn: 'Custom Palette',
    bgColor: customBg,
    textColor: customText,
    accentColor: customAccent,
    borderColor: `${customText}22`
  } : presetTheme;
  const currentRatio = RATIOS.find(r => r.id === selectedRatio) || RATIOS[0];
  const currentFont = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  // Drawing Canvas to trigger PNG render
  const drawAndDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution sizes
    const width = currentRatio.width;
    const height = currentRatio.height;
    canvas.width = width;
    canvas.height = height;

    // 1. Fill background color
    ctx.fillStyle = currentTheme.bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw border frame helper
    if (showFraming) {
      ctx.strokeStyle = currentTheme.borderColor;
      ctx.lineWidth = width * 0.015;
      ctx.strokeRect(width * 0.04, width * 0.04, width - width * 0.08, height - width * 0.08);

      // Inner thin gold accent border
      ctx.strokeStyle = currentTheme.accentColor;
      ctx.lineWidth = width * 0.003;
      ctx.strokeRect(width * 0.048, width * 0.048, width - width * 0.096, height - width * 0.096);
    }

    // 3. Draw Ornament
    ctx.fillStyle = currentTheme.accentColor;
    ctx.textAlign = 'center';
    
    let textStartY = height * 0.22;
    if (selectedRatio === 'story') {
      textStartY = height * 0.28;
    } else if (selectedRatio === 'landscape') {
      textStartY = height * 0.18;
    }

    if (showOrnament === 'fleur-de-lys') {
      ctx.font = `${width * 0.05}px serif`;
      ctx.fillText('⚜️', width / 2, textStartY - height * 0.04);
    } else if (showOrnament === 'quotes') {
      ctx.font = `bold italic ${width * 0.1}px "Playfair Display", Georgia, serif`;
      ctx.fillText('“', width / 2, textStartY - height * 0.02);
    } else if (showOrnament === 'line') {
      ctx.strokeStyle = currentTheme.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.4, textStartY - height * 0.04);
      ctx.lineTo(width * 0.6, textStartY - height * 0.04);
      ctx.stroke();
    }

    // 4. Draw Citation / Blockquote wrapped text
    const cleanFontName = currentFont.fontFamily.split(',')[0].replace(/"/g, '');
    ctx.font = `${selectedFont === 'calligraphy' ? 'italic ' : ''}${fontSize * (width / 1000)}px ${cleanFontName}`;
    ctx.fillStyle = currentTheme.textColor;
    ctx.textBaseline = 'top';

    const maxTextWidth = width * 0.76;
    const words = customCitation.split(/\s+/);
    let lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw lines
    ctx.textAlign = textAlign;
    const lineSpacing = fontSize * (width / 1000) * lineHeight;
    let textY = textStartY;
    
    lines.forEach(line => {
      let textX = width / 2;
      if (textAlign === 'left') {
        textX = (width - maxTextWidth) / 2;
      } else if (textAlign === 'right') {
        textX = width - (width - maxTextWidth) / 2;
      }
      ctx.fillText(line, textX, textY);
      textY += lineSpacing;
    });

    // 5. Draw Personal Reflection / Notes Box if toggled & active
    if (showNoteFlag && extrait.note) {
      textY += lineSpacing * 0.4;
      const noteY = textY;
      
      const splitNote = docSplitText(ctx, `${isFrench ? 'Réflexion : ' : 'Reflection: '}${extrait.note}`, maxTextWidth - width * 0.04, `${fontSize * 0.55 * (width / 1000)}px ${cleanFontName}`);
      const noteHeight = splitNote.lines.length * fontSize * 0.55 * (width / 1000) * 1.4 + (width * 0.03);

      // Draw subtle pastel box
      ctx.fillStyle = currentTheme.id === 'royal-navy' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.05)';
      ctx.fillRect((width - maxTextWidth) / 2, noteY, maxTextWidth, noteHeight);

      // Accent border left on note
      ctx.strokeStyle = currentTheme.accentColor;
      ctx.lineWidth = width * 0.005;
      ctx.beginPath();
      ctx.moveTo((width - maxTextWidth) / 2, noteY);
      ctx.lineTo((width - maxTextWidth) / 2, noteY + noteHeight);
      ctx.stroke();

      // Write text
      ctx.fillStyle = currentTheme.textColor;
      ctx.font = `italic ${fontSize * 0.52 * (width / 1000)}px ${cleanFontName}`;
      ctx.textAlign = 'left';
      let currentNoteY = noteY + (width * 0.015);
      
      splitNote.lines.forEach((nline: string) => {
        ctx.fillText(nline, (width - maxTextWidth) / 2 + (width * 0.02), currentNoteY);
        currentNoteY += fontSize * 0.52 * (width / 1000) * 1.4;
      });

      textY += noteHeight + (width * 0.03);
    }

    // 6. Signature line at the bottom
    let signatureY = height * 0.85;
    if (selectedRatio === 'story') {
      signatureY = height * 0.88;
    } else if (selectedRatio === 'landscape') {
      signatureY = height * 0.82;
    }

    ctx.textAlign = 'center';
    
    // Line separator
    ctx.strokeStyle = `${currentTheme.textColor}22`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.45, signatureY - height * 0.03);
    ctx.lineTo(width * 0.55, signatureY - height * 0.03);
    ctx.stroke();

    if (showAuthor) {
      ctx.font = `bold uppercase ${width * 0.026}px ${cleanFontName}`;
      ctx.fillStyle = currentTheme.textColor;
      ctx.fillText(customAuthor, width / 2, signatureY);
    }

    if (showSource && customTitle) {
      ctx.font = `italic ${width * 0.02}px ${cleanFontName}`;
      ctx.fillStyle = currentTheme.accentColor;
      
      let refText = `« ${customTitle} »`;
      if (customPage) refText += ` • p. ${customPage}`;
      if (extrait.chapitre) refText += ` • Ch. ${extrait.chapitre}`;

      ctx.fillText(refText, width / 2, signatureY + height * 0.032);
    }

    // Download flow
    const itemStr = customTitle.slice(0, 15).replace(/[^a-zA-Z]/g, '_');
    const fileName = `JeanneDArc_Quote_${itemStr || 'extrait'}.png`;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Split text helper to behave exactly like PDF word wraps on canvas
  const docSplitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) => {
    ctx.font = font;
    const words = text.split(/\s+/);
    let lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return { lines };
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-zinc-950/75 p-2 md:p-4 backdrop-blur-xs overflow-y-auto" id="quote-card-generation-suite">
      <div className="relative w-full max-w-5xl rounded-3xl border border-gold/30 bg-white shadow-2xl dark:bg-zinc-900 overflow-hidden flex flex-col md:flex-row h-[94vh] md:h-[88vh] max-h-[95vh]">
        
        {/* LEFT COLUMN: INTERACTIVE PREVIEW */}
        <div className="w-full md:flex-1 bg-zinc-100 dark:bg-zinc-950 p-4 md:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto h-[40vh] md:h-full">
          
          <div className="w-full flex items-center justify-between mb-4 md:hidden">
            <span className="font-serif text-[11px] font-bold text-gold uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={12} />
              {isFrench ? "Aperçu de la Carte" : "Card Preview"}
            </span>
            <button onClick={onClose} className="rounded-full bg-white/80 p-2 text-zinc-400 hover:text-zinc-600 dark:bg-zinc-900">
              <X size={16} />
            </button>
          </div>

          {/* ACTUAL LIVE MOCKUP REPLICATED WITH CSS */}
          <div 
            id="quote-preview-visual-card"
            className="shadow-xl transition-all duration-300 relative select-none w-full max-w-[280px] sm:max-w-[360px] md:max-w-[420px] max-h-full"
            style={{
              aspectRatio: currentRatio.ratio,
              backgroundColor: currentTheme.bgColor,
              color: currentTheme.textColor,
            }}
          >
            {/* Sizable Framing border */}
            {showFraming && (
              <div 
                className="absolute inset-[3.5%] pointer-events-none rounded transition-all"
                style={{
                  border: `2px solid ${currentTheme.borderColor}`,
                  outline: `1px solid ${currentTheme.accentColor}`,
                  outlineOffset: '-4px'
                }}
              />
            )}

            {/* Content area inside padding */}
            <div className="absolute inset-[8%] flex flex-col justify-between items-center text-center">
              
              {/* Ornament Element at top */}
              <div className="mt-2 min-h-[30px]" style={{ color: currentTheme.accentColor }}>
                {showOrnament === 'fleur-de-lys' && <span className="text-xl md:text-2xl">⚜️</span>}
                {showOrnament === 'quotes' && <span className="font-serif italic font-bold text-3xl md:text-4xl">“</span>}
                {showOrnament === 'line' && <div className="w-12 h-0.5" style={{ backgroundColor: currentTheme.accentColor }} />}
              </div>

              {/* Main Citation block in chosen font */}
              <div className="flex-1 flex flex-col justify-center w-full px-2">
                <p 
                  className="font-medium leading-relaxed m-0 pr-1 break-words line-clamp-8"
                  style={{
                    fontFamily: currentFont.fontFamily,
                    fontSize: `${fontSize * 0.9}px`,
                    fontStyle: selectedFont === 'calligraphy' ? 'italic' : 'normal',
                    lineHeight: lineHeight,
                    textAlign: textAlign
                  }}
                >
                  {customCitation}
                </p>

                {/* Optional Custom user reflection card */}
                {showNoteFlag && extrait.note && (
                  <div 
                    className="mt-4 p-2.5 rounded-md text-left border-l-2 transition-all block"
                    style={{
                      borderLeftColor: currentTheme.accentColor,
                      backgroundColor: currentTheme.id === 'royal-navy' ? 'rgba(212,175,55,0.08)' : 'rgba(212, 175, 55, 0.05)',
                    }}
                  >
                    <p 
                      className="font-serif italic font-bold text-[9px] uppercase tracking-wider mb-0.5"
                      style={{ color: currentTheme.accentColor }}
                    >
                      ✦ {isFrench ? 'Votre Réflexion :' : 'Personal Ref :'}
                    </p>
                    <p 
                      className="font-serif italic leading-relaxed text-[11px] line-clamp-3 m-0"
                      style={{ fontFamily: currentFont.fontFamily }}
                    >
                      {extrait.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Signature and metadata references at bottom */}
              <div className="w-full flex flex-col items-center gap-1.5 mt-2">
                <div className="w-10 h-[1px]" style={{ backgroundColor: `${currentTheme.textColor}22` }} />
                
                {showAuthor && (
                  <span 
                    className="font-bold uppercase tracking-wider text-[11px]"
                    style={{ fontFamily: currentFont.fontFamily }}
                  >
                    {customAuthor}
                  </span>
                )}

                {showSource && customTitle && (
                  <span 
                    className="text-[9px] font-medium tracking-wide"
                    style={{ 
                      fontFamily: currentFont.fontFamily, 
                      color: currentTheme.accentColor 
                    }}
                  >
                    « {customTitle} » {customPage ? `• p. ${customPage}` : ''}
                  </span>
                )}
              </div>

            </div>

          </div>

          <p className="text-[10px] text-zinc-400 mt-4 font-mono select-none">
            ⚡ {isFrench 
              ? "L'aperçu ci-dessus est optimisé pour les dimensions choisies." 
              : "Live visual card preview synchronized with export vectors."}
          </p>

          {/* Hidden utility Canvas for actual raw high-res drawing */}
          <canvas ref={canvasRef} className="hidden" />

        </div>

        {/* RIGHT COLUMN: REQUISITE CONTROLS / PALETTES */}
        <div className="w-full md:w-[400px] p-4 md:p-6 flex flex-col justify-between bg-white dark:bg-zinc-900 overflow-y-auto h-[54vh] md:h-full">
          
          <div className="space-y-6">
            
            {/* Modal Title bar for web */}
            <div className="hidden md:flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="font-serif text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={12} />
                  {isFrench ? "Générateur de Carte" : "Quote Card Studio"}
                </span>
                <h3 className="font-serif text-lg font-bold text-royal dark:text-gold uppercase">
                  {isFrench ? "Personnalisation" : "Design Suite"}
                </h3>
              </div>
              <button onClick={onClose} className="rounded-full bg-zinc-100 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* PARTIE I: DESIGN DE LA CARTE */}
            <div className="space-y-4">
              <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block border-b border-zinc-100 dark:border-zinc-800/60 pb-1">
                {isFrench ? "PARTIE I : DESIGN & AMBIANCE" : "PART I: DESIGN & THEME"}
              </span>

              {/* SECTION 1: STYLE DES POLICES (Serigraphy typographies) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-serif font-bold text-royal dark:text-gold uppercase tracking-widest flex items-center gap-1.5">
                  <Type size={11} />
                  {isFrench ? "Typographie & Police" : "Typography & Font"}
                </label>
                <div className="grid grid-cols-2 gap-1 px-1 py-1 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font.id)}
                      className={`py-1 px-1.5 rounded-lg text-[9px] font-medium transition-all text-left flex items-center gap-1 ${
                        selectedFont === font.id
                          ? 'bg-royal text-white dark:bg-gold dark:text-royal font-bold shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <span>✦</span>
                      <span className="truncate">{font.id === 'serif-elegant' ? 'Classic (Garamond)' : font.id === 'philosophe' ? 'Playfair' : font.id === 'medieval' ? 'Gothic' : font.id === 'calligraphy' ? 'Script' : font.id === 'machine' ? 'Typewriter' : 'Modern'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: THEME / COLORWAY FLAVORS */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-serif font-bold text-royal dark:text-gold uppercase tracking-widest flex items-center gap-1.5">
                  <Palette size={11} />
                  {isFrench ? "Couleurs & Arrière-plans" : "Color Themes"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      style={{ backgroundColor: theme.bgColor, color: theme.textColor, borderColor: theme.borderColor }}
                      className={`p-2 rounded-lg border relative text-left transition-all hover:scale-[1.01] flex flex-col justify-between h-12 ${
                        selectedTheme === theme.id ? 'ring-2 ring-gold shadow-sm border-gold' : 'border-zinc-200/80 shadow-sm dark:border-zinc-800'
                      }`}
                    >
                      <span 
                        className="font-serif font-bold text-[8.5px] leading-tight truncate w-full"
                        style={{ color: theme.textColor }}
                      >
                        {isFrench ? theme.nameFr : theme.nameEn}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: theme.accentColor }} />
                        <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: theme.borderColor }} />
                        <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: theme.textColor }} />
                      </div>
                      {selectedTheme === theme.id && (
                        <span className="absolute top-1 right-1 text-gold">
                          <Check size={8} className="stroke-[3]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Visual Free Color Palette */}
                <div className="mt-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[10px] font-sans font-bold text-royal dark:text-gold uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={useCustomColors}
                      onChange={(e) => setUseCustomColors(e.target.checked)}
                      className="accent-gold rounded cursor-pointer"
                    />
                    <span>🌈 {isFrench ? "Sur-mesure (Palette Libre)" : "Free Palette Creator"}</span>
                  </label>
                  
                  {useCustomColors && (
                    <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-sans font-bold">{isFrench ? "Fond" : "Background"}</span>
                        <input
                          type="color"
                          value={customBg}
                          onChange={(e) => setCustomBg(e.target.value)}
                          className="w-10 h-7 border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer p-0 bg-transparent"
                          title={isFrench ? "Couleur de fond" : "Background color"}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-sans font-bold">{isFrench ? "Texte" : "Text"}</span>
                        <input
                          type="color"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          className="w-10 h-7 border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer p-0 bg-transparent"
                          title={isFrench ? "Couleur du texte" : "Text color"}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-sans font-bold">{isFrench ? "Détails" : "Accents"}</span>
                        <input
                          type="color"
                          value={customAccent}
                          onChange={(e) => setCustomAccent(e.target.value)}
                          className="w-10 h-7 border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer p-0 bg-transparent"
                          title={isFrench ? "Couleur des ornements" : "Accent color"}
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* SECTION 3: SOCIAL DIMENSION RATIOS */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-serif font-bold text-royal dark:text-gold uppercase tracking-widest flex items-center gap-1.5">
                  <Sliders size={11} />
                  {isFrench ? "Format & Taille d'Image" : "Format & Sizing"}
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedRatio(ratio.id)}
                      className={`py-1 px-1.5 rounded-lg text-[8.5px] font-serif font-bold uppercase transition-all flex flex-col items-center justify-center ${
                        selectedRatio === ratio.id
                          ? 'bg-royal text-white dark:bg-gold dark:text-royal'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <span className="text-xs mb-0.5">{ratio.id === 'square' ? '⬛' : ratio.id === 'story' ? '📱' : '📺'}</span>
                      <span className="truncate w-full text-center">{ratio.id === 'square' ? 'Post (1:1)' : ratio.id === 'story' ? 'Story (9:16)' : 'Paysage (16:9)'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PARTIE II: SIGNATURES MINIATURES (1, 2, 3) */}
            <div className="space-y-4 pt-1">
              <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block border-b border-zinc-100 dark:border-zinc-800 pb-1">
                {isFrench ? "PARTIE II : INFORMATIONS (1, 2, 3)" : "PART II: CARD INFORMATIONS (1, 2, 3)"}
              </span>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-gold/20 dark:border-zinc-800 space-y-4">
                
                {/* 0. CORPS DE LA CITATION & ALIGNEMENT */}
                <div className="space-y-1.5 pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <label className="text-[10px] font-serif font-bold text-royal dark:text-gold uppercase tracking-widest flex items-center justify-between">
                    <span>✍️ {isFrench ? "Texte de la Citation" : "Quote Phrase Body"}</span>
                  </label>
                  <textarea
                    rows={3}
                    value={customCitation}
                    onChange={(e) => setCustomCitation(e.target.value)}
                    placeholder={isFrench ? "Saisir ou ajuster le texte de l'extrait" : "Type or adjust excerpt draft..."}
                    className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 transition-all font-sans"
                  />
                  
                  {/* Selectable Align choices buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-sans text-zinc-400 dark:text-zinc-300 font-bold uppercase tracking-wider">
                      {isFrench ? "Alignement" : "Text Align"}
                    </span>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => setTextAlign(align)}
                          className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                            textAlign === align
                              ? 'bg-royal text-white dark:bg-gold dark:text-royal'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                          }`}
                        >
                          {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1. NOM DE L'AUTEUR */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-serif font-bold text-royal dark:text-gold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-royal text-white dark:bg-gold dark:text-royal flex items-center justify-center text-[9px] font-mono leading-none font-bold">1</span>
                      {isFrench ? "Nom de l'Auteur" : "Author Name"}
                    </label>
                    <input
                      type="checkbox"
                      checked={showAuthor}
                      onChange={(e) => setShowAuthor(e.target.checked)}
                      className="accent-gold rounded cursor-pointer"
                      title={isFrench ? "Afficher/Masquer l'auteur" : "Toggle author display"}
                    />
                  </div>
                  <input
                    type="text"
                    value={customAuthor}
                    disabled={!showAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    placeholder={isFrench ? "Indiquer l'Auteur" : "Author Name"}
                    className={`w-full p-2 border rounded-lg text-xs bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 transition-all ${
                      showAuthor ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-900/40 opacity-50 bg-zinc-100'
                    }`}
                  />
                </div>

                {/* 2. TITRE DU LIVRE */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-serif font-bold text-royal dark:text-gold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-royal text-white dark:bg-gold dark:text-royal flex items-center justify-center text-[9px] font-mono leading-none font-bold">2</span>
                      {isFrench ? "Titre du Livre" : "Book Title"}
                    </label>
                    <input
                      type="checkbox"
                      checked={showSource}
                      onChange={(e) => setShowSource(e.target.checked)}
                      className="accent-gold rounded cursor-pointer"
                      title={isFrench ? "Afficher/Masquer le titre" : "Toggle title display"}
                    />
                  </div>
                  <input
                    type="text"
                    value={customTitle}
                    disabled={!showSource}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={isFrench ? "Indiquer le Livre d'Origine" : "Book Title"}
                    className={`w-full p-2 border rounded-lg text-xs bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 transition-all ${
                      showSource ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-900/40 opacity-50 bg-zinc-100'
                    }`}
                  />
                </div>

                {/* 3. PAGE DE L'EXTRAIT */}
                <div className="space-y-1">
                  <label className="text-[10px] font-serif font-bold text-royal dark:text-gold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-royal text-white dark:bg-gold dark:text-royal flex items-center justify-center text-[9px] font-mono leading-none font-bold">3</span>
                    {isFrench ? "Page de l'extrait" : "Excerpt Page"}
                  </label>
                  <input
                    type="text"
                    value={customPage}
                    disabled={!showSource}
                    onChange={(e) => setCustomPage(e.target.value)}
                    placeholder={isFrench ? "Ex: 42 (ou Ch. III)" : "Ex: 42"}
                    className={`w-full p-2 border rounded-lg text-xs bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 transition-all ${
                      showSource ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-900/40 opacity-50 bg-zinc-100'
                    }`}
                  />
                </div>

              </div>
            </div>

            {/* PARTIE III: OPTIONS SUPPLÉMENTAIRES */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block border-b border-zinc-100 dark:border-zinc-800 pb-1">
                {isFrench ? "PARTIE III : AJUSTEMENTS VISUELS" : "PART III: VISUAL REFINEMENTS"}
              </span>

              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                {/* Ornamental Head Option */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif font-medium text-zinc-600 dark:text-zinc-300">{isFrench ? "Ornement au sommet" : "Header Icon"}</span>
                  <select
                    value={showOrnament}
                    onChange={(e) => setShowOrnament(e.target.value)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded p-1 text-[11px]"
                  >
                    <option value="fleur-de-lys">Fleur-de-lys (⚜️)</option>
                    <option value="quotes">Guillemets (“)</option>
                    <option value="line">Filet élégant (—)</option>
                    <option value="none">{isFrench ? "Aucun" : "None"}</option>
                  </select>
                </div>

                {/* Text Size adjust slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-serif text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    <span>{isFrench ? "Taille de police citation" : "Text Sizing"}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="64"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-gold h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Line height slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-serif text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    <span>{isFrench ? "Interligne global" : "Line Height"}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{lineHeight}</span>
                  </div>
                  <input
                    type="range"
                    min="1.1"
                    max="2.0"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="w-full accent-gold h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Toggle controls checkbox row */}
                <div className="grid grid-cols-2 gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3 text-[10.5px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFraming}
                      onChange={(e) => setShowFraming(e.target.checked)}
                      className="accent-gold rounded"
                    />
                    <span>{isFrench ? "Bordures Or & Vintage" : "Vintage Frame"}</span>
                  </label>
                  {extrait.note && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNoteFlag}
                        onChange={(e) => setShowNoteFlag(e.target.checked)}
                        className="accent-gold rounded"
                      />
                      <span>{isFrench ? "Inclure mes notes" : "Show Notes"}</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* EXPORTER TRIGGER (PARTIE IV: MOYEN DE TÉLÉCHARGER) */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 mt-6 flex flex-col gap-3">
            <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block text-center">
              {isFrench ? "PARTIE IV : DIFFUSION & EXPORT" : "PART IV: EXPORT & DOWNLOAD"}
            </span>
            <div className="flex gap-2">
              <button
                id="quote-card-close-btn-footer"
                onClick={onClose}
                className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold font-serif uppercase tracking-wider transition-all text-zinc-500"
              >
                {isFrench ? "Annuler" : "Cancel"}
              </button>
              <button
                id="quote-card-download-png-btn"
                onClick={drawAndDownloadImage}
                className="flex-1 bg-royal text-white dark:bg-gold dark:text-royal py-3 px-4 rounded-xl font-serif font-bold text-xs uppercase tracking-widest hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-royal/10"
              >
                <Download size={14} />
                <span>{isFrench ? "Générer & Télécharger PNG" : "Export Card (.PNG)"}</span>
              </button>
            </div>
            <p className="text-[9.5px] text-center text-zinc-400 leading-snug">
              {isFrench 
                ? "Cliquez ci-dessus pour générer une image haute résolution (PNG) de votre extrait optimisée pour le format sélectionné." 
                : "Generate and save high-resolution publication-ready JPG/PNG assets."}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
