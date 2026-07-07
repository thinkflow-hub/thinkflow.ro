---
title: "What a RAG Pipeline That Actually Works in Production Looks Like"
description: "From client PDFs to chunking, embedding, Qdrant, re-ranking, and local LLM. Circuit breaker, retry, failover. Not the Pinecone demo. Real production patterns."
date: "2026-07-06"
category: "AI Infrastructure"
tags: [rag, pipeline, qdrant, llm, production, ai, retrieval-augmented-generation]
affiliatePrograms: [Qdrant]
image: "/images/blog/rag-pipeline-production-that-actually-works.webp"
---

# What a RAG Pipeline That Actually Works in Production Looks Like

**Published by ThinkFlow · Reading time: ~14 min · For: engineers who tried RAG and it was "meh"**

---

You built the demo. It was impressive. The model answered questions about your documents. Your manager was excited. You deployed it.

Then reality arrived.

The model confidently cited a policy that was updated 8 months ago. It answered "yes" to a question that had a clear "no" in the document — because the relevant chunk was ranked 11th and never made it into the context. It worked perfectly on the 5 documents you tested it with, and started hallucinating on document 47, which had a table embedded in a scanned PDF.

Welcome to the gap between RAG demos and RAG in production.

This is not a tutorial. There are a thousand tutorials. This is a post-mortem — the things that broke in production, why they broke, and what the architecture looks like after you have fixed them.

---

## Why Most RAG Demos Lie to You

The standard demo pipeline looks like this:

1. Load a PDF
2. Split it into 1,000-character chunks with 200-character overlap
3. Embed with OpenAI `text-embedding-3-small`
4. Store in Pinecone / Chroma / Weaviate
5. At query time: embed the question, find top-5 similar chunks, send to GPT-4 with a prompt

This works. In a demo. On 10 clean, well-structured PDFs with consistent formatting and content that genuinely matches the query phrasing.

In production, you have:
- Scanned documents where OCR has introduced noise
- Tables, footnotes, and headers that chunk badly at fixed character boundaries
- Legal or technical language where a 3-sentence excerpt is meaningless without context
- Users who phrase queries differently from how the documents phrase answers
- Documents that contradict each other across versions

The demo pipeline is optimized for impressiveness. The production pipeline is optimized for **reliability under adversarial conditions**.

These are different things.

---

## The Full Production Architecture

Before diving into each component, here is the complete picture:

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

Every step in this diagram exists because something broke without it. Let us go through the non-obvious ones.

---

## Ingestion — The Part Everyone Underestimates

### Why Fixed-Size Chunking Is Wrong for Most Documents

The default advice — chunk at 1,000 characters, overlap 200 — works for homogeneous text. It fails for:

**Legal documents**: A clause like "Section 12.3 shall not apply in circumstances defined under Article 4 of the preceding agreement" is meaningless without Article 4. Fixed chunking cuts the reference. You need **semantic chunking** that preserves logical units (paragraphs, clauses, sections).

**Technical manuals**: A table split across two chunks becomes noise. Neither chunk retrieves correctly because the table's meaning requires the full structure.

**Q&A formatted documents**: An FAQ where the question is in chunk 5 and the answer is in chunk 6 will always return the wrong chunk for the user's question.

**What to do instead:**

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

### Metadata Is Half the Retrieval

Every chunk needs a payload that lets you filter before or after retrieval:

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

This payload allows queries like: "Find relevant chunks from contracts effective after January 2025" — without that filter, you might retrieve a superseded version and hallucinate a policy that is no longer valid.

---

## Vector Store — Why Qdrant and Why Self-Hosted

There are good managed vector databases. Pinecone is well-engineered. Weaviate Cloud is solid. But for production systems where data cannot leave your infrastructure, you need self-hosted — and **Qdrant is the current best option** for this use case.

### Why Qdrant Specifically

- **Rust-based**: memory efficiency and performance are significantly better than Python-native alternatives
- **Sparse + dense hybrid search**: native support for combining BM25 keyword matching with semantic vector search (crucial for short, technical queries where pure semantics fails)
- **Payload filtering**: filter by metadata before or during vector search, not after — this changes query latency from 200ms to 15ms at scale
- **Snapshots**: point-in-time backups of your entire vector store in seconds

### Docker Compose for Production Qdrant

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

## Hybrid Retrieval — Why Dense-Only Search Fails Short Queries

Pure vector search fails when the user's query is short and technical.

Query: "GDPR Article 17"
Dense vector search will find documents about "right to erasure" and "data subject rights" — because those are semantically related. But the user wants the exact chunk that contains "Article 17" verbatim.

