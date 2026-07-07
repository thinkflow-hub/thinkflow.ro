---
title: "Next.js 16 + FastAPI + Supabase Auth: Production-Ready AI App Template"
description: "Full-stack template: Next.js 16 App Router, FastAPI backend, Supabase Auth + pgvector. Type-safe, edge-ready, with AI agent integration."
date: "2026-07-14"
category: "Web Development"
tags: [nextjs, fastapi, supabase, auth, template, ai-app, fullstack]
affiliatePrograms: [Vercel, Supabase]
image: "/api/og?title=Next.js+16+FastAPI+Supabase&logos=vercel,supabase&category=Web+Development&tags=nextjs,fastapi,ai"
---

# Next.js 16 + FastAPI + Supabase Auth: Production-Ready AI App Template

Most "AI app starters" pick one side of the stack and leave the other to a tutorial's worth of hand-waving — a Next.js template with a stubbed-out `/api/chat` route, or a FastAPI backend with no real auth story past a hardcoded token. Neither survives contact with an actual user base. This is the split that does: <a href="https://vercel.com/?ref=thinkflow" rel="sponsored nofollow">Vercel</a>-deployed Next.js 16 for the frontend and edge auth, FastAPI for the AI workload, and <a href="https://supabase.com/?ref=thinkflow" rel="sponsored nofollow">Supabase</a> underneath both as auth provider, Postgres database, and vector store in one.

---

## Architecture

Three pieces, each doing the one job it's actually good at.

**Next.js 16 App Router** handles routing, server rendering, and the edge middleware that checks whether a request is authenticated before it ever reaches a page. Next.js 16 ships the React Compiler as stable (automatic memoization, no manual `useMemo`/`useCallback`), a reworked prefetch system that dedupes shared layouts across routes, and Cache Components — caching is opt-in now, so nothing gets silently cached the way early App Router versions sometimes did.

**FastAPI** owns everything that isn't request/response web serving: embedding generation, similarity search against the vector store, calls out to whichever LLM provider the app uses, and any background job that runs longer than a serverless function's patience allows. It's a plain REST service with no awareness of Next.js at all.

**Supabase** is the part that keeps this from turning into three separate vendor dashboards. One Postgres instance is the application database, the auth provider (email/password, OAuth, magic links), and — via the `pgvector` extension, included on every plan including free — the vector store FastAPI queries for retrieval.

```
Browser
   │
   ▼
Next.js 16 (Vercel)  ── edge middleware validates session
   │  Server Action, forwards Supabase JWT
   ▼
FastAPI backend      ── verifies JWT, runs embeddings/retrieval/LLM call
   │
   ▼
Supabase Postgres    ── auth.users · app tables · pgvector embeddings
```

The Next.js app never talks to Postgres directly for anything auth-related — it talks to Supabase's Auth API, gets a JWT, and that same JWT is what FastAPI verifies before doing any work. One identity, two backends.

---

## Authentication: Supabase Auth with Next.js Middleware

Supabase's `@supabase/ssr` package is the current, supported way to wire this up — the older `auth-helpers` package is in maintenance mode only. The pattern has three parts: a browser client, a server client, and middleware that refreshes the session on every request since Server Components can't write cookies themselves.

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() re-validates against Supabase's Auth server every call.
  // getSession() only reads the local cookie and cannot be trusted in middleware.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}
```

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
```

That last point matters more than it looks: `getSession()` reads whatever the cookie says without checking it's still valid, and middleware is exactly the place where trusting a stale cookie lets an expired or revoked session through. `getUser()` costs one round trip to Supabase's Auth server but is the only one of the two that's actually safe to gate routes on.

---

## Template Repository

The full starter — this middleware, both Supabase clients, the FastAPI service, and a working chat route wired end to end — is available as a GitHub template repo. Request early access to the template and we'll send it to you: [get in touch](https://thinkflow.ro/contact).

---

## The Rest of the Code

**Supabase client for Server Components and Server Actions:**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component — middleware already refreshes
            // the session, so a write failure here is safe to ignore.
          }
        },
      },
    },
  )
}
```

**Supabase client for the browser** (client components — auth forms, real-time subscriptions):

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

**FastAPI route that verifies the Supabase JWT and runs retrieval against pgvector:**

```python
# routers/chat.py
import os
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai")
SUPABASE_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]


def verify_supabase_token(authorization: str = Header(...)) -> str:
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["sub"]  # Supabase user ID


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(body: ChatRequest, user_id: str = Depends(verify_supabase_token)):
    matches = await search_similar_documents(body.message, user_id=user_id)
    answer = await generate_answer(body.message, context=matches)
    return {"answer": answer, "sources": matches}
```

The Supabase project's JWT secret (found under Project Settings → API) is what FastAPI needs to verify tokens without calling back to Supabase on every request — the same key Supabase itself uses to sign them.

---

## AI Integration: Calling FastAPI from Next.js Server Actions

Server Actions are the natural place to make this call — no client-side API route needed, and the Supabase session is already available server-side:

```typescript
// app/actions/chat.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function askAssistant(message: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('Not authenticated')

  const res = await fetch(`${process.env.FASTAPI_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message }),
  })

  if (!res.ok) throw new Error(`Backend error: ${res.status}`)
  return res.json()
}
```

A client component calls `askAssistant(message)` directly, like any other function — Next.js handles the serialization. The FastAPI backend never sees a Next.js request; it sees an HTTP call with a bearer token, same as it would from a mobile client or a cron job.

---

## Cost: Free to Start, Predictable to Scale

| Service | Free tier | Typical upgrade trigger |
|---|---|---|
| Vercel Hobby | 100 GB bandwidth, 1M edge requests, 1M function invocations, 4 CPU-hours/month | Team collaboration or traffic past Hobby's fair-use limits → Pro |
| Supabase Free | 500 MB database, 1 GB storage, 5 GB egress, 50K monthly active users, 500K edge function invocations, pgvector included, 2 projects | Project auto-pause after 7 days idle, no backups → Pro at $25/month |

Neither Vercel nor Supabase hosts a long-running FastAPI process directly. For an early-stage app, the backend fits comfortably on a free tier elsewhere — Render's free web service or Fly.io's free allowance both handle the request volume a new product sees, accepting that a cold instance takes a few seconds to wake up. Once retrieval and generation calls are frequent enough that cold starts matter, that's the same signal used elsewhere on this site for the serverless-to-dedicated conversation: move the backend to a small always-on box once volume justifies it, and keep Next.js and Supabase exactly where they are.

The total starting cost for this stack is $0. The first real bill shows up when the Supabase project's database crosses 500 MB or the app needs backups — both comfortably past the point where a side project has already validated whether anyone wants it.

---

If your team needs this stack wired correctly the first time — auth, retrieval, and the backend split done right — [get in touch](https://thinkflow.ro/contact).
