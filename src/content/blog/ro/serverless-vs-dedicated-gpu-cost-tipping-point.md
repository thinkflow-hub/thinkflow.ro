---
title: "Serverless vs GPU Dedicat: Punctul Exact de Cotitură al Costului pentru Workload-uri LLM"
description: "Analiză de cost Vercel serverless vs GPU dedicat Hetzner pentru inferență LLM. La 50K, 500K și 5M de cereri lunare, care variantă e mai ieftină? Benchmark-uri reale din 2026."
date: "2026-07-09"
category: "Cloud Hosting"
tags: [serverless, gpu, cost-analysis, vercel, hetzner, llm-inference]
affiliatePrograms: [Vercel, Hetzner]
image: "/api/og?title=Serverless+vs+GPU+Dedicat&logos=vercel,hetzner&category=Cloud+Hosting&tags=cost,gpu,llm"
verification: "market-analysis"
---

# Serverless vs GPU Dedicat: Punctul Exact de Cotitură al Costului

Zicem că o echipă rulează Llama 3.1 8B printr-o funcție <a href="https://vercel.com/?ref=thinkflow" rel="sponsored nofollow">Vercel</a> care face proxy și streamează răspunsul — 2 milioane de cereri pe lună, un volum tipic pentru un produs la stadiu mediu. Factura pentru funcție ajunge la aproximativ $954/lună odată ce durata activă și bandwidth-ul sunt calculate corect, nu numărul de invocări pe care Vercel îl arată implicit.

Mută același workload pe un singur server GPU dedicat <a href="https://www.hetzner.com/?ref=thinkflow" rel="sponsored nofollow">Hetzner GEX44</a> și cifra devine $231/lună, fix, indiferent dacă acele 2 milioane de cereri vin uniform sau în trei vârfuri brutale de marți după-amiază.

Diferența nu e liniară. Sub un anumit volum, serverless e mai ieftin și nu la limită. Peste el, dedicatul e mai ieftin și nici aici nu e la limită. Articolul de față găsește exact linia asta și arată calculul din spate — plus costurile ascunse de ambele părți pe care o comparație simplă de preț-per-cerere le ratează.

![Aceleași 2 milioane de cereri pe lună, două facturi complet diferite: Vercel serverless la $954/lună vs Hetzner GEX44 dedicat la $231/lună fix](/images/blog/serverless-gpu-monthly-bill-comparison.svg)

---

## Factura Vercel Serverless, Descompusă

Vercel nu rulează GPU-ul. Funcția de partea Vercel e un proxy: deschide o conexiune către locul unde trăiește efectiv modelul (un API de inferență găzduit, sau propriul box GPU) și rămâne facturată ca „activă" pe toată durata în care ține acea conexiune deschisă cât timp streamează token-uri către client. Pentru un răspuns de 500 de token-uri la aproximativ 40 token-uri/secundă, asta înseamnă circa 12 secunde de durată activă per cerere — cifra care chiar determină factura, nu numărul de cereri luat separat.

Ipotezele folosite mai jos, declarate ca să poată fi verificat calculul: 12 secunde durată activă, 1 GB memorie provizionată, ~600 KB payload mediu de răspuns (text plus headers/JSON), tarifele Fluid Compute din Vercel Pro, și alocările incluse în plan (1 TB Fast Data Transfer, 10M Edge Requests) înainte să înceapă depășirea de cotă.

| Componentă | Formulă | 50K cereri/lună | 500K cereri/lună | 5M cereri/lună |
|---|---|---|---|---|
| Execuție funcție (CPU + memorie, durată activă) | $0.128/CPU-hr + $0.0106/GB-hr | $23 | $231 | $2,310 |
| Bandwidth (Fast Data Transfer) | $0.15/GB peste 1TB inclus | $0 | $0 | $300 |
| Cereri Edge | $2/1M peste 10M incluse | $0 | $0 | $0 |
| **Total** | | **$23** | **$231** | **$2,610** |

