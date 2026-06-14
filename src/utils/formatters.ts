import { Extrait } from '../types';

export const formatForTwitter = (extrait: Extrait, auteur: string): string => {
  const quote = `« ${extrait.citation} »`;
  const meta = `\n\n— ${auteur || extrait.auteur || 'Anonyme'}${extrait.page ? `, ${extrait.page}` : ''}`;
  return `${quote}${meta}`;
};

export const formatForInstagram = (extrait: Extrait, auteur: string, titre: string): string => {
  const heading = `📖 Une pépite littéraire à méditer...\n\n`;
  const quote = `« ${extrait.citation} »\n\n`;
  const meta = `✨ ${auteur || extrait.auteur || 'Anonyme'} — ${titre || extrait.titreLivre || 'Livre'}${extrait.page ? ` (${extrait.page})` : ''}\n\n`;
  const reflection = `Qu'en pensez-vous ? Répondez-moi en commentaire ! 👇`;
  return `${heading}${quote}${meta}${reflection}`;
};

export const formatForLinkedIn = (extrait: Extrait, auteur: string, titre: string): string => {
  const hook = `💡 [Inspiration littéraire] Prendre de la hauteur avec les grands esprits.\n\n`;
  const quote = `« ${extrait.citation} »\n\n`;
  const credit = `Cet extrait issu de l'ouvrage "${titre || extrait.titreLivre || 'livre'}" de ${auteur || extrait.auteur || 'Anonyme'} ${extrait.page ? `(${extrait.page})` : ''} résonne puissamment aujourd'hui.\n\n`;
  const cta = `Cette pensée nous invite à nous interroger sur nos propres perspectives. Quelle est votre interprétation ?`;
  return `${hook}${quote}${credit}${cta}`;
};

export const formatForTikTok = (extrait: Extrait, auteur: string): string => {
  const catchphrase = `POV: Tu ouvres un livre au hasard et tu tombes sur ÇA... 👀\n\n`;
  const quote = `« ${extrait.citation} »\n\n`;
  const meta = `✍️ ${auteur || extrait.auteur || 'Anonyme'}`;
  return `${catchphrase}${quote}${meta}`;
};

export const formatGroupedText = (extraits: Extrait[], auteur: string, titre: string): string => {
  if (extraits.length === 0) return '';
  return extraits.map((ext, idx) => {
    return `${idx + 1}. « ${ext.citation} »\n[${auteur || ext.auteur || 'Anonyme'} - ${titre || ext.titreLivre || 'Livre'}${ext.page ? `, ${ext.page}` : ''}${ext.chapitre ? `, Ch. ${ext.chapitre}` : ''}]\n`;
  }).join('\n=========================\n\n');
};
