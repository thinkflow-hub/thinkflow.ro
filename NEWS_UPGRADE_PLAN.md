# News Upgrade — Plan Complet Faza 1–5

**Data:** 2026-07-12
**Context:** thinkflow.ro/news/ + news.thinkflow.ro (migrat)
**Pipeline:** M:\thinkflow\openclaw\scripts\news_pipeline.py

---

## Faza 1: Core UX Upgrade (estimat: 3 zile)

### 1.1 Intel View — Story Clustering Avansat

**Problema:** Avem `cluster_id` în date dar nu-l folosim. Articole care vorbesc despre același subiect (match pe keywords + titlu) nu sunt grupate la nivel semantic.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/lib/news.ts` | Adaugă `semanticCluster(items: NewsItem[]): Map<string, NewsItem[]>` care grupează articole după: (1) `cluster_id` existent, (2) keyword overlap > 60%, (3) titlu similar (bigram Jaccard) |
| `src/components/news/NewsCluster.tsx` | **Creează** — card special pentru cluster: header cu "Story: {topic principal}", N sub-carduri cu surse diferite, badge "X sources, Y perspectives" |
| `src/components/news/NewsCard.tsx` | Adaugă `onCluster?: NewsItem[]` prop — dacă prezent, cardul devine expandabil cu NewsCluster în interior |
| `src/components/news/NewsFeed.tsx` | În `useMemo`, după filtrare, rulează `semanticCluster()`; cluster-ele înlocuiesc cardurile individuale în grid |

**Acceptanță:**
- 2 articole HN + Lobsters despre același subiect → 1 cluster card cu "2 sources" badge
- Click pe cluster → expandează view cu fiecare sursă separat (tab-uri sau stacked cards)
- Cluster header arată `cluster_topics[0]` ca titlu + sentiment overall
- Fără match → comportament existent

---

### 1.2 Multi-Angle Source Comparison

**Problema:** Userul nu poate vedea cum aceeași știre e acoperită din perspective diferite.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/components/news/NewsCluster.tsx` | Când clusterul conține 2+ articole, adaugă "Compare sources" toggle. În modul compare: |
| — | Split view: stânga = sursa 1 (title + summary + sentiment), dreapta = sursa 2 |
| — | Jos: AI-generated "Consensus" — ce au în comun + "Differences" — ce diferă |
| `src/lib/news.ts` | Adaugă `generateComparison(items: NewsItem[]): { consensus: string, differences: string }` — extrage din `summary_detailed` similarități |
| — | Fallback: dacă nu există `summary_detailed`, compară `description` + `keywords` simplu |

**Acceptanță:**
- Cluster cu 3 articole → buton "Compare (3 sources)"
- Click → 3 coloane cu titlu, sursă, sentiment, sumar
- Jos: "All agree: {X}" + "Differs: {Y}"
- Funcționează cu orice combinație de surse

---

### 1.3 Detail View In-App

**Problema:** Toate linkurile duc direct la sursa externă. Userul nu poate citi un sumar AI sau vedea timeline-ul fără să părăsească site-ul.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/app/[locale]/news/article/[source_id]/page.tsx` | **Creează** — pagină dinamică: `generateStaticParams()` = toate `source_id`-urile din ultimele 7 zile |
| — | SSR: citește `NewsItem` după `source_id` din toate fișierele |
| — | Afișează: titlu, toate summary-urile (tldr, detailed, bullets), sentiment, keywords, surse, timeline (cluster items), link extern |
| `src/components/news/InlineArticle.tsx` | **Creează** — versiune inline (modal/expand) pentru feed |
| `src/components/news/NewsCard.tsx` | Click pe titlu → navighează la `/news/article/{source_id}` (nu mai link direct extern) |
| — | Buton "Read original" separat care merge la sursă |
| `next.config.ts` | Adaugă rewrites: `/news/article/:id` → `/:locale/news/article/:id` |

**Acceptanță:**
- Click pe orice card → pagina dedicată cu toate detaliile
- `summary_detailed` + `summary_bullets` afișate în tab-uri
- Timeline: "This story was covered by HN, Reddit, and 2 blogs"
- Buton "Read original ↗" deschide sursa externă
- 404 pentru `source_id` inexistent
- ISR: `revalidate: 3600` (o oră)

---

### 1.4 Session-Limiting UX

**Problema:** Scroll infinit, fără oprire. Userul petrece prea mult timp.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/components/news/NewsFeed.tsx` | Adaugă mod implicit "Briefing Mode" (toggle: "Briefing" / "Full Feed") |
| — | **Briefing Mode:** arată doar top 10 items + DailyBriefingCard + "That's today's top stories" cu emoji și mesaj gen "Go outside. Touch some grass." (ca Bubbles) |
| — | **Full Feed:** comportament existent cu "Load More" |
| — | Adaugă `sessionTimer`: după 5 minute în Full Feed, arată un nudge "Still reading? Here's a summary of what you've seen." |
| `src/components/news/NewsBriefing.tsx` | **Creează** — versiunea newspaper-style: grouped by category, maxim 2 per category, cu "Continue to full feed" jos |