![Costul Vercel serverless pe componentă, pe trei nivele de volum: $23 la 50K, $231 la 500K, $2,610 la 5M cereri pe lună](/images/blog/serverless-gpu-cost-scaling-by-tier.svg)

Două lucruri de reținut. Întâi, la 50K și 500K cereri, bandwidth-ul și cererile edge rămân în limitele incluse ale Vercel Pro — toată factura e durată de calcul. Al doilea, taxa de bază de $20/lună a planului Pro e lăsată deliberat în afara tabelului: e un cost de platformă pe care o echipă îl plătește indiferent dacă lansează sau nu o funcționalitate LLM, deci nu schimbă unde cade punctul de cotitură. Adaug-o mental înapoi dacă o cifră curată de cost total de deținere contează mai mult decât costul marginal specific al funcționalității LLM.

### Aritmetica din spatele cifrei de 500K

Merită parcursă o dată, pentru că e cifra pe care se sprijină tot restul articolului. La 12 secunde de durată activă și 1 GB memorie provizionată:

- Timp CPU: 500,000 cereri × 12s ÷ 3,600 = 1,666.7 ore-CPU × $0.128 = $213.3
- Timp memorie: 1,666.7 GB-ore × $0.0106 = $17.7
- Invocări: 500,000 ÷ 1,000,000 × $0.60 = $0.30
- Subtotal: $231.3

![Descompunerea celor $231/lună la 500K cereri: $213.3 timp CPU (92%) plus $17.7 timp memorie (8%) plus $0.30 invocări (0.1%)](/images/blog/serverless-gpu-500k-arithmetic-breakdown.svg)

Cifra asta rămâne valabilă doar cât timp răspunsul mediu chiar e ~500 de token-uri la ~40 token-uri/secundă. O echipă care streamează completări mai lungi — răspunsuri RAG cu citări, răspunsuri de agent cu mai mulți pași — împinge durata activă în sus și mută punctul de cotitură mai jos, uneori mult sub 500K. O echipă care servește completări scurte de tip clasificare (50–100 token-uri) îl împinge în direcția opusă, peste 1M. Formula contează mai mult decât cifra specifică; rulează-o pe loguri reale de producție înainte să tratezi orice din articolul ăsta ca pe o prognoză.

### Variații pe regiune și model de facturare

Tarifele Fluid Compute din Vercel variază pe regiune — o funcție care rulează în São Paulo se facturează vizibil mai scump per GB-oră decât una într-o regiune din SUA sau UE. Echipele rămase pe modelul vechi de preț per-invocare al Vercel (pre-Fluid Compute) vor vedea o curbă complet diferită, de obicei mai plată la volum mic și mai abruptă la volum mare, pentru că facturarea veche taxează durata alocată integral, nu timpul activ de CPU. Verifică pe ce model de facturare e efectiv proiectul înainte să aplici direct cifrele de mai sus.

![Variație pe regiune și model de facturare: São Paulo se facturează vizibil mai scump per GB-oră decât US/EU, iar prețul vechi per-invocare produce o curbă mai plată apoi mai abruptă decât Fluid Compute](/images/blog/serverless-gpu-region-billing-variance.svg)

---

## Alternativa GPU Dedicat

Un Hetzner GEX44 costă €184/lună (~$211 la cursul de mijloc 2026) — un NVIDIA RTX 4000 SFF Ada cu 20 GB VRAM, un Intel Core i5-13500 și 64 GB RAM. Adaugă Cloudflare în față pentru TLS, caching și protecție DDoS de bază la aproximativ $20/lună, iar costul total ajunge la circa $231/lună. Cifra asta nu se mișcă indiferent dacă serverul servește 50,000 de cereri sau 5 milioane — nu există niciun contor per-cerere care rulează.

Rulând vLLM pe acest hardware, un model de clasă 8B precum Llama 3.1 8B încape confortabil, cu loc suficient pentru batching. Nu există taxă de invocare a funcției, niciun contor de bandwidth dincolo de termenii proprii ai Cloudflare și niciun cold start — modelul stă rezident în VRAM tot timpul cât serverul e pornit. Pentru echipele care au nevoie de mai mult spațiu de manevră, GEX130 de la Hetzner (RTX 6000 Ada, 48 GB VRAM) costă circa €838/lună și acoperă modele de 32B–70B cu quantizare; aceeași logică de cost fix se aplică la un plafon mai ridicat.

