---
title: "Serverless vs Dedicated GPU: The Exact Cost Tipping Point for LLM Workloads"
description: "Cost analysis of Vercel serverless vs Hetzner dedicated GPU for LLM inference. At 50K, 500K, and 5M monthly queries, which is cheaper? Real 2026 benchmarks."
date: "2026-07-09"
category: "Cloud Hosting"
tags: [serverless, gpu, cost-analysis, vercel, hetzner, llm-inference]
affiliatePrograms: [Vercel, Hetzner]
image: "/api/og?title=Serverless+vs+Dedicated+GPU&logos=vercel,hetzner&category=Cloud+Hosting&tags=cost,gpu,llm"
---

# Serverless vs Dedicated GPU: The Exact Cost Tipping Point

Say a team is serving Llama 3.1 8B through a <a href="https://vercel.com/?ref=thinkflow" rel="sponsored nofollow">Vercel</a> function that proxies and streams the completion — 2 million requests a month, a fairly typical mid-stage product. That function bill lands around $954/month once active duration and bandwidth are counted correctly, not the invocation count Vercel shows you by default.

Move the same workload to a single <a href="https://www.hetzner.com/?ref=thinkflow" rel="sponsored nofollow">Hetzner GEX44</a> dedicated GPU server and the number becomes $231/month, flat, regardless of whether that 2 million requests arrives evenly or in three brutal Tuesday-afternoon spikes.

The gap isn't linear. Below a certain volume, serverless is cheaper and it isn't close. Above it, dedicated is cheaper and it isn't close either. This piece finds that line and shows the math behind it — plus the hidden costs on both sides that a simple per-request price comparison misses.

---

## The Vercel Serverless Bill, Deconstructed

Vercel doesn't run the GPU. The function on Vercel's side is a proxy: it opens a connection to wherever the model actually lives (a hosted inference API, or your own GPU box), and it stays billed as "active" for the full duration it holds that connection open while streaming tokens back to the client. For a 500-token response at roughly 40 tokens/second, that's about 12 seconds of active duration per request — the number that actually drives the bill, not the request count on its own.

Assumptions used below, stated so the math is checkable: 12 seconds active duration, 1 GB provisioned memory, ~600 KB average response payload (text plus headers/JSON), Vercel Pro's Fluid Compute rates, and the plan's included allowances (1 TB Fast Data Transfer, 10M Edge Requests) before overage kicks in.

| Component | Formula | 50K req/mo | 500K req/mo | 5M req/mo |
|---|---|---|---|---|
| Function execution (CPU + memory, active duration) | $0.128/CPU-hr + $0.0106/GB-hr | $23 | $231 | $2,310 |
| Bandwidth (Fast Data Transfer) | $0.15/GB beyond 1TB included | $0 | $0 | $300 |
| Edge requests | $2/1M beyond 10M included | $0 | $0 | $0 |
| **Total** | | **$23** | **$231** | **$2,610** |

Two things worth noting. First, at 50K and 500K requests, bandwidth and edge requests stay inside Vercel Pro's included allowances — the entire bill is compute duration. Second, the $20/month Pro plan base fee is left out of this table on purpose: it's a platform cost a team pays regardless of whether it ships an LLM feature, so it doesn't change where the tipping point sits. Add it back mentally if a clean total-cost-of-ownership number matters more than the marginal cost of the LLM feature specifically.

### The arithmetic behind the 500K number

Worth walking through once, because it's the number the rest of this piece rests on. At 12 seconds of active duration and 1 GB of provisioned memory:

- CPU time: 500,000 requests × 12s ÷ 3,600 = 1,666.7 CPU-hours × $0.128 = $213.3
- Memory time: 1,666.7 GB-hours × $0.0106 = $17.7
- Invocations: 500,000 ÷ 1,000,000 × $0.60 = $0.30
- Subtotal: $231.3

That number holds only as long as the average response really is ~500 tokens at ~40 tokens/second. A team streaming longer completions — RAG answers with citations, multi-step agent responses — pushes active duration up and moves the tipping point lower, sometimes well under 500K. A team serving short classification-style completions (50–100 tokens) pushes it the other way, past 1M. The formula matters more than the specific number; run it against actual production logs before treating any of this as a forecast.

