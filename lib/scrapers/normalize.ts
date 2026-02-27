// lib/scrapers/normalize.ts
// Normaliza eventos de diferentes fontes para um formato uniforme
// e deduplica eventos repetidos

import type { RawEvent, NormalizedEvent, EventCategory } from './types';

// Meses em português para parsing de datas
const MESES: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

const VALID_CATEGORIES: EventCategory[] = [
  'música', 'teatro', 'dança', 'cinema', 'exposição',
  'workshop', 'literatura', 'infantil', 'festival', 'desporto', 'visita', 'outro',
];

// === Normalização ===
export function normalizeEvents(raw: RawEvent[]): NormalizedEvent[] {
  return raw
    .map(normalizeOne)
    .filter((e): e is NormalizedEvent => e !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeOne(raw: RawEvent): NormalizedEvent | null {
  const title = cleanText(raw.title);
  if (!title || title.length < 3) return null;

  const date = parseDate(raw.date || '');
  // Se não conseguimos parsear a data, usamos hoje
  const isoDate = date ? formatISO(date) : new Date().toISOString().split('T')[0];

  const endDate = raw.endDate ? parseDate(raw.endDate) : null;
  const category = normalizeCategory(raw.category || '', title);
  const id = generateId(title, isoDate);

  return {
    id,
    title,
    description: cleanText(raw.description || ''),
    date: isoDate,
    endDate: endDate ? formatISO(endDate) : undefined,
    time: raw.time || extractTimeFromDate(raw.date || ''),
    location: cleanText(raw.location || 'Barreiro'),
    category,
    imageUrl: raw.imageUrl || undefined,
    sourceUrl: raw.sourceUrl || undefined,
    source: raw.source,
    tags: raw.tags || [],
    featured: false,
    scrapedAt: new Date().toISOString(),
  };
}

// === Parsing de datas ===
function parseDate(input: string): Date | null {
  if (!input) return null;

  // Já é ISO 8601? (2026-03-15 ou 2026-03-15T21:00:00)
  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(input);

  // Formato "15 de março de 2026" ou "15 março 2026"
  const ptMatch = input.match(/(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})/i);
  if (ptMatch) {
    const [, day, monthStr, year] = ptMatch;
    const month = MESES[monthStr.toLowerCase()];
    if (month !== undefined) return new Date(parseInt(year), month, parseInt(day));
  }

  // Formato "15/03/2026" ou "15-03-2026"
  const numMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (numMatch) {
    const [, day, month, year] = numMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Formato "Mar 15, 2026" ou "March 15, 2026"
  const enMatch = input.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (enMatch) {
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d;
  }

  // Tentar Date.parse como último recurso
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) return parsed;

  return null;
}

function formatISO(d: Date): string {
  return d.toISOString().split('T')[0]; // "2026-03-15"
}

function extractTimeFromDate(input: string): string {
  const m = input.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '';
}

// === Categorias ===
function normalizeCategory(raw: string, title: string): EventCategory {
  const s = (raw + ' ' + title).toLowerCase();

  if (s.includes('concert') || s.includes('music') || s.includes('música') || s.includes('concerto') || s.includes('dj') || s.includes('jazz') || s.includes('punk') || s.includes('rock') || s.includes('fado')) return 'música';
  if (s.includes('festival') || s.includes('fest ') || s.includes('fest\'') || s.includes('festas')) return 'festival';
  if (s.includes('teatro') || s.includes('theatre') || s.includes('peça') || s.includes('dramaturgia')) return 'teatro';
  if (s.includes('dança') || s.includes('dance') || s.includes('ballet') || s.includes('bailar')) return 'dança';
  if (s.includes('cinema') || s.includes('filme') || s.includes('film') || s.includes('curta') || s.includes('documentário')) return 'cinema';
  if (s.includes('exposição') || s.includes('exhibition') || s.includes('galeria') || s.includes('fotografia') || s.includes('artes visuais') || s.includes('pintura')) return 'exposição';
  if (s.includes('workshop') || s.includes('oficina') || s.includes('ateliê') || s.includes('formação') || s.includes('curso')) return 'workshop';
  if (s.includes('livro') || s.includes('leitura') || s.includes('poesia') || s.includes('literatura') || s.includes('biblioteca') || s.includes('contos')) return 'literatura';
  if (s.includes('infantil') || s.includes('crianças') || s.includes('júnior') || s.includes('famíli') || s.includes('bebé') || s.includes('kids')) return 'infantil';
  if (s.includes('desporto') || s.includes('corrida') || s.includes('atletismo') || s.includes('futebol') || s.includes('natação')) return 'desporto';
  if (s.includes('visita') || s.includes('caminhada') || s.includes('passeio') || s.includes('percurso') || s.includes('tour')) return 'visita';

  return 'outro';
}

// === Deduplicação ===
export function deduplicateEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const seen = new Map<string, NormalizedEvent>();

  for (const e of events) {
    const key = dedupeKey(e);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, e);
    } else {
      // Merge: manter o que tem mais informação
      seen.set(key, mergeEvents(existing, e));
    }
  }

  return Array.from(seen.values());
}

function dedupeKey(e: NormalizedEvent): string {
  // Normalizar título para comparação (remove acentos, lowercase, remove espaços extra)
  const normTitle = e.title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 50);
  return `${normTitle}|${e.date}`;
}

function mergeEvents(a: NormalizedEvent, b: NormalizedEvent): NormalizedEvent {
  return {
    ...a,
    description: a.description.length >= b.description.length ? a.description : b.description,
    time: a.time || b.time,
    location: a.location !== 'Barreiro' ? a.location : b.location,
    imageUrl: a.imageUrl || b.imageUrl,
    tags: [...new Set([...a.tags, ...b.tags])],
  };
}

// === Utilitários ===
function cleanText(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]+/g, ' ')
    .trim();
}

function generateId(title: string, date: string): string {
  const base = `${title.toLowerCase().slice(0, 40)}-${date}`;
  // Hash simples mas determinístico
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  }
  return `evt-${Math.abs(hash).toString(36)}`;
}