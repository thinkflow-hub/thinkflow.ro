---
title: "Cum pui preț pe un tool MCP: un endpoint x402 funcțional în mai puțin de o oră"
description: "Serverele MCP sunt gratuite implicit. Aici e mecanica la nivel de protocol a punerii unui preț pe unul dintre ele — cererea 402 reală, respingerea reală când plata eșuează, decontarea on-chain reală când reușește, și ce se strică."
date: "2026-08-13"
category: "AI Infrastructure"
tags: [mcp, x402, plati, agenti, api-design, base, usdc]
affiliatePrograms: []
image: "/images/blog/mcp-x402-monetization-toll-gate.webp"
verification: "production-tested"
---

Majoritatea serverelor Model Context Protocol sunt gratuite. Nu gratuite ca în open source —
gratuite ca în nimeni n-a cablat vreodată o plată la ele. Expui un tool, un agent îl apelează,
tu suporți costul de calcul.

E în regulă pentru un server de hobby. Încetează să mai fie în regulă în momentul în care
tool-ul tău face ceva scump: un scrape care arde bandwidth de proxy, un apel de model pe care
îl plătești, un dataset pe care l-ai licențiat. În punctul ăla ai nevoie ca apelantul să
plătească per invocare, iar apelantul nu e un om cu card bancar — e un agent, la 3 dimineața,
fără browser și fără flux de checkout.

**x402** e mecanismul pentru asta. Reînvie codul de status HTTP 402 Payment Required — rezervat
în specificația originală și nefolosit timp de treizeci de ani — și îi dă un înțeles concret:
*atât costă, aici trimiți banii, reîncearcă cu dovada*.

![O poartă de taxare între agent și serviciu — momentul în care un apel fără preț devine unul cu preț](/images/blog/mcp-x402-monetization-toll-gate.webp)

Tot ce urmează vine dintr-un endpoint real: un server FastAPI împachetat în pachetul oficial
`x402` pentru Python (v2.16.0), rulând contra facilitatorului public implicit
(`x402.org/facilitator`) pe testnet-ul Base Sepolia. Codul complet, rulabil, e linkat la final.

## Două round trip-uri, trei capturi

![Diagramă de secvență x402: agentul, serverul MCP și facilitatorul schimbând cererea 402 și dovada plății](/images/blog/mcp-x402-monetization-sequence.svg)

Un agent apelează tool-ul tău cu plată. Habar n-are că el costă bani.

**Runda 1 — cererea.** Un `POST` neplătit primește 402 înapoi. Ăsta e corpul real întors de
serverul meu demo — nesimplificat, nerescris:

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

