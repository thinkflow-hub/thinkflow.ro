# Test List — thinkflow.ro/news/ Upgrade (Faza 0-5)

**Status:** Toate implementările sunt complete. Teste de verificare.

---

## Faza 0 — Quick Wins

### 0.1 Story Clustering Vizual
- [ ] 2 articole cu același `cluster_id` → apar ca 1 card "N sources"
- [ ] Click "Show all sources" → expandează lista de surse
- [ ] Articole fără cluster_id → comportament normal (single card)

### 0.2 Image Optimization
- [ ] Card cu thumbnail → imaginea se încarcă cu `loading="lazy"`
- [ ] Favicon-urile se încarcă corect
- [ ] Layout shift minim la încărcare

### 0.3 Newsletter
- [ ] `/api/newsletter` POST cu email valid → 201 + scrie în subscribers.txt
- [ ] `/api/newsletter` POST cu email invalid → 400
- [ ] `/api/newsletter` POST cu email duplicat → 200 "Already subscribed"
- [ ] UI NewsletterSignup pe `/news/` → subscribe form vizibil
- [ ] Submit form → status "Subscribed!" cu confirmare
- [ ] `newsletter_sender.py --subscribe test@example.com` → adaugă subscriber
- [ ] `newsletter_sender.py --list-subscribers` → arată lista
- [ ] `newsletter_sender.py --schedule` → creează Task Scheduler
- [ ] Pipeline sâmbăta → rulează pasul de newsletter

### 0.4 Server-Side Search
- [ ] `GET /api/news/search?q=AI&days=7` → JSON cu articole relevante
- [ ] Query < 2 caractere → 400
- [ ] Search în UI → debounce 350ms, "..." indicator
- [ ] Rezultatele includ articole din ultimele 14 zile
- [ ] Search cu 0 rezultate → mesaj corespunzător

### 0.5 Sticky Date Headers
- [ ] Scroll → data header rămâne lipită sus (sticky)
- [ ] Header arată "Today", "Yesterday", sau data formatată
- [ ] Header arată numărul de articole
- [ ] La final → mesaj "🌿 That's all for now"

---

## Faza 1 — Core UX

### 1.1 Intel View
- [ ] Articole cu keyword overlap > 60% → cluster semantic
- [ ] Articole cu titlu similar (bigram Jaccard > 0.3) → cluster
- [ ] Cluster card arată "N sources" badge + confidence (verified/corroborated/single)
- [ ] Cluster arată "Covered by HN, Reddit..."

### 1.2 Multi-Angle Source Comparison
- [ ] Cluster cu 2+ articole → buton "Compare sources"
- [ ] Click → arată consensus + differences
- [ ] Consensus: "All N sources agree on..."
- [ ] Differences: per-sursă cuvinte unice

### 1.3 Detail View
- [ ] Click pe titlu articol → `/news/article/{source_id}`
- [ ] Pagina arată: title, category, source, date, thumbnail
- [ ] Buton "Read original ↗" → link extern
- [ ] AI summaries: TL;DR, Detailed, Key Points
- [ ] Keywords → link către `/news/topic/{keyword}`
- [ ] Timeline: "Also covered by" → alte surse din același cluster
- [ ] 404 pentru source_id inexistent

### 1.4 Session-Limiting UX
- [ ] Default: Briefing Mode (10 items)
- [ ] Toggle: Briefing / Full Feed
- [ ] Full Feed → "Load More" funcționează
- [ ] 5 minute în Full Feed → nudge "Been reading for a while?"
- [ ] Click nudge → switch la Briefing Mode

---

## Faza 2 — AI Intelligence

### 2.1 Knowledge Graph
- [ ] `news_graph_builder.py --days=7` → generează `_data/news_graph.json`
- [ ] Graph file conține nodes (articles + entities) + edges
- [ ] `/news/graph` → pagină cu vizualizare SVG
- [ ] Noduri colorate după categorie
- [ ] Hover pe nod → tooltip
- [ ] Click pe nod articol → navighează la `/news/article/{id}`

### 2.2 Chat cu News
- [ ] `/news/chat` → pagină cu NewsChat component
- [ ] Input "What happened in AI this week?" → răspuns cu articole
- [ ] Răspunsul include citări (linkuri către articole)
- [ ] Fără rezultate → mesaj corespunzător
- [ ] Loading state "Searching articles..."
- [ ] Chat history persistă în sesiune

