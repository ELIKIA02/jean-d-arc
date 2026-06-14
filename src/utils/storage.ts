import { HistoriqueItem, Extrait, ConfigExtrait } from '../types';

const KEYS = {
  HISTORIQUE: 'jeandarc_historique',
  FAVORIS: 'jeandarc_favoris',
  MISTRAL_KEY: 'jeandarc_mistral_api_key',
  THEME: 'jeandarc_theme',
  LANGUE: 'jeandarc_langue',
};

export const getMistralKey = (): string => {
  return localStorage.getItem(KEYS.MISTRAL_KEY) || '';
};

export const saveMistralKey = (key: string): void => {
  localStorage.setItem(KEYS.MISTRAL_KEY, key.trim());
};

export const getTheme = (): 'clair' | 'sombre' | 'medieval' => {
  return (localStorage.getItem(KEYS.THEME) as any) || 'medieval';
};

export const saveTheme = (theme: 'clair' | 'sombre' | 'medieval'): void => {
  localStorage.setItem(KEYS.THEME, theme);
};

export const getLangue = (): 'FR' | 'EN' => {
  return (localStorage.getItem(KEYS.LANGUE) as 'FR' | 'EN') || 'FR';
};

export const saveLangue = (langue: 'FR' | 'EN'): void => {
  localStorage.setItem(KEYS.LANGUE, langue);
};

export const getHistorique = (): HistoriqueItem[] => {
  try {
    const data = localStorage.getItem(KEYS.HISTORIQUE);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error parsing history', e);
    return [];
  }
};

export const saveHistorique = (items: HistoriqueItem[]): void => {
  localStorage.setItem(KEYS.HISTORIQUE, JSON.stringify(items.slice(0, 20))); // Limit to latest 20 items
};

export const getFavoris = (): Extrait[] => {
  try {
    const data = localStorage.getItem(KEYS.FAVORIS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error parsing favorites', e);
    return [];
  }
};

export const saveFavoris = (items: Extrait[]): void => {
  localStorage.setItem(KEYS.FAVORIS, JSON.stringify(items));
};
