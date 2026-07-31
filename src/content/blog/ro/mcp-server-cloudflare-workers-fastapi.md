---
title: "Cum construiești un server MCP cu Cloudflare Workers și FastAPI"
description: "Server MCP (Model Context Protocol) de producție, deployat pe Cloudflare Workers cu backend FastAPI. Conectezi LLM-uri la surse de date reale prin standardul din 2026."
date: "2026-07-10"
category: "AI Infrastructure"
tags: [mcp, cloudflare, workers, fastapi, llm, ai-agents, protocol]
affiliatePrograms: [Cloudflare]
image: "/api/og?title=Server+MCP+Cloudflare+Workers&logos=cloudflare&category=AI+Infrastructure&tags=mcp,workers,fastapi"
verification: "market-analysis"
---

# Cum construiești un server MCP cu Cloudflare Workers și FastAPI

Pe 28 iulie 2026, Model Context Protocol lansează cea mai mare revizuire a specificației de la lansare, un nucleu stateless gândit să ruleze pe infrastructură HTTP obișnuită, nu pe conexiuni fixate, legate de sesiune. Nu e o notă de subsol. E momentul în care MCP încetează să mai fie „noua chestie de la Anthropic" și devine ceea ce a devenit USB-C pentru încărcătoare: conectorul de care nimeni nu mai discută pentru că pur și simplu toată lumea îl folosește.

Majoritatea echipelor care construiesc servere MCP azi apelează la un singur proces Node sau la un container. Funcționează până când agentul care apelează serverul tău trebuie să ruleze de pe trei continente, rate limits trebuie să țină sub un vârf de trafic, iar cold starts pe un container scale-to-zero încep să apară în graficele tale de latență. Cloudflare Workers rezolvă jumătatea de deployment a problemei, la edge; un backend FastAPI din spate se ocupă de partea pentru care Workers n-au fost niciodată gândite — să vorbească cu o bază de date reală, un API intern sau un data warehouse.

Articolul acesta parcurge ambele jumătăți: un Cloudflare Worker care face pe gateway-ul MCP și un serviciu FastAPI care face treaba efectivă cerută de fiecare apel de tool.

---

## Ce este MCP și de ce e standardul din 2026

MCP e un protocol bazat pe JSON-RPC care oferă unui LLM o modalitate standard de a descoperi și apela tools, de a citi resurse și de a folosi prompt-uri expuse de un server, fără ca fiecare produs AI să-și inventeze propriul format de plugin. Anthropic a publicat specificația la finalul lui 2024; până în 2026 a fost adoptată în toolingul de agenți al OpenAI, Google și Microsoft, ceea ce e partea care contează cu adevărat. Un protocol devine infrastructură abia când și competitorii îl implementează.

Transportul care a făcut din MCP un serviciu de rețea viabil, Streamable HTTP, a înlocuit designul original bazat exclusiv pe stdio și a permis serverelor să ruleze ca deployment-uri remote, multi-tenant, în loc de subprocese locale per utilizator. Revizuirea din 28 iulie 2026 merge mai departe: elimină cerința ca un client să rămână fixat pe o singură instanță de server pe toată durata unei sesiuni — exact ce făcea ca MCP în spatele unui load balancer standard să fie incomod, în primul rând. Header-ele noi (`Mcp-Method`, `Mcp-Name`) permit unui gateway să facă routing și rate limiting pe baza operației apelate, fără să parseze body-ul cererii, relevant direct pentru Worker-ul construit mai jos.

Nimic din toate astea nu schimbă cum arată un apel de tool în ziua de zi cu zi: un client trimite `tools/list` ca să descopere ce e disponibil, apoi `tools/call` cu numele unui tool și argumentele lui, ca să-l invoce. Ce se schimbă e ce anume are voie să stea între client și codul care rulează tool-ul. Exact acesta e golul pe care îl umple un gateway la edge.

![Cum funcționează MCP: un client apelează tools/list și tools/call prin JSON-RPC; revizuirea din 28 iulie 2026 face nucleul stateless și adaugă header-ele Mcp-Method/Mcp-Name pentru routing](/images/blog/mcp-cloudflare-protocol-explainer.svg)

---

## Arhitectura: Cloudflare Worker ca gateway MCP, FastAPI ca backend

Separarea e deliberată, nu întâmplătoare:

**Worker-ul** termină conexiunea MCP, validează credențialele clientului, aplică rate limits și traduce cererile `tools/call` în apeluri HTTP obișnuite către backend. Rulează în izolatele V8 ale Cloudflare, care nu au problema cold-start-ului specifică containerelor: un izolat deja instanțiat oriunde în rețeaua Cloudflare răspunde în milisecunde cu o singură cifră, iar chiar și un izolat rece se inițializează într-o fracțiune din timpul necesar unui container. Pentru un gateway MCP aflat între un agent și tool-urile lui, acest prag de latență contează mai mult decât pentru un API CRUD obișnuit.

