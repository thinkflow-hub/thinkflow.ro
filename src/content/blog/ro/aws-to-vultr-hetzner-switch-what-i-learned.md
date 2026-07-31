---
title: "Am trecut de la AWS la Vultr și Hetzner — iată ce am învățat"
description: "Benchmark real: costuri, latență, scalare. Next.js pe servere dedicate vs. serverless. Când Vercel îți sparge bugetul și când chiar are sens."
date: "2026-07-06"
category: "Cloud Hosting"
tags: [aws, vultr, hetzner, cloud, hosting, nextjs, devops]
affiliatePrograms: [Vultr, Hetzner]
image: "/api/og?title=Am+trecut+de+la+AWS+la+Vultr+și+Hetzner&logos=vultr,hetzner&category=Cloud+Hosting&tags=aws,cloud,cost"
verification: "market-analysis"
---

# Am trecut de la AWS la Vultr și Hetzner — iată ce am învățat

**Publicat de ThinkFlow · Timp de citire: ~11 min · Pentru: dezvoltatori, ingineri DevOps, CTO care se uită la factura de cloud**

---

Factura AWS a venit într-o marți. Nu era catastrofală — era 1,340 USD pe lună. Dar când am detaliat-o pe capitole, nu am putut justifica cea mai mare parte din ea. NAT gateways inactive. Transfer de date între availability zones. Loguri CloudWatch la care nu mă uitasem de 4 luni. Și o instanță cu 16 GB memorie care rula la o utilizare medie de CPU de 12%.

În luna aceea am început să mă uit altfel la factură. Nu ca infrastructură — ci ca **overhead**.

Acesta nu e un atac la adresa AWS. AWS e cu adevărat excelent la ce face. Dar „excelent la ce face” și „alegerea potrivită pentru workload-ul tău” nu sunt aceeași propoziție.

Iată ce am descoperit după 14 luni de rulat producție pe un mix de servere dedicate Hetzner și instanțe cloud Vultr — cifrele reale, compromisurile reale și situațiile în care m-aș întoarce la AWS fără să stau pe gânduri.

---

## Contextul migrării — ce rulam

Înainte să intrăm în benchmark-uri, contextul onest: nu e vorba de un startup cu workload-uri triviale, dar nici de un Fortune 500 cu cerințe de compliance care anulează grija pentru costuri.

**Workload-uri migrate:**
- 3 aplicații Next.js (una cu trafic mare, două medii)
- 2 backend-uri API Python (FastAPI, async, inferență CPU-bound)
- 1 cluster PostgreSQL (primary + read replica)
- 1 cluster Redis pentru gestionarea sesiunilor și cozi de job-uri
- Nginx reverse proxy + SSL Let's Encrypt
- CI/CD prin GitHub Actions cu runners self-hosted

**Ce am lăsat pe AWS:**
- S3 pentru object storage (nimic nu bate prețul S3 la scară, pentru acest caz specific de utilizare)
- SES pentru emailuri tranzacționale
- CloudFront pentru CDN de assets

Migrarea n-a fost ideologică. A fost incrementală și reversibilă. Asta contează.

---

## Comparația de costuri — cifre reale, nu slide-uri de marketing

### Setup AWS (înainte de migrare)

| Serviciu | Cost lunar |
|---|---|
| EC2 t3.xlarge (4 vCPU, 16 GB) x2 | $280 |
| RDS db.t3.medium PostgreSQL | $115 |
| ElastiCache cache.t3.micro Redis | $47 |
| NAT Gateway + transfer de date | $190 |
| ALB (Application Load Balancer) | $35 |
| CloudWatch Logs + alarme | $28 |
| Storage EBS (500 GB gp3) | $40 |
| Diverse (Route53, Secrets Manager, etc.) | $22 |
| **Total** | **~$757 / lună** |

> Notă: Asta nu include instanța de inferență de 16 GB care a împins totalul la 1,340 USD. Acea instanță a fost declanșatorul auditului.

### Setup Hetzner + Vultr (după migrare)

| Serviciu | Cost lunar |
|---|---|
| Hetzner AX52 dedicat (8 nuclee Ryzen, 64 GB RAM, 2x 1 TB NVMe) | $79 |
| Hetzner CX32 VPS (4 vCPU, 8 GB) — staging | $17 |
| Vultr High Frequency 2 vCPU 4 GB — Redis + job-uri | $24 |
| Hetzner Managed Database PostgreSQL | $48 |
| Hetzner Load Balancer | $7 |
| S3 (rămas pe AWS) | $18 |
| SES (rămas pe AWS) | $6 |
| Cloudflare Pro (CDN + DDoS, înlocuiește CloudFront) | $20 |
| **Total** | **~$219 / lună** |

**Economie lunară: ~$538. Economie anuală: ~$6,456.**

