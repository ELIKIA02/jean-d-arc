import { useState } from 'react';
import { Download, FileText, Share2, Clipboard, Check, Twitter, Instagram, Linkedin, MessageSquare, AlertCircle, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Extrait, LivreMetadata } from '../types';
import { getLangue } from '../utils/storage';
import { formatForTwitter, formatForInstagram, formatForLinkedIn, formatForTikTok } from '../utils/formatters';

interface ExportPanelProps {
  selectedExtraits: Extrait[];
  allExtraits: Extrait[];
  metadata: LivreMetadata;
  onShowToast: (message: string) => void;
}

export default function ExportPanel({
  selectedExtraits,
  allExtraits,
  metadata,
  onShowToast,
}: ExportPanelProps) {
  const isFrench = getLangue() === 'FR';
  
  // Tab State
  const [activeExporterTab, setActiveExporterTab] = useState<'files' | 'social'>('files');
  const [socialIdx, setSocialIdx] = useState<number>(0);
  const [showFormatDropdown, setShowFormatDropdown] = useState<boolean>(false);

  const targetExtraits = selectedExtraits.length > 0 ? selectedExtraits : allExtraits;
  const isBatchFiltered = selectedExtraits.length > 0;

  // 1️⃣ EXPORT AS TEXT FILE (.txt)
  const handleExportText = () => {
    if (targetExtraits.length === 0) return;

    let content = `========================================================\n`;
    content += `        ⚜️ JEAN D'ARC — DOSSIER D'EXTRAITS LITTÉRAIRES \n`;
    content += `========================================================\n\n`;
    content += `Ouvrage : ${metadata.titre}\n`;
    content += `Auteur(e) : ${metadata.auteur}\n`;
    content += `Date d'export : ${new Date().toLocaleDateString()}\n`;
    content += `Scope : ${isBatchFiltered ? `Sélection de ${targetExtraits.length} extraits` : `Tous les ${allExtraits.length} extraits`}\n`;
    content += `--------------------------------------------------------\n\n`;

    targetExtraits.forEach((ext, idx) => {
      content += `[Extrait ${idx + 1}]\n`;
      content += `« ${ext.citation} »\n`;
      content += `[📍 ${metadata.auteur} — ${metadata.titre}${ext.page ? `, p. ${ext.page}` : ''}${ext.chapitre ? `, Ch. ${ext.chapitre}` : ''}]\n`;
      if (ext.note) {
        content += `${isFrench ? 'Réflexion : ' : 'Reflection: '}${ext.note}\n`;
      }
      content += `\n--------------------------------------------------------\n\n`;
    });

    content += `Généré avec dévouement par l'application Jean d'Arc Extraits. ⚜️`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jean-d-arc-${metadata.titre.toLowerCase().replace(/\s+/g, '-')}-extraits.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(isFrench ? "✓ Extraits téléchargés au format TXT !" : "✓ Excerpts downloaded as TXT file!");
  };

  // 2️⃣ EXPORT AS WORD DOCUMENT (.doc - MS-Word compatible HTML/CSS format)
  const handleExportWord = () => {
    if (targetExtraits.length === 0) return;

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Jean d'Arc Literature Extracts</title>
        <style>
          body { font-family: "Calibri", sans-serif; color: #2c2c2c; line-height: 1.5; padding: 2cm; }
          .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 40px; }
          .brand { font-size: 24pt; font-family: "Georgia", serif; color: #1E3A5F; font-weight: bold; letter-spacing: 2px; }
          .title { font-size: 16pt; font-weight: bold; margin-top: 10px; color: #2c2c2c; }
          .author { font-size: 12pt; italic; color: #6b7280; }
          .meta-info { font-size: 10pt; color: #9ca3af; margin-top: 5px; }
          .extract-card { margin-bottom: 30px; border-left: 4px solid #D4AF37; padding-left: 15px; margin-left: 10px; }
          .citation { font-style: italic; font-size: 11pt; color: #4b5563; margin-bottom: 10px; }
          .ref { font-size: 10pt; color: #555555; font-family: "Calibri", sans-serif; font-weight: bold; }
          .footer { text-align: center; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #9ca3af; padding-top: 15px; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">⚜️ JEAN D'ARC</div>
          <div class="title">Rapport d'extractions littéraires de citations</div>
          <div class="author">Ouvrage : <b>${metadata.titre}</b> de ${metadata.auteur}</div>
          <div class="meta-info">Fichier analysé : ${metadata.fileName} (${metadata.fileSize}) | Date : ${new Date().toLocaleDateString()}</div>
        </div>
    `;

    targetExtraits.forEach((ext, idx) => {
      html += `
        <div class="extract-card">
          <div class="citation">« ${ext.citation} »</div>
          <div class="ref">📍 ${metadata.auteur} — ${metadata.titre}${ext.page ? ` • p. ${ext.page}` : ''}${ext.chapitre ? ` • Ch. ${ext.chapitre}` : ''}</div>
          ${ext.note ? `<div class="note" style="margin-top: 10px; padding: 8px; background-color: #fcfcf4; border-left: 2px solid #D4AF37; font-size: 10pt; font-style: italic; color: #555555;"><b>${isFrench ? 'Réflexion :' : 'Note:'}</b> ${ext.note}</div>` : ''}
        </div>
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
      `;
    });

    html += `
        <div class="footer">
          Document d'extraits officiels généré par l'application <b>Jean d'Arc Extraits</b>.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jean-d-arc-${metadata.titre.toLowerCase().replace(/\s+/g, '-')}-extraits.doc`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(isFrench ? "✓ Rapport Word (.doc) prétéléchargé !" : "✓ Word report (.doc) downloaded!");
  };

  // 3️⃣ EXPORT AS PDF DOCUMENT (.pdf) using jsPDF
  const handleExportPDF = () => {
    if (targetExtraits.length === 0) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Color definitions
    const cRoyal = [30, 58, 95];
    const cGold = [212, 175, 55];
    const cGrey = [100, 110, 120];

    // Page margins and height
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 25;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 25;
        // Page numbers
        doc.setFont('Georgia', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Jean d'Arc Extraits — ${metadata.titre}`, margin, pageHeight - 10);
      }
    };

    // Draw main emblem heading
    doc.setFont('Georgia', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(cRoyal[0], cRoyal[1], cRoyal[2]);
    doc.text('⚜️ JEAN D\'ARC', pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(cGrey[0], cGrey[1], cGrey[2]);
    doc.text('LE GESTIONNAIRE DE COUPS DE CŒUR LITTÉRAIRES', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Golden boundary line
    doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Metadata details
    doc.setFont('Courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`OUVRAGE : ${metadata.titre.toUpperCase()}`, margin, y);
    y += 5;
    doc.text(`AUTEUR   : ${metadata.auteur.toUpperCase()}`, margin, y);
    y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Document : ${metadata.fileName} | Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 12;

    // Print cards
    targetExtraits.forEach((ext, index) => {
      // Split citation text so it wraps elegantly in the pdf
      const splitCitation = doc.splitTextToSize(`« ${ext.citation} »`, pageWidth - margin * 2 - 12);
      const citationHeight = splitCitation.length * 5;
      
      let noteHeight = 0;
      let splitNote: any[] = [];
      if (ext.note) {
        splitNote = doc.splitTextToSize(`${isFrench ? 'Réflexion: ' : 'Reflection: '}${ext.note}`, pageWidth - margin * 2 - 16);
        noteHeight = splitNote.length * 4.5 + 4;
      }

      const totalNeededHeight = citationHeight + noteHeight + 15;

      checkPageBreak(totalNeededHeight);

      // Left gold accent line representing entry
      doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
      doc.setLineWidth(1);
      doc.line(margin, y, margin, y + citationHeight + noteHeight + 6);

      // Write citation content
      doc.setFont('Times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(splitCitation, margin + 4, y + 4);
      y += citationHeight + 4;

      // Write personal reflection if exists
      if (ext.note) {
        doc.setFillColor(252, 252, 244);
        doc.rect(margin + 4, y + 1, pageWidth - margin * 2 - 8, noteHeight - 2, 'F');
        
        doc.setFont('Times', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(splitNote, margin + 6, y + 4.5);
        y += noteHeight;
      }

      // Card meta tags/chapter data
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(cRoyal[0], cRoyal[1], cRoyal[2]);
      const location = `📍 ${metadata.auteur} — ${metadata.titre}${ext.page ? ` • p. ${ext.page}` : ''}${ext.chapitre ? ` • Ch. ${ext.chapitre}` : ''}`;
      doc.text(location, margin + 4, y + 2);
      y += 10;
    });

    // Save
    doc.save(`jean-d-arc-${metadata.titre.toLowerCase().replace(/\s+/g, '-')}-extraits.pdf`);
    onShowToast(isFrench ? "✓ Document PDF mémorable téléchargé !" : "✓ Gorgeous PDF document downloaded!");
  };

  // Helper functions for social media network previews
  const activeExcerptForSocial = targetExtraits[socialIdx] || targetExtraits[0];

  const handleCopyTwitter = () => {
    if (!activeExcerptForSocial) return;
    const txt = formatForTwitter(activeExcerptForSocial, metadata.auteur);
    navigator.clipboard.writeText(txt);
    onShowToast(isFrench ? "✓ Forgé pour Twitter/X !" : "✓ Perfect tweet format copied!");
  };

  const handleCopyInstagram = () => {
    if (!activeExcerptForSocial) return;
    const txt = formatForInstagram(activeExcerptForSocial, metadata.auteur, metadata.titre);
    navigator.clipboard.writeText(txt);
    onShowToast(isFrench ? "✓ Style Instagram copié avec hashtags !" : "✓ Instagram copy complete!");
  };

  const handleCopyLinkedIn = () => {
    if (!activeExcerptForSocial) return;
    const txt = formatForLinkedIn(activeExcerptForSocial, metadata.auteur, metadata.titre);
    navigator.clipboard.writeText(txt);
    onShowToast(isFrench ? "✓ Post LinkedIn copié dans le presse-papiers !" : "✓ LinkedIn post template copied!");
  };

  const handleCopyTikTok = () => {
    if (!activeExcerptForSocial) return;
    const txt = formatForTikTok(activeExcerptForSocial, metadata.auteur);
    navigator.clipboard.writeText(txt);
    onShowToast(isFrench ? "✓ Caption BookTok forgé avec style !" : "✓ BookTok caption copied!");
  };

  if (targetExtraits.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl mt-8 pt-8 border-t border-gold/20" id="multiformat-export-panel">
      
      <div className="rounded-2xl border border-gold/40 bg-zinc-900 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-5 text-gold text-8xl pointer-events-none font-serif font-extrabold select-none">GOLDEN</div>
        
        <div className="flex flex-col lg:flex-row gap-8 justify-between">
          
          {/* Left instructions block */}
          <div className="space-y-4 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 text-gold px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase border border-gold/15">
              ⚜️ {isFrench ? "ÉTAPE FINALE : EXPORTATION" : "FINAL STEP: MULTI-EXPORT"}
            </span>

            <h3 className="font-serif text-3xl font-bold tracking-tight text-gold uppercase">
              {isFrench ? "Façonner vos Publications" : "Forge your deliverables"}
            </h3>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {isFrench 
                ? `Exportez vos sélections vers des formats d'archive haut de gamme (.doc, .pdf, .txt) ou prévisualisez et copiez les textes précalculés avec hashtags adaptés à vos réseaux sociaux favoris.`
                : `Deliver your selected text gems into professional, ready-to-import files (.doc, .pdf) or preview formats custom-styled to skyrocket bookish outreach on social profiles.`}
            </p>

            {isBatchFiltered && (
              <div className="rounded-lg bg-gold/10 p-3.5 border border-gold/30 text-xs text-gold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <p>
                  {isFrench 
                    ? `Mode ciblé : Seulement les ${selectedExtraits.length} extraits cochés seront inclus dans l'export.`
                    : `Active Focus: Only the ${selectedExtraits.length} currently checked quotes will be downloaded.`}
                </p>
              </div>
            )}
            
            {/* Tab switchers */}
            <div className="flex rounded-lg bg-zinc-800 p-1 border border-zinc-700 max-w-sm mt-4">
              <button
                type="button"
                id="tab-exporter-files"
                onClick={() => setActiveExporterTab('files')}
                className={`flex-1 text-xs py-2 rounded-md font-bold uppercase transition-all ${activeExporterTab === 'files' ? 'bg-gold text-zinc-900 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                💾 {isFrench ? "Fichiers à télécharger" : "Download Files"}
              </button>
              <button
                type="button"
                id="tab-exporter-social"
                onClick={() => setActiveExporterTab('social')}
                className={`flex-1 text-xs py-2 rounded-md font-bold uppercase transition-all ${activeExporterTab === 'social' ? 'bg-gold text-zinc-900 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                📱 {isFrench ? "Prêt-à-poster" : "Social Outputs"}
              </button>
            </div>
          </div>

          {/* Right Export Interfaces Column */}
          <div className="flex-1 max-w-xl">
            
            {/* FILES EXPORT OPTION */}
            {activeExporterTab === 'files' && (
              <div className="space-y-6 animate-fadeIn py-2">
                <p className="text-xs text-zinc-400 font-mono tracking-wider uppercase">
                  {isFrench ? "GÉNÉRATION D'ARCHIVES À TELECHARGER :" : "HIGH-FIDELITY BATCH DOWNLOADABLE FILES:"}
                </p>
                
                <div className="relative inline-block w-full">
                  <button
                    type="button"
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl font-serif font-bold text-sm transition-all bg-gold hover:bg-gold-hover text-zinc-950 shadow-lg border border-gold/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📥</span>
                      <span>{isFrench ? "Exporter le dossier d'extraits..." : "Export excerpts folder..."}</span>
                    </div>
                    <ChevronDown size={18} className={`transition-transform duration-200 ${showFormatDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showFormatDropdown && (
                    <>
                      {/* Backdrop to close dropdown easily */}
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowFormatDropdown(false)} />
                      
                      <div className="absolute right-0 left-0 mt-2 rounded-xl border border-zinc-700 bg-zinc-800 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-700/50 animate-fadeIn">
                        
                        {/* WORD */}
                        <button
                          type="button"
                          onClick={() => {
                            handleExportWord();
                            setShowFormatDropdown(false);
                          }}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-700 transition-colors text-left"
                        >
                          <span className="text-2xl">📘</span>
                          <div className="flex-1">
                            <h4 className="font-serif font-bold text-sm text-white">Document Microsoft Word</h4>
                            <span className="text-[10px] text-zinc-400">Format .doc (Calibri Report)</span>
                          </div>
                        </button>

                        {/* PDF */}
                        <button
                          type="button"
                          onClick={() => {
                            handleExportPDF();
                            setShowFormatDropdown(false);
                          }}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-700 transition-colors text-left"
                        >
                          <span className="text-2xl">📕</span>
                          <div className="flex-1">
                            <h4 className="font-serif font-bold text-sm text-white">Document Portrait PDF</h4>
                            <span className="text-[10px] text-zinc-400">Format .pdf (A4 Georgia Margins)</span>
                          </div>
                        </button>

                        {/* TXT */}
                        <button
                          type="button"
                          onClick={() => {
                            handleExportText();
                            setShowFormatDropdown(false);
                          }}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-700 transition-colors text-left"
                        >
                          <span className="text-2xl">📓</span>
                          <div className="flex-1">
                            <h4 className="font-serif font-bold text-sm text-white">Fichier Texte Brut</h4>
                            <span className="text-[10px] text-zinc-400">Format .txt (Hyphen Separated)</span>
                          </div>
                        </button>

                      </div>
                    </>
                  )}
                </div>
                
                <p className="text-[10px] text-zinc-500 font-mono text-center pt-2">
                  🛡️ {isFrench ? "Chaque fichier comprend en en-tête les détails d'origine du livre." : "Each generated paper embeds corresponding reference metadata records."}
                </p>
              </div>
            )}

            {/* SOCIAL READY PREVIEW COMPONENT */}
            {activeExporterTab === 'social' && activeExcerptForSocial && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Navigator carousel between selected items */}
                <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                  <span className="text-xs text-zinc-400 font-mono">
                    {isFrench ? "RÉSEAUX SOCIAUX (Ajustement par extrait) :" : "PRESETS CAROUSEL FOR EACH ELEMENT:"}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="social-prev-excerpt-btn"
                      disabled={socialIdx === 0}
                      onClick={() => setSocialIdx(socialIdx - 1)}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 font-bold border border-zinc-700 disabled:opacity-30"
                    >
                      ◄ {isFrench ? "Précédent" : "Prev"}
                    </button>
                    <span className="font-mono text-xs font-bold text-gold bg-zinc-800 rounded px-2">
                      {socialIdx + 1} / {targetExtraits.length}
                    </span>
                    <button
                      type="button"
                      id="social-next-excerpt-btn"
                      disabled={socialIdx >= targetExtraits.length - 1}
                      onClick={() => setSocialIdx(socialIdx + 1)}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 font-bold border border-zinc-700 disabled:opacity-30"
                    >
                      {isFrench ? "Suivant" : "Next"} ►
                    </button>
                  </div>
                </div>

                {/* Excerpt current highlight citation placeholder */}
                <div className="p-3 bg-zinc-800 rounded-lg text-xs italic text-zinc-300 border-l-2 border-gold max-h-20 overflow-y-auto">
                  “ {activeExcerptForSocial.citation} ”
                </div>

                {/* Grid channels templates copying */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  
                  {/* Twitter channel */}
                  <button
                    type="button"
                    id="copy-twitter-format-btn"
                    onClick={handleCopyTwitter}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-700 bg-zinc-800 text-left hover:bg-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-cyan-400"><Twitter size={15} /></span>
                      <span className="font-serif font-bold uppercase tracking-wider text-[11px]">TWITTER / X FORMAT</span>
                    </div>
                    <Clipboard size={12} className="text-zinc-500 shrink-0" />
                  </button>

                  {/* Instagram Channel */}
                  <button
                    type="button"
                    id="copy-instagram-format-btn"
                    onClick={handleCopyInstagram}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-700 bg-zinc-800 text-left hover:bg-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-pink-400"><Instagram size={15} /></span>
                      <span className="font-serif font-bold uppercase tracking-wider text-[11px]">INSTAGRAM FORMAT</span>
                    </div>
                    <Clipboard size={12} className="text-zinc-500 shrink-0" />
                  </button>

                  {/* LinkedIn Channel */}
                  <button
                    type="button"
                    id="copy-linkedin-format-btn"
                    onClick={handleCopyLinkedIn}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-700 bg-zinc-800 text-left hover:bg-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-blue-400"><Linkedin size={15} /></span>
                      <span className="font-serif font-bold uppercase tracking-wider text-[11px]">LINKEDIN REPORT</span>
                    </div>
                    <Clipboard size={12} className="text-zinc-500 shrink-0" />
                  </button>

                  {/* TikTok BookTok channel */}
                  <button
                    type="button"
                    id="copy-tiktok-format-btn"
                    onClick={handleCopyTikTok}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-700 bg-zinc-800 text-left hover:bg-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-emerald-400"><MessageSquare size={15} /></span>
                      <span className="font-serif font-bold uppercase tracking-wider text-[11px]">TIKTOK BOOKTOK</span>
                    </div>
                    <Clipboard size={12} className="text-zinc-500 shrink-0" />
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
