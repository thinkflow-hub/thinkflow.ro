<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ThinkFLOW Ro — Project Status

## Goal
Site multi-page (Next.js 16.2.10) cu blog, contact form (Nodemailer), servicii, i18n (EN/RO), Supabase CRM, news aggregator. Deploy pe Vercel.

## Domain
- thinkflow.ro → Vercel DNS, SSL activ
- news.thinkflow.ro → Vercel DNS, live (122 pagini)

## Architecture

```
thinkflow.ro (Next.js 16.2.10)
├── [locale]/         # i18n: en, ro (next-intl)
├── blog/             # Markdown (gray-matter + remark)
├── api/
│   ├── og/           # Dynamic OG images (@vercel/og)
│   ├── supabase/
│   │   ├── contact/  # Contact form → Supabase + email
│   │   ├── newsletter/ # Subscribe/unsubscribe
│   │   └── analytics/  # Blog page views
│   └── contact/      # Legacy (deprecated)
├── lib/
│   ├── supabase.ts   # Supabase server client
│   └── posts.ts      # Blog data layer
├── components/
│   ├── blog/         # Modular blog components
│   ├── Header.tsx
│   └── Footer.tsx
└── messages/
    ├── en.json       # UI translations
    └── ro.json       # UI translations

news.thinkflow.ro (Next.js 16.2.10)
├── public/data/news/*.json  # Pipeline data
├── src/app/
│   ├── trending/
│   ├── community/
│   ├── open_source/
│   ├── releases/
│   ├── ai_labs/
│   ├── research/
│   ├── newsletters/
│   └── industry/
└── lib/
    └── data-loader.ts
```

## Progress

### Done
- 29+3 = 32 pagini statice (3 articole blog noi), layout responsive, dark theme, Tailwind v4
- Blog: 8 articole markdown (5 existente + 3 noi: AI Agencies, AWS→Hetzner, RAG Pipeline)
- Blog hero images: Python script (1200×630 WebP, frosted glass + logo)
- Blog icons: lucide-react (FileText, Code, Sparkles, Link etc.)
- Contact form: Nodemailer + Brevo SMTP
- SEO: Article schema JSON-LD (blog detail), Organization schema (layout), sitemap.xml, robots.txt
- OG: Dynamic endpoint `/api/og` cu `@vercel/og` (satori + resvg)
- OG: Blog detail page folosește `/api/og?title=...` pentru social share
- Schema Article: câmp `image` adăugat în JSON-LD
- Image Sitemap: `/sitemap-images/route.ts` pentru Google Images
- Supabase: `@supabase/supabase-js` instalat, client lib lazy, 4 API endpoints
- Supabase: contact form → contacts table + email notification
- Supabase: newsletter subscribe/unsubscribe → newsletter_subscribers table
- Supabase: blog analytics → blog_views table (ViewTracker component)
- Supabase env vars set on Vercel (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY)
- news.thinkflow.ro: 404 fixat, live cu 122 pagini statice, daily pipeline
- news.thinkflow.ro: pagini compliance (privacy, terms, affiliate-disclosure) + footer legal links
- Deploy: GitHub → Vercel auto-deploy, live la thinkflow.ro și news.thinkflow.ro
- i18n: next-intl v4.13.1, auto-detect locale, EN/RO, build 0 erori
- Email @thinkflow.ro: MX records (ImprovMX) + Brevo SMTP + Gmail Send-as
- DNS: MX (ImprovMX) + SPF + CAA records în Vercel DNS
- Privacy policy: corectată contradicția cookie vs URL params
- Vector DB post: affiliatePrograms aliniat cu linkurile reale
- Logo inline SVG generat cu font paths (Black Signature + Montserrat încorporate)

### In Progress
- (none)

### Next Steps
1. LinkedIn Company Page (când ai ~50 conexiuni)
2. Aplicații affiliate (PartnerStack, Supabase, Vercel, Cloudflare)
3. Blog category pages (SSG)
4. Cross-link thinkflow.ro ↔ news.thinkflow.ro
5. Author avatar pe blog cards

## Plan Details

### P0 — news.thinkflow.ro 404 fix
**Action:** Check Vercel Dashboard → deployments + domains. Force re-deploy.
**Structural:** Add `/api/health` endpoint + GitHub Actions pre-deploy check.

### P1 — i18n (next-intl)
**Package:** `next-intl` v4.13.1
**Auto-detect:** Cookie `NEXT_LOCALE` → Browser `Accept-Language` → Fallback `en`
**Routes:** `/en/*` (default), `/ro/*`
**Content:**
- Blog posts: `src/content/blog/{en,ro}/*.md`
- UI strings: `messages/{en,ro}.json`
- Translation phases: UI → Hero/Homepage → Services → Blog (1-2 posts) → Legal (external)

