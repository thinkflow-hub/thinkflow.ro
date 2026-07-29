---
title: "Building a RAG Pipeline with Qdrant and Ollama"
description: "Tutorial on building a RAG pipeline with Qdrant vector database and Ollama."
date: "2026-07-21"
category: "AI Development"
tags: [rag, qdrant, ollama, vector-search]
affiliatePrograms: ["Qdrant Cloud"]
image: "/api/og?title=Building+a+RAG+Pipeline+with+Qdrant+and+Ollama&logos=Qdrant Cloud&category=AI+Development&tags=rag,qdrant,ollama"
---

# Building a RAG Pipeline with Qdrant and Ollama

Retrieval-Augmented Generation (RAG) combines vector search with large language models (LLMs) to create context‑aware AI applications that can answer questions grounded in user‑provided data.

## Why RAG?

LLMs are powerful at generating fluent text, but they rely solely on the knowledge encoded during training. When faced with queries about proprietary documents, recent events, or niche topics, the model may hallucinate—producing plausible‑sounding but incorrect information. RAG mitigates this by inserting a retrieval step that fetches relevant passages from an external knowledge base before generation. The retrieved context acts as a factual grounding, guiding the LLM toward answers that are consistent with the source material.

Key advantages of a RAG approach include:

- **Reduced hallucination**: The model conditions its output on verifiable snippets, lowering the chance of fabricating facts.
- **Up‑to‑date knowledge**: By indexing fresh data (e.g., daily news, internal logs) you can answer questions about information that post‑dates the model’s training cutoff.
- **Domain specialization**: You can tailor the vector store to any corpus—legal contracts, product manuals, research papers—without retraining the LLM.
- **Transparent sourcing**: The pipeline can return the original document IDs or passages alongside the answer, enabling auditability and user trust.

Typical RAG deployments consist of four logical stages: query embedding, vector similarity search, context assembly, and LLM inference. Each stage can be scaled independently, allowing you to optimize for latency, throughput, or cost based on your workload.

## Architecture

```
User Query
    ↓
Embedding Model (Ollama)
    ↓
Vector Search (Qdrant)
    ↓
Retrieved Context (text chunks)
    ↓
LLM (Ollama or any compatible endpoint)
    ↓
Final Answer
```

1. **User Query** – The raw text input from a client application or API.
2. **Embedding Model** – Converts the query into a dense vector representation. In this guide we use the `nomic-embed-text` model served by Ollama, which produces 768‑dimensional embeddings suitable for semantic similarity.
3. **Vector Search** – Qdrant receives the query vector and performs an approximate nearest‑neighbor (ANN) search against stored document vectors, returning the top‑k most similar entries along with their payloads (e.g., original text, metadata).
4. **Context Assembly** – The retrieved passages are concatenated or otherwise formatted into a prompt that instructs the LLM to answer the question using only the supplied context.
5. **LLM** – The language model generates the final answer, conditioned on the retrieved context. Ollama can serve a variety of models (e.g., Llama 2, Mistral) via the same API used for embeddings.

Because each block communicates over HTTP (or gRPC for Qdrant), the pipeline can be deployed as a set of microservices, behind a load balancer, or as a single monolithic process for prototyping.

## Step 1: Run Qdrant

Qdrant is a vector similarity search engine written in Rust, optimized for high‑dimensional workloads. It offers a REST/JSON API, a gRPC interface, and an optional UI for inspection.

### Docker Quick‑Start

The simplest way to get a Qdrant instance running is via Docker:

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

- `-d` runs the container in detached mode.
- Ports `6333` (REST) and `6334` (gRPC) are exposed to the host.
- A host directory (`$(pwd)/qdrant_storage`) is mounted to persist collections and snapshots across container restarts.
- The official `qdrant/qdrant` image pulls the latest stable release.

### Configuration Options

You can tune Qdrant through environment variables or a configuration file. Commonly adjusted parameters include:

| Variable | Description | Typical Value |
|----------|-------------|---------------|
| `QDRANT__SERVICE__GRPC_PORT` | gRPC port | `6334` |
| `QDRANT__SERVICE__HTTP_PORT` | HTTP port | `6333` |
| `QDRANT__STORAGE__PATH` | Path to storage directory | `/qdrant/storage` |
| `QDRANT__COLLECTIONS__DEFAULT_VECTOR_SIZE` | Dimensionality of vectors if not specified per collection | `768` |
| `QDRANT__MAX_SEARCH_THREADS` | Maximum threads for search parallelism | `4` (adjust to CPU cores) |

For production deployments, consider:

- Enabling TLS via `QDRANT__SERVICE__TLS__FROM_FILE` and providing certificate/key files.
- Setting resource limits (`--cpus`, `--memory`) in Docker to prevent the container from overwhelming the host.
- Using a orchestration platform (Kubernetes, Docker Swarm) with a liveness probe that hits the `/ready` endpoint.

### Verifying the Installation

After the container starts, you can check its health:

```bash
curl http://localhost:6333/ready
```

A successful response returns `{"status":"ok"}`. The interactive UI is available at `http://localhost:6333/dashboard`, where you can view collections, monitor metrics, and manually insert or search vectors.

## Step 2: Embeddings with Ollama

Ollama provides a local server that serves LLMs and embedding models via a simple HTTP API. It abstracts away the complexities of model loading, GPU acceleration, and batching.

### Pulling the Embedding Model

Before you can generate embeddings, you need to have the model available locally:

```bash
ollama pull nomic-embed-text
```

This command downloads the `nomic-embed-text` model (approximately 200 MB) and makes it ready for inference. Ollama stores models under `~/.ollama/models` by default.

### Starting the Ollama Server

If Ollama is not already running as a daemon, start it:

```bash
ollama serve &
```

The server binds to `http://localhost:11434` by default. You can change the host and port with the `OLLAMA_HOST` environment variable.

### Embedding API Endpoint

To embed a piece of text, send a POST request to `http://localhost:11434/api/embeddings`:

```json
POST /api/embeddings
Content-Type: application/json

{
  "model": "nomic-embed-text",
  "prompt": "Your input text goes here"
}
```

The response contains a JSON object with an `embedding` field—a list of floating‑point numbers representing the vector. For batch processing, you can loop over texts or use the `/api/embeddings` endpoint in parallel; Ollama handles concurrency internally.

### Dimensionality and Normalization

`nomic-embed-text` yields 768‑dimensional vectors. The model does not L2‑normalize the output by default; however, cosine similarity (the default metric in Qdrant) is invariant to scaling, so you can store the raw embeddings directly. If you prefer dot‑product similarity, you may normalize the vectors client‑side before upserting.

### Error Handling and Retries

Network hiccups or model loading delays can cause transient HTTP 500 responses. A robust client should:

- Implement exponential backoff with jitter.
- Respect the `Retry-After` header if present.
- Log the request payload and response for debugging.

## Step 3: Store and Query

Qdrant’s API is deliberately straightforward: you create a collection, upsert vectors with associated payloads, and perform similarity searches.

### Creating a Collection

A collection defines the vector size, distance metric, and optional indexing parameters. Using the REST API:

```bash
curl -X PUT "http://localhost:6333/collections/my_docs" \
  -H "Content-Type: application/json" \
  -d '{
        "vectors": {
          "size": 768,
          "distance": "Cosine"
        }
      }'
```

- `size` must match the embedding dimensionality of your chosen model.
- `distance` can be `Cosine`, `Dot`, or `Euclid`. Cosine is common for text embeddings.

You can also specify `optimizers_config` or `hnsw_config` to tune indexing speed vs. recall trade‑offs, but the defaults work well for most moderate‑size datasets (< 1 million vectors).

### Upserting Vectors

Each point consists of a vector, an optional unique identifier (`id`), and a payload (arbitrary JSON). The payload is useful for storing the original text, metadata (e.g., source URL, timestamp), or any fields you wish to filter on later.

Example using `httpx` in Python:

```python
import httpx
import json

def upsert_point(point_id: int, vector: list[float], text: str, metadata: dict):
    url = "http://localhost:6333/collections/my_docs/points"
    payload = {
        "points": [
            {
                "id": point_id,
                "vector": vector,
                "payload": {
                    "text": text,
                    **metadata
                }
            }
        ]
    }
    response = httpx.put(url, json=payload, timeout=10.0)
    response.raise_for_status()
    return response.json()
```

- The `id` can be any integer; Qdrant will reject duplicates unless you set the `wait` flag to false and handle conflicts manually.
- Payload fields are indexed automatically, enabling filtering during search.

### Performing a Similarity Search

Once points are stored, you can search with a query vector:

```python
def search(query_vector: list[float], limit: int = 5, filter_conditions=None):
    url = "http://localhost:6333/collections/my_docs/points/search"
    search_body = {
        "vector": query_vector,
        "limit": limit,
        "with_payload": True,
        "with_vector": False
    }
    if filter_conditions:
        search_body["filter"] = filter_conditions
    response = httpx.post(url, json=search_body, timeout=10.0)
    response.raise_for_status()
    return response.json()["result"]
```

- `limit` controls how many nearest neighbors are returned.
- `with_payload: True` ensures the original text and metadata come back in the response.
- `filter_conditions` follows Qdrant’s filter language, allowing you to restrict results by payload fields (e.g., only documents from a specific date range).

### Example Filter

To retrieve only documents whose `source` field equals `"internal_wiki"`:

```json
{
  "must": [
    {
      "key": "source",
      "match": {
        "value": "internal_wiki"
      }
    }
  ]
}
```

You can combine multiple conditions using `should`, `must_not`, and nested structures.

## Complete Example

Below is a self‑contained Python script that demonstrates the full RAG workflow:

1. Starts (or assumes) a running Qdrant and Ollama instance.
2. Loads a small sample corpus from plain‑text files.
3. Generates embeddings with `nomic-embed-text`.
4. Upserts the vectors into Qdrant.
5. Accepts a user query, embeds it, searches Qdrant, builds a prompt, and calls an LLM (here we use Ollama’s `llama2` model) to produce the final answer.