Patru câmpuri decid dacă un agent chiar poate să te plătească. `network` e un identificator
[CAIP-2](https://chainagnostic.org/CAIPs/caip-2) — `eip155:84532` e testnet-ul Base Sepolia,
`eip155:8453` ar fi Base mainnet. Confundarea lor e cel mai frecvent mod de a face o integrare
funcțională să pară stricată: cererea e validă, semnătura e corectă, iar plata tot eșuează,
pentru că clientul a semnat pentru un lanț pe care serverul nu-l urmărește.

`asset` e adresa contractului de token, specifică lanțului — cea de mai sus e USDC de pe
testnet-ul Sepolia, *nu* contractul de pe mainnet. `amount` e denominat în cea mai mică unitate
a token-ului, deci `10000` la 6 zecimale înseamnă **0,01 $**, nu zece mii de dolari. Și ăsta
eșuează în tăcere: cererea arată validă, iar suma e pur și simplu greșită cu șase ordine de
mărime într-o direcție sau alta.

![Anatomia unui răspuns 402: cele 4 câmpuri (network, asset, amount, payTo) care decid dacă plata funcționează, cu valorile reale capturate](/images/blog/mcp-x402-monetization-response-anatomy.svg)

De reținut că ăsta e JSON-ul brut — pe fir, același payload ajunge și codificat base64 într-un
header de răspuns `payment-required`, care e de fapt ce citește un client.

**Runda 2 — dovada.** Agentul construiește un payload de plată, îl semnează și reîncearcă cu un
header `X-PAYMENT` care poartă semnătura. Uite ce a venit înapoi când am făcut asta pe bune,
folosind un cont proaspăt generat cu **sold zero** pe Base Sepolia:

```json
{
  "x402Version": 2,
  "error": "invalid_exact_evm_insufficient_balance",
  "resource": { "url": "https://api.example.com/mcp/tools/vendor_audit", "...": "..." },
  "accepts": [ { "...": "same payment requirements as round 1" } ]
}
```

Șirul ăla e codul de eroare real al facilitatorului. Semnătura era validă, cererea era corect
formată — protocolul a funcționat exact cum a fost gândit, iar plătitorul pur și simplu n-avea
banii.

**Runda 3 — alimentat, decontat pe bune.** Am alimentat un cont plătitor din
[faucet-ul public Circle](https://faucet.circle.com) și am rulat aceeași cerere contra aceluiași
cod de server. De data asta vine înapoi `200`:

```json
{
  "url": "https://example.com/mcp",
  "recommendation": "expose as a priced x402 tool at $0.01/call",
  "paid": true
}
```

cu un header `payment-response` care se decodează în:

```json
{
  "success": true,
  "payer": "0x3214cB6C1936F1430a5236E6f062C7c17cC9E0E9",
  "transaction": "0x9530b6634adabf59dd8234e993d2bb9cba1c30703f359f9b1d5d9fc42108dd86",
  "network": "eip155:84532"
}
```

Hash-ul ăla de tranzacție nu e o afirmație pe care trebuie s-o crezi pe cuvânt —
[verifică-l singur pe Base Sepolia Blockscout](https://base-sepolia.blockscout.com/tx/0x9530b6634adabf59dd8234e993d2bb9cba1c30703f359f9b1d5d9fc42108dd86):
status `ok`, trimis către contractul real USDC, metoda `transferWithAuthorization` — exact
tiparul de autorizare fără gas EIP-3009 pe care l-a semnat clientul. Nimic nu s-a schimbat în
codul serverului între respingere și decontare; plătitorul pur și simplu a avut fonduri a doua
oară.

Un lucru la care să te aștepți dacă deschizi linkul: adresa care primește banii on-chain nu e
`payTo`-ul din captura rundei 1 de mai sus. Demo-ul generează chei de unică folosință la
fiecare rulare (`gen_wallets.py`), deci rularea alimentată a avut o adresă de încasare
proaspătă. Același cod, alte portofele consumabile — motiv pentru care publicarea capturilor
ăstora nu costă nimic.

Ăsta e tot protocolul. Fără conturi, fără chei API de provizionat, fără factură. Agentul află
prețul în momentul apelului și decontează în același schimb.

![Ambele round trip-uri alăturate: cererea 402 și respingerea pe sold insuficient, ambele capturate verbatim de la un server care rulează](/images/blog/mcp-x402-monetization-round1-vs-round2.svg)

## De ce forma asta și nu o cheie API

Alternativa evidentă e ce face orice SaaS: te înregistrezi, primești o cheie, se facturează
lunar. Merge când se înregistrează un om. Se destramă pentru trafic de agenți, din trei motive.

![Decontare per apel x402 versus modelul cu cheie API, și cele trei motive pentru care traficul de agenți strică facturarea lunară: descoperire, granularitate, încredere](/images/blog/mcp-x402-monetization-vs-api-key.svg)

**Descoperire.** Un agent care îți găsește tool-ul într-un catalog nu poate completa un
formular de înregistrare. Cu x402, prețul e parte din răspunsul protocolului — agentul află
costul apelând.

**Granularitate.** Facturarea lunară înseamnă că alegi un tier pentru un apelant pe care nu
l-ai întâlnit niciodată. Decontarea per apel înseamnă că un apelant care te invocă de două ori
plătește două apeluri.

**Încredere.** O cheie API e un secret cu viață lungă pe care trebuie să-l stochezi, să-l
rotești și pe care într-un final îl scapi. O plată per apel nu poartă absolut nicio credențială
permanentă.

Compromisul e real: decontarea adaugă latență și moștenești moduri de eșec la nivel de lanț pe
care o cheie API nu le-a avut niciodată — vezi răspunsul cu sold insuficient de mai sus, care e
exact genul ăsta de eșec. Pentru un tool care costă un cent per apel e un schimb bun. Pentru un
tool care costă o sutime de cent, overhead-ul de decontare domină și ar trebui să faci batching.

## Cum faci tool-ul descoperibil

Un endpoint pe care nu-l găsește nimeni nu e o afacere. Metadatele de catalog sunt ce transformă
402-ul tău în venit, și e partea pe care majoritatea o sar.

```json
{
  "name": "mcp-server-audit",
  "description": "Inspect an MCP server URL or repo; return monetization recommendations",
  "endpoint": "https://api.example.com/mcp/tools/vendor_audit",
  "pricing": { "amount": "10000", "asset": "USDC", "network": "eip155:8453" },
  "input_schema": { "type": "object", "properties": { "url": { "type": "string" } }, "required": ["url"] }
}
```

![Comparație: o descriere vagă de tool pe care agentul o sare vs una precisă pe care o apelează](/images/blog/mcp-x402-monetization-discoverability.svg)

Scrie `description` pentru un model, nu pentru un om care răsfoiește un director. Agentul care
decide dacă să cheltuie bani pe tine citește exact șirul ăsta. „Inspectează un server MCP și
întoarce recomandări de monetizare" e apelat. „Platformă puternică de analiză bazată pe AI" nu
e — nu spune nimic despre *când* să fie apelată.

Aceeași regulă se aplică descrierii MCP a tool-ului însuși. Descrierile prescriptive, care
enunță condiția declanșatoare („apelează asta când utilizatorul întreabă despre prețuri
curente"), performează măsurabil mai bine decât cele care descriu doar capabilitatea.

## Ce se strică

![Cele 5 moduri reale de eșec: sold insuficient, network greșit, zecimale, idempotență, timeout nepotrivit](/images/blog/mcp-x402-monetization-what-breaks.svg)

**Sold insuficient** — arătat mai sus, și cel pe care îl vei lovi constant în dezvoltare dacă
n-ai la îndemână un portofel de testnet alimentat. Nu e un bug; e protocolul refuzând corect să
servească pe cineva care nu poate plăti. Ține un sold mic permanent pe testnet în timpul
dezvoltării, ca asta să nu-ți mănânce prima după-amiază.

**Network greșit.** Acoperit mai sus — `eip155:84532` față de `eip155:8453` arată la un caracter
distanță și eșuează fără niciun diagnostic util dincolo de „sold insuficient" sau o eroare de
verificare tăcută, pentru că clientul verifică un sold pe un lanț unde fondurile tale de test
nu există.

**Zecimale.** Acoperit mai sus, merită repetat pentru că eșuează în tăcere în direcția
*opusă* față de soldul insuficient: cererea arată validă și cere pur și simplu de 1.000.000× mai
mult sau mai puțin.

**Idempotență.** Agentul plătește, handler-ul tău crapă după decontare, agentul reîncearcă. A
plătit acum de două ori pentru un singur rezultat. Cheiește munca pe identificatorul plății și
întoarce rezultatul din cache la reluare — asta nu e opțional, e diferența dintre un serviciu și
o reclamație.

**Timeout nepotrivit.** `maxTimeoutSeconds` din 402 (300 în captura de mai sus) e o promisiune
despre cât timp onorezi cotația. Setează-l mai scurt decât timpul tău de confirmare a decontării
și orice apelant onest eșuează.

Încă două de știut înainte ca asta să gestioneze venit real, nu doar un demo:

**Replay, la nivel de aplicație.** Nonce-ul propriu al EIP-3009 împiedică *aceeași autorizație
semnată* să miște fonduri de două ori on-chain — un header `X-PAYMENT` capturat nu poate fi
retrimis ca să golească portofelul plătitorului a doua oară, contractul de token respinge
nonce-ul refolosit. Ce *nu* protejează e logica propriului tău server: dacă servești răspunsul
tool-ului înainte ca decontarea să se confirme efectiv, sau dacă pui rezultatul în cache pe
cheia greșită, un atacator care a capturat un header valid (un proxy care scurge, un log de
debug, un CDN prost configurat) tot poate scoate un răspuns gratuit de la *tine*, chiar dacă
replay-ul la nivel de lanț e blocat. E aceeași disciplină ca la punctul de idempotență — cheia
pe identificatorul plății, nu răspunde până când decontarea e confirmată, nu doar
semnătură-validă.

**Facilitatorul e o dependență de încredere.** Fiecare round trip de mai sus a trecut prin
facilitatorul *public implicit* (`x402.org/facilitator`). Serverul tău nu vorbește niciodată
direct cu lanțul — se bazează pe cuvântul facilitatorului că o plată s-a decontat. Pentru un
demo, în regulă. Pentru venit de care chiar depinzi, ăla e un singur terț pe a cărui onestitate
și uptime îți stă acum venitul: dacă minte despre decontare, servești gratis; dacă e picat,
niciun plătitor legitim nu poate finaliza o achiziție, oricât de bună i-ar fi semnătura.
Deployment-urile de producție ori rulează propriul facilitator (verifici singur contra stării
lanțului), ori aleg unul aflat sub un contract a cărui încălcare chiar ar fi observată.

## Merită făcut?

Răspunsul onest: depinde cât te costă tool-ul per apel.

Dacă un apel arde bani reali — un API plătit în aval, secunde de GPU, date licențiate — atunci
decontarea per apel potrivește costul cu venitul exact, și e cel mai curat model de facturare
disponibil pentru trafic de agenți.

Dacă tool-ul tău e ieftin de rulat, partea interesantă nu e venitul. E că un tool cu preț e un
tool *descoperibil*: apare în cataloagele pe care agenții le caută, cu o descriere citibilă de
mașină a ce face și cât costă. Aia e distribuție, iar distribuția e de obicei problema mai grea.

Ce nu e, azi, e o piață mare. Volumul de plăți agent-către-agent e mic și concentrat.
Construiește pentru că ai un tool care merită taxat, nu pentru că te aștepți la o coadă de
agenți plătitori din prima zi.

## Rulează-l singur

Serverul complet, clientul și toate cele trei răspunsuri capturate: **[github.com/thinkflow-ro/x402-mcp-demo](https://github.com/thinkflow-ro/x402-mcp-demo)**.
Trei fișiere scurte și un singur `pip install`. Rundele 1 și 2 — cererea de preț și respingerea —
nu au nevoie de fonduri deloc, fiindcă demo-ul își generează propriile chei de testnet de unică
folosință. Doar decontarea din runda 3 cere alimentarea uneia dintre ele dintr-un faucet public.

---

*Rulez nouăsprezece servere MCP în producție și le auditez suprafața de credențiale cu un tool
construit special. Dacă vrei un deployment MCP revizuit — ce să expui, ce să taxezi, ce scurge —
[hai să vorbim](https://thinkflow.ro/contact).*
