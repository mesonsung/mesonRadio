/**
 * 廣播站台模型
 * Radio Station Model
 */

export interface Station {
  id: string;
  name: string;
  url: string;
  icon?: string; // Base64 or URL
  type: 'radio' | 'podcast';
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StationFormData {
  name: string;
  url: string;
  icon?: string;
  type: 'radio' | 'podcast';
}

export interface SearchResult {
  name: string;
  url: string;
  favicon?: string;
  country?: string;
  language?: string;
  tags?: string[];
}