### 2.3 Canale Personalizate
- [ ] `/news/channels` → listare canale
- [ ] "+ New Channel" → form cu name, keywords, categories
- [ ] Canal creat → apare în listă
- [ ] Click pe canal → `/news/channels/{id}` cu feed filtrat
- [ ] Delete canal → dispare din listă
- [ ] Persistă în localStorage între sesiuni

---

## Faza 3 — Power User

### 3.1 Keyboard Shortcuts
- [ ] `j` / `↓` → navigare la următorul card
- [ ] `k` / `↑` → navigare la cardul anterior
- [ ] `o` / `Enter` → deschide articolul selectat
- [ ] `f` / `/` → focus search bar
- [ ] `b` → toggle Briefing/Full Feed
- [ ] `c` → cycle category filter
- [ ] `Cmd+K` → command palette
- [ ] `?` → keyboard help overlay
- [ ] `Esc` → close help / palette / modals

### 3.2 RSS Feeds
- [ ] `GET /api/news/feed/all` → RSS 2.0 XML valid
- [ ] `GET /api/news/feed/trending` → RSS filtrat pe categorie
- [ ] `/news/feed.xml` → redirect la feed/all
- [ ] RSS include: title, link, description, pubDate, guid
- [ ] Validabil cu https://validator.w3.org/feed/

### 3.3 MCP Server
- [ ] `news_mcp.top_stories(5)` → JSON cu top 5 articole
- [ ] `news_mcp.search_news("AI", 7)` → articole match-uite
- [ ] `news_mcp.get_briefing()` → DailyBriefing curent
- [ ] `news_mcp.list_categories()` → categorii cu counts
- [ ] Chief: "What's trending?" → calls MCP, returnează articole
- [ ] Chief: "Briefing for today" → calls get_briefing()

---

## Faza 4 — Geospatial & Multimedia

### 4.1 News Map
- [ ] `/news/map` → pagină cu hartă Leaflet
- [ ] Articole cu geo_date → markeri pe hartă
- [ ] Markeri au culoare = categorie, dimensiune = score
- [ ] Click marker → popup cu titlu
- [ ] Zoom + drag funcționează

### 4.2 Multi-Format Support
- [ ] Card cu `format: "video"` → badge 🎬
- [ ] Card cu `format: "podcast"` → badge 🎙
- [ ] Card cu `format: "event"` → badge 📅
- [ ] Format badge lângă category badge

### 4.3 Gallery View
- [ ] Toggle ▦ / ⊞ în feed header
- [ ] Gallery mode → grid 4 coloane cu thumbnails
- [ ] Fallback pentru articole fără thumbnail → inițială + gradient
- [ ] Gallery + category filter → funcționează împreună

---

## Faza 5 — Agentic Newsroom

### 5.1 AI Reporter Agent
- [ ] `news_reporter.py --minutes=30 --threshold=3` → detectează subiecte comune
- [ ] Același keyword în 3+ surse → breaking event detectat
- [ ] Breaking brief generat + salvat
- [ ] `--escalate` → operator HITL queue

### 5.2 Personalization
- [ ] Click pe articol → `trackRead()` în localStorage
- [ ] `getPersonalizedScore()` > 1.0 pentru categorii preferate
- [ ] `getTopCategory()` → categoria cea mai citită
- [ ] `resetPersonalization()` → curăță datele

### 5.3 Fact-Checking
- [ ] `news_fact_checker.py --days=3` → generează `*_verification.json`
- [ ] 3+ surse același cluster → status "verified"
- [ ] 1 sursă → status "unconfirmed"
- [ ] `/api/news/verify?source_id=X` → returnează status
- [ ] Card cu verified → badge "✓ Verified"
- [ ] Card cu unconfirmed → badge "⚠ Unconfirmed"

---

## Smoke Tests (e2e rapide)

```bash
# Pipeline complet (fără agregare)
python scripts/news_pipeline.py --skip-aggregator

# Newsletter subscriber
python scripts/newsletter_sender.py --subscribe test@thinkflow.ro

# Breaking news detection
python scripts/news_reporter.py --minutes=60 --threshold=2

# Fact-check
python scripts/news_fact_checker.py --days=7

# Knowledge graph
python scripts/news_graph_builder.py --days=7

# RSS feed validation
curl http://localhost:3000/api/news/feed/all | head -20

# Search API
curl "http://localhost:3000/api/news/search?q=AI&days=3"

# MCP tools
python -c "from tools.news_mcp import top_stories; print(top_stories(3))"
```