**FastAPI** face ce Workers nu pot face structural: ține un pool de conexiuni de lungă durată către Postgres, rulează un stack de dependințe Python mai greu sau stă într-un VPC lângă sistemele pe care tool-urile chiar le interoghează. Nu vorbește deloc MCP. E un simplu serviciu REST. Worker-ul e singurul lucru care știe că MCP există.

![Diagramă de arhitectură: client MCP către Cloudflare Worker (auth, rate limiting, protocol MCP, routing) către backend FastAPI (logică de business, bază de date, API-uri interne)](/images/blog/mcp-cloudflare-architecture-flow.svg)

```
Client MCP (Claude, un framework de agenți, Claude Code)
        │  Streamable HTTP, JSON-RPC
        ▼
Cloudflare Worker  (auth · rate limiting · protocol MCP · routing)
        │  HTTPS simplu, cheie API internă
        ▼
Backend FastAPI    (logică de business · bază de date · API-uri interne)
```

E aceeași formă ca a unui API gateway în fața unui microserviciu, cu o diferență: protocolul din fața gateway-ului e MCP în loc de REST sau GraphQL, deci treaba gateway-ului include traducerea payload-urilor `tools/call` în orice convenție de apelare vorbește deja backend-ul.

![De ce edge-ul: un izolat V8 cald răspunde în milisecunde cu o singură cifră, un izolat rece se inițializează într-o fracțiune din timpul de cold-start al unui container](/images/blog/mcp-cloudflare-isolate-vs-container.svg)

---

## Codul: handler MCP în TypeScript + definiții de tools în FastAPI

### Worker-ul: handler-ul protocolului MCP

```typescript
// src/index.ts — Cloudflare Worker acting as the MCP gateway
import { createMcpHandler } from "agents/mcp";
import { z } from "zod";

interface Env {
  BACKEND_API_KEY: string;
  FASTAPI_BASE_URL: string;
  MCP_RATE_LIMITER: RateLimit;
}

const handler = createMcpHandler<Env>({
  name: "thinkflow-data-mcp",
  version: "1.0.0",
  tools: (server, env) => {
    server.tool(
      "get_customer_invoices",
      "Fetch invoices for a customer by internal ID from the billing system",
      { customerId: z.string().describe("Internal customer ID, e.g. cus_8f21a") },
      async ({ customerId }) => {
        const res = await fetch(`${env.FASTAPI_BASE_URL}/tools/invoices/${customerId}`, {
          headers: { "X-Internal-Key": env.BACKEND_API_KEY },
        });

        if (!res.ok) {
          return {
            content: [{ type: "text", text: `Backend returned ${res.status}` }],
            isError: true,
          };
        }

        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );

    server.tool(
      "search_knowledge_base",
      "Search internal product documentation for a query string",
      {
        query: z.string().describe("Free-text search query"),
        limit: z.number().min(1).max(20).optional().default(5),
      },
      async ({ query, limit }) => {
        const url = `${env.FASTAPI_BASE_URL}/tools/search?q=${encodeURIComponent(query)}&limit=${limit}`;
        const res = await fetch(url, { headers: { "X-Internal-Key": env.BACKEND_API_KEY } });
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      },
    );
  },
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler(request, env, ctx);
  },
};
```

Fiecare apel `server.tool()` înregistrează un tool, schema lui de input (validată cu Zod, care generează și JSON Schema-ul pe care clientul îl vede din `tools/list`) și un handler care nu face nimic specific MCP dincolo de a returna array-ul `content` pe care îl așteaptă protocolul. Munca efectivă (interogarea unei baze de date, rularea unei căutări) e un simplu `fetch()` către FastAPI.

### Backend-ul: definițiile de tools în FastAPI

```python
# main.py — FastAPI backend, no MCP awareness required
import os
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel

app = FastAPI()
BACKEND_API_KEY = os.environ["BACKEND_API_KEY"]


def verify_internal_key(x_internal_key: str = Header(...)) -> None:
    if x_internal_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


class Invoice(BaseModel):
    id: str
    amount_cents: int
    status: str


@app.get("/tools/invoices/{customer_id}", response_model=list[Invoice])
def get_invoices(customer_id: str, _: None = Depends(verify_internal_key)):
    # Replace with a real query against the billing database
    return billing_db.fetch_invoices(customer_id)


@app.get("/tools/search")
def search_knowledge_base(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    _: None = Depends(verify_internal_key),
):
    return knowledge_base.search(q, limit=limit)
```

Treaba FastAPI aici e REST obișnuit: Pydantic validează forma răspunsului, `Depends` se ocupă de verificarea auth internă, și nimic din acest fișier nu importă vreo librărie MCP. Ăsta e sensul separării: echipa de backend poate itera pe acest serviciu fără să știe sau să-i pese că, la final, apelantul e un LLM.

---

## Securizare: chei API și rate limiting pe Cloudflare