Iar AX52-ul dedicat, la $79/lună, rulează la aproximativ 18-25% CPU, cu loc pentru dublarea workload-ului actual. Instanța AWS echivalentă ar fi un m5.4xlarge — care costă $560/lună on-demand, sau $250/lună cu angajament de tip reserved instance pe 1 an.

---

## Latența — ce s-a schimbat de fapt

Aici lucrurile devin nuanțate, pentru că răspunsul e: depinde în totalitate de unde sunt utilizatorii tăi.

### Assets servite prin CDN (static, JS bundles, imagini)
**Înainte:** CloudFront, TTFB mediu global ~85ms
**După:** Cloudflare Pro, TTFB mediu global ~70ms

Rețeaua edge a Cloudflare e cu adevărat mai bine distribuită decât CloudFront pentru traficul din Europa și Europa de Est. Pentru utilizatorii din România, specific, TTFB a scăzut de la ~95ms la ~40ms după trecerea la Cloudflare cu un PoP la Frankfurt.

### Timpi de răspuns API (dinamic, cu bază de date implicată)
**Înainte (AWS eu-central-1):** P50: 180ms, P95: 420ms, P99: 890ms
**După (Hetzner Falkenstein DC):** P50: 95ms, P95: 210ms, P99: 390ms

Îmbunătățirea e reală, dar are nevoie de o explicație: **cifrele AWS erau degradate de latența NAT gateway și de round-trip-urile bazei de date multi-AZ.** Când colocalizezi serverul aplicației și baza de date în același datacenter (sau folosești networking privat între DC-uri apropiate), elimini o taxă de latență semnificativă pe care o plăteai pentru o „înaltă disponibilitate” de care poate nici nu aveai nevoie cu adevărat.

### Latența de cold start (discuția despre serverless)
Pe Lambda, cold start-urile pentru o funcție Node.js: 800ms - 2,400ms, în funcție de alocarea de memorie și dacă containerul era „warm”.

Pe Hetzner: fără cold starts. Procesul rulează tot timpul.

Pentru orice endpoint API expus direct utilizatorului, cold starts-urile de pe Lambda sunt o problemă reală de UX. Pentru job-uri de fundal, procesare async sau webhook handlers unde utilizatorul nu așteaptă — Lambda e perfect ok.

---

## Next.js pe servere dedicate vs. serverless — compromisurile reale

Asta e secțiunea care generează cele mai multe dezbateri, așa că hai să fim preciși.

### Cazul Vercel — când are sens

Vercel e excelent. O spun fără ironie.

**Vercel chiar câștigă atunci când:**
- Ești o echipă mică (2-5 dezvoltatori) și deployment ops nu e competența ta de bază
- Traficul tău e imprevizibil și are tipare reale de vârf (conținut viral, flash sales)
- Faci prototipare și time-to-first-deploy contează mai mult decât cost-per-request
- Te bazezi mult pe funcții specifice Vercel: Edge Middleware, invalidare cache ISR, preview deployments per PR
- Bugetul tău e sub $50/lună și nu ai nevoie de logică custom pe server

La această scară, avantajul de DX (developer experience) al Vercel merită premium-ul. Cumperi simplitate operațională.

### Când Vercel îți sparge bugetul

Modelul de facturare care bagă echipele în belea:

```
Vercel Pro: $20/month/user
+ Function execution: $0.60 per 1M GB-seconds
+ Bandwidth: $0.15 per GB over 1 TB
+ Edge Requests: $2 per 1M requests
+ Image optimization: $5 per 1K source images
```

Rulează o aplicație Next.js cu:
- 500,000 vizitatori lunari
- Medie de 15 apeluri API per sesiune
- 200ms execuție medie a funcției la 1 GB memorie

Adică: 500,000 x 15 x 0.2s x 1 GB = 1,500,000 GB-seconds = **$900/lună doar în costuri de funcții**, înainte de bandwidth, înainte de imagini, înainte de team seats.

Un Hetzner AX52 la $79/lună gestionează asta cu rezervă, rulând Next.js cu `next start` în spatele Nginx, cu PM2 pentru gestionarea proceselor și deploy-uri zero-downtime via `pm2 reload`.

### Setup-ul Next.js self-hosted care chiar funcționează în producție

```nginx
# nginx.conf (simplified)
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Static assets — cached aggressively
    location /_next/static/ {
        alias /var/www/app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Dynamic routes
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# pm2 ecosystem file
module.exports = {
  apps: [{
    name: 'nextjs-app',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 'max',        # Uses all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
}
```

Deploy zero-downtime: `git pull && npm run build && pm2 reload nextjs-app`

Timp total de deploy: 45-90 secunde, în funcție de complexitatea build-ului. Fără Vercel. Fără taxe de platformă. Fără cold starts.

---