```python
#!/usr/bin/env python3
"""
RAG pipeline using Qdrant (vector store) and Ollama (embeddings + LLM).
"""

import os
import json
import httpx
from pathlib import Path
from typing import List, Dict, Any

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
QDRANT_HOST = os.getenv("QDRANT_HOST", "http://localhost:6333")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
COLLECTION_NAME = "demo_rag"
EMBED_MODEL = "nomic-embed-text"
LLM_MODEL = "llama2"          # any model served by Ollama
VECTOR_SIZE = 768             # must match embedding model output
TOP_K = 3                     # number of retrieved chunks to feed the LLM

# ----------------------------------------------------------------------
# Helper functions
# ----------------------------------------------------------------------
def http_post(url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Wrapper around httpx.POST with basic error handling."""
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()

def embed_text(text: str) -> List[float]:
    """Call Ollama's embedding endpoint."""
    payload = {
        "model": EMBED_MODEL,
        "prompt": text
    }
    data = http_post(f"{OLLAMA_HOST}/api/embeddings", payload)
    return data["embedding"]

def ensure_collection():
    """Create the Qdrant collection if it does not exist."""
    url = f"{QDRANT_HOST}/collections/{COLLECTION_NAME}"
    # Try to GET first; if 404, create.
    get_resp = httpx.get(url)
    if get_resp.status_code == 404:
        create_payload = {
            "vectors": {
                "size": VECTOR_SIZE,
                "distance": "Cosine"
            }
        }
        resp = httpx.put(url, json=create_payload)
        resp.raise_for_status()
        print(f"Created collection '{COLLECTION_NAME}'")
    elif get_resp.status_code != 200:
        get_resp.raise_for_status()
    else:
        print(f"Collection '{COLLECTION_NAME}' already exists.")

def upsert_points(points: List[Dict[str, Any]]):
    """Upload a batch of points to Qdrant."""
    url = f"{QDRANT_HOST}/collections/{COLLECTION_NAME}/points"
    payload = {"points": points}
    resp = httpx.put(url, json=payload)
    resp.raise_for_status()
    print(f"Upserted {len(points)} points.")

def search_query(vector: List[float], limit: int = TOP_K) -> List[Dict[str, Any]]:
    """Perform a vector search and return payloads."""
    url = f"{QDRANT_HOST}/collections/{COLLECTION_NAME}/points/search"
    payload = {
        "vector": vector,
        "limit": limit,
        "with_payload": True,
        "with_vector": False
    }
    data = http_post(url, payload)
    return data["result"]

def build_prompt(query: str, contexts: List[str]) -> str:
    """Compose a prompt that instructs the LLM to answer using the given contexts."""
    context_block = "\n\n".join([f"[{i+1}] {c}" for i, c in enumerate(contexts)])
    prompt = (
        "Answer the question based solely on the provided context. "
        "If the context does not contain the answer, say you don't know.\n\n"
        f"Context:\n{context_block}\n\n"
        f"Question: {query}\n"
        "Answer:"
    )
    return prompt

def generate_answer(prompt: str) -> str:
    """Call Ollama's completion endpoint."""
    payload = {
        "model": LLM_MODEL,
        "prompt": prompt,
        "stream": False   # we want the full response at once
    }
    data = http_post(f"{OLLAMA_HOST}/api/generate", payload)
    return data["response"]

# ----------------------------------------------------------------------
# Main workflow
# ----------------------------------------------------------------------
def main():
    # 1. Prepare Qdrant
    ensure_collection()

    # 2. Load sample documents (replace with your own data source)
    docs_dir = Path("./sample_docs")
    documents = []   # list of dicts: {"id": int, "text": str, "metadata": {...}}
    for i, file_path in enumerate(docs_dir.glob("*.txt")):
        text = file_path.read_text(encoding="utf-8")
        # Simple chunking: split by double newline; adjust as needed
        chunks = [c.strip() for c in text.split("\n\n") if c.strip()]
        for j, chunk in enumerate(chunks):
            documents.append({
                "id": i * 1000 + j,   # ensure uniqueness across files
                "text": chunk,
                "metadata": {
                    "source": file_path.name,
                    "chunk_index": j
                }
            })

    # 3. Embed and upsert
    points_to_upsert = []
    for doc in documents:
        vec = embed_text(doc["text"])
        points_to_upsert.append({
            "id": doc["id"],
            "vector": vec,
            "payload": {
                "text": doc["text"],
                **doc["metadata"]
            }
        })
        # Upsert in batches of 64 to limit memory usage
        if len(points_to_upsert) >= 64:
            upsert_points(points_to_upsert)
            points_to_upsert.clear()
    if points_to_upsert:
        upsert_points(points_to_upsert)

    # 4. Interactive query loop
    print("\nRAG ready. Type your question (or 'exit' to quit).")
    while True:
        user_query = input("\n> ").strip()
        if user_query.lower() in {"exit", "quit"}:
            break
        if not user_query:
            continue

        # Embed query
        q_vec = embed_text(user_query)

        # Retrieve top‑k contexts
        results = search_query(q_vec, limit=TOP_K)
        contexts = [r["payload"]["text"] for r in results]

        # Build prompt and generate answer
        prompt = build_prompt(user_query, contexts)
        answer = generate_answer(prompt)

        print("\n--- Answer ---")
        print(answer)
        print("---------------")

if __name__ == "__main__":
    main()
```

### How the Script Works