![Nivelurile GPU Hetzner: GEX44 la €184/lună cu 20GB VRAM pentru modele 7B–14B, GEX130 la ~€838/lună cu 48GB VRAM pentru modele 32B–70B — VRAM e constrângerea de dimensionare, nu volumul de cereri](/images/blog/serverless-gpu-hetzner-tier-specs.svg)

Compromisul pe care o echipă îl face pentru tariful ăsta fix: provizionarea durează una până la trei zile lucrătoare în loc de un singur apel API, și nu există scalare elastică dacă traficul se triplează peste noapte. Ăsta e costul real al hardware-ului dedicat și trebuie să intre în decizie, chiar dacă nu apare pe nicio factură.

VRAM-ul e constrângerea reală de dimensionare, nu cererile pe lună. Douăzeci de gigabytes acoperă confortabil modele de 7B–14B cu loc pentru batching concurent; împinge spre un model de 32B și quantizarea încetează să mai fie opțională. Acolo începe conversația despre GEX130, nu mai devreme — cumpărarea unei cutii mai mari din start, „ca să fii sigur", e echivalentul din hardware dedicat al supra-provizionării unei instanțe EC2, și erodează exact avantajul de cost pe care se bazează comparația asta.

Bandwidth-ul merită și el o a doua privire. Termenii Cloudflare tratează traficul HTTP proxy-at ca fiind, în practică, nemăsurat pentru un workload tipic de API, motiv pentru care $20/lună îl acoperă indiferent de volumul de cereri din tabelele de mai sus. E un model genuin diferit de depășirea per-GB a Vercel peste 1TB, și e parte din motivul pentru care linia dedicatului rămâne plată la orice nivel de volum, în loc să urce treptat așa cum face linia serverless.

Comanda e celălalt detaliu practic pe care echipele îl subestimează. Un GEX44 trece prin Hetzner Robot, nu prin Cloud API-ul cu provizionare instant — așteaptă-te la o taxă unică de setup pe prima factură și la o fereastră de livrare măsurată în zile lucrătoare, nu în minute. E un compromis bun pentru un workload cu volum cunoscut și stabil. E un compromis prost pentru o echipă care încă nu știe dacă luna viitoare aduce 50K cereri sau 5 milioane; provizionarea unei cutii de dimensiune greșită și re-comandarea costă atât bani, cât și zilele de așteptare, de două ori.

### Cum se compară asta cu un API de inferență găzduit

Există o a treia opțiune care merită menționată, chiar dacă nu e subiectul de aici: plata per token către un API găzduit, în loc să rulezi fie funcții proxy serverless, fie o cutie dedicată. Inferența găzduită pentru un model open-weight de clasă 8B costă de obicei undeva între $0.10–$0.30 per 1M token-uri, în funcție de furnizor și lungimea contextului. La volum mic, asta e adesea mai ieftin decât oricare dintre opțiunile din acest articol, odată ce timpul de inginerie e prețuit corect — nimeni nu trebuie să administreze un GPU sau să se gândească la facturarea pe durată activă. Punctul de intersecție față de self-hosting apare de obicei undeva între 150M și 250M token-uri pe lună, mult peste punctul de cotitură pe număr de cereri discutat aici, pentru că volumul de token-uri și numărul de cereri nu evoluează împreună odată ce lungimea răspunsului variază. Cadrul onest: serverless vs. dedicat e întrebarea corectă odată ce o echipă a decis deja să facă self-hosting. Dacă să faci self-hosting deloc e o întrebare separată, mai devreme în proces.

---

## Tabelul Punctului de Cotitură