**Hybrid search combines:**
- **Dense retrieval**: semantic similarity (catches paraphrase, synonyms, related concepts)
- **Sparse retrieval (BM25)**: keyword matching (catches exact terms, document IDs, article numbers, product codes)

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

This typically improves recall by 15-25% compared to dense-only search, especially for technical domain queries.

---

## Re-Ranking — The Step That Changes Everything

This is the single highest-ROI improvement you can make to a mediocre RAG system.

Vector search returns the top-20 chunks by approximate similarity. But "approximate similarity" is computed between two vectors in high-dimensional space — it is a blunt instrument. The CrossEncoder re-ranker computes a **direct relevance score** between the query and each candidate chunk, attending to the actual token-level interaction between them.

The difference in accuracy is not marginal. It is the difference between 78% and 94% in our legal document benchmark.

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

**Why 0.1 as a threshold?** If the best-matching chunk scores below 0.1, the question likely cannot be answered from your document corpus. Returning low-confidence chunks to the LLM causes hallucination. Better to say "I cannot find a relevant answer in the available documents" than to confabulate.

---

## LLM Inference — Local Model Setup That Does Not Embarrass You in Production

The model choice depends on your hardware and your accuracy requirements. For legal/enterprise document QA in production:

| Model | VRAM Required | Quality | Use Case |
|---|---|---|---|
| Qwen2.5 14B Q4_K_M | 10 GB | Excellent | Default recommendation |
| Qwen2.5 32B Q4_K_M | 22 GB | Near-frontier | High-stakes document QA |
| Mistral 7B Instruct Q5 | 6 GB | Good | High-throughput, latency-sensitive |
| Llama 3.1 8B Q5_K_M | 6 GB | Good | General purpose |

**The system prompt is not optional:**

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

The instruction "if the context does not contain a clear answer, say so explicitly" reduces hallucination more than any other single prompt change. Models default to helpfulness — they will confabulate rather than admit ignorance unless you explicitly give them permission to not know.

---

## Production Hardening — Circuit Breaker, Retry, Failover

This is the section the Pinecone demo does not have.

### Circuit Breaker Pattern

Your LLM inference service will occasionally become unavailable — OOM from a large context window, GPU driver issue, Ollama restart. Without a circuit breaker, all your RAG requests will hang until timeout, degrading the entire application.

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

### Retry with Exponential Backoff

Not every failure warrants a circuit open. Transient errors (network blip, brief GPU memory spike) should retry:

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

### Fallback Strategy

When the circuit is open, you need a graceful degradation — not a 500 error:

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

**This matters more than you think.** A system that returns raw sources when the LLM is down is infinitely more useful than a system that returns a 500 error. And it is honest — the user understands what they are getting.

---

## Observability — You Cannot Fix What You Cannot See

Every RAG query in production should log:

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

The `top_reranker_score` is particularly valuable: if you see a distribution of queries with scores below 0.2, those are queries your corpus cannot answer — signals to improve your document coverage or add a fallback response.

---

## The Failure Modes No One Tells You About

**1. Embedding model drift**: If you upgrade your embedding model, re-embed your entire corpus. Mixing embeddings from different models in the same collection produces garbage retrieval. This is not obvious until it breaks silently.

**2. OCR confidence cascade**: A scanned PDF with 72% OCR confidence produces chunks that embed incorrectly because the text is corrupted. Filter out chunks below a confidence threshold at ingestion time, not at retrieval time.

**3. Version proliferation**: If you ingest a document, then a revised version, then the revision of the revision — without deduplication — your retrieval will return all three versions with equal probability. Your metadata filtering strategy must account for document lifecycle.

**4. Context window overflow**: When all 4 top-ranked chunks are long, they may exceed the LLM's context window. Implement a context budget:

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

**5. The "I cannot find" hallucination**: A model told to admit uncertainty will sometimes say "I cannot find this in the documents" — and then answer anyway in the next sentence. Always parse the answer and check if retrieval score and answer confidence are consistent. Mismatches warrant a flag.

---

## The Bottom Line

RAG is not a feature you add. It is an engineering discipline.

The demo works in 2 hours. The production system takes weeks — because chunking strategy, hybrid retrieval, re-ranking, circuit breakers, observability, and failure mode analysis are not afterthoughts. They are the product.

The engineers who ship RAG systems that users trust are not the ones who found the best LLM. They are the ones who obsessed over the retrieval layer, instrumented everything, and designed for failure from the beginning.

At ThinkFlow, this is the kind of system we build and operate — not as a one-time project, but as a maintained production service. If your RAG demo underperformed in production, or if you are starting from scratch and want to get it right the first time, **[let's talk →](https://www.thinkflow.ro/contact)**

---

*ThinkFlow · Bucharest, Romania · thinkflow.ro*
