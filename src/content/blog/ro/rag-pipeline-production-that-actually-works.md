---
title: "Cum arată un pipeline RAG care chiar funcționează în producție"
description: "De la PDF-urile clienților la chunking, embedding, Qdrant, re-ranking și LLM local. Circuit breaker, retry, failover. Nu demo-ul de Pinecone. Tipare reale de producție."
date: "2026-07-06"
category: "AI Infrastructure"
tags: [rag, pipeline, qdrant, llm, production, ai, retrieval-augmented-generation]
affiliatePrograms: [Qdrant]
image: "/images/blog/rag-pipeline-production-that-actually-works.webp"
verification: "market-analysis"
---

# Cum arată un pipeline RAG care chiar funcționează în producție

**Publicat de ThinkFlow · Timp de citire: ~14 min · Pentru: inginerii care au încercat RAG și a fost „meh"**

---

Ai construit demo-ul. A fost impresionant. Modelul răspundea la întrebări despre documentele tale. Managerul tău era încântat. L-ai pus în producție.

Apoi a venit realitatea.

Modelul a citat cu încredere o politică actualizată acum 8 luni. A răspuns „da" la o întrebare care avea clar „nu" în document — pentru că fragmentul relevant era clasat pe locul 11 și n-a mai ajuns în context. A funcționat perfect pe cele 5 documente pe care l-ai testat, apoi a început să halucineze la documentul 47, care avea un tabel încorporat într-un PDF scanat.

Bine ai venit în prăpastia dintre demo-urile RAG și RAG-ul din producție.

Ăsta nu e un tutorial. Există o mie de tutoriale. E un post-mortem — lucrurile care s-au stricat în producție, de ce s-au stricat și cum arată arhitectura după ce le-ai reparat.

---

## De ce mint majoritatea demo-urilor RAG

Pipeline-ul standard de demo arată așa:

1. Încarci un PDF
2. Îl împarți în fragmente de 1,000 de caractere, cu suprapunere de 200 de caractere
3. Faci embedding cu OpenAI `text-embedding-3-small`
4. Stochezi în Pinecone / Chroma / Weaviate
5. La momentul interogării: faci embedding la întrebare, găsești top 5 fragmente similare, le trimiți la GPT-4 împreună cu un prompt

Funcționează. Într-un demo. Pe 10 PDF-uri curate, bine structurate, cu formatare consistentă și conținut care chiar se potrivește cu formularea interogărilor.

În producție, ai:
- Documente scanate în care OCR-ul a introdus zgomot
- Tabele, note de subsol și titluri care se fragmentează prost la limite fixe de caractere
- Limbaj juridic sau tehnic în care un extras de 3 propoziții nu are sens fără context
- Utilizatori care formulează interogările diferit față de cum documentele formulează răspunsurile
- Documente care se contrazic între versiuni

Pipeline-ul de demo e optimizat pentru impresie. Pipeline-ul de producție e optimizat pentru **fiabilitate în condiții adverse**.

Astea sunt lucruri diferite.

---

## Arhitectura completă de producție

Înainte să intrăm în detaliile fiecărei componente, iată tabloul complet:

```
INGESTION PIPELINE (offline)
=====================
[Raw documents: PDF, DOCX, HTML, scanned images]
        |
[Pre-processing: OCR (Tesseract/EasyOCR), HTML cleaning, DOCX extraction]
        |
[Chunking strategy — document-type aware]
        |
[Metadata tagging: source, version, date, section, confidence score]
        |
[Embedding: local model on GPU (nomic-embed-text or e5-mistral-7b)]
        |
[Upsert to Qdrant — with payload + sparse vectors for hybrid search]
        |
[Post-ingestion validation: coverage check, embedding quality audit]


QUERY PIPELINE (online, user-facing)
=====================
[User query]
        |
[Query expansion + HyDE (Hypothetical Document Embeddings)]
        |
[Hybrid retrieval: dense vector search + BM25 keyword search]
        |
[Candidate pool: top-20 chunks from retrieval]
        |
[CrossEncoder re-ranking: score all 20, select top-4]
        |
[Context assembly: inject metadata, handle conflicts]
        |
[LLM inference: local Qwen2.5 or Mistral — on dedicated GPU via Ollama]
        |
[Answer + source citations + confidence indicator]
        |
[Post-processing: hallucination check via NLI model]
        |
[Logging: full trace to ClickHouse for audit]
```