| Cereri/lună | Vercel Serverless | Hetzner Dedicat | Câștigător |
|---|---|---|---|
| 50K | $23 | $231 | Serverless |
| 250K | $116 | $231 | Serverless |
| 500K | $231 | $231 | Prag de echilibru |
| 1M | $462 | $231 | Dedicat (de 2.0x mai ieftin) |
| 2M | $954 | $231 | Dedicat (de 4.1x mai ieftin) |
| 5M | $2,610 | $231 | Dedicat (de 11.3x mai ieftin) |

500,000 de cereri pe lună e linia, aproape până la ultimul dolar, date fiind ipotezele de mai sus. Sub ea, elasticitatea merită plătită. Peste ea, fiecare cerere în plus pe serverless costă bani reali, în timp ce costul cutiei dedicate rămâne fix — motiv exact pentru care multiplul continuă să crească în loc să se stabilizeze.

![Punctul de cotitură: costul Vercel serverless urcă de la $23 la 50K cereri până la $2,610 la 5M, intersectând linia fixă de $231/lună a Hetzner dedicat la pragul de echilibru de 500K](/images/blog/serverless-gpu-tipping-point-crossover.svg)

### Ce nu arată tabelul

Cold start-urile sunt reale de partea serverless: o funcție care n-a mai procesat o cerere de câteva minute are nevoie de 800–2,400ms ca să pornească, înainte să apuce măcar să deschidă conexiunea de proxy, peste care se adaugă și time-to-first-token propriu al modelului. O cutie dedicată cu modelul deja încărcat în VRAM nu adaugă nimic din toate astea — latența primului token e cât ia GPU-ul, punct.

Partea dedicată are propriul cost ascuns, în direcție opusă: capacitatea neutilizată. Un GEX44 costă $231/lună indiferent dacă e saturat 24 de ore pe zi sau procesează trafic real doar opt ore. O echipă care rulează inferență doar în orele de program plătește tot pentru o lună întreagă de hardware — tariful fix e un avantaj la volum mare și un dezavantaj la utilizare mică și în rafale. Ăsta e motivul real pentru care punctul de cotitură nu e o funcție pură a numărului de cereri; e o funcție a numărului de cereri *și* a cât de uniform e distribuit traficul de-a lungul zilei.

Ca să punem o cifră pe asta: o echipă cu 500K cereri distribuite uniform pe 730 de ore lunar folosește la maximum avantajul tarifului fix. O echipă cu aceleași 500K cereri, dar concentrate doar într-o fereastră de 10 ore de program, plătește efectiv aceiași $231 pentru circa 300 de ore active în loc de 730 — un cost real per cerere de peste dublu față de ce sugerează tariful fix. Nici tabelul serverless, nici tabelul dedicat de mai sus nu țin cont de asta de unul singur; apare abia când cineva mapează traficul real pe ceas, nu doar pe calendar.

Există un al treilea cost care aparține discuției ăsteia și rareori e modelat: timpul de inginerie necesar ca să rulezi efectiv cutia dedicată. Cineva răspunde de patch-urile de OS, actualizările de driver, monitorizarea discului și de alerta de la ora 2 dimineața dacă GPU-ul cade de pe bus. Serverless face din asta problema altcuiva; hardware-ul dedicat o transformă într-un cost real, deși de obicei mic, în timpul cuiva care menține serverul sănătos.

![Ce nu arată tabelul punctului de cotitură: 800–2,400ms cold start pe serverless vs 0ms adăugat pe dedicat, și capacitate neutilizată — aceeași factură de $231/lună acoperind 730 de ore complet folosite sau doar ~300 de ore de program, dublând costul real per cerere](/images/blog/serverless-gpu-hidden-costs.svg)

---

## Jocul Hibrid

Majoritatea setup-urilor de producție ajung să ruleze pe amândouă, împărțite pe tip de workload, nu printr-o migrare totul-sau-nimic. Serverless-ul se ocupă de UI, auth, webhooks și orice e ușor și în rafale. Cutia dedicată se ocupă de inferență și procesare batch — părțile unde durata și volumul chiar determină costul.