### P2 — Supabase Integration
**Package:** `@supabase/supabase-js`
**Tables:** contacts, newsletter_subscribers, blog_views
**RLS:** anon INSERT only
**Endpoints:**
- `POST /api/supabase/contact` — Save + email (replaces legacy)
- `POST /api/supabase/newsletter/subscribe` — Save subscriber
- `POST /api/supabase/newsletter/unsubscribe` — Soft delete
- `POST /api/supabase/analytics/view` — Save page view

### P3 — Blog Refactor
Split `BlogContent.tsx` (398 lines) → featured, grid, list, hero, CTA components.

### P4 — Typography Contrast
`text-white/40` → `text-zinc-400`, `text-white/20` → `text-zinc-500`, etc.

### P5 — Related Posts
Section at bottom of `blog/[slug]/page.tsx` with 3 related posts.

### P6 — Inline CTAs
`BlogCTA.tsx` — newsletter after index 2, consulting after index 4.

### P7 — Blog Hero
"SOTA Analysis" / "Infrastructure Intelligence" copy + stats.

### P8 — Category Pages
`blog/category/[category]/page.tsx` — SSG, shared layout.

### P9 — Cross-link
Header + Footer: link to news.thinkflow.ro (and vice versa).

### P10 — Author Avatar
Author block on each BlogCard + FeaturedBlogCard.

### P11 — EN/RO Toggle
Functional locale switcher in Header.

## Email & DNS Infrastructure

### Domain & DNS
- **Registrar:** Hostgate (nameservers → Vercel DNS)
- **DNS provider:** Vercel (ns1.vercel-dns.com, ns2.vercel-dns.com)
- **Cached DNS viewer:** https://dnschecker.org (propagare)

### DNS Records (Vercel DNS — set 07.07.2026)
| Host | Value | Priority | Type |
|------|-------|----------|------|
| `@` | `mx1.improvmx.com` | 10 | MX ✅ |
| `@` | `mx2.improvmx.com` | 20 | MX ✅ |
| `@` | `v=spf1 include:spf.improvmx.com ~all` | — | TXT ✅ |

### Email Flow
```
@thinkflow.ro → ImprovMX (forward) → thinkflowhub@gmail.com (inbox)
                ↑ MX records in Vercel DNS

Trimitere email → Brevo SMTP (smtp-relay.brevo.com:587) → destinație
                  ↑ SMTP Key din Brevo dashboard
```

### ImprovMX (primire emailuri)
- **Service:** improvmx.com (gratis, fără SMTP)
- **Config:** Alias `daniel@thinkflow.ro` → forward la `thinkflowhub@gmail.com`
- **Dashboard:** https://app.improvmx.com (login cu thinkflowhub@gmail.com)
- **Status:** Activ după propagare MX records ✅

### Brevo SMTP (trimitere emailuri)
- **Service:** brevo.com (gratis, 300 emailuri/zi, fost Sendinblue)
- **SMTP Server:** `smtp-relay.brevo.com`
- **Port:** `587` (TLS)
- **Login:** `b13476001@smtp-brevo.com`
- **SMTP Key generat:** *(vezi .env.local sau Brevo dashboard)*
- **Dashboard:** https://app.brevo.com → Account → TP → SMTP & API
- **Authorized IPs:** Trebuie adăugat IP-ul Gmail (sau `0.0.0.0/0`) pentru ca Gmail "Send mail as" să funcționeze
- **Status:** SMTP Key generat ✅, așteaptă autorizare IP pentru Gmail

### Gmail "Send mail as" (daniel@thinkflow.ro)
- **Feature:** Gmail → Settings → Accounts → "Add another email address"
- **Status:** Parțial configurat (blocat la autentificare SMTP — IP neautorizat în Brevo)
- **Rezolvare:** Adaugă `0.0.0.0/0` (sau IP specific) în Brevo → TP → SMTP & API → Authorized IPs
- **Verificare:** Gmail trimite cod pe daniel@thinkflow.ro → ImprovMX forward → thinkflowhub@gmail.com

### Nodemailer (formular contact site)
- **File:** `src/app/api/supabase/contact/route.ts`
- **Config:** SMTP Brevo (smtp-relay.brevo.com:587, login b13476001@smtp-brevo.com)
- **Env vars:** SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_EMAIL

### Vercel Tokens
| Token | Scope | Status | Used for |
|-------|-------|--------|----------|
| *(Team DNS PAT — vezi Vercel dashboard)* | Team DNS | ✅ | Adăugat MX records |
| *(Vercel Deploy Token — vezi .vercel/project.json)* | Deploy | ✅ | Deploy Vercel |
| *(Personal PAT — nefolosit)* | Personal (user) | ⚠️ | Inutil (team domain) |