**Acceptanță:**
- Default: Briefing Mode (ziar, 10 articole, cu stop message)
- Toggle "Full Feed" → feed normal cu Load More
- După 5 minute în Full Feed → nudge cu sumar
- Stop message: "🌿 That's all for today. Come back tomorrow."

---

## Faza 2: AI Intelligence (estimat: 3 zile)

### 2.1 Knowledge Graph (Simplificat)

**Problema:** Articolele sunt independente. Userul nu vede conexiunile între subiecte, autori, surse.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `M:\thinkflow\openclaw\scripts\news_graph_builder.py` | **Creează** — script care rulează după agregare: |
| — | Citește toate articolele din ultimele 7 zile |
| — | Extrage entități (companii, persoane, tech) din `keywords` + `title` + `description` |
| — | Construiește graf: noduri = articole + entități, muchii = shared entities |
| — | Salvează ca `_data/news_graph.json`: `{ nodes: [{id, label, type, weight}], edges: [{source, target, weight}] }` |
| `M:\thinkflow\openclaw\scripts\news_pipeline.py` | Adaugă pas: `news_graph_builder.py` după `news_geo_enricher` |
| `D:\WebDev\thinkflow.ro\src\lib\news.ts` | Adaugă `readGraph(): GraphData` |
| `D:\WebDev\thinkflow.ro\src\components\news\NewsGraph.tsx` | **Creează** — componentă client-side care desenează graful (folosește `react-force-graph-2d` sau similar lightweight) |
| — | Noduri articol: culoare = category, dimensiune = score |
| — | Hover pe nod → arată titlu articol |
| — | Click pe nod → navighează la `/news/article/{id}` |
| `src/app/[locale]/news/page.tsx` | Adaugă buton "Explore Knowledge Graph" care deschide NewsGraph în modal |

**Acceptanță:**
- `news_graph_builder.py` generează `_data/news_graph.json` cu minim 50 de noduri
- Graful e interactiv (drag, zoom, hover, click)
- Arată conexiunile între articole care împărtășesc aceleași keywords
- Timp de generare < 10 secunde

---

### 2.2 Chat cu News

**Problema:** Userul nu poate pune întrebări în limbaj natural despre conținutul arhivei.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `D:\WebDev\thinkflow.ro\src\app\api\news\ask\route.ts` | **Creează** — `POST /api/news/ask` cu body `{ question: string }` |
| — | Calls OpenClaw `task_planner.decompose()` cu intent `research` |
| — | Search vectorial peste news data (keywords + summary) |
| — | Returnează `{ answer, sources: NewsItem[], tokens_used }` |
| `D:\WebDev\thinkflow.ro\src\components\news\NewsChat.tsx` | **Creează** — chat bubble UI: input "Ask anything about the news..." |
| — | Mesajele apar ca bubbles: user (blue) + AI (gray) cu citări |
| — | Citările sunt linkuri către `/news/article/{source_id}` |
| — | History: ultimele 10 întrebări în localStorage |
| `src/app/[locale]/news/page.tsx` | Adaugă buton "Ask AI" în header-ul paginii, deschide NewsChat drawer |

**Acceptanță:**
- "What happened in AI this week?" → răspuns coerent cu 3-5 citări
- "Summarize the top security stories" → bullet list din surse relevante
- Fiecare citare e link către articol
- Loading state: "Searching 200+ articles..."
- Fără API key → mesaj "AI chat unavailable"

---

### 2.3 Canale Personalizate