Contează două straturi, și stau în puncte diferite ale traseului cererii.

![Două granițe de încredere: un Bearer token protejează segmentul public client-Worker, o cheie internă X-Internal-Key protejează segmentul Worker-FastAPI în interiorul Cloudflare Tunnel](/images/blog/mcp-cloudflare-security-layers.svg)

**Între Worker și FastAPI**, o cheie internă comună (`X-Internal-Key` de mai sus) e suficientă. Acest trafic nu părăsește niciodată rețeaua Cloudflare dacă backend-ul e accesibil și el prin Cloudflare Tunnel, iar o cheie statică, rotită periodic prin `wrangler secret put BACKEND_API_KEY`, acoperă nevoia fără să adauge complexitate OAuth unui serviciu care nu e niciodată apelat direct de un utilizator final.

**Între clientul MCP și Worker**, tratează-l ca pe orice API public: cere un bearer token și aplică rate limiting înainte ca cererea să ajungă la un handler de tool. Binding-ul Workers Rate Limiting de la Cloudflare face asta fără un serviciu separat:

```toml
# wrangler.toml
[[ratelimits]]
name = "MCP_RATE_LIMITER"
namespace_id = "1001"
simple = { limit = 300, period = 60 }
```

```typescript
// Inside the Worker, before dispatching to the MCP handler
async function checkRateLimit(env: Env, clientId: string): Promise<boolean> {
  const { success } = await env.MCP_RATE_LIMITER.limit({ key: clientId });
  return success;
}
```

ID-ul de client de aici ar trebui să vină din bearer token, nu din adresa IP. Clienții MCP stau frecvent în spatele unor IP-uri de egress partajate (platforma de agenți a unei companii, un pool de CI runners), iar limitele bazate pe IP fie blochează trafic legitim, fie nu limitează nimic util. Pentru echipele care preferă să nu se atingă de cod, regulile de rate limiting WAF din dashboard-ul Cloudflare acoperă aceeași nevoie la nivel de zonă, potrivite pe path (`/mcp`) în loc de un binding.

Pentru control al accesului de nivel OAuth (să delimitezi ce tools poate apela agentul unui anumit utilizator, nu doar dacă se poate conecta), <a href="https://www.cloudflare.com/?ref=thinkflow" rel="sponsored nofollow">Cloudflare Workers</a> permite conectarea serverului MCP în spatele Cloudflare Access sau al unui furnizor OAuth terț (GitHub, Google, Auth0), emițând tokenuri delimitate per utilizator, în loc de o singură cheie comună pentru toți apelanții.

![Flux al cererii: ID-ul de client extras din Bearer token, verificat contra unei limite de 300 de cereri la 60 de secunde, apoi fie trimis la handler-ul de tool, fie respins cu 429](/images/blog/mcp-cloudflare-request-flow.svg)

---

## Cost: tier gratuit vs plătit

| Plan | Inclus | Depășire |
|---|---|---|
| Workers Free | 100,000 cereri/zi | Plafon fix — cererile peste acest prag sunt respinse, fără surprize la facturare |
| Workers Paid ($5/lună) | 10M cereri/lună, 30M CPU-ms/lună | $0.30 per 1M cereri suplimentare, $0.02 per 1M CPU-ms suplimentare |

![Prețuri Cloudflare Workers: tier gratuit la 100,000 cereri/zi vs tier plătit la $5/lună pentru 10M cereri și 30M CPU-ms, cu tarife de depășire și un exemplu calculat la 500,000 apeluri/zi](/images/blog/mcp-cloudflare-cost-tiers.svg)

Un server MCP folosit intern de o mână de ingineri rareori se apropie de cele 100,000 cereri/zi ale tier-ului gratuit. Plafonul respectiv seamănă mai degrabă cu traficul unui API public moderat de solicitat. Odată depășit, baza de $5 a planului plătit acoperă 10 milioane de cereri pe lună înainte să se aplice vreo taxă per cerere. O echipă ale cărei agenți apelează serverul MCP de 500,000 de ori pe zi (15 milioane pe lună) ajunge la aproximativ $5 bază plus 5 milioane de cereri peste cota inclusă, la $0.30/milion, adică în jur de $6.50/lună, în total. Egress-ul e gratuit indiferent de tier, ceea ce contează pentru tool-uri care întorc payload-uri mari (rezultate de căutare, extrase din documente) înapoi prin gateway.

Costul de hosting al backend-ului FastAPI stă complet în afara acestui calcul și depinde de unde rulează — un VPS mic gestionează fără probleme volumul de cereri de mai sus, din moment ce Worker-ul absoarbe deja rate limiting-ul și auth-ul înainte ca ceva să ajungă la el.

---

Dacă echipa ta conectează LLM-uri la sisteme interne și vrea ca gateway-ul și backend-ul să fie construite corect din prima — [ia legătura](https://thinkflow.ro/contact).
