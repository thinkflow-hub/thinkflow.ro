---
title: "Next.js 16 + FastAPI + Supabase Auth: Template de Aplicație AI Production-Ready"
description: "Template full-stack: Next.js 16 App Router, backend FastAPI, Supabase Auth + pgvector. Type-safe, edge-ready, cu integrare de agenți AI."
date: "2026-07-14"
category: "Web Development"
tags: [nextjs, fastapi, supabase, auth, template, ai-app, fullstack]
affiliatePrograms: [Vercel, Supabase]
image: "/api/og?title=Next.js+16+FastAPI+Supabase&logos=vercel,supabase&category=Web+Development&tags=nextjs,fastapi,ai"
verification: "market-analysis"
---

# Next.js 16 + FastAPI + Supabase Auth: Template de Aplicație AI Production-Ready

Majoritatea „AI app starters” rezolvă o singură parte a stack-ului și lasă cealaltă la voia hand-waving-ului de nivel tutorial: un template Next.js cu o rută `/api/chat` simulată, sau un backend FastAPI fără nicio poveste reală de autentificare dincolo de un token hardcodat. Niciunul nu supraviețuiește contactului cu o bază reală de utilizatori. Asta e combinația care chiar funcționează: Next.js 16 deployat pe <a href="https://vercel.com/?ref=thinkflow" rel="sponsored nofollow">Vercel</a> pentru frontend și autentificare la edge, FastAPI pentru workload-ul de AI, și <a href="https://supabase.com/?ref=thinkflow" rel="sponsored nofollow">Supabase</a> dedesubtul ambelor, ca furnizor de autentificare, bază de date Postgres și vector store, toate într-unul singur.

---

## Arhitectură

Trei componente, fiecare făcând exact treaba la care se pricepe.

**Next.js 16 App Router** se ocupă de routing, de randarea pe server și de middleware-ul de la edge care verifică dacă o cerere e autentificată înainte să ajungă vreodată la o pagină. Next.js 16 vine cu React Compiler stabil (memoization automată, fără `useMemo`/`useCallback` manual), un sistem de prefetch regândit care deduplică layout-urile partajate între rute, și Cache Components. Cache-uirea e acum opt-in, deci nimic nu mai e cache-uit pe ascuns așa cum se întâmpla uneori în primele versiuni de App Router.

![Elementele implicite din Next.js 16 pe care se bazează acest template: React Compiler stabil, prefetch regândit care deduplică layout-urile, Cache Components care fac cache-uirea opt-in](/images/blog/nextjs-supabase-nextjs16-features.svg)

**FastAPI** se ocupă de tot ce nu înseamnă servire web de tip request/response: generarea de embeddings, căutarea de similaritate în vector store, apelurile către orice provider LLM folosește aplicația, și orice job de fundal care rulează mai mult decât permite răbdarea unei funcții serverless. E un serviciu REST simplu, care nu știe absolut nimic despre existența lui Next.js.

**Supabase** e partea care împiedică totul să se transforme în trei dashboard-uri de vendor separate. O singură instanță Postgres e, în același timp, baza de date a aplicației, furnizorul de autentificare (email/parolă, OAuth, magic links) și, prin extensia `pgvector` (inclusă în orice plan, inclusiv cel gratuit), vector store-ul pe care FastAPI îl interoghează pentru retrieval.

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

![Arhitectură full-stack: Next.js 16 pe Vercel, backend FastAPI și Supabase Postgres, toate folosind un singur JWT emis de Supabase Auth](/images/blog/nextjs-supabase-architecture-flow.svg)

Aplicația Next.js nu vorbește niciodată direct cu Postgres pentru nimic legat de autentificare — vorbește cu Auth API-ul lui Supabase, primește un JWT, și exact acel JWT e cel pe care FastAPI îl verifică înainte de a face orice. O singură identitate, două backend-uri.

---

## Autentificare: Supabase Auth cu middleware Next.js

Pachetul `@supabase/ssr` de la Supabase e modul actual, susținut oficial, de a lega totul. Pachetul mai vechi `auth-helpers` e doar în mentenanță. Pattern-ul are trei părți: un client de browser, un client de server, și un middleware care reîmprospătează sesiunea la fiecare cerere, pentru că Server Components nu pot scrie cookie-uri singure.

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

Ultimul punct contează mai mult decât pare: `getSession()` citește orice scrie cookie-ul, fără să verifice dacă mai e valid, iar middleware e exact locul unde a avea încredere într-un cookie învechit lasă să treacă o sesiune expirată sau revocată. `getUser()` costă un round-trip către serverul Auth al lui Supabase, dar e singurul dintre cele două care e cu adevărat sigur de folosit pentru a bloca rute.

