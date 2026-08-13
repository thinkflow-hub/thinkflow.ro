---
title: "How to Charge for an MCP Tool: A Working x402 Endpoint in Under an Hour"
description: "MCP servers are free by default. Here is the wire-level mechanics of putting a price on one — the real 402 demand, the real rejection when payment fails, the real on-chain settlement when it succeeds, and what breaks."
date: "2026-08-13"
category: "AI Infrastructure"
tags: [mcp, x402, payments, agents, api-design, base, usdc]
affiliatePrograms: []
image: "/images/blog/mcp-x402-monetization-toll-gate.webp"
verification: "production-tested"
---

Most Model Context Protocol servers are free. Not free as in open source — free as in nobody
ever wired a payment to them. You expose a tool, an agent calls it, you eat the compute.

That is fine for a hobby server. It stops being fine the moment your tool does something
expensive: a scrape that burns proxy bandwidth, a model call you pay for, a dataset you
licensed. At that point you need the caller to pay per invocation, and the caller is not a
human with a credit card — it is an agent, at 3am, with no browser and no checkout flow.

**x402** is the mechanism for that. It revives HTTP status code 402 Payment Required — reserved
in the original spec and unused for thirty years — and gives it a concrete meaning: *here is
what this costs, here is where to send it, retry with proof.*

![A toll gate between agent and service — the moment an unpriced call becomes a priced one](/images/blog/mcp-x402-monetization-toll-gate.webp)

Everything below comes from a real endpoint: a FastAPI server wrapped in the official
`x402` Python package (v2.16.0), running against its default public facilitator
(`x402.org/facilitator`) on Base Sepolia testnet. Full runnable code is linked at the end.

## The two round trips

![x402 sequence diagram: agent, MCP server, and facilitator exchanging the 402 demand and the payment proof](/images/blog/mcp-x402-monetization-sequence.svg)

An agent calls your paid tool. It has no idea it costs money.