**Problema:** Userul primește același feed ca toată lumea. Googles permite crearea de "spaces" (topicuri).

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/app/[locale]/news/channels/page.tsx` | **Creează** — listare canale: predefinite (categoriile) + custom |
| `src/app/[locale]/news/channels/[id]/page.tsx` | **Creează** — feed filtrat doar pe articolele din acel channel |
| `src/components/news/ChannelManager.tsx` | **Creează** — UI pentru creare canal: nume, keywords, surse preferate |
| — | Salvează în localStorage (fără cont) |
| — | Channel = query salvat: `{name, keywords:[], sources:[], categories:[], notify: bool}` |
| `M:\thinkflow\openclaw\scripts\newsletter_sender.py` | Adaugă `--channel` flag: trimite newsletter doar cu articolele dintr-un canal specific |
| `src/app/api/news/channels/route.ts` | **Creează** — endpoint care primește definiția unui canal și returnează articole match-uite |

**Acceptanță:**
- Utilizatorul creează canal "Kubernetes" cu keywords `[kubernetes, k8s, container, orchestration]`
- Feed-ul arată doar articole care conțin cel puțin un keyword
- Canalele persistă în localStorage între sesiuni
- Buton "Subscribe to daily email" pentru canal → integrare cu newsletter_sender

---

## Faza 3: Power User (estimat: 2 zile)

### 3.1 Keyboard Shortcuts

**Problema:** Pagina e doar mouse-friendly. Power users pierd timp.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/components/news/NewsKeyboard.tsx` | **Creează** — hook `useNewsKeyboard()` care ascultă keydown events: |
| — | `j/k` → navigare sus/jos între carduri |
| — | `o` / `Enter` → deschide articol curent |
| — | `f` → focus search bar |
| — | `c` → toggle category filter |
| — | `b` → toggle Briefing/Full mode |
| — | `?` → arată/ascunde help overlay |
| — | `Esc` → close modal / search |
| — | `Cmd+K` → command palette |
| `src/components/news/CommandPalette.tsx` | **Creează** — `Cmd+K` palette: search actions + search news |
| — | Actions: "Switch to Briefing", "Go to Archive", "Filter by category: AI Labs" |
| — | News search: caută articole în timp real |
| `src/components/news/NewsFeed.tsx` | Integrează `useNewsKeyboard()` + CommandPalette |
| `src/components/news/KeyboardHelp.tsx` | **Creează** — overlay cu lista completă de shortcut-uri (apăsat `?`) |

**Acceptanță:**
- `j/k` → selecția se mută între carduri (highlight galben)
- `o` → deschide articolul selectat
- `Cmd+K` → se deschide palette, search funcționează
- `?` → help overlay cu toate shortcut-urile
- Fără conflict cu shortcut-urile browser-ului

---

### 3.2 Output Feeds (RSS)

**Problema:** Conținutul e închis în UI. Nu poate fi consumat de RSS readers externi.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `D:\WebDev\thinkflow.ro\src\app\api\news\feed\[category]\route.ts` | **Creează** — RSS feed generat dinamic: |
| — | `GET /api/news/feed/trending` → RSS XML cu articolele din categoria respectivă |
| — | `GET /api/news/feed/all` → toate articolele |
| — | `GET /api/news/feed/topic/{keyword}` → articole care conțin acel keyword |
| — | Formate: RSS 2.0 standard, validabil cu validators |
| `D:\WebDev\thinkflow.ro\src\app\news\feed.xml\route.ts` | **Creează** — redirect: `/news/feed.xml` → `/api/news/feed/all` |
| `src/app/sitemap.ts` | Adaugă link-urile feed-urilor în sitemap |

**Acceptanță:**
- `curl https://thinkflow.ro/api/news/feed/trending` → RSS XML valid
- Feed-ul include title, link, description, pubDate, guid per item
- Funcționează în Feedly / Inoreader / FreshRSS
- Topic feed: `GET /api/news/feed/topic/kubernetes` → doar articole relevante

---

### 3.3 MCP Server

**Problema:** Agenții AI (inclusiv OpenClaw Chief) nu pot interoga direct arhiva de news.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `M:\thinkflow\openclaw\src\tools\news_mcp.py` | **Creează** — MCP tool endpoints pentru Chief: |
| — | `news.top_stories(n: int = 10, category?: string)` → top N articole |
| — | `news.search(query: string, days: int = 7)` → articole match-uite |
| — | `news.timeline(source_id: string)` → cluster items pentru un articol |
| — | `news.briefing(date?: string)` → DailyBriefing |
| — | `news.categories()` → listă categorii cu counts |
| `M:\thinkflow\openclaw\src\agents\chief.py` | Înregistrează `news_mcp` tools în context pentru intents de tip `research` |
| — | Ex: "What's trending in AI this week?" → calls `news.top_stories(5, "ai_labs")` |
| `M:\thinkflow\openclaw\docs\loops\MCP_NEWS.md` | **Creează** — documentație: cum să folosească orice agent MCP-ul de news |

