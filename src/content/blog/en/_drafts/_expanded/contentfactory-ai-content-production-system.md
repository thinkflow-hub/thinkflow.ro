---
title: "ContentFactory: AI Content Production System"
description: "Overview of ContentFactory modular AI content production system with six factories."
date: "2026-07-21"
category: "Architecture"
tags: [contentfactory, ai-automation, architecture]
affiliatePrograms: []
image: "/api/og?title=ContentFactory+AI+Content+Production+System&logos=&category=Architecture&tags=contentfactory,ai-automation,architecture"
---

# ContentFactory: AI Content Production System

A modular multi-factory AI content production system for scaling output.

## The Six Factories

ContentFactory is organized around six independent yet interchangeable factories. Each factory encapsulates a complete end‑to‑end pipeline for a specific content type, while sharing a common set of core services. This design enables teams to add, remove, or scale factories without affecting the rest of the system.

### 1. SEO Factory  
**Purpose** – Produce search‑engine‑optimized long‑form articles that can be auto‑published to a CMS or static site generator.  

**Inputs**  
- Keyword list or topic brief (plain text or CSV).  
- Optional SEO constraints: target word count, reading level, internal/external link quotas.  

**Pipeline**  
1. **Topic Expansion** – An LLM (routed via the shared LLM router) generates a hierarchical outline based on the seed keyword.  
2. **Section Drafting** – Each outline node is sent to a dedicated LLM instance that writes a paragraph‑level draft, respecting tone and style guides supplied in a YAML configuration.  
3. **On‑Page Optimization** – A rule‑based module inserts meta‑tags, schema markup, and suggested internal links derived from a Qdrant vector store of previously published articles.  
4. **Quality Control** – The draft passes through a shared QC service that runs readability checks, plagiarism detection (via a local hash‑based index), and SEO scoring (using open‑source tools such as `seobot`).  
5. **Auto‑Publish** – Upon passing QC, the article is pushed to a target endpoint (WordPress REST API, Ghost Admin API, or a Git‑based static site) using an authenticated HTTP client.  

**Key Components**  
- `seo_factory/worker.py` – Celery‑style task that orchestrates the steps above.  
- `seo_factory/templates/` – Jinja2 templates for article scaffolding and meta‑tag generation.  
- `seo_factory/config.yaml` – Factory‑specific overrides for tone, target audience, and publishing credentials.  

### 2. KDP Factory  
**Purpose** – Create puzzle books, workbooks, and low‑content publications ready for upload to Kindle Direct Publishing (KDP) or similar print‑on‑demand platforms.  

**Inputs**  
- Puzzle specifications (type, difficulty, grid size).  
- Content assets: word lists, trivia questions, or educational exercises.  

**Pipeline**  
1. **Asset Preparation** – Word lists are filtered and lemmatized using spaCy; trivia items are validated against a curated knowledge base stored in Qdrant.  
2. **Puzzle Generation** – Procedural generators (implemented in pure Python) produce crosswords, word searches, Sudoku, or math worksheets. Each generator receives parameters from the spec and returns a printable SVG or PDF representation.  
3. **Layout Assembly** – A layout engine (ReportLab) places puzzles onto print‑ready pages, inserts front‑matter (title, copyright, ISBN placeholder), and adds bleed and margin settings per KDP templates.  
4. **Validation** – A shared QC module runs preflight checks: page count limits, image resolution, color space (CMYK conversion), and ensures no copyrighted material slips through via perceptual hashing.  
5. **Export & Upload** – The final PDF is uploaded to KDP via the official API (or saved to an S3 bucket for manual review).  

**Key Components**  
- `kdp_factory/generators/` – Module containing each puzzle type as a subclass of `BasePuzzle`.  
- `kdp_factory/layout/` – ReportLab‑based page builder with support for multi‑column layouts.  
- `kdp_factory/validation.py` – Calls into the shared QC service and adds KDP‑specific rules (e.g., no RGB images).  

### 3. Copy Factory  
**Purpose** – Generate conversion‑focused short‑form copy: landing page headlines, email sequences, ad copy, and social media captions.  

**Inputs**  
- Product or service description (markdown or plain text).  
- Target audience personas (JSON).  
- Desired tone and call‑to‑action type.  