**To create a DNS-capable token:** Vercel Dashboard → Team (thinkflow-hubs-projects) → Settings → Tokens → Create PAT with DNS scope.

## Affiliate Roadmap & Content Plan

### Affiliate Programs Per Cluster

| Categorie | Program | Aplicație | Șansă | Prioritate |
|-----------|---------|-----------|-------|------------|
| **Cloud/Hosting** | DigitalOcean | Aplicare directă | ~80% | Mare |
| | Vultr | Aplicare directă | ~70% | Mare |
| | Hetzner | De verificat | ~40% | Medie |
| | Linode (Akamai) | Aplicare directă | ~50% | Medie |
| | Cloudways | Aplicare directă | ~80% | Medie |
| | Namecheap | Aplicare directă | ~90% | Medie |
| **Dev Tools** | Datadog | Aplicare directă | ~60% | Medie |
| | Sentry | Aplicare directă | ~70% | Medie |
| **AI** | ElevenLabs | Aplicare directă | ~70% | Mare (avem articol) |
| | Supabase | Partner form | ~60% | Mare (avem articol) |
| | Pinecone | via PartnerStack | ~45% | După LinkedIn |
| | Qdrant | via PartnerStack | ~45% | După LinkedIn |
| **Rețele** | PartnerStack | Aplicație directă | ~45% | După LinkedIn |
| | CJ Affiliate | Aplicație directă | ~25% | După 3 luni trafic |

### Recommended Blog Articles

**Tier 1 — Prioritate maximă (monetizare directă):**

| # | Articol | Vizat | Keywords |
|---|---------|-------|----------|
| 1 | Hetzner vs DigitalOcean: Dedicated Servers for AI Workloads | Hetzner, DigitalOcean | hetzner vs digitalocean, dedicated server AI, cloud cost 2026 |
| 2 | Ollama in Production: Running Local LLMs on Bare Metal | Hetzner, Vultr | ollama production, local llm deployment, llm on dedicated server |
| 3 | CI/CD for Self-Hosted Next.js: GitHub Actions + Docker + Hetzner | GitHub, Hetzner | self-hosted next.js cicd, github actions hetzner, next.js deploy |
| 4 | PostgreSQL in 2026: Supabase vs Self-Hosted vs Managed | Supabase, DigitalOcean, Hetzner | postgresql 2026, supabase vs self-hosted, managed postgres |

**Tier 2 — Extindere reach:**

| # | Articol | Vizat |
|---|---------|-------|
| 5 | Web Scraping at Scale: Python, Proxies, and Infrastructure | DigitalOcean, Vultr |
| 6 | Server Monitoring for Self-Hosted Apps: Datadog, Sentry, Open Source | Datadog, Sentry |
| 7 | Multi-Agent Systems with LangGraph: Production Blueprint | Qdrant, Vultr |
| 8 | Docker Compose for AI Apps: Complete Production Reference | DigitalOcean, Vultr |

**Tier 3 — GEO + brand awareness:**

| # | Articol | Vizat |
|---|---------|-------|
| 9 | GEO Content Strategy in 2026: How AI Search Engines Read Your Site | — |
| 10 | Cost of Building AI Infrastructure in Europe: Complete Guide 2026 | Hetzner, Vultr, DigitalOcean |
| 11 | FastAPI for ML Inference: Production Patterns and Deployment | Vultr, DigitalOcean |

### Aplicare Recomandată — Ordine
1. **Supabase** (direct, formular partener) — acum
2. **DigitalOcean + Vultr** (direct, programe deschise) — acum
3. **ElevenLabs** (direct) — acum (avem deja articol)
4. **PartnerStack** — după LinkedIn Company Page
5. **CJ Affiliate** — după 3 luni de trafic constant

## Relevant Files
- `src/app/api/og/route.tsx` — Dynamic OG image generator
- `src/app/api/supabase/contact/route.ts` — Contact with Supabase
- `src/app/api/supabase/newsletter/subscribe/route.ts` — Newsletter subscribe
- `src/app/api/supabase/newsletter/unsubscribe/route.ts` — Newsletter unsubscribe
- `src/app/api/supabase/analytics/view/route.ts` — Blog analytics
- `src/lib/supabase.ts` — Supabase server client
- `src/lib/posts.ts` — Post data layer
- `src/app/blog/[slug]/page.tsx` — Blog detail + Article schema + OG metadata
- `src/app/sitemap.ts` — Main sitemap
- `src/app/sitemap-images/route.ts` — Image sitemap
- `src/components/BlogContent.tsx` — Blog listing (to refactor)
- `scripts/blog_image_generator.py` — Python hero image generator
