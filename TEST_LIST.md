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

## B — Agent Architecture

- [ ] A2A: `send_a2a_message("chief", "router", "ping", handler=router.handle_a2a)` → `{"alive": true}`
- [ ] A2A: `send_a2a_message("chief", "ghost", "ping")` → `NOT_FOUND` error
- [ ] A2A: `handle_a2a({protocol:"bad"})` → `INVALID_PROTOCOL` error
- [ ] A2A: `handle_a2a({protocol:"a2a-v1.0", action:"unknown"})` → `UNKNOWN_ACTION` error
- [ ] A2A: `handle_a2a({protocol:"a2a-v1.0", action:"status"})` → `{agent_id, ...}`
- [ ] A2A: `handle_a2a({protocol:"a2a-v1.0", action:"memory_context", payload:{topic:"AI"}})` → `{context: "..."}`
- [ ] Escalation: input cu "deploy site" → output conține `[ESCALATION — deploy requires operator approval]`
- [ ] Escalation: input cu "shutdown server" → output conține `[URGENT — shutdown_service]`
- [ ] Escalation: input cu "delete file" → output conține `[ESCALATION — delete_files]`
- [ ] Escalation: VRAM < 2GB + content intent → output conține `[ESCALATION — REVIEW RECOMMENDED]`
- [ ] Escalation: input fără cuvinte permisive → output normal (fără tag escalate)

## C — ContentFactory v2

- [ ] `factory_health()` → 6 factories cu `status: "ok"` sau `"missing"`
- [ ] `seo_generate("test", template="listicle")` → dict cu `success, job_id, duration_s`
- [ ] `copy_generate("test product", template="landing_page")` → dict cu `success`
- [ ] `kdp_produce()` → dict cu status (poate `unavailable` în afara orelor)
- [ ] `kdp_produce(niche_id="cottagecore_word_search", auto_publish=True)` → procesează + încearcă upload
- [ ] `fiverr_process()` → dict cu status (probabil `unavailable` fără ordere)
- [ ] `service_process()` → dict cu status
- [ ] factory timeout: rulează `seo_generate` cu un timeout mic → `status: "timeout"`
- [ ] E: drive offline → `status: "unavailable"` cu `detail: "E drive not found"`
- [ ] Chief: "scrie un articol SEO despre VPS hosting" → task decomposition cu sub-task-uri
- [ ] Evaluator-optimizer: factory output cu QC score < 0.7 → refine loop invocat
- [ ] MoA pricing: "pachet servicii copywriting pentru startup" → 3 proposeri
- [ ] KDP auto-publish dry-run: `python tools/kdp_auto_publish.py --niche cottagecore_word_search --dry-run` → "DRY RUN"
- [ ] KDP auto-publish validation: `python tools/kdp_auto_publish.py --niche not_a_real_niche` → `validation_failed`

## D — Analytics & Monitoring

- [ ] `GET /api/system/metrics` → JSON cu `health + metrics + audit`
- [ ] `/system` dashboard → încărcare fără erori, cards vizibile
- [ ] `python -m utils.alerting --check` → JSON cu `alerts: N` și `notified: {discord, telegram}`
- [ ] Alerting cu threshold breach: setează error_rate > 10% → alertă trimisă pe canal configurat
- [ ] `GET /api/system/metrics` când OpenClaw e offline → 503 + `error: "Metrics unavailable"`
- [ ] Dashboard: click pe card → informații detaliate (dacă implementat)

## E — YouTube + Podcast Sources

- [ ] `news_sources.yaml` → `youtube_channels` conține 4 entries cu `format: video`
- [ ] `news_sources.yaml` → `podcast_feeds` conține 3 entries cu `format: podcast`
- [ ] `python scripts/news_aggregator.py --once --dry-run` → YouTube + podcast feeds fetch-uite
- [ ] Item în API search cu `format: "video"` → badge 🎬 în UI
- [ ] Item în API search cu `format: "podcast"` → badge 🎙 în UI
- [ ] Item în API search cu `format: "event"` → badge 📅 în UI
- [ ] Sursă YouTube: URL-ul e link la video, nu la canal