## Scalarea — unde serverele dedicate cer mai multă gândire

Partea onestă: scalarea orizontală e mai complexă operațional pe infrastructură self-hosted.

Pe AWS, pornirea unei alte instanțe și adăugarea ei într-un ALB target group durează 3 minute și o comandă Terraform. Pe Hetzner ai nevoie să:
1. Provizionezi un server nou (apel API sau manual — API-ul Hetzner e bun)
2. Rulezi playbook-ul Ansible/cloud-init ca să-l configurezi
3. Îl adaugi la load balancer
4. Verifici health checks

Asta e o operațiune de 10-15 minute dacă ai automatizarea la punct. Dacă nu ai automatizarea la punct, e o goană de 45 de minute — exact momentul în care nu-ți dorești o goană de 45 de minute.

**Răspunsul practic:** Pentru workload-uri cu tipare de trafic previzibile, serverele dedicate câștigă din punct de vedere economic. Pentru workload-uri unde chiar nu poți prezice când vei avea nevoie de capacitate 10x în 5 minute, auto-scaling-ul de cloud gestionat (AWS, GCP) își merită premium-ul.

Majoritatea aplicațiilor B2B SaaS sunt în prima categorie. Majoritatea aplicațiilor consumer virale sunt în a doua.

---

## Pentru ce aș mai folosi încă AWS

Fără loialități tribale aici. AWS e răspunsul corect pentru:

- **S3** — La scară, nimic nu e mai ieftin sau mai fiabil pentru object storage. Nu face self-host la MinIO pentru nimic critic, dacă nu ai un inginer de storage dedicat.
- **SES** — $0.10 per 1,000 de emailuri. Deliverability-ul e gestionat. Alternativa (Postfix self-hosted + încălzirea reputației IP) e o slujbă full-time.
- **Lambda pentru procesare event-driven** — SNS/SQS/Lambda pentru workflow-uri async e un pattern cu adevărat elegant. Modelul de cost funcționează atunci când nu rulezi request handlers expuse direct utilizatorului.
- **RDS cu multi-AZ** — Dacă baza ta de date căzând timp de 30 de secunde ar provoca un incident business-critical, failover-ul gestionat merită prețul. Failover-ul de la Hetzner Managed Database e mai lent și mai puțin testat în producție.
- **EKS dacă ești deja Kubernetes-native** — Rularea Kubernetes pe bare metal e o treabă care cere ingineri de platformă dedicați. Dacă echipa ta deja trăiește în Kubernetes, EKS sau GKE elimină o povară operațională enormă.

---

## Cadrul de decizie

Nu mai trata alegerea furnizorului de cloud ca pe o identitate. Folosește în schimb asta:

```
Is your traffic pattern genuinely unpredictable?
  YES → Managed cloud (AWS/GCP) with auto-scaling
  NO  → Continue

Do you have dedicated DevOps/SRE to manage infrastructure?
  NO  → Managed cloud or Vercel for simplicity
  YES → Continue

Is your monthly compute spend over $300?
  NO  → Vercel/managed cloud — savings do not justify ops overhead yet
  YES → Continue

Are you running stateless workloads (web servers, APIs)?
  YES → Hetzner/Vultr dedicated or VPS — strong economic case
  NO  → Evaluate per workload (databases: Hetzner Managed DB; storage: S3)
```

---

## Concluzia

AWS nu e scump pentru că e prost. E scump pentru că optimizează pentru flexibilitate și simplitate operațională cu prețul eficienței brute de cost. Plătești pentru capacitatea de a scala de la zero la 10 milioane de request-uri într-o după-amiază.

Dacă chiar ai nevoie de asta, prețul e justificat.

Dacă nu ai — și majoritatea companiilor din intervalul de 10K până la 500K vizitatori lunari nu au — subvenționezi o capacitate pe care n-o vei folosi niciodată, în timp ce plătești pentru NAT gateways, transfer de date cross-AZ și load balancers care costă mai mult pe lună decât un server dedicat complet.

Migrarea nu e lipsită de riscuri. Cere disciplină de automatizare, un pipeline de deploy care nu depinde de „magia” platformei și o evaluare onestă a maturității operaționale a echipei tale.

Dar dacă acele condiții sunt îndeplinite: economia nu e nici pe aproape.

La ThinkFlow, ajutăm echipele de engineering să facă această tranziție fără incidentul de rollback de la 3 dimineața. Dacă te uiți la factura ta de cloud și te întrebi aceleași lucruri ca mine, rulăm cu preț fix un **[Audit de Cost & Migrare Cloud →](https://www.thinkflow.ro/services/cloud-cost-migration-audit)** — sau pur și simplu **[hai să vorbim →](https://www.thinkflow.ro/contact)** mai întâi.

---

*ThinkFlow · București, România · thinkflow.ro*