**Acceptanță:**
- `chief.process("What's trending in open source?")` → returnează articole din categoria open_source
- `news_mcp.top_stories(3)` → returnează JSON cu top 3
- Integrat direct, fără HTTP call (in-process)
- Documentat cu exemple

---

## Faza 4: Geospatial & Multimedia (estimat: 3 zile)

### 4.1 Hartă Geospatială Simplă

**Problema:** Avem `geo_title` și `geo_keywords` în datele existente, dar nu le folosim. Știrile au o componentă geografică neexploatată.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `M:\thinkflow\openclaw\scripts\news_geo_enricher.py` | Adaugă output: lat/lng per articol (geocoding simplu din `geo_keywords` + `title`) |
| — | Salvează `{ source_id, lat, lng, city, country }` în `_data/news_geo.json` |
| `D:\WebDev\thinkflow.ro\src\lib\news.ts` | Adaugă `readGeoLocations(): GeoPoint[]` |
| `D:\WebDev\thinkflow.ro\src\components\news\NewsMap.tsx` | **Creează** — componentă hartă: |
| — | Folosește MapLibre GL JS (open source, gratis) |
| — | Pinuri pe hartă (dimensiune = score, culoare = category) |
| — | Click pin → popup cu titlu + link |
| — | Cluster pins când sunt prea multe |
| `src/app/[locale]/news/map/page.tsx` | **Creează** — pagină dedicată "Explore by Location" |
| `src/app/[locale]/news/page.tsx` | Adaugă toggle: "Feed" / "Map" view |

**Acceptanță:**
- Articole cu geo_data apar pe hartă
- Zoom + drag funcționează
- Pin cluster: număr articole în acel oraș
- Fără API key (MapLibre = self-hosted tiles sau free ones)
- City mode: arată doar articole din acel oraș

---

### 4.2 Multi-Format Support

**Problema:** Suportăm doar RSS text. YouTube, podcast-uri, evenimente lipsesc.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `M:\thinkflow\openclaw\scripts\news_aggregator.py` | Adaugă surse: YouTube RSS (`https://www.youtube.com/feeds/videos.xml?channel_id=...`), Podcast RSS |
| `D:\WebDev\thinkflow.ro\src\lib\news-types.ts` | Adaugă `format` field: `"article" | "video" | "podcast" | "event"` |
| `D:\WebDev\thinkflow.ro\src\components\news\NewsCard.tsx` | Adaugă badge tip: "🎬 Video" / "🎙 Podcast" / "📅 Event" lângă category badge |
| `D:\WebDev\thinkflow.ro\src\components\news\NewsFeed.tsx` | Adaugă filter toggle: "All" / "Articles" / "Video" / "Podcast" |

**Acceptanță:**
- YouTube channels: video-urile apar în feed cu badge "🎬"
- Podcasts: apar cu badge "🎙" și link către audio
- Filtrează după format funcționează
- Sincronizare la fel ca articolele text

---

### 4.3 Image Gallery View