### Region and billing-model variance

Vercel's Fluid Compute rates shift by region — a function running in São Paulo bills noticeably higher per GB-hour than one in a US or EU region. Teams still on Vercel's legacy per-invocation pricing (pre-Fluid Compute) will see a different curve entirely, usually a flatter one at low volume and a steeper one at high volume, because legacy billing charges for the full allocated duration rather than active CPU time. Check which billing model a project is actually on before applying the numbers above directly.

---

## The Dedicated GPU Alternative

A Hetzner GEX44 runs €184/month (~$211 at mid-2026 rates) — an NVIDIA RTX 4000 SFF Ada with 20 GB VRAM, an Intel Core i5-13500, and 64 GB RAM. Add Cloudflare in front for TLS, caching, and basic DDoS protection at roughly $20/month, and the all-in cost is about $231/month. That number does not move whether the box serves 50,000 requests or 5 million — there's no per-request meter running.

Running vLLM on that hardware, an 8B-class model like Llama 3.1 8B fits comfortably with room for batching. There's no function invocation fee, no bandwidth meter beyond Cloudflare's own terms, and no cold start — the model sits resident in VRAM the entire time the server is powered on. For teams that need more headroom, Hetzner's GEX130 (RTX 6000 Ada, 48 GB VRAM) runs about €838/month and covers 32B–70B models with quantization; the same flat-cost logic applies at a higher ceiling.

The trade a team makes for that flat rate: provisioning takes one to three business days instead of one API call, and there's no elastic scale-out if traffic triples overnight. That's the real cost of dedicated hardware, and it belongs in the decision even though it doesn't show up on an invoice.

VRAM is the actual sizing constraint, not requests per month. Twenty gigabytes covers 7B–14B models comfortably with room for concurrent batching; push toward a 32B model and quantization stops being optional. That's the point at which the GEX130 conversation starts, not before — buying the bigger box early just to be safe is the dedicated-hardware equivalent of over-provisioning an EC2 instance, and it erodes the exact cost advantage this comparison is built on.

Bandwidth is worth a second look too. Cloudflare's terms treat proxied HTTP traffic as effectively unmetered for a typical API workload, which is why $20/month covers it regardless of the request volume in the tables above. That's a genuinely different model from Vercel's per-GB overage past 1TB, and it's part of why the dedicated line stays flat at every volume tier rather than creeping upward the way the serverless line does.

Ordering is the other practical detail teams underestimate. A GEX44 goes through Hetzner Robot rather than the instant-provision Cloud API — expect a one-time setup charge on the first invoice and a delivery window measured in business days, not minutes. That's a fine trade for a workload with known, steady volume. It's a poor trade for a team that still doesn't know whether next month brings 50K requests or 5 million; provisioning the wrong-sized box and re-ordering costs both money and the days spent waiting twice.

### How this compares to a hosted inference API

There's a third option worth naming even though it's not the subject here: paying per token to a hosted API instead of running either serverless proxy functions or a dedicated box. Hosted inference for an 8B-class open-weight model typically runs somewhere in the $0.10–$0.30 per 1M tokens range depending on provider and context length. At low volume that's often cheaper than either option in this piece once engineering time is priced in — nobody has to manage a GPU or reason about active-duration billing. The crossover against self-hosting usually shows up somewhere between 150M and 250M tokens a month, well above the request-count tipping point discussed here, because token volume and request count don't scale together once response length varies. The honest framing: serverless vs. dedicated is the right question once a team has already decided to self-host. Whether to self-host at all is a separate, earlier question.

---

## The Tipping Point Table

| Requests/month | Vercel Serverless | Hetzner Dedicated | Winner |
|---|---|---|---|
| 50K | $23 | $231 | Serverless |
| 250K | $116 | $231 | Serverless |
| 500K | $231 | $231 | Break-even |
| 1M | $462 | $231 | Dedicated (2.0x cheaper) |
| 2M | $954 | $231 | Dedicated (4.1x cheaper) |
| 5M | $2,610 | $231 | Dedicated (11.3x cheaper) |

