export type EventItem = {
  id: number;
  title: string;
  category: string;
  venue: string;
  date: string;
  endDate?: string;
  time?: string;
  subtitle?: string;
  description: string;
  image: string;
  featured?: boolean;
};

export const CATEGORIES: Record<string, { label: string; color: string }> = {
  musica: { label: "música", color: "#C0392B" },
  teatro: { label: "teatro", color: "#2471A3" },
  danca: { label: "dança", color: "#17A589" },
  cinema: { label: "cinema", color: "#5D6D7E" },
  exposicao: { label: "exposição", color: "#B7950B" },
  festival: { label: "festival", color: "#CA6F1E" },
  literatura: { label: "literatura", color: "#6C3483" },
  oficina: { label: "oficina", color: "#A04000" },
  comunidade: { label: "comunidade", color: "#1E8449" },
  performance: { label: "performance", color: "#884EA0" },
};

export const VENUES: Record<string, string> = {
  mula: "Cooperativa Mula",
  amac: "Auditório Municipal Augusto Cabrita",
  bib: "Biblioteca Municipal do Barreiro",
  adao: "ADAO",
  pada: "PADA Studios",
  sala6: "Sala 6",
  peni: "SIRB Os Penicheiros",
  gal: "Galeria Municipal",
  parque: "Parque da Cidade",
  cabos: "Casa da Cidadania Cabós Gonçalves",
  av: "Teatro Arte Viva",
  forum: "Fórum Barreiro",
  gas: "Gasoline",
  loco: "Locomotiva",
  tejo: "Museu Industrial da Baía do Tejo",
};