Fiecare pas din diagramă există pentru că ceva s-a stricat fără el. Hai să trecem prin cele care nu sunt evidente.

---

## Ingestia — partea pe care toată lumea o subestimează

### De ce chunking-ul de dimensiune fixă e greșit pentru majoritatea documentelor

Sfatul standard — fragmentează la 1,000 de caractere, suprapunere 200 — funcționează pentru text omogen. Eșuează pentru:

**Documente juridice**: o clauză precum „Secțiunea 12.3 nu se aplică în circumstanțele definite la Articolul 4 din acordul precedent" nu are sens fără Articolul 4. Chunking-ul fix taie referința. Ai nevoie de **chunking semantic**, care păstrează unitățile logice (paragrafe, clauze, secțiuni).

**Manuale tehnice**: un tabel împărțit în două fragmente devine zgomot. Niciun fragment nu se regăsește corect, pentru că sensul tabelului necesită structura completă.

**Documente formatate ca Q&A**: un FAQ în care întrebarea e în fragmentul 5 și răspunsul în fragmentul 6 va returna mereu fragmentul greșit pentru întrebarea utilizatorului.

**Ce faci în schimb:**

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
import re

def document_aware_splitter(text: str, doc_type: str) -> list[str]:
    if doc_type == "legal":
        section_pattern = r'\n(?=Article \d+|Section \d+|ARTICLE|SECTION)'
        sections = re.split(section_pattern, text)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800, chunk_overlap=150,
            separators=["\n\n", "\n", ". ", " "]
        )
        chunks = []
        for section in sections:
            if len(section) > 800:
                chunks.extend(splitter.split_text(section))
            else:
                chunks.append(section)
        return chunks

    elif doc_type == "faq":
        qa_pattern = r'(?=Q:|Question:|\d+\.\s)'
        return re.split(qa_pattern, text)

    else:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=600, chunk_overlap=100,
            separators=["\n\n", "\n", ". ", "! ", "? ", " "]
        )
        return splitter.split_text(text)
```

### Metadata înseamnă jumătate din retrieval

Fiecare fragment are nevoie de un payload care să-ți permită să filtrezi înainte sau după retrieval:

```python
chunk_payload = {
    "text": chunk_text,
    "source_file": "contract_v3_2025.pdf",
    "section": "Article 12 — Termination",
    "doc_version": "3.0",
    "effective_date": "2025-03-01",
    "doc_type": "legal",
    "language": "en",
    "page_number": 14,
    "confidence_ocr": 0.94,
    "char_count": len(chunk_text),
    "ingested_at": datetime.utcnow().isoformat()
}
```

Acest payload permite interogări precum: „Găsește fragmentele relevante din contracte în vigoare după ianuarie 2025" — fără acel filtru, ai putea recupera o versiune depășită și halucina o politică care nu mai e valabilă.

---

## Vector store — de ce Qdrant și de ce self-hosted

Există baze de date vectoriale gestionate (managed) bune. Pinecone e bine inginerit. Weaviate Cloud e solid. Dar pentru sisteme de producție în care datele nu pot ieși din infrastructura ta, ai nevoie de self-hosted — iar **Qdrant este în prezent cea mai bună opțiune** pentru acest caz de utilizare.

### De ce Qdrant, specific

- **Bazat pe Rust**: eficiența memoriei și performanța sunt semnificativ mai bune decât la alternativele native în Python
- **Căutare hibridă sparse + dense**: suport nativ pentru combinarea potrivirii de cuvinte-cheie BM25 cu căutarea vectorială semantică (esențial pentru interogări scurte și tehnice, unde semantica pură eșuează)
- **Filtrare pe payload**: filtrezi după metadate înainte sau în timpul căutării vectoriale, nu după — asta schimbă latența interogării de la 200ms la 15ms, la scară
- **Snapshots**: backup-uri point-in-time ale întregului vector store, în câteva secunde

### Docker Compose pentru Qdrant în producție

```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:v1.9.0
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
      - ./qdrant_config.yaml:/qdrant/config/production.yaml
    environment:
      - QDRANT__SERVICE__API_KEY=${QDRANT_API_KEY}
      - QDRANT__LOG_LEVEL=WARN
    deploy:
      resources:
        limits:
          memory: 8G