## F — SEO / Marketing

- [ ] `python scripts/news_to_blog.py --days 7` → blog post în `_output/blog_drafts/{slug}.md`
- [ ] Blog post conține frontmatter YAML valid (`title:`, `date:`, `description:`, `category:`)
- [ ] Blog post are corp markdown coerent (>500 cuvinte)
- [ ] `python scripts/news_to_blog.py --days 7 --publish` → scrie în `thinkflow.ro/src/content/blog/`
- [ ] `python scripts/news_to_blog.py --days 7 --locale en` → blog post în engleză
- [ ] `python scripts/social_poster.py --test` → "All channels OK" sau raportează lipsă config
- [ ] `python scripts/social_poster.py --limit 3 --channels discord` → postează doar pe Discord
- [ ] `python scripts/social_poster.py --limit 5` → postează top 5 stories (configurable)
- [ ] ISR: `revalidate = 3600` în news page → Next.js generează static

## A — Deployment (Smoke Tests e2e)

- [ ] `python scripts/news_pipeline.py --skip-aggregator` → toți pașii: ✅
- [ ] `npm run build` în thinkflow.ro → 0 errors, build reușit
- [ ] `curl http://localhost:3000/api/news/search?q=AI` → 200 + JSON cu results
- [ ] `curl http://localhost:3000/api/news/feed/all` → RSS XML valid (începe cu `<rss>`)
- [ ] `curl http://localhost:3000/api/news/feed/trending` → RSS filtrat
- [ ] `curl http://localhost:3000/api/system/metrics` → 200 + JSON
- [ ] `curl http://localhost:3000/api/newsletter` POST cu email valid → 201
- [ ] `schtasks /Query /TN "ThinkFlow-Newsletter"` → task exists
- [ ] `schtasks /Query /TN "ThinkFlow-News-Pipeline"` → task exists
- [ ] `schtasks /Query /TN "ThinkFlow-Social-Poster"` → task exists (opțional)
- [ ] `$env:VERCEL_DEPLOY_HOOK` → variabila e setată
- [ ] `$env:SENDGRID_API_KEY` → variabila e setată
- [ ] `curl -I https://thinkflow.ro/news/` → 200
- [ ] `news.thinkflow.ro` → 301 redirect la thinkflow.ro/news/ (după DNS)

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

# Factory MCP
python -c "from tools.contentfactory_mcp import factory_health; print(factory_health())"

# Blog generator
python scripts/news_to_blog.py --days 3

# Social poster test
python scripts/social_poster.py --test

# Alerting check
python -m utils.alerting --check

---

## Strat 0 — Fundație

- [ ] 0.1 OLLAMA_BASE_URL cu `/v1` → API calls merg fără `/v1`
- [ ] 0.2 LEDGER_PATH → directorul se creează automat dacă nu există
- [ ] 0.3 USER_SITE_PACKAGES → `site.getusersitepackages()` apelat în toate modulele audio
- [ ] 0.4 Model defaults `openrouter/free` → verificat că există
- [ ] 0.5 `audio_factory/mcp_server.py` → eroare clară dacă `mcp` lipsește
- [ ] 0.6 `asyncio.run()` în context sincron → nu mai crapă cu RuntimeError
- [ ] 0.7 Circular import core↔router → verificat

## Strat 1 — Pipeline & MCP

- [ ] 1.1 BackgroundTasks → `process_job` async nu blochează ASGI
- [ ] 1.2 MCP `run_pipeline` → nu blochează event loop
- [ ] 1.3 QC scoring → nu blochează event loop
- [ ] 1.4 Queue lock → ținut pe toată durata procesării
- [ ] 1.5 Queue ID → consistent (timestamp vs UUID)
- [ ] 1.6 Queue get_next_job → atomic
- [ ] 1.7 Secrets → niciun email/password hardcodat
- [ ] 1.8 requirements.txt → există per factory
- [ ] 1.9 Queue cleanup → `failed_reason` curățat pe ship_ready
- [ ] 1.10 QC model → configurabil