export const EVENTS: EventItem[] = [
  { id: 1, title: "Sessões TAU URUBU! — LA NEGRA", category: "musica", venue: "mula", date: "2026-02-27", time: "21:30", subtitle: "Noite de música latina e improvisação", description: "Entrada livre com consumo mínimo. A Cooperativa Mula abre portas para mais uma noite de música ao vivo, com sonoridades latinas e espaço para improvisação.", image: "https://images.unsplash.com/photo-1504704911898-68304a7d2571?w=600&h=400&fit=crop", featured: true },
  { id: 2, title: "Ciclo Kurosawa: Dersu Uzala", category: "cinema", venue: "mula", date: "2026-03-03", time: "21:00", subtitle: "Sessão do ciclo dedicado ao mestre japonês", description: "Filme de 1975, 142 min. Entrada 3€. O ciclo prossegue às terças-feiras na Cooperativa Mula.", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop" },
  { id: 3, title: "Olhares sobre o Barreiro", category: "exposicao", venue: "gal", date: "2026-02-15", endDate: "2026-03-30", subtitle: "Mostra fotográfica colectiva", description: "Trabalhos do Clube de Fotógrafos do Barreiro. Entrada livre. De terça a sábado, das 10h às 18h.", image: "https://images.unsplash.com/photo-1540224871915-bc8ffb782bdf?w=600&h=400&fit=crop", featured: true },
  { id: 4, title: "BIRDS ARE INDIE", category: "musica", venue: "sala6", date: "2026-02-28", time: "22:00", subtitle: "Concerto + DJset Dead Club", description: "Bilhetes antecipados 5€. Sala 6, Barreiro.", image: "https://images.unsplash.com/photo-1501386761578-0a55f6261024?w=600&h=400&fit=crop" },
  { id: 5, title: "Oficina de Escrita Criativa", category: "oficina", venue: "bib", date: "2026-03-08", time: "10:00", subtitle: "Com Rosário Vaz", description: "Inscrição prévia obrigatória na Biblioteca Municipal. Gratuito. Vagas limitadas a 15 participantes.", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop" },
  { id: 6, title: "Festival Passagens 2026", category: "festival", venue: "mula", date: "2026-05-16", endDate: "2026-05-17", subtitle: "HuBB — Humans Before Borders", description: "Festival multidisciplinar com música, performance e comunidade. Programa completo a anunciar em abril.", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=400&fit=crop", featured: true },
  { id: 7, title: "Memória Industrial do Barreiro", category: "literatura", venue: "cabos", date: "2026-03-12", time: "18:30", subtitle: "Conversa com Rosalina Carmona", description: "Sobre o património industrial da cidade e os desafios da sua preservação. Entrada livre.", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&h=400&fit=crop" },
  { id: 8, title: "LUGAR COMUM", category: "teatro", venue: "av", date: "2026-03-06", endDate: "2026-03-07", time: "21:00", subtitle: "ArteViva — Companhia de Teatro do Barreiro", description: "Nova criação da companhia residente. Onde a vida é arte. Onde a arte é vida. Bilhetes 7€/5€.", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop" },
  { id: 9, title: "Ervas Daninhas + Bastardos do Espírito Santo", category: "musica", venue: "mula", date: "2026-03-07", time: "20:00", subtitle: "Noite de punk rock", description: "Duas bandas do circuito underground português na Cooperativa Mula. Bilhetes à porta 4€.", image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=400&fit=crop" },
  { id: 10, title: "Circuito de Arte Urbana", category: "comunidade", venue: "parque", date: "2026-03-14", time: "10:00", subtitle: "Alto do Seixalinho, Santo André e Verderena", description: "Visita guiada aos murais e intervenções artísticas do Barreiro. Inscrição obrigatória, máx. 25 pessoas.", image: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&h=400&fit=crop" },
  { id: 11, title: "PADA Studios Open Day 13.0", category: "exposicao", venue: "pada", date: "2026-04-04", endDate: "2026-04-05", time: "15:30", subtitle: "Portas abertas nos estúdios de artistas", description: "No Parque Industrial do Barreiro, dezenas de artistas abrem os seus estúdios ao público. Entrada livre.", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop", featured: true },
  { id: 12, title: "Caminhada Património Ferroviário", category: "comunidade", venue: "cabos", date: "2026-03-15", time: "09:00", subtitle: "Estação Barreiro-A", description: "Percurso fácil de 5km pela história ferroviária do Barreiro. Inscrição obrigatória.", image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop" },
  { id: 13, title: "Sonica Ekrano 2026", category: "festival", venue: "adao", date: "2026-04-10", endDate: "2026-04-18", time: "21:30", subtitle: "Cinema e som experimental", description: "Programação OUT.RA. Instalações, projecções e performances em vários espaços do Barreiro.", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=400&fit=crop" },
  { id: 14, title: "Pizza Domingueira c/ Mr. Bubble", category: "musica", venue: "mula", date: "2026-03-22", time: "13:00", subtitle: "Almoço com DJ set", description: "Pizza artesanal e vinil. Ambiente familiar, todos são bem-vindos.", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop" },
  { id: 15, title: "Tertúlia d'Os Leças", category: "literatura", venue: "peni", date: "2026-03-19", time: "21:00", subtitle: "Barreiro e o futuro", description: "Debate sobre os desafios urbanos do concelho. Na SIRB Os Penicheiros. Entrada livre.", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop" },
  { id: 16, title: "Workshop Sopas, Caldos e Purês", category: "oficina", venue: "mula", date: "2026-03-21", time: "10:00", subtitle: "Com Sara Ferreira Luz", description: "Inscrição 15€ com degustação incluída. Vagas limitadas.", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop" },
  { id: 17, title: "OUT.FEST 2026", category: "festival", venue: "mula", date: "2026-10-01", endDate: "2026-10-04", subtitle: "22ª edição — Festival Internacional de Música Exploratória", description: "Quatro dias de músicas plurais em vários espaços do Barreiro. Programa a anunciar.", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop", featured: true },
  { id: 18, title: "Labirinto", category: "danca", venue: "bib", date: "2026-03-28", time: "16:00", subtitle: "Performance-percurso para todas as idades", description: "Dança contemporânea que convida à exploração do espaço. Inclui lançamento de livro. Entrada livre.", image: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop" },
  { id: 19, title: "Galo Negro Sessions", category: "musica", venue: "gas", date: "2026-03-29", time: "21:30", subtitle: "THORMENTHOR + BESTA + ΔIII", description: "Metal e noise no Gasoline. Bilhetes 8€.", image: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&h=400&fit=crop" },
  { id: 20, title: "A Última Ilusão", category: "literatura", venue: "forum", date: "2026-03-16", time: "16:00", subtitle: "Pedro Miguel Ribeiro com Mónica Vale de Gato e Filipa Amorim", description: "Conversa sobre humor, suspense e o processo criativo. Sessão de autógrafos. Bertrand do Fórum Barreiro.", image: "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=600&h=400&fit=crop" },
  { id: 21, title: "O Quebra-Nozes", category: "danca", venue: "amac", date: "2026-02-26", time: "17:00", subtitle: "Ballet do Douro", description: "Clássico de Tchaikovsky no Auditório Municipal. Bilhetes 10€/8€.", image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop" },
  { id: 22, title: "FARB 2026 — Festival de Artes de Rua", category: "festival", venue: "parque", date: "2026-07-11", endDate: "2026-07-19", subtitle: "Festival de Artes de Rua do Barreiro", description: "Programação multidisciplinar ao ar livre em vários pontos da cidade. Entrada livre.", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop", featured: true },
  { id: 23, title: "Perplexos", category: "teatro", venue: "av", date: "2026-04-11", endDate: "2026-04-12", time: "21:00", subtitle: "Encenação de Carina Silva", description: "ArteViva — Companhia de Teatro do Barreiro. Nova produção.", image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=400&fit=crop" },
  { id: 24, title: "The Dowsers Society", category: "musica", venue: "adao", date: "2026-04-25", time: "19:00", subtitle: "Concerto + DJ set", description: "Entrada 6€. ADAO, Parque Industrial do Barreiro.", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop" },
];