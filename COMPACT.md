# ThinkFLOW — Compact 7 Iul 2026

## Logo
- **Think**: Black Signature (handwriting .otf) → #ededed
- **FLOW**: Montserrat ExtraBold (Google Fonts) → #1e40af navy
- Fără hexagon, fără glass pill, fără gradient
- Favicon: monogramă "T" (Signature) + "F" (Montserrat)

## Fonturi
- `BlackSignature.otf` → `/fonts/BlackSignature.otf` (275KB)
- `Montserrat` weight 800 → Google Fonts
- Clase CSS: `.font-signature`, `.font-montserrat-extrabold`

## Email Infrastructure
| Component | Service | Status |
|-----------|---------|--------|
| Primire (forward) | ImprovMX (gratis) | ✅ MX records live |
| Trimitere (SMTP) | Brevo (gratis, 300/zi) | ✅ SMTP Key generat |
| Gmail Send-as | daniel@thinkflow.ro | ⚠️ Așteaptă IP auth Brevo |

## DNS
- **Registrar:** Hostgate → **DNS:** Vercel (ns1/ns2.vercel-dns.com)
- **MX records:** mx1.improvmx.com (10), mx2.improvmx.com (20) ✅

## Token-uri Vercel
| Scope | Status |
|-------|--------|
| Team DNS (PAT) | ✅ Salvat în AGENTS.md |
| Deploy | ✅ Existent |

## Audit Conturi
| Platformă | Handle | Status |
|-----------|--------|--------|
| GitHub | `thinkflow-hub` | ⚠️ Gol (avatar/bio/website lipsă) |
| Fiverr | `thinkflow_ro` | ⚠️ Nealiniat cu brandul |
| Freelancer | `ThinkFLOW` | ⚠️ 0 review-uri |
| Contra | `burcea_daniel...` | ✅ $1k+, aliniat AI |
| LinkedIn | `burcea-daniel-...` | 🔒 Neverificat |

## Site
- 29 pagini statice, Next.js 16.2.10, build OK
- Blog: 5 articole, RSS, JSON-LD, sitemap
- Contact: Nodemailer SMTP Brevo configurat ✅
- **Live** la thinkflow.ro (EN/RO) + news.thinkflow.ro ✅

## ContentFactory (E:\)
- 3 factories (SEO, Copy, Fiverr) — 7+ agenți fiecare
- GEO Discovery → ~27 inputs/run
- GEO Monitor → 15 keywords, qwen2.5-7b
- Task Scheduler: Discovery 3:00 + Monitor 3:30
- 12 Fiverr gigs + 12 images generate

## Next
- Autorizare IP în Brevo → finalizare Gmail Send-as
- Blog publishing (Faza 1 din plan)
- Aplicații affiliate (după compliance pages)