**Problema:** Grid-ul e uniform (text carduri). Nicio variantă vizuală.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/components/news/NewsGallery.tsx` | **Creează** — grid compact cu thumbnails mari (3-4 coloane, imagini 200x150) |
| — | Fiecare card: thumbnail + title suprapus jos + gradient |
| — | Fără text body, doar titlu + scor |
| `src/components/news/NewsFeed.tsx` | Adaugă toggle view: "List" / "Grid" / "Gallery" |
| — | List = view existent, Grid = 3 coloane standard, Gallery = thumbnail-heavy |

**Acceptanță:**
- Toggle între 3 view-uri păstrează filtrul activ
- Gallery view: 4 coloane, titlu pe gradient peste imagine
- Fallback: articole fără thumbnail → gradient colorat după category

---

## Faza 5: Agentic Newsroom (estimat: 4 zile)

### 5.1 AI Reporter Agent Workflow

**Problema:** Tot conținutul e generat de pipeline-ul existent. Nu există un "reporter" AI care să identifice breaking news, să scrie sinteze, să publice autonom.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `M:\thinkflow\openclaw\src\agents\news_reporter.py` | **Creează** — agent specializat: |
| — | Monitorizează feed-ul live (ultimele 2 ore) |
| — | Detectează evenimente breaking: același subiect apare în 3+ surse în < 30 minute |
| — | Generează "Breaking Brief": text scurt explicând evenimentul |
| — | Postează automat ca `DailyBriefing` suplimentar (`_data/news/_breaking_{ts}.json`) |
| — | Escaladează la operator dacă scorul de încredere < 0.7 |
| `M:\thinkflow\openclaw\src\agents\chief.py` | Adaugă intent `news_monitor` care pornește agentul |
| `M:\thinkflow\openclaw\scripts\news_pipeline.py` | Adaugă pas opțional: `news_reporter` (rulează la fiecare 30 minute, nu doar la pipeline) |

**Acceptanță:**
- 3 articole despre același subiect în 30 minute → agentul generează "Breaking Brief"
- Brief-ul apare în UI cu badge "🚨 Breaking"
- Operatorul e notificat prin HITL queue
- Nu generează false positives > 1/zi (calibrat)

---

### 5.2 Personalized Front Page

**Problema:** Toți userii văd același feed. VG și NewzAI personalizează după istoric.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `src/components/news/PersonalizationEngine.ts` | **Creează** — client-side personalization: |
| — | Track: ce categorii citește userul, ce keywords, ce surse |
| — | Salvează în localStorage: `{ reads: [{source_id, category, keywords, ts}], fav_sources: Map, fav_categories: Map }` |
| — | Expună `getPersonalizedScore(item: NewsItem): number` care boostează articole din categorii preferate |
| `src/components/news/NewsFeed.tsx` | Adaugă mod "For You" (tab lângă "All"): |
| — | Recomandă: categorii preferate + surse preferate + keywords match |
| — | "Because you read: {topic}" badge pe cardurile recomandate |
| `src/components/news/NewsCard.tsx` | Adaugă badge "Recommended for you" / "Because you read X" |

**Acceptanță:**
- După 5 click-uri pe "AI Labs" → "For You" tab prioritizează AI Labs
- Badge "Because you read: AI" pe carduri relevante
- Persistă în localStorage între sesiuni
- Buton "Reset personalization" în settings
- Fără cont, fără server-side tracking

---

### 5.3 Fact-Checking Vizibil

**Problema:** Userul nu știe dacă o știre e verificată sau e neconfirmată.

**Implementare:**

| Fișier | Modificare |
|--------|-----------|
| `M:\thinkflow\openclaw\scripts\news_fact_checker.py` | **Creează** — rulează după agregare: |
| — | Pentru fiecare articol, compară cu alte articole din același cluster |
| — | Dacă 2+ surse independente raportează același fapt → badge "verified" |
| — | Dacă e singura sursă și e breaking → badge "unconfirmed" |
| — | Salvează: `{ source_id, verification: "verified" | "unconfirmed" | "contradicted", sources_count: number }` |
| `D:\WebDev\thinkflow.ro\src\components\news\VerificationBadge.tsx` | **Creează** — badge vizual: |
| — | "✓ Verified by 3 sources" (verde) |
| — | "⚠ Unconfirmed" (galben, doar breaking) |
| — | "✗ Contradicted by 2 sources" (roșu) |
| `D:\WebDev\thinkflow.ro\src\components\news\NewsCard.tsx` | Adaugă VerificationBadge sub title |
| `M:\thinkflow\openclaw\scripts\news_pipeline.py` | Adaugă pas: `news_fact_checker` după `news_clusterer` |
| `D:\WebDev\thinkflow.ro\src\lib\news-types.ts` | Adaugă `verification_status: "verified" | "unconfirmed" | "contradicted" | null` |

**Acceptanță:**
- Articol acoperit de HN + Reddit + TechCrunch → badge "✓ Verified by 3 sources"
- Breaking news dintr-o singură sursă → badge "⚠ Unconfirmed"
- Surse contradictorii → badge "✗ Contradicted"
- Fără date → fără badge (comportament existent)
- Timp de execuție < 5 secunde per pipeline run

---

## Matrice Efort/Impact

| Fază | Efort | Impact | Dependențe |
|------|-------|--------|------------|
| 0 | 4h | ⚡ Maxim imediat | Nimic |
| 1 | 3 zile | 💥 Diferență dramatică | Faza 0 |
| 2 | 3 zile | 🧠 Diferență competitivă | Faza 1 |
| 3 | 2 zile | ⌨️ Power users | Faza 1,2 |
| 4 | 3 zile | 🌍 Diferență vizuală | Faza 1 |
| 5 | 4 zile | 🤖 Visul final | Faza 2,3,4 |

**Total estimat:** ~20 zile lucrătoare (4 săptămâni) pentru tot.

---

## Cum Procedăm

**Propune-mi următorul pas.** De exemplu:
- "Începe Faza 0" — și încep implementarea chiar acum
- "Detaliază mai mult punctul X din Faza Y" — și intru în profunzime
- "Sari peste Faza Z, prioritizează W" — și ajustăm planul
