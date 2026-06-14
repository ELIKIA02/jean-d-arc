export interface LivreMetadata {
  titre: string;
  auteur: string;
  chapitre: string;
  pagesRange: string;
  totalChars: number;
  fileName: string;
  fileSize: string;
  estimatedPages: number;
}

export interface Extrait {
  id: string;
  citation: string;
  page?: string;
  chapitre?: string;
  auteur?: string;
  titreLivre?: string;
  score: number; // e.g. 9 for 9/10
  tags: string[];
  theme: string; // 'sagesse', 'amour', 'humour', 'intrigue', 'philosophie'
  typeContenu: 'citation' | 'dialogue' | 'reflexion' | 'poetique' | 'charniere';
  contextBefore?: string;
  note?: string;
}

export interface ConfigExtrait {
  scope: 'chapitre' | 'livre';
  nombre: number;
  langue: 'FR' | 'EN';
  themes: string[]; // sagesse, amour, humour, intrigue, philosophie etc.
  charLimits: [number, number]; // e.g. [40, 280]
  scoreMin: number; // 5-10
  tonalite: 'Neutre' | 'Inspirant' | 'Provocant' | 'Calme';
  typeExtraction: 'rapide' | 'approfondie';
}

export interface HistoriqueItem {
  id: string;
  timestamp: number;
  metadata: LivreMetadata;
  config: ConfigExtrait;
  extraits: Extrait[];
}

export type AppStateStatus = 'IDLE' | 'UPLOADING' | 'PARSING' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'EXPORTING';
