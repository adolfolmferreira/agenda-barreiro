# Agenda Barreiro

Agenda independente de eventos e cultura na cidade do Barreiro.

## Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- Deploy: Vercel / Netlify

## Estrutura

```
agenda-barreiro/
├── app/
│   ├── globals.css        # Estilos globais + fontes
│   ├── layout.tsx         # Layout raiz + metadata SEO
│   └── page.tsx           # Página principal (client component)
├── lib/
│   ├── events.ts          # Dados dos eventos + categorias + espaços
│   └── dates.ts           # Utilitários de datas (filtros temporais)
├── next.config.js
├── package.json
└── README.md
```

## Começar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

```bash
npx vercel
```

Ou ligar o repositório GitHub à Vercel para deploy automático.

## Roadmap

- [ ] Backend com scraping automático (Viral Agenda, CM Barreiro, OUT.RA)
- [ ] API REST própria para os dados
- [ ] Formulário de submissão de eventos
- [ ] Páginas individuais por evento (SSG)
- [ ] Páginas por espaço/local
- [ ] Newsletter semanal
- [ ] PWA para mobile

## Fontes de dados

| Fonte | Tipo | URL |
|---|---|---|
| CM Barreiro | WordPress REST API | cm-barreiro.pt |
| Viral Agenda | Web scraping | viralagenda.com/pt/setubal/barreiro |
| OUT.RA | Web scraping | outra.pt |
| Cooperativa Mula | Redes sociais | Instagram/Facebook |
| Rostos | Web scraping | rostos.pt |
| New in Barreiro | Web scraping | newinbarreiro.nit.pt |

## Licença

MIT