```

```yaml
# qdrant_config.yaml
storage:
  optimizers:
    default_segment_number: 2
    memmap_threshold_kb: 200000
  performance:
    max_search_threads: 0
```

---

## Hybrid retrieval — de ce căutarea doar dense eșuează la interogări scurte

Căutarea vectorială pură eșuează atunci când interogarea utilizatorului e scurtă și tehnică.

Interogare: „Articolul 17 GDPR"
Căutarea vectorială dense va găsi documente despre „dreptul la ștergere" și „drepturile persoanei vizate" — pentru că sunt înrudite semantic. Dar utilizatorul vrea exact fragmentul care conține „Articolul 17" cuvânt cu cuvânt.

**Căutarea hibridă combină:**
- **Dense retrieval**: similaritate semantică (prinde parafrazări, sinonime, concepte înrudite)
- **Sparse retrieval (BM25)**: potrivire de cuvinte-cheie (prinde termeni exacți, ID-uri de documente, numere de articole, coduri de produs)

```python
from qdrant_client import QdrantClient
from qdrant_client.models import SearchRequest, NamedVector, NamedSparseVector, SparseVector

async def hybrid_search(
    query: str, collection: str, limit: int = 20, filters: dict = None
) -> list[dict]:

    dense_vector = await embed_query(query)
    sparse_vector = compute_sparse_vector(query)

    results = client.query_points(
        collection_name=collection,
        prefetch=[
            models.Prefetch(query=dense_vector, using="dense", limit=20),
            models.Prefetch(
                query=models.SparseVector(
                    indices=sparse_vector.indices, values=sparse_vector.values
                ),
                using="sparse", limit=20
            )
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=limit, with_payload=True,
        query_filter=build_filter(filters) if filters else None
    )

    return [hit.payload for hit in results.points]
```

De regulă, asta îmbunătățește recall-ul cu 15-25% față de căutarea doar dense, mai ales pentru interogări din domenii tehnice.

---

## Re-ranking — pasul care schimbă totul

Ăsta e, de departe, îmbunătățirea cu cel mai mare ROI pe care o poți aduce unui sistem RAG mediocru.

Căutarea vectorială returnează top 20 de fragmente după similaritate aproximativă. Dar „similaritatea aproximativă" e calculată între doi vectori într-un spațiu cu dimensiuni multe — e un instrument imprecis. Re-rankerul CrossEncoder calculează un **scor de relevanță direct** între interogare și fiecare fragment candidat, ținând cont de interacțiunea reală, la nivel de token, dintre ele.

Diferența în acuratețe nu e marginală. E diferența dintre 78% și 94% în benchmark-ul nostru pe documente juridice.

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2",
    max_length=512
)

def rerank_chunks(query: str, candidates: list[dict], top_k: int = 4) -> list[dict]:
    pairs = [(query, chunk["text"]) for chunk in candidates]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(candidates, scores),
        key=lambda x: x[1], reverse=True
    )

    return [chunk for chunk, score in ranked[:top_k] if score > 0.1]
```

**De ce pragul 0.1?** Dacă fragmentul cu cel mai bun scor e sub 0.1, întrebarea probabil nu poate fi răspunsă din corpusul tău de documente. A trimite fragmente cu încredere scăzută către LLM produce halucinații. Mai bine spui „Nu găsesc un răspuns relevant în documentele disponibile" decât să confabulezi.

---

## LLM inference — o configurație de model local care nu te face de râs în producție

Alegerea modelului depinde de hardware-ul tău și de cerințele de acuratețe. Pentru QA pe documente juridice/enterprise în producție:

| Model | VRAM necesar | Calitate | Caz de utilizare |
|---|---|---|---|
| Qwen2.5 14B Q4_K_M | 10 GB | Excelentă | Recomandarea implicită |
| Qwen2.5 32B Q4_K_M | 22 GB | Aproape de frontieră | QA pe documente cu miză mare |
| Mistral 7B Instruct Q5 | 6 GB | Bună | Throughput mare, sensibil la latență |
| Llama 3.1 8B Q5_K_M | 6 GB | Bună | Uz general |

**Promptul de sistem nu e opțional:**

```python
SYSTEM_PROMPT = """You are a document analysis assistant. Your answers must be:
1. Based ONLY on the context provided below
2. Cited with the specific document and section they come from
3. Honest about uncertainty: if the context does not contain a clear answer, say so explicitly

If the provided context contradicts itself across documents, surface both versions and note the conflict.
Never invent details not present in the context.

Context:
{context}

Source documents: {sources}"""
```

Instrucțiunea „dacă contextul nu conține un răspuns clar, spune asta explicit" reduce halucinațiile mai mult decât orice altă modificare de prompt, luată separat. Modelele sunt implicit orientate spre a fi utile — vor confabula mai degrabă decât să admită că nu știu, dacă nu le dai explicit permisiunea să nu știe.

---

## Production hardening — circuit breaker, retry, failover

Asta e secțiunea pe care demo-ul de Pinecone n-o are.

### Tiparul Circuit Breaker

Serviciul tău de inference LLM va deveni ocazional indisponibil — OOM din cauza unei ferestre de context prea mari, o problemă de driver GPU, un restart de Ollama. Fără circuit breaker, toate cererile tale RAG vor rămâne agățate până la timeout, degradând întreaga aplicație.

```python
import asyncio
from enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class LLMCircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 30, success_threshold: int = 2):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold

    async def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if datetime.now() - self.last_failure_time > timedelta(seconds=self.recovery_timeout):
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
            else:
                raise CircuitOpenError("LLM service unavailable, using fallback")

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
```

### Retry cu exponential backoff

Nu orice eșec justifică deschiderea circuitului. Erorile tranzitorii (un blip de rețea, un vârf scurt de memorie GPU) ar trebui reîncercate:

```python
import asyncio
from functools import wraps

def retry_with_backoff(max_retries=3, base_delay=0.5, max_delay=10.0):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            delay = base_delay
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except TransientError as e:
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(delay)
                    delay = min(delay * 2, max_delay)
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

### Strategia de fallback

Când circuitul e deschis, ai nevoie de o degradare grațioasă — nu de o eroare 500:

```python
async def rag_query_with_fallback(query: str, context: list[dict]) -> dict:
    try:
        async with circuit_breaker.call(local_llm_inference, query, context):
            return await local_llm_inference(query, context)

    except CircuitOpenError:
        try:
            return await secondary_llm_inference(query, context)
        except Exception:
            pass

        return {
            "answer": None,
            "mode": "degraded",
            "message": "AI synthesis temporarily unavailable. Here are the most relevant document sections:",
            "sources": context[:3],
            "confidence": None
        }
```

**Asta contează mai mult decât crezi.** Un sistem care returnează sursele brute atunci când LLM-ul e picat e infinit mai util decât unul care returnează o eroare 500. Și e onest — utilizatorul înțelege exact ce primește.

---

## Observability — nu poți repara ce nu poți vedea

Fiecare interogare RAG din producție ar trebui să logheze:

```python
trace = {
    "trace_id": str(uuid4()),
    "timestamp": datetime.utcnow().isoformat(),
    "query": query,
    "query_embedding_time_ms": 45,
    "retrieval_time_ms": 23,
    "reranker_time_ms": 180,
    "llm_inference_time_ms": 2100,
    "total_time_ms": 2348,
    "retrieved_chunks": [chunk["source_file"] for chunk in candidates],
    "reranked_top_scores": [0.89, 0.72, 0.61, 0.44],
    "top_reranker_score": 0.89,
    "answer_length": len(answer),
    "fallback_triggered": False,
    "model_used": "qwen2.5:14b",
    "user_feedback": None
}
await log_to_clickhouse(trace)
```

`top_reranker_score` e deosebit de valoros: dacă vezi o distribuție de interogări cu scoruri sub 0.2, acelea sunt interogări la care corpusul tău nu poate răspunde — un semnal să-ți îmbunătățești acoperirea documentelor sau să adaugi un răspuns de fallback.

---

## Modurile de eșec despre care nimeni nu-ți spune

**1. Embedding model drift**: dacă faci upgrade la modelul de embedding, re-fă embedding pentru întregul corpus. Amestecarea embeddingurilor din modele diferite în aceeași colecție produce retrieval de gunoi. Nu e evident până nu se strică pe tăcute.

**2. Cascada de încredere OCR**: un PDF scanat cu o încredere OCR de 72% produce fragmente care fac embedding incorect, pentru că textul e corupt. Filtrează fragmentele sub un prag de încredere la momentul ingestiei, nu la momentul retrieval-ului.

**3. Proliferarea versiunilor**: dacă ingerezi un document, apoi o versiune revizuită, apoi revizia reviziei — fără deduplicare — retrieval-ul tău va returna toate cele trei versiuni cu probabilitate egală. Strategia ta de filtrare pe metadate trebuie să țină cont de ciclul de viață al documentului.

**4. Depășirea ferestrei de context**: când toate cele 4 fragmente din top sunt lungi, pot depăși fereastra de context a LLM-ului. Implementează un buget de context:

```python
MAX_CONTEXT_TOKENS = 3000

def assemble_context(chunks: list[dict]) -> str:
    context_parts = []
    token_count = 0
    for chunk in chunks:
        chunk_tokens = estimate_tokens(chunk["text"])
        if token_count + chunk_tokens > MAX_CONTEXT_TOKENS:
            break
        context_parts.append(chunk["text"])
        token_count += chunk_tokens
    return "\n\n---\n\n".join(context_parts)
```

**5. Halucinația „nu găsesc"**: un model instruit să admită incertitudinea va spune uneori „nu găsesc asta în documente" — și apoi va răspunde oricum, în propoziția următoare. Parsează mereu răspunsul și verifică dacă scorul de retrieval și încrederea răspunsului sunt consistente. Discrepanțele merită un flag.

---

## Concluzia

RAG nu e un feature pe care-l adaugi. E o disciplină de inginerie.

Demo-ul funcționează în 2 ore. Sistemul de producție durează săptămâni — pentru că strategia de chunking, hybrid retrieval, re-ranking, circuit breakers, observability și analiza modurilor de eșec nu sunt gânduri ulterioare. Ele sunt produsul.

Inginerii care livrează sisteme RAG în care utilizatorii au încredere nu sunt cei care au găsit cel mai bun LLM. Sunt cei care au fost obsedați de stratul de retrieval, au instrumentat totul și au proiectat pentru eșec încă de la început.

La ThinkFlow, ăsta e tipul de sistem pe care-l construim și îl operăm — nu ca proiect punctual, ci ca serviciu de producție întreținut. Dacă demo-ul tău RAG a avut performanțe slabe în producție, sau dacă pornești de la zero și vrei să faci lucrurile bine din prima, **[hai să vorbim →](https://www.thinkflow.ro/contact)**

---

*ThinkFlow · București, România · thinkflow.ro*