500,000 requests a month is the line, almost to the dollar, given the assumptions above. Below that, the elasticity is worth paying for. Above it, every additional request on serverless costs real money while the dedicated box's cost stays flat — which is exactly why the multiple keeps widening instead of holding steady.

### What the table doesn't show

Cold starts are real on the serverless side: a function that hasn't handled a request in a few minutes takes 800–2,400ms to spin up before it can even open the proxy connection, on top of the model's own time-to-first-token. A dedicated box with the model already loaded in VRAM adds none of that — first-token latency is whatever the GPU takes, full stop.

The dedicated side has its own hidden cost, in the opposite direction: idle capacity. A GEX44 costs $231/month whether it's saturated 24 hours a day or only handling real traffic for eight. A team running inference only during business hours is still paying for a full month of hardware — the flat rate is an advantage at volume and a disadvantage at low, bursty utilization. That's the actual reason the tipping point isn't purely a function of request count; it's a function of request count *and* how evenly that traffic is spread across the day.

Put a number on that: a team doing 500K requests spread evenly across 730 hours a month is fully utilizing the flat-rate advantage. A team doing the same 500K requests but only during a 10-hour business-hours window is effectively paying the same $231 for roughly 300 active hours instead of 730 — a real per-request cost more than double what the flat rate implies. Neither the serverless table nor the dedicated table above accounts for this on its own; it only shows up once someone maps actual traffic against the clock, not just against the calendar.

There's a third cost that belongs in this conversation and rarely gets modeled: engineering time to actually run the dedicated box. Someone owns OS patching, driver updates, disk monitoring, and the 2 a.m. page if the GPU falls off the bus. Serverless makes that problem someone else's; dedicated hardware makes it a real, if usually small, line item in whoever's time is spent keeping the server healthy.

---

## The Hybrid Play

Most production setups end up running both, split by workload rather than by an all-or-nothing migration. Serverless handles the UI, auth, webhooks, and anything lightweight and bursty. The dedicated box handles inference and batch processing — the parts where duration and volume actually drive cost.

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

This keeps the Vercel bill small (only lightweight paths accumulate function duration) and puts every dollar of GPU cost against a fixed $231/month, regardless of how that traffic grows.

Two additions make the hybrid setup meaningfully better than the bare version above. First, a semantic cache in front of the GPU endpoint — even a simple exact-match or embedding-similarity cache on common prompts — reduces the requests that ever reach the dedicated box, which matters most for FAQ-style or support-bot traffic where the same handful of questions repeat constantly. Second, a health check on the GPU endpoint with a fallback to a hosted API (Together, Fireworks, or similar) covers the one real weakness of dedicated hardware: no automatic failover if the box goes down at 3 a.m. That fallback path costs more per token, but only during an outage — cheap insurance against the single point of failure a dedicated server introduces.

Monitoring both sides matters as much as the routing logic. GPU utilization, VRAM headroom, and queue depth on the dedicated box; invocation count and active duration on the serverless side. Without both, the tipping point calculated today quietly drifts as traffic composition changes — average response length creeping up from 500 tokens to 800 moves the crossover point without anyone noticing until the invoice does.

## Decision Flowchart

```
Monthly LLM requests under 100K?
  → Serverless (Vercel, AWS Lambda)

Monthly LLM requests 100K–400K?
  → Borderline — run both for 30 days and compare the actual invoices

Monthly LLM requests above 400K, steady volume?
  → Dedicated GPU (Hetzner, Vultr)

Traffic spiky, no clear daily pattern yet?
  → Serverless — the elasticity premium is worth paying until the pattern is known

Traffic flat and forecastable month over month?
  → Dedicated — at that point the economics aren't a judgment call anymore
```

The only input that matters here is request volume and its distribution across the day — not team size, not funding stage, not what a competitor is running.

If your team is hitting serverless cost walls, we design and build the hybrid architecture that eliminates them — [get in touch](https://thinkflow.ro/contact).