**Pipeline**  
1. **Brief Enrichment** – The LLM router expands the brief with benefit statements, pain points, and differentiators.  
2. **Variant Generation** – A prompt template requests *N* variations of each copy element (e.g., five headline options, three email subject lines). Temperature and top‑p settings are varied per batch to encourage diversity.  
3. **A/B Scoring** – Each variant is passed to a lightweight scoring model (a fine‑tuned DistilBERT hosted on Ollama) that predicts click‑through or conversion likelihood based on historical performance data stored in Postgres.  
4. **Human‑in‑the‑Loop Review** – Variants above a confidence threshold are auto‑approved; lower‑scoring items are routed to a review queue where a copy editor can edit or reject them.  
5. **Delivery** – Approved copy is exported to the requested format (CSV for ad platforms, HTML snippets for landing pages, or JSON for email automation tools) and optionally pushed via webhook to a CRM.  

**Key Components**  
- `copy_factory/prompts.py` – Centralized prompt library with version control.  
- `copy_factory/scoring/` – Wrapper around the Ollama‑served scoring model.  
- `copy_factory/review/` – Simple Flask‑based UI for manual validation, backed by Redis for task state.  

### 4. Fanvue Factory  
**Purpose** – Produce stylized images and image sequences using a ComfyUI‑driven node graph, suitable for social media, advertising, or editorial use.  

**Inputs**  
- Text prompt (or batch of prompts).  
- Optional reference images or style guides.  
- Generation parameters: seed, steps, CFG scale, sampler.  

**Pipeline**  
1. **Prompt Pre‑Processing** – Tokens are sanitized and optionally expanded with synonyms via a thesaurus lookup stored in Qdrant.  
2. **Graph Execution** – A pre‑defined ComfyUI workflow (exported as JSON) is loaded; the prompt and parameters are injected into the appropriate nodes (e.g., CLIP Text Encoder, KSampler, VAE Decoder).  
3. **Post‑Processing** – Output images undergo optional upscaling (using an ESRGAN model hosted on Ollama), color correction, and watermark embedding.  
4. **Quality Control** – A shared QC service runs NSFW detection (via a lightweight OpenCV‑based classifier) and checks for artifacts such as blurry regions or banding.  
5. **Asset Storage** – Approved images are written to an object store (MinIO/S3) with metadata (prompt, seed, generation time) indexed in Qdrant for retrieval and reuse.  

**Key Components**  
- `fanvue_factory/workflow.json` – Baseline ComfyUI graph; can be versioned per campaign.  
- `fanvue_factory/client.py` – Thin wrapper around the ComfyUI API (HTTP) that handles async job submission and result polling.  
- `fanvue_factory/upscaler/` – Ollama‑served model wrapper for 2× or 4× upscaling.  

### 5. Clipping Factory  
**Purpose** – Create short‑form video clips (TikTok, Reels, YouTube Shorts) from longer source material or generated scenes.  

**Inputs**  
- Source video URL or local file (mp4, mov).  
- Optional transcript or subtitles.  
- Clip specifications: target duration, aspect ratio, start/end time offsets, text overlay templates.  

**Pipeline**  
1. **Ingest** – `yt-dlp` (or FFmpeg for local files) downloads the source to a temporary workspace.  
2. **Speech‑to‑Text** – If no transcript is supplied, Whisper (running via Ollama) generates a timestamped transcript.  
3. **Scene Detection** – A shot‑boundary algorithm (PySceneDetect) identifies candidate segments that satisfy semantic coherence (e.g., a complete sentence or action).  
4. **Clip Assembly** – FFmpeg extracts the segment, applies vertical cropping/resizing to 9:16, adds burnt‑in captions from the transcript, and optionally inserts a branded outro.  
5. **Quality Control** – The shared QC service validates: video bitrate, audio loudness (EBU R128), absence of copyrighted audio (via audio fingerprinting against a local database), and proper aspect ratio.  
6. **Publish** – Clips are uploaded to target platforms via their respective APIs (TikTok, Instagram, YouTube) or stored in a CDN for later distribution.  

**Key Components**  
- `clipping_factory/ingest.py` – Handles `yt-dlp` options and fallback to local file copy.  
- `clipping_factory/transcribe.py` – Ollama‑based Whisper wrapper with language detection.  
- `clipping_factory/overlay/` – FFmpeg filter complexes for text styling and animation.  
- `clipping_factory/publish/` – Thin clients for each platform’s upload endpoint, using OAuth2 tokens stored in Vault.  

### 6. Fiverr Factory  
**Purpose** – Automate the fulfillment of micro‑services offered on marketplaces such as Fiverr, Upwork, or custom client portals.  

**Inputs**  
- Order payload (service type, requirements, attached files).  
- Seller‑specific configuration: preferred tools, turnaround time, pricing tiers.  