| Section | Purpose |
|--------|---------|
| **Configuration** | Centralizes host, model names, and constants; easily overridden via environment variables. |
| **HTTP helpers** | Thin wrappers around `httpx` that raise on non‑2xx responses, keeping the main logic clean. |
| **Embedding** | Calls Ollama’s `/api/embeddings` endpoint; returns a 768‑dim list. |
| **Collection management** | Checks for existing collection; creates it with cosine distance if absent. |
| **Document ingestion** | Reads `.txt` files from `sample_docs/`, splits on blank lines (a naive chunker), assigns a unique integer ID, and stores the raw text plus metadata (source filename, chunk index). |
| **Upserting** | Sends points in batches of 64 to balance throughput and memory usage. |
| **Query loop** | Repeatedly reads user input, embeds it, searches Qdrant, builds a prompt that concatenates the retrieved chunks, and asks the LLM to answer. |
| **Prompt design** | Explicitly instructs the model to rely only on the supplied context and to admit ignorance when appropriate, which further curbs hallucination. |
| **Answer output** | Streams the LLM’s final answer to the console. |

You can adapt this script in several ways:

- **Different chunking strategies** (sentence‑based, sliding window, hierarchical) to improve retrieval granularity.
- **Metadata enrichment** (e.g., adding timestamps, tags, or author) to enable filtered search (`filter` parameter in the search payload).
- **Alternative LLMs** (Mistral, Phi‑2, etc.) by changing `LLM_MODEL` and ensuring the model is pulled with `ollama pull`.
- **Production deployment** by wrapping the core logic in a FastAPI or Flask service, adding authentication, logging, and monitoring.

## Operational Considerations

### Persistence and Backups

Qdrant stores data in the directory mounted at `/qdrant/storage`. Regular snapshots can be taken by copying this directory while the container is stopped, or by using the built‑in `/snapshot` endpoint:

```bash
curl -X POST "http://localhost:6333/snapshots" -H "Content-Type: application/json" -d '{"name": "weekly_backup"}'
```

Restoring a snapshot involves stopping Qdrant, replacing the storage folder with the snapshot contents, and restarting.

### Scaling

- **Vertical scaling**: Increase CPU/RAM allocated to the Qdrant container; the HNSW index benefits from more memory for faster graph traversal.
- **Horizontal scaling**: Qdrant supports clustering via its enterprise edition or through replication strategies using the open‑source version (leader‑follower replication). For read‑heavy workloads, you can deploy multiple read replicas behind a load balancer.
- **Embedding throughput**: Ollama can process multiple prompts concurrently; consider using a GPU‑enabled host (`ollama serve` will automatically leverage CUDA if available) to reduce latency.

### Monitoring

Both services expose basic metrics:

- Qdrant: `/metrics` endpoint (Prometheus format) when `QDANT__TELEMETRY__ENABLED=true`.
- Ollama: logs to stdout; you can forward them to a logging system (e.g., Loki, Elasticsearch) for query latency tracking.

Setting up alerts on high query latency or low cache hit ratios helps maintain service level objectives.

### Security

- **Network**: By default, both services listen only on `localhost` when invoked without explicit host binding. For external access, place them behind a reverse proxy (NGINX, Traefik) with TLS termination and authentication (e.g., OAuth2, API keys).
- **Data protection**: Payloads stored in Qdrant are not encrypted at rest; if your documents contain sensitive information, consider encrypting fields client‑side before upserting, or deploy Qdrant on encrypted volumes.
- **Model access**: Ollama does not implement authentication by default; restrict access to the host’s port (`11434`) using firewall rules or run it inside a private network.

## Conclusion

Combining Qdrant’s high‑performance vector search with Ollama’s locally hosted embedding and generation models yields a pragmatic, production‑ready RAG pipeline that you can run on a single workstation or scale across a cluster. The architecture cleanly separates concerns—embedding, storage, and generation—allowing each component to be optimized, monitored, and replaced independently.

By following the steps outlined above, you can:

1. **Spin up** a durable vector store with Docker.
2. **Generate** high‑quality semantic embeddings using a state‑of‑the‑art model.
3. **Store** and **retrieve** relevant context with sub‑second latency.
4. **Ground** LLM responses in verifiable source material, markedly reducing hallucination.

Feel free to experiment with different chunking strategies, alternative distance metrics, or larger language models to suit the specific characteristics of your data and use case. The modular nature of this approach ensures that as either the embedding or generation landscape evolves, you can swap in newer models without re‑architecting the entire system. Happy building!