## Strat 2 — Bug-uri Fabrici

### KDP
- [ ] 2.1 `add_bleed.py` → nu mai e dead code, output folosit
- [ ] 2.2 ASSETS → nehardcodat, citit din config
- [ ] 2.3 Barcode area → 2"×1.2" (KDP spec)
- [ ] 2.4 Validator + ship_folder → citesc `queue.yaml`, nu `niches.yaml`
- [ ] 2.5 Niche prefix → `national_parks` → `national_parks`, nu `national`
- [ ] 2.6 `deferred_seasonal` → recunoscut de runner

### SEO
- [ ] 2.7 `@retry` duplicat → un singur decorator
- [ ] 2.8 `article_dir` → path sanitizat
- [ ] 2.9 `.hitl_pending` → curățat la timeout
- [ ] 2.10 `ledger.record_transaction` → try/except

### Copy
- [ ] 2.11 Strategy fail → pipeline se oprește, nu primește `None`
- [ ] 2.12 `{tone_guidelines}` → populat corect

### Clipping
- [ ] 2.13 `gpu_whisper_context()` exception → mesaj clar
- [ ] 2.14 `num_clips` → default consistent (3 în UI, 3 în process_job)
- [ ] 2.15 `/status/{job_id}` → path traversal protection

### Fiverr
- [ ] 2.16 Sandbox failure → pipeline se oprește
- [ ] 2.17 HITL → review uman real
- [ ] 2.18 UUID → 16+ caractere, fără coliziune

### Service
- [ ] 2.19 f08_translation → chunking pentru text lung
- [ ] 2.20 f14_pdf → operație necunoscută = eroare, nu OCR
- [ ] 2.21 f11_dataclean → lowercaze doar coloanele specificate

## Strat 3 — Fanvue Producție

- [ ] 3.1 REGEN loop → generează și evaluează imaginea NOUĂ
- [ ] 3.2 Node ID → citit din workflow, nu hardcodat "36"
- [ ] 3.3 `qa_result` → handle corect când QA e skipped
- [ ] 3.4 NSFW LoRA → fișierele există sau eroare clară
- [ ] 3.5 Flux Krea NSFW → workflow existent
- [ ] 3.6 Sidecar seed → valoarea reală din job
- [ ] 3.7 Imagini generate → > 0 în outputs/
- [ ] 3.8 105 pending job-uri → arhivate
- [ ] 3.9 `lora_trained/` → fișiere există
- [ ] 3.10 `generate_embeddings()` → face ceva real

## Strat 4 — Audio Funcțional

- [ ] 4.1 Piper model path → funcționează pe Windows
- [ ] 4.2 F5-TTS API → voice cloning funcțional
- [ ] 4.3 `profiles/` → cel puțin un voice profile
- [ ] 4.4 ffprobe/ffmpeg → verificate la startup
- [ ] 4.5 MusicGen/Transcriber → funcționează și pe CPU
- [ ] 4.6 voiceover → scrie în `outputs/` corect
- [ ] 4.7 Piper fallback → notifică utilizatorul

## Strat 5 — Completare

- [ ] 5.1 Copy factory → 6/6 config templates
- [ ] 5.2 Clipping → testimonial + livestream configs
- [ ] 5.3 SEO → prompts/ populat
- [ ] 5.4 KDP → Christmas niche deblocată
- [ ] 5.5 Clipping → notifier integrat
- [ ] 5.6 Clipping → guardrails apelat în runner
- [ ] 5.7 KDP → 6 pending niches procesate

## Strat 6 — Polish

- [ ] 6.1 Toate LOW severity issue-uri din audit
- [ ] 6.2 pytest setup per factory
- [ ] 6.3 Docstring audit → fără SyntaxWarning
- [ ] 6.4 Gitignore + pycache cleanup
- [ ] 6.5 SECURITY → CORS, auth, rate limiting
```