**Pipeline**  
1. **Order Parsing** – The incoming webhook payload is validated against a JSON schema; missing fields trigger automated clarification messages to the buyer.  
2. **Task Routing** – Based on service type, the order is dispatched to the appropriate factory (e.g., a logo request goes to Fanvue Factory, a blog post to SEO Factory).  
3. **Execution** – The selected factory runs its standard pipeline, with additional metadata (order ID, buyer notes) injected into the prompt or configuration.  
4. **Delivery & Notification** – Upon completion, the output files are uploaded to a secure storage bucket; a presigned URL is generated and sent to the buyer via the marketplace’s messaging API or email.  
5. **Financial Ledger Update** – The shared ledger service records revenue, platform fees, and applicable taxes, enabling real‑time payout reconciliation.  

**Key Components**  
- `fiverr_factory/webhook.py` – FastAPI endpoint that verifies signatures (HMAC‑SHA256) and enqueues tasks.  
- `fiverr_factory/mapper.py` – Mapping from marketplace service IDs to internal factory identifiers.  
- `fiverr_factory/ledger_integration.py` – Calls the shared financial ledger to debit/credit accounts.  

## Core Architecture

While each factory operates autonomously, they rely on a set of shared, horizontally scalable services that provide cross‑cutting concerns. The architecture follows a microservices‑style, event‑driven model built around asynchronous task queues.

### LLM Routing (OpenRouter + Ollama)  
- **OpenRouter** acts as a fallback and load‑balancer for commercial LLM APIs (e.g., GPT‑4, Claude). Requests are forwarded when the local Ollama pool cannot meet latency or throughput requirements.  
- **Ollama** hosts locally quantized models (Llama 2, Mistral, CodeLlama) for low‑latency, cost‑free inference. Each factory can specify a preferred model family via a routing table (`llm_router/config.yaml`).  
- The router exposes a uniform `/v1/chat/completions` endpoint, enabling factories to treat LLM calls as a black box irrespective of the underlying provider.

### Quality Control (QC)  
The QC service is a pluggable pipeline of validators:  
1. **Format Validators** – JSON schema, markdown lint, image dimension checks.  
2. **Content Validators** – Profanity filters, plagiarism detection (MinHash LSH), factual consistency (via retrieval‑augmented generation against a trusted knowledge base).  
3. **Business Rule Validators** – SEO score thresholds, KDP compliance, brand guideline checks.  
Each validator returns a pass/fail status and an optional remediation suggestion. Factories can enable/disable validators via feature flags without redeploying.

### Financial Ledger  
A double‑entry ledger implemented with PostgreSQL stores every economic event:  
- **Credit** – Revenue from completed orders, ad‑share, or subscription fees.  
- **Debit** – Cost of API calls (OpenRouter usage), GPU hours (Ollama), storage, and third‑party fees.  
The ledger provides real‑time balances per factory, per client, and globally. Periodic settlement jobs generate CSV reports compatible with accounting software (QuickBooks, Xero).  

### Queue Management  
- **Message Broker** – Redis Streams (or Apache Kafka for higher throughput) holds tasks as immutable records.  
- **Workers** – Stateless Python consumers (`factory_worker.py`) pull tasks, execute the factory‑specific pipeline, and publish results to a downstream stream (e.g., `completed.seo`).  
- **Prioritization** – Tasks carry a priority field; the broker respects ordering, enabling rush orders or paid‑tier services to jump the queue.  
- **Visibility Timeout & Dead‑Letter Queues** – Prevent worker starvation and capture repeatedly failing tasks for manual inspection.

### Observability & Reliability  
- **Logging** – Structured JSON logs emitted to Loki via Promtail; each log includes trace IDs propagated through OpenTelemetry.  
- **Metrics** – Prometheus exporters expose counters (tasks processed, LLM token usage), gauges (queue depth, worker latency), and histograms (response times).  
- **Tracing** – Jaeger integrates with the FastAPI instrumentation to trace a request from webhook receipt through LLM calls, QC, and storage.  
- **Circuit Breaker** – The LLM router incorporates a hysteresis‑based breaker to temporarily disable a failing provider and avoid cascading latency spikes.  

### Deployment Model  
All services are containerized with Docker and orchestrated by Kubernetes (or Docker Swarm for smaller installations). Helm charts encapsulate each factory and the shared services, allowing independent version upgrades. Persistent storage for model checkpoints, vector indexes, and user uploads is provisioned via CSI‑compatible volumes (e.g., AWS EBS, GCP PD). Secrets (API keys, DB credentials) are injected through HashiCorp Vault or Kubernetes Secrets, never baked into images.

## Tech Stack

The system deliberately chooses mature, open‑source components that can be run on‑premises or in a public cloud, minimizing vendor lock‑in while preserving the ability to leverage proprietary APIs when advantageous.