![Fluxul cererilor prin middleware-ul de autentificare: getUser() verifică sesiunea, redirecționează cererile neautentificate către /dashboard spre /login, iar rutele publice trec mai departe](/images/blog/nextjs-supabase-middleware-auth-flow.svg)

---

## Repository-ul Template

Starter-ul complet (acest middleware, ambii clienți Supabase, serviciul FastAPI și o rută de chat funcțională, legată cap-coadă) e disponibil ca template repo pe GitHub. Cere acces timpuriu la template și ți-l trimitem: [ia legătura](https://thinkflow.ro/ro/contact).

---

## Restul Codului

**Client Supabase pentru Server Components și Server Actions:**

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

**Client Supabase pentru browser** (client components: formulare de autentificare, subscripții real-time):

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

**Ruta FastAPI care verifică JWT-ul Supabase și rulează retrieval pe pgvector:**

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

Secretul JWT al proiectului Supabase (îl găsești la Project Settings → API) e ceea ce îi trebuie lui FastAPI ca să verifice token-urile fără să sune înapoi la Supabase la fiecare cerere. E aceeași cheie pe care Supabase însuși o folosește ca să le semneze.

---

## Integrare AI: apelarea FastAPI din Server Actions Next.js

Server Actions sunt locul natural pentru acest apel, pentru că nu ai nevoie de o rută API pe partea de client, iar sesiunea Supabase e deja disponibilă pe server:

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

Un client component apelează `askAssistant(message)` direct, ca pe orice altă funcție. Next.js se ocupă de serializare. Backend-ul FastAPI nu vede niciodată o cerere Next.js; vede un apel HTTP cu un bearer token, exact cum ar vedea unul venit dintr-un client mobil sau dintr-un cron job.

![O singură identitate, două backend-uri: același JWT Supabase merge de la login-ul din browser, prin Server Action, până la verificarea locală din FastAPI, fără niciun callback](/images/blog/nextjs-supabase-jwt-trust-chain.svg)

---

## Cost: gratuit la început, predictibil la scalare

| Serviciu | Plan gratuit | Declanșator tipic pentru upgrade |
|---|---|---|
| Vercel Hobby | 100 GB bandwidth, 1M cereri edge, 1M invocări de funcții, 4 ore CPU/lună | Colaborare în echipă sau trafic peste limitele de fair-use ale Hobby → Pro |
| Supabase Free | Bază de date 500 MB, 1 GB storage, 5 GB egress, 50K utilizatori activi lunar, 500K invocări de edge functions, pgvector inclus, 2 proiecte | Auto-pauză a proiectului după 7 zile de inactivitate, fără backup-uri → Pro la $25/lună |

![Limitele planurilor gratuite Vercel Hobby și Supabase Free, una lângă alta: 100GB bandwidth și 4 ore CPU vs bază de date 500MB și 50K utilizatori activi lunar](/images/blog/nextjs-supabase-free-tier-limits.svg)

Nici Vercel, nici Supabase nu găzduiește direct un proces FastAPI care rulează continuu. Pentru o aplicație la început de drum, backend-ul încape confortabil pe un plan gratuit în altă parte. Atât serviciul web gratuit al Render, cât și alocația gratuită de pe Fly.io gestionează fără probleme volumul de cereri al unui produs nou, cu condiția să accepți că o instanță rece are nevoie de câteva secunde ca să se trezească. Odată ce apelurile de retrieval și generare devin suficient de frecvente încât cold start-urile chiar contează, e același semnal folosit și în alte articole de pe acest site pentru discuția serverless-vs-dedicated: muți backend-ul pe o mașină mică, mereu pornită, odată ce volumul o justifică, și lași Next.js și Supabase exact unde sunt.

![Topologia de deployment: Next.js pe Vercel, Postgres pe Supabase, iar FastAPI găzduit separat pe un plan gratuit Render sau Fly.io, până când volumul justifică o mașină mereu pornită](/images/blog/nextjs-supabase-deployment-topology.svg)

Costul total de pornire pentru acest stack e $0. Prima factură reală apare când baza de date a proiectului Supabase depășește 500 MB sau când aplicația are nevoie de backup-uri — ambele confortabil dincolo de punctul în care un side project a validat deja dacă îl vrea cineva.

---

Dacă echipa ta are nevoie ca acest stack să fie legat corect din prima (autentificare, retrieval și separarea backend-ului făcute cum trebuie), [ia legătura](https://thinkflow.ro/ro/contact).