**Round 1 — the demand.** An unpaid `POST` gets a 402 back. This is the actual body my
demo server returned — not simplified, not retyped:

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "https://api.example.com/mcp/tools/vendor_audit",
    "description": "Inspect an MCP server URL or repo; return monetization recommendations",
    "mimeType": ""
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:84532",
      "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "amount": "10000",
      "payTo": "0xb7271507cFa220cC825568Cfb263C3dEa9f02D58",
      "maxTimeoutSeconds": 300,
      "extra": { "name": "USDC", "version": "2" }
    }
  ]
}
```

Four fields decide whether an agent can actually pay you. `network` is a
[CAIP-2](https://chainagnostic.org/CAIPs/caip-2) identifier — `eip155:84532` is Base Sepolia
testnet, `eip155:8453` would be Base mainnet. Mixing the two up is the single most common way
to make a working integration look broken: the request is valid, the signature checks out,
and the payment still fails because the client signed for a chain the server isn't watching.

`asset` is the token contract address, chain-specific — the one above is Sepolia-testnet USDC,
*not* the mainnet contract. `amount` is denominated in the token's smallest unit, so `10000` at
6 decimals is **$0.01**, not ten thousand dollars. This one fails silently too: the request
looks valid and the amount is simply wrong by six orders of magnitude in either direction.

![Anatomy of a 402 response: the 4 fields (network, asset, amount, payTo) that decide whether payment works, with the real captured values](/images/blog/mcp-x402-monetization-response-anatomy.svg)

Note this is the raw JSON — on the wire, the same payload also arrives base64-encoded in a
`payment-required` response header, which is what a client actually reads.

**Round 2 — the proof.** The agent builds a payment payload, signs it, and retries with an
`X-PAYMENT` header carrying the signature. Here is what came back when I did that for real,
using a freshly generated account with **zero balance** on Base Sepolia:

```json
{
  "x402Version": 2,
  "error": "invalid_exact_evm_insufficient_balance",
  "resource": { "url": "https://api.example.com/mcp/tools/vendor_audit", "...": "..." },
  "accepts": [ { "...": "same payment requirements as round 1" } ]
}
```

That string is the facilitator's real error code. The signature was valid, the request was
correctly formed — the protocol worked exactly as designed, and the payer simply didn't have
the money.

**Round 3 — funded, settled for real.** I funded a payer account from
[Circle's public faucet](https://faucet.circle.com) and ran the same request against the same
server code. This time it comes back `200`:

```json
{
  "url": "https://example.com/mcp",
  "recommendation": "expose as a priced x402 tool at $0.01/call",
  "paid": true
}
```

with a `payment-response` header that decodes to:

```json
{
  "success": true,
  "payer": "0x3214cB6C1936F1430a5236E6f062C7c17cC9E0E9",
  "transaction": "0x9530b6634adabf59dd8234e993d2bb9cba1c30703f359f9b1d5d9fc42108dd86",
  "network": "eip155:84532"
}
```

That transaction hash is not a claim you have to take on faith —
[check it yourself on Base Sepolia Blockscout](https://base-sepolia.blockscout.com/tx/0x9530b6634adabf59dd8234e993d2bb9cba1c30703f359f9b1d5d9fc42108dd86):
status `ok`, sent to the real USDC contract, method `transferWithAuthorization` — the exact
EIP-3009 gasless-authorization pattern the client signed. Nothing changed in the server code
between the rejection and the settlement; the payer simply had funds the second time.

One thing to expect if you do open that link: the receiving address on-chain is not the
`payTo` shown in the round 1 capture above. The demo mints throwaway keys on every run
(`gen_wallets.py`), so the funded run had a fresh receiving address. Same code, different
disposable wallets — which is also why publishing these captures costs nothing.

That is the whole protocol. No accounts, no API keys to provision, no invoice. The agent
discovers the price at call time and settles in the same exchange.

![Both round trips side by side: the 402 demand and the insufficient-balance rejection, both captured verbatim from a running server](/images/blog/mcp-x402-monetization-round1-vs-round2.svg)

## Why this shape and not an API key

The obvious alternative is what every SaaS does: sign up, get a key, bill monthly. That works
when a human signs up. It falls apart for agent traffic for three reasons.

![x402 per-call settlement versus the API key model, and the three reasons agent traffic breaks monthly billing: discovery, granularity, trust](/images/blog/mcp-x402-monetization-vs-api-key.svg)

**Discovery.** An agent that finds your tool in a catalog cannot complete a signup form. With
x402 the price is part of the protocol response — the agent learns the cost by calling.

**Granularity.** Monthly billing means you pick a tier for a caller you have never met. Per-call
settlement means a caller who invokes you twice pays for two calls.

**Trust.** An API key is a long-lived secret you have to store, rotate, and eventually leak.
A per-call payment carries no standing credential at all.

The tradeoff is real: settlement adds latency, and you inherit chain-level failure modes an API
key never had — see the insufficient-balance response above, which is exactly that kind of
failure. For a tool that costs a cent per call this is a good trade. For a tool that costs a
hundredth of a cent, the settlement overhead dominates and you should batch instead.

## Making the tool discoverable

An endpoint nobody can find is not a business. Catalog metadata is what turns your 402 into
revenue, and it is the part most people skip.

```json
{
  "name": "mcp-server-audit",
  "description": "Inspect an MCP server URL or repo; return monetization recommendations",
  "endpoint": "https://api.example.com/mcp/tools/vendor_audit",
  "pricing": { "amount": "10000", "asset": "USDC", "network": "eip155:8453" },
  "input_schema": { "type": "object", "properties": { "url": { "type": "string" } }, "required": ["url"] }
}
```

![Comparison: a vague tool description an agent skips vs a precise one it calls](/images/blog/mcp-x402-monetization-discoverability.svg)

Write the `description` for a model, not for a human browsing a directory. The agent deciding
whether to spend money on you reads exactly this string. "Inspect an MCP server and return
monetization recommendations" gets called. "Powerful AI-driven analysis platform" does not —
it says nothing about *when* to call it.

The same rule applies to the tool's own MCP description. Prescriptive descriptions that state
the trigger condition ("call this when the user asks about current prices") measurably
outperform ones that only describe capability.

## What breaks

![The 5 real failure modes: insufficient balance, network mismatch, decimals, idempotency, timeout mismatch](/images/blog/mcp-x402-monetization-what-breaks.svg)

**Insufficient balance** — shown above, and the one you will hit constantly in development
unless you keep a funded testnet wallet on hand. It is not a bug; it is the protocol correctly
refusing to serve someone who can't pay. Budget for a small standing testnet balance during
development so this doesn't eat your first afternoon.

**Network mismatch.** Covered above — `eip155:84532` vs `eip155:8453` look one character apart
and fail with no useful diagnostic beyond "insufficient balance" or a silent verify failure,
because the client is checking a balance on a chain where your test funds don't exist.

**Decimals.** Covered above, worth repeating because it fails silently in the *other*
direction from insufficient balance: the request looks valid and simply demands 1,000,000×
too much or too little.

**Idempotency.** The agent pays, your handler crashes after settlement, the agent retries. It
has now paid twice for one result. Key your work on the payment identifier and return the
cached result on replay — this is not optional, it is the difference between a service and a
complaint.

**Timeout mismatch.** `maxTimeoutSeconds` in the 402 (300 in the capture above) is a promise
about how long you will honour the quote. Set it shorter than your settlement confirmation
time and every honest caller fails.

Two more worth knowing before this handles real revenue, not just a demo:

**Replay, at the application layer.** EIP-3009's own nonce stops the *same signed
authorization* from moving funds twice on-chain — a captured `X-PAYMENT` header can't be
resubmitted to drain the payer's wallet a second time, the token contract rejects the reused
nonce. What it does *not* protect is your server's own logic: if you serve the tool response
before settlement actually confirms, or you cache the result on the wrong key, an attacker who
captured a valid header (a leaky proxy, a debug log, a misconfigured CDN) can still get a free
response out of *you* even though the chain-level replay is blocked. This is the same
discipline as the idempotency point above — key on the payment identifier, don't respond until
settlement is confirmed, not just signature-valid.

**The facilitator is a trust dependency.** Every round trip above went through the *default
public* facilitator (`x402.org/facilitator`). Your server never talks to the chain directly —
it trusts the facilitator's word on whether a payment settled. For a demo, fine. For revenue
you actually depend on, that's a single third party whose honesty and uptime your income now
rests on: if it lies about settlement, you serve for free; if it's down, no legitimate payer
can complete a purchase at all, however good their signature is. Production deployments either
run their own facilitator (verify against chain state yourself) or pick one under a contract
they'd actually notice breaking.

## Is it worth doing

Honest answer: it depends on what your tool costs you per call.

If a call burns real money — a paid API downstream, GPU seconds, licensed data — then per-call
settlement matches cost to revenue exactly, and it is the cleanest billing model available for
agent traffic.

If your tool is cheap to run, the interesting part is not the revenue. It is that a priced tool
is a *discoverable* tool: it appears in catalogs agents search, with a machine-readable
description of what it does and what it costs. That is distribution, and distribution is
usually the harder problem.

What it is not, today, is a large market. Agent-to-agent payment volume is small and
concentrated. Build it because you have a tool worth charging for, not because you expect a
queue of paying agents on day one.

## Run it yourself

Full server, client, and all three captured responses: **[github.com/thinkflow-ro/x402-mcp-demo](https://github.com/thinkflow-ro/x402-mcp-demo)**.
Three short files and one `pip install`. Rounds 1 and 2 — the price demand and the rejection —
need no funds at all, since the demo generates its own throwaway testnet keys. Only the round 3
settlement requires topping one of them up from a public faucet.

---

*I run nineteen MCP servers in production and audit their credential surface with a
purpose-built tool. If you want an MCP deployment reviewed — what to expose, what to price,
what is leaking — [get in touch](https://thinkflow.ro/contact).*