```python
# router.py — FastAPI middleware on Vercel that sends inference
# traffic to the dedicated GPU box and lets everything else run serverless.

import os
import httpx
from fastapi import FastAPI, Request

app = FastAPI()

GPU_INFERENCE_URL = os.environ["HETZNER_INFERENCE_URL"]  # e.g. https://inference.internal:8000

# Only these paths carry real GPU cost. Everything else is cheap enough
# to leave on Vercel without a second thought.
HEAVY_PATHS = {"/api/chat/completions", "/api/embeddings", "/api/batch"}

@app.middleware("http")
async def route_by_workload(request: Request, call_next):
    if request.url.path in HEAVY_PATHS:
        async with httpx.AsyncClient(timeout=60.0) as client:
            upstream = await client.request(
                request.method,
                f"{GPU_INFERENCE_URL}{request.url.path}",
                headers=dict(request.headers),
                content=await request.body(),
            )
            return upstream
    return await call_next(request)
```

Asta ține factura Vercel mică (doar rutele ușoare acumulează durată de funcție) și pune fiecare dolar de cost GPU pe un tarif fix de $231/lună, indiferent cum crește traficul respectiv.

Două completări fac setup-ul hibrid semnificativ mai bun decât versiunea simplă de mai sus. Întâi, un cache semantic în fața endpoint-ului GPU — chiar și un cache simplu, pe potrivire exactă sau pe similaritate de embedding, aplicat pe prompt-urile comune — reduce numărul de cereri care ajung vreodată la cutia dedicată, ceea ce contează cel mai mult pentru traficul de tip FAQ sau support-bot, unde aceleași câteva întrebări se repetă constant. Al doilea, un health check pe endpoint-ul GPU cu fallback către un API găzduit (Together, Fireworks sau similar) acoperă singura slăbiciune reală a hardware-ului dedicat: lipsa failover-ului automat dacă cutia cade la ora 3 dimineața. Ruta de fallback costă mai mult per token, dar doar în timpul unei căderi — o asigurare ieftină împotriva singurului punct de eșec pe care îl introduce un server dedicat.

Monitorizarea ambelor părți contează la fel de mult ca logica de rutare. Utilizarea GPU, marja de VRAM disponibilă și adâncimea cozii pe cutia dedicată; numărul de invocări și durata activă de partea serverless. Fără amândouă, punctul de cotitură calculat azi derivă discret pe măsură ce compoziția traficului se schimbă — lungimea medie a răspunsului care urcă de la 500 la 800 de token-uri mută punctul de intersecție fără ca nimeni să observe, până observă factura.

![Jocul hibrid: router.py verifică HEAVY_PATHS și rutează traficul ușor către Vercel serverless, în timp ce cererile de chat/embeddings/batch trec printr-un cache semantic către cutia GPU Hetzner GEX44 cu tarif fix, cu un fallback de health-check către un API găzduit](/images/blog/serverless-gpu-hybrid-architecture.svg)

## Diagrama de Decizie

```
Cereri LLM lunare sub 100K?
  → Serverless (Vercel, AWS Lambda)

Cereri LLM lunare între 100K–400K?
  → Zonă gri — rulează ambele variante timp de 30 de zile și compară facturile reale

Cereri LLM lunare peste 400K, volum stabil?
  → GPU Dedicat (Hetzner, Vultr)

Trafic în rafale, fără tipar zilnic clar încă?
  → Serverless — prima de elasticitate merită plătită până se conturează tiparul

Trafic constant și previzibil de la o lună la alta?
  → Dedicat — în acest punct economia nu mai e o chestiune de judecată
```

Singurul input care contează aici e volumul de cereri și distribuția lui pe parcursul zilei — nu mărimea echipei, nu stadiul de finanțare, nu ce rulează un competitor.

Dacă echipa ta se lovește de pereții de cost ai serverless-ului, noi proiectăm și construim arhitectura hibridă care îi elimină — [ia legătura](https://thinkflow.ro/ro/contact?src=serverless-vs-dedicated-gpu-cost-tipping-point).
