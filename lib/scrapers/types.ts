// lib/scrapers/types.ts

export interface RawEvent {
  title: string;
  description?: string;
  date?: string;        // ISO string ou texto livre
  endDate?: string;     // ISO string ou texto livre
  time?: string;        // ex: "21:00" ou "14:00 - 18:00"
  location?: string;    // nome do espaço/local
  category?: string;    // ex: "música", "teatro", "exposição"
  imageUrl?: string;    // URL da imagem
  sourceUrl?: string;   // link para o evento original
  source: 'cm-barreiro-agenda' | 'cm-barreiro-junior' | 'outra';
  tags?: string[];
}

export interface NormalizedEvent {
  id: string;           // hash único baseado em título+data
  title: string;
  description: string;
  date: string;         // ISO 8601: "2026-03-15"
  endDate?: string;     // ISO 8601
  time?: string;
  location: string;
  category: EventCategory;
  imageUrl?: string;
  sourceUrl?: string;
  source: string;
  tags: string[];
  featured: boolean;
  scrapedAt: string;    // ISO timestamp de quando foi recolhido
}

export type EventCategory =
  | 'música'
  | 'teatro'
  | 'dança'
  | 'cinema'
  | 'exposição'
  | 'workshop'
  | 'literatura'
  | 'infantil'
  | 'festival'
  | 'desporto'
  | 'visita'
  | 'outro';

export interface ScrapeResult {
  source: string;
  events: NormalizedEvent[];
  scrapedAt: string;
  errors: string[];
}