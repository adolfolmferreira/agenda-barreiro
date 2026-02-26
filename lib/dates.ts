const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MONTHS_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function parse(d: string) {
  return new Date(d + "T12:00:00");
}

export function formatShort(d: string) {
  const x = parse(d);
  return `${x.getDate()} ${MONTHS_SHORT[x.getMonth()]}`;
}

export function formatFull(d: string) {
  const x = parse(d);
  return `${x.getDate()} de ${MONTHS[x.getMonth()]} de ${x.getFullYear()}`;
}

export function monthKey(d: string) {
  return MONTHS[parse(d).getMonth()];
}

export function isToday(d: string) {
  const now = new Date();
  const x = parse(d);
  return now.getFullYear() === x.getFullYear() && now.getMonth() === x.getMonth() && now.getDate() === x.getDate();
}

export function isThisWeek(d: string) {
  const now = new Date();
  const x = parse(d);
  const dow = now.getDay() || 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow + 1);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return x >= mon && x <= sun;
}

export function isThisWeekend(d: string) {
  const now = new Date();
  const dow = now.getDay() || 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + (6 - dow));
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return parse(d) >= sat && parse(d) <= sun;
}

export function inRange(d: string, d2: string | undefined, fn: (d: string) => boolean) {
  if (fn(d)) return true;
  if (d2 && fn(d2)) return true;
  if (d2) {
    const now = new Date();
    return parse(d) <= now && parse(d2) >= now;
  }
  return false;
}