| Layer | Technology | Role |
|-------|------------|------|
| **Language** | Python 3.11+ | Core implementation language; extensive ecosystem for ML, data processing, and web services. |
| **API Framework** | FastAPI | Provides high‑performance asynchronous HTTP endpoints with automatic OpenAPI documentation. |
| **LLM Inference** | Ollama (local) + OpenRouter (remote) | Ollama serves quantized LLMs on GPU/CPU; OpenRouter offers fail‑over to commercial models. |
| **Vector Store** | Qdrant | Stores embeddings for semantic search, deduplication, and retrieval‑augmented generation. |
| **Image Generation** | ComfyUI | Node‑based UI for Stable Diffusion workflows; accessed via its REST API for headless operation. |
| **Video Handling** | yt-dlp, FFmpeg | Download source media and perform transcoding, clipping, and filter operations. |
| **Speech‑to‑Text** | Whisper (via Ollama) | Generates accurate timestamps transcripts for video clipping and subtitle creation. |
| **Model Coordination Protocol** | MCP (Model Context Protocol) | Defines a lightweight, language‑agnostic RPC for chaining model calls, sharing context (e.g., conversation history, retrieved documents), and managing model lifecycle. |
| **Messaging** | Redis Streams (primary) / Apache Kafka (optional) | Durable task queuing with consumer groups for horizontal scaling. |
| **Database** | PostgreSQL (financial ledger, metadata) | ACID‑compliant store for ledger entries, user accounts, and factory configuration. |
| **Object Store** | MinIO (S3‑compatible) | Stores generated assets (articles, PDFs, images, video clips) with fine‑grained access policies. |
| **Observability** | Prometheus, Grafana, Loki, Jaeger | Metrics collection, visualization, log aggregation, and distributed tracing. |
| **Secrets Management** | HashiCorp Vault (or Kubernetes Secrets) | Secure injection of API keys, database passwords, and signing tokens. |
| **Container Orchestration** | Kubernetes (with Helm charts) | Declarative deployment, scaling, and self‑healing of all services. |
| **Infrastructure as Code** | Terraform / Pulumi | Provisioning of cloud resources (VPC, subnets, IAM roles, managed databases) in a repeatable manner. |

### Rationale for Choices  

- **Python** offers unparalleled libraries for natural language processing (spaCy, transformers), audio/video (FFmpeg‑python, librosa), and scientific computing (NumPy, Pandas). Its asyncio support aligns well with FastAPI’s non‑blocking design.  
- **FastAPI** leverages Starlette and Pydantic to deliver automatic data validation, serialization, and interactive docs, reducing boilerplate while maintaining high throughput (thanks to ASGI).  
- **Ollama** enables local execution of LLMs without reliance on external API keys, crucial for cost‑sensitive or air‑gapped environments. The fallback to OpenRouter guarantees continuity when local resources are saturated.  
- **Qdrant** provides real‑time vector similarity search with horizontal scaling, filtering, and payload storage—ideal for retrieving relevant snippets for SEO articles or checking plagiarism.  
- **ComfyUI** separates the image generation workflow from code, allowing artists to adjust pipelines via a GUI while the factory programmatically drives the same graph via API calls.  
- **yt-dlp** and **FFmpeg** are de‑facto standards for downloading and manipulating media; both are actively maintained and support a vast array of codecs and containers.  
- **Whisper** offers robust multilingual speech recognition, enabling the Clipping Factory to operate without pre‑supplied transcripts.  
- **MCP** standardizes how factories exchange context (e.g., a retrieved article summary passed to a copywriting model) and how they request specific model capabilities, fostering reuse and reducing duplicated integration code.  
- **Redis Streams** give low‑latency, persistent queuing with built-in consumer group semantics, making it straightforward to scale workers up or down based on backlog depth.  
- **PostgreSQL** guarantees transactional integrity for the ledger, a critical requirement for accurate financial reporting.  
- **MinIO** offers an S3‑compatible API that can be swapped with any cloud object store without code changes.  
- **Observability stack** (Prometheus/Grafana/Loki/Jaeger) is industry‑standard for monitoring micro‑service health, diagnosing latency spikes, and auditing QC failures.  
- **Vault** ensures that secrets are never persisted in container images or source control, complying with security best practices.  
- **Kubernetes & Helm** provide declarative scaling, rolling updates, and rollback capabilities; Helm charts enable each factory to be versioned independently.  
- **Terraform/Pulumi** allow the entire infrastructure to be codified, reviewed, and reproduced across environments (dev, staging, prod).  

---

By adhering to this modular architecture, ContentFactory can scale each content vertical independently, introduce new factories with minimal friction, and maintain a uniform standard of quality, traceability, and financial accountability across all generated output. The system is production‑ready today, leveraging battle‑tested open‑source components while retaining the flexibility to incorporate emerging models or services as they become available.