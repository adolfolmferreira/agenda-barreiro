export const MO: Record<number, string> = {
  0:'jan', 1:'fev', 2:'mar', 3:'abr', 4:'mai', 5:'jun',
  6:'jul', 7:'ago', 8:'set', 9:'out', 10:'nov', 11:'dez',
};
export const MO_FULL: Record<number, string> = {
  0:'Janeiro', 1:'Fevereiro', 2:'Março', 3:'Abril',
  4:'Maio', 5:'Junho', 6:'Julho', 7:'Agosto',
  8:'Setembro', 9:'Outubro', 10:'Novembro', 11:'Dezembro',
};

export function pd(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

export function fmtRange(start: string, end?: string | null): string {
  const d1 = pd(start);
  if (!d1) return '';
  const day1 = d1.getDate();
  const mon1 = MO[d1.getMonth()];
  if (!end || end === start) return `${day1} ${mon1}`;
  const d2 = pd(end);
  if (!d2 || d2.getTime() === d1.getTime()) return `${day1} ${mon1}`;
  const day2 = d2.getDate();
  const mon2 = MO[d2.getMonth()];
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    return `${day1} - ${day2} ${mon1}`;
  }
  return `${day1} ${mon1} - ${day2} ${mon2}`;
}

export function fmtFull(start: string, end?: string | null): string {
  const d1 = pd(start);
  if (!d1) return start;
  const day1 = d1.getDate();
  const mon1 = MO_FULL[d1.getMonth()];
  if (!end || end === start) return `${day1} de ${mon1} de ${d1.getFullYear()}`;
  const d2 = pd(end);
  if (!d2 || d2.getTime() === d1.getTime()) return `${day1} de ${mon1} de ${d1.getFullYear()}`;
  const day2 = d2.getDate();
  const mon2 = MO_FULL[d2.getMonth()];
  return `${day1} de ${mon1} – ${day2} de ${mon2} de ${d2.getFullYear()}`;
}

export function cleanLoc(s: string): string {
  // Decode HTML entities
  let c = s.replace(/&aacute;/g,'á').replace(/&eacute;/g,'é').replace(/&iacute;/g,'í')
    .replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&atilde;/g,'ã')
    .replace(/&otilde;/g,'õ').replace(/&ccedil;/g,'ç').replace(/&amp;/g,'&')
    .replace(/&nbsp;/g,' ').replace(/&#8211;/g,'–').replace(/&#8220;/g,'"').replace(/&#8221;/g,'"');
  c = c.replace(/^(Ponto de encontro:|Partida:)\s*/i, "");
  // Normalize Mercado locations
  if (/mercado\s*(municipal\s*)?1/i.test(c)) c = 'Mercado Municipal 1º de Maio';
  if (/^largo\s*mercado/i.test(c)) c = 'Mercado Municipal 1º de Maio';
  c = c.split(/\d|Organização|\sM\/|\sO\s[A-Z]|\sEntre\s|\se\s[a-z]|\sPara\s|\sRua\s|\sa\s[a-z]|Horário|\sOrg[.:]|\sUm\s|A mostra|vai\s|realidade|Inscrição|Info|Preço|Duração|Público|Domingos|tudo pode|a criatividade|a dança|No próximo|Em parceria|às\s/i)[0].trim();
  if (c.length < 5) return "";
  return c.length > 50 ? c.slice(0, 50) + "…" : c;
}

export function mk(d: string): string { return d.slice(0, 7); }
export function mkLabel(key: string): string {
  const [, m] = key.split('-').map(Number);
  return MO_FULL[m - 1] || key;
}

export function isPast(ev: { date: string; endDate?: string | null }): boolean {
  const d = pd(ev.endDate || ev.date);
  if (!d) return false;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return d < t;
}
