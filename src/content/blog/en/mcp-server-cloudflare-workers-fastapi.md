---
title: "How to Build an MCP Server with Cloudflare Workers and FastAPI"
description: "Production MCP (Model Context Protocol) server deployed on Cloudflare Workers with FastAPI backend. Connecting LLMs to real data sources via the 2026 standard."
date: "2026-07-10"
category: "AI Infrastructure"
tags: [mcp, cloudflare, workers, fastapi, llm, ai-agents, protocol]
affiliatePrograms: [Cloudflare]
image: "/api/og?title=MCP+Server+Cloudflare+Workers&logos=cloudflare&category=AI+Infrastructure&tags=mcp,workers,fastapi"
---

# How to Build an MCP Server with Cloudflare Workers and FastAPI

On July 28, 2026, the Model Context Protocol ships its largest specification revision since launch — a stateless core designed to run on ordinary HTTP infrastructure instead of pinned, session-bound connections. That's not a footnote. It's the moment MCP stops being "the new Anthropic thing" and becomes what USB-C became for chargers: the connector nobody discusses anymore because everything just uses it.

Most teams building MCP servers today reach for a single Node process or a container. That works until the agent calling your server needs to run from three continents, your rate limits need to hold under a traffic spike, and cold starts on a scale-to-zero container start showing up in your latency graphs. Cloudflare Workers solve the deployment half of that problem at the edge; a FastAPI backend behind it handles the part Workers were never meant to do — talking to a real database, an internal API, or a data warehouse.

This walks through both halves: a Cloudflare Worker acting as the MCP gateway, and a FastAPI service doing the actual work each tool call needs.

---

## What MCP Is, and Why It's the 2026 Standard

MCP is a JSON-RPC-based protocol that gives an LLM a standard way to discover and call tools, read resources, and use prompts exposed by a server — without every AI product inventing its own plugin format. Anthropic published the spec in late 2024; by 2026 it's been adopted across OpenAI's, Google's, and Microsoft's agent tooling, which is the part that actually matters. A protocol only becomes infrastructure once competitors implement it too.

The transport that made MCP viable as a network service — Streamable HTTP — replaced the original stdio-only design and let servers run as remote, multi-tenant deployments instead of local subprocesses per user. The July 28, 2026 revision goes further: it removes the requirement that a client stay pinned to one server instance for the life of a session, which is what made MCP behind a standard load balancer awkward in the first place. New headers (`Mcp-Method`, `Mcp-Name`) let a gateway route and rate-limit on the operation being called without parsing the request body — directly relevant to the Worker built below.

None of this changes what a tool call looks like day to day: a client sends `tools/list` to discover what's available, then `tools/call` with a tool name and arguments to invoke one. What changes is what's allowed to sit between the client and the code that runs the tool — which is exactly the gap an edge gateway fills.

---

## Architecture: Cloudflare Worker as MCP Gateway, FastAPI as the Backend

The split is deliberate, not incidental:

**The Worker** terminates the MCP connection, validates the client's credentials, enforces rate limits, and translates `tools/call` requests into ordinary HTTP calls against the backend. It runs in Cloudflare's V8 isolates, which don't have the container cold-start problem — an isolate that's already been instantiated anywhere on Cloudflare's network responds in low single-digit milliseconds, and even a cold isolate initializes in a fraction of the time a container does. For an MCP gateway sitting between an agent and its tools, that latency floor matters more than it does for a typical CRUD API.

**FastAPI** does what Workers structurally can't: hold a long-lived connection pool to Postgres, run a heavier Python dependency stack, or sit inside a VPC next to the systems the tools actually query. It doesn't speak MCP at all — it's a plain REST service. The Worker is the only thing that knows MCP exists.

```
MCP client (Claude, an agent framework, Claude Code)
        │  Streamable HTTP, JSON-RPC
        ▼
Cloudflare Worker  (auth · rate limiting · MCP protocol · routing)
        │  plain HTTPS, internal API key
        ▼
FastAPI backend    (business logic · database · internal APIs)
```

This is the same shape as an API gateway in front of a microservice, with one difference: the protocol in front of the gateway is MCP instead of REST or GraphQL, so the gateway's job includes translating `tools/call` payloads into whatever calling convention the backend already speaks.

---

## The Code: MCP Handler in TypeScript + FastAPI Tool Definitions

### The Worker: MCP protocol handler

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

Each `server.tool()` call registers a tool, its input schema (validated with Zod, which also produces the JSON Schema the client sees from `tools/list`), and a handler that does nothing MCP-specific beyond returning the `content` array the protocol expects. The actual work — hitting a database, running a search — is a plain `fetch()` to FastAPI.

### The backend: FastAPI tool definitions

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

FastAPI's job here is ordinary REST — Pydantic validates the response shape, `Depends` handles the internal auth check, and nothing in this file imports an MCP library. That's the point of the split: the backend team can iterate on this service without knowing or caring that an LLM is the eventual caller.

---

## Securing It: API Keys and Rate Limiting on Cloudflare

Two layers matter, and they sit at different points in the request path.

**Between the Worker and FastAPI**, a shared internal key (`X-Internal-Key` above) is enough — this traffic never leaves Cloudflare's network if the backend is also reachable through Cloudflare Tunnel, and a static key rotated periodically via `wrangler secret put BACKEND_API_KEY` covers it without adding OAuth complexity to a service that's never called directly by an end user.

**Between the MCP client and the Worker**, treat it like any public API: require a bearer token, and rate-limit before a request reaches a tool handler. Cloudflare's Workers Rate Limiting binding does this without a separate service:

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

A client ID here should come from the bearer token, not the IP address — MCP clients frequently sit behind shared egress IPs (a company's agent platform, a CI runner pool), and IP-based limits either block legitimate traffic or don't limit anything useful. For teams that would rather not touch code, Cloudflare's dashboard-level WAF rate limiting rules cover the same need at the zone level, matched on path (`/mcp`) instead of a binding.

For OAuth-grade access control — scoping which tools a given user's agent can call, not just whether they can connect — <a href="https://www.cloudflare.com/?ref=thinkflow" rel="sponsored nofollow">Cloudflare Workers</a> supports wiring the MCP server behind Cloudflare Access or a third-party OAuth provider (GitHub, Google, Auth0), issuing scoped tokens per user rather than one shared key for every caller.

---

## Cost: Free Tier vs Paid

| Plan | Included | Overage |
|---|---|---|
| Workers Free | 100,000 requests/day | Hard cap — requests beyond it are dropped, no billing surprise |
| Workers Paid ($5/month) | 10M requests/month, 30M CPU-ms/month | $0.30 per additional 1M requests, $0.02 per additional 1M CPU-ms |

An MCP server used internally by a handful of engineers rarely approaches the free tier's 100,000 requests/day — that ceiling is closer to what a moderately busy public API sees. Cross it, and the paid plan's $5 base covers 10 million requests a month before any per-request charge applies. A team whose agents call the MCP server 500,000 times a day — 15 million a month — lands at roughly $5 base plus 5 million requests over the included amount at $0.30/million, or about $6.50/month total. Egress is free regardless of tier, which matters for tools that return large payloads (search results, document excerpts) back through the gateway.

The FastAPI backend's hosting cost sits outside this entirely and depends on where it runs — a small VPS handles the request volume above without strain, since the Worker is already absorbing rate limiting and auth before anything reaches it.

---

If your team is wiring LLMs into internal systems and wants the gateway and the backend built right the first time — [get in touch](https://thinkflow.ro/contact).
