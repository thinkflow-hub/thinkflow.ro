---
title: "AWS to Hetzner GPU Migration: 2026 Costs & Benchmarks"
description: "Move AI inference off AWS GPU: 2026 cost benchmarks, P95 latency tables, Terraform migration roadmap. Full stack $2,745/mo down to $377/mo on Hetzner GEX44."
date: "2026-07-08"
category: "Cloud Hosting"
tags: [aws, hetzner, cloud-migration, gpu, llm, inference, cost-optimization]
affiliatePrograms: [Hetzner, DigitalOcean]
image: "/api/og?title=AWS+to+Hetzner+GPU&logos=hetzner,digitalocean&category=Cloud+Hosting&tags=aws,gpu,llm"
---

# Moving AI Inference from AWS GPU to Hetzner Bare Metal

The AWS bill landed on a Tuesday: **$1,340** for the month. NAT gateways and cross-AZ transfer were noise. The line item that triggered the audit was a `p3.2xlarge` running Llama inference at 11% average GPU utilization — billed at $3.06/hour whether the model was serving traffic or idle at 3am.

That was when the cloud bill stopped being infrastructure and became **margin leakage**.

Fourteen months later, the same inference workload runs on a <a href="https://www.hetzner.com/?ref=thinkflow" rel="sponsored nofollow">Hetzner GEX44</a> in Falkenstein. GPU compute: **€232/month** (~$272 at mid-2026 rates). Same model family, same API contract, P95 latency down from 890ms to 390ms for European users. S3, SES, and CloudFront stayed on AWS — hybrid, not ideological.

Below: July 2026 pricing after Hetzner's June cloud adjustment, GPU comparisons against AWS p3/p4/g5, a phased migration with Terraform and Docker, production benchmarks, and a decision framework for when AWS still earns its premium.

---

## Cost Benchmark: AWS vs Hetzner (July 2026)

Pricing checked July 2026. AWS figures are on-demand, **us-east-1**, Linux. Hetzner figures are monthly, **excl. VAT**, from the [June 2026 price list](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/). GPU dedicated server rates (GEX line) were unchanged in that adjustment; cloud VPS rates increased ~35%.

### The inference stack we migrated

| Component | AWS (before) | Hetzner (after) |
|---|---|---|
| GPU inference (Llama 3.1 8B, vLLM) | EC2 `p3.2xlarge` | GEX44 dedicated |
| API gateway + routing | ALB + NAT Gateway | Hetzner Load Balancer + private network |
| Embedding service (CPU) | `c6i.xlarge` | CX43 cloud VPS |
| Vector DB (Qdrant) | Self-hosted on `r6i.large` | CX53 cloud VPS |
| Object storage | S3 | S3 (kept on AWS) |
| Email | SES | SES (kept on AWS) |
| Staging environment | `g5.xlarge` (dev GPU testing) | <a href="https://www.digitalocean.com/?ref=thinkflow" rel="sponsored nofollow">DigitalOcean</a> GPU Droplet (hourly) |

### Monthly cost breakdown

**AWS setup (always-on inference, eu-central-1):**

| Service | Spec | Monthly Cost |
|---|---|---|
| EC2 `p3.2xlarge` (1× V100 16GB) | 8 vCPU, 61 GB RAM | $2,234 |
| EC2 `c6i.xlarge` (embeddings) | 4 vCPU, 8 GB | $124 |
| EC2 `r6i.large` (Qdrant) | 2 vCPU, 16 GB | $91 |
| NAT Gateway + cross-AZ transfer | — | $142 |
| ALB | — | $35 |
| EBS (800 GB gp3) | — | $64 |
| CloudWatch + misc | — | $31 |
| S3 + SES | — | $24 |
| **Total** | | **~$2,745 / month** |

The `p3.2xlarge` alone is 81% of compute spend. It was chosen in early 2025 because p3 was the only GPU family with available capacity in eu-central-1 without a 6-week quota request.

**Hetzner setup (after migration):**

| Service | Spec | Monthly Cost |
|---|---|---|
| GEX44 dedicated GPU | RTX 4000 SFF Ada, 20 GB VRAM, 64 GB RAM | €232 (~$272) |
| CX43 cloud VPS | 8 vCPU, 16 GB — embeddings | €16 (~$19) |
| CX53 cloud VPS | 16 vCPU, 32 GB — Qdrant | €29 (~$34) |
| Hetzner Load Balancer | — | €7 (~$8) |
| S3 + SES (kept on AWS) | — | $24 |
| Cloudflare Pro (CDN, replaces CloudFront for API) | — | $20 |
| **Total** | | **~$377 / month** |

**Monthly savings: ~$2,368. Annual: ~$28,416.**

That is not a rounding error. It is a senior engineer's fully loaded salary in most EU markets.

### Cost per always-on GPU hour (normalized)

| Provider | Instance | GPU | VRAM | $/hour (24/7) | $/month (730 hrs) |
|---|---|---|---|---|---|
| AWS | `g4dn.xlarge` | 1× T4 | 16 GB | $0.53 | $387 |
| AWS | `g5.xlarge` | 1× A10G | 24 GB | $1.01 | $734 |
| AWS | `g5.2xlarge` | 1× A10G | 24 GB | $1.21 | $884 |
| AWS | `p3.2xlarge` | 1× V100 | 16 GB | $3.06 | $2,234 |
| AWS | `p3.8xlarge` | 4× V100 | 64 GB | $12.24 | $8,935 |
| AWS | `p4d.24xlarge` | 8× A100 | 320 GB | $32.77 | $23,922 |
| Hetzner | GEX44 | 1× RTX 4000 Ada | 20 GB | $0.37 | $272 |
| Hetzner | GEX131-1 | 1× RTX PRO 6000 Blackwell | 96 GB | $1.91 | $1,397 |

The GEX44 at $272/month delivers comparable VRAM to `g5.xlarge` (24 GB) and outperforms `g4dn.xlarge` on inference throughput for modern models — at **37% of the AWS cost**.

For 70B+ model serving, GEX131-1 at ~$1,397/month compares against `p4d.24xlarge` at $23,922/month. Multi-GPU tensor parallelism is gone, but for single-model inference with 4-bit quantization, one 96 GB Blackwell GPU covers most production RAG and chat workloads.

---

## GPU Instance Comparison: AWS p3/p4 vs Hetzner GEX

Do not compare p4d to GEX44 — that is a category error. Compare **workload requirements to hardware capabilities**.

### Spec matrix

| | AWS `p3.2xlarge` | AWS `g5.2xlarge` | AWS `p4d.24xlarge` | Hetzner GEX44 | Hetzner GEX131-1 |
|---|---|---|---|---|---|
| **GPU** | 1× V100 | 1× A10G | 8× A100 40GB | 1× RTX 4000 Ada | 1× RTX PRO 6000 Blackwell |
| **VRAM** | 16 GB | 24 GB | 320 GB | 20 GB | 96 GB |
| **Tensor cores** | 640 (gen 1) | 3,328 (gen 3) | 49,152 (gen 3) | 192 (gen 4) | 5th-gen Tensor |
| **System RAM** | 61 GB | 32 GB | 1,152 GB | 64 GB | 256 GB |
| **Storage** | EBS (extra $) | EBS (extra $) | 8 TB NVMe local | 2× 1.92 TB NVMe | 2× 960 GB NVMe |
| **Network** | Up to 10 Gbps | Up to 10 Gbps | 400 Gbps | 1 Gbps | 1 Gbps |
| **On-demand $/hr** | $3.06 | $1.21 | $32.77 | ~$0.37 (flat) | ~$1.91 (flat) |
| **Spot $/hr** | ~$0.90 | ~$0.36 | ~$9.83–16.38 | N/A | N/A |
| **Best for** | Legacy workloads | Single-GPU inference | Training, 70B+ FP16 | 7B–32B inference | 70B inference, fine-tuning |

### What actually matters for LLM inference

**VRAM is the hard constraint.** A Llama 3.1 8B model at FP16 needs ~16 GB. At INT4 with KV cache headroom, ~10 GB. GEX44's 20 GB handles 8B–14B models comfortably with batching. At 32B, aggressive quantization or GEX131 is required.

**Tensor core generation beats raw CUDA cores for transformer inference.** The RTX 4000 Ada (GEX44) is two architecture generations ahead of V100 (p3). In our tests, GEX44 served Llama 3.1 8B **2.4× faster** than p3.2xlarge despite similar VRAM — the p3 premium was paying for 2017 silicon.

**Network bandwidth rarely bottlenecks inference.** Token generation is GPU-bound, not network-bound. Hetzner's 1 Gbps is sufficient for API serving up to ~500 concurrent streaming connections. Where AWS wins: multi-region active-active with 400 Gbps intra-cluster for distributed training.

**Spot instances change the AWS math — but only if your workload tolerates interruption.** `g5.2xlarge` spot at ~$0.36/hr (~$263/month) approaches Hetzner pricing. But spot capacity for GPU instances in eu-central-1 was interrupted 4 times in our 90-day monitoring window. For user-facing inference APIs, that is unacceptable without a warm standby — which doubles cost and complexity.

### When p4 still makes sense

- **Multi-GPU tensor parallelism** for 70B+ models at FP16 without quantization
- **Fine-tuning** with large batch sizes across 8× A100
- **Burst training** — spin up for 48 hours, fine-tune, terminate
- **Compliance**: HIPAA BAA, FedRAMP, SOC 2 Type II with AWS-native audit trails

For steady-state inference — which is what 80% of "AI products" actually run — dedicated bare metal wins on unit economics.

---

## Migration Roadmap: Step by Step

This is not "lift and shift." It is a phased cutover with rollback at every stage.

### Phase 0: Inventory and baseline (Week 1)

Before touching infrastructure, capture the current baseline:

```bash
# On AWS inference instance — baseline GPU metrics
nvidia-smi dmon -s pucvmet -d 5 -c 720 > gpu_baseline.log

# vLLM / TGI benchmark (adjust model path)
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --dtype auto &

# Run throughput test
vllm bench serve \
  --backend vllm \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --dataset-name random \
  --num-prompts 500 \
  --request-rate 10
```

Record tokens/second (P50/P95), time-to-first-token (TTFT), GPU memory utilization, and requests/minute at saturation. Without a baseline, there is no proof the migration worked.

### Phase 1: Provision Hetzner infrastructure (Week 1–2)

Order GEX44 via <a href="https://www.hetzner.com/?ref=thinkflow" rel="sponsored nofollow">Hetzner Robot</a>. Setup fee: €114 one-time. Delivery: typically 24–72 hours for GEX44 in FSN1. GEX131 can have waitlists — order early.

**Terraform — Hetzner cloud resources (load balancer, VPS for Qdrant/embeddings):**

```hcl
terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_network" "ai_infra" {
  name     = "ai-inference"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "ai_subnet" {
  network_id   = hcloud_network.ai_infra.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}

resource "hcloud_server" "qdrant" {
  name        = "qdrant-prod"
  server_type = "cx53"
  image       = "docker-ce"
  location    = "fsn1"
  network {
    network_id = hcloud_network.ai_infra.id
    ip         = "10.0.1.10"
  }
}

resource "hcloud_server" "embeddings" {
  name        = "embeddings-prod"
  server_type = "cx43"
  image       = "docker-ce"
  location    = "fsn1"
  network {
    network_id = hcloud_network.ai_infra.id
    ip         = "10.0.1.11"
  }
}

resource "hcloud_load_balancer" "inference" {
  name               = "inference-lb"
  load_balancer_type = "lb11"
  location           = "fsn1"
}

resource "hcloud_load_balancer_service" "vllm" {
  load_balancer_id = hcloud_load_balancer.inference.id
  protocol         = "http"
  listen_port      = 443
  destination_port = 8000

  health_check {
    protocol = "http"
    port     = 8000
    interval = 10
    timeout  = 5
    retries  = 3
    http {
      path         = "/health"
      status_codes = ["200"]
    }
  }
}
```

The GEX44 itself is provisioned through Hetzner Robot (dedicated servers are not yet in the `hcloud` Terraform provider). Use cloud-init or Ansible for GPU server configuration — keep it identical to the AWS configuration.

### Phase 2: Containerize the inference stack (Week 2)

```dockerfile
# Dockerfile.vllm
FROM vllm/vllm-openai:v0.8.5

ENV MODEL_NAME=meta-llama/Llama-3.1-8B-Instruct
ENV GPU_MEMORY_UTILIZATION=0.90
ENV MAX_MODEL_LEN=8192
ENV TENSOR_PARALLEL_SIZE=1

EXPOSE 8000

CMD ["--model", "${MODEL_NAME}", \
     "--gpu-memory-utilization", "${GPU_MEMORY_UTILIZATION}", \
     "--max-model-len", "${MAX_MODEL_LEN}", \
     "--dtype", "auto", \
     "--enable-prefix-caching"]
```

```yaml
# docker-compose.prod.yml
services:
  vllm:
    build:
      context: .
      dockerfile: Dockerfile.vllm
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    ports:
      - "8000:8000"
    volumes:
      - model_cache:/root/.cache/huggingface
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:1.27-alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/inference.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      vllm:
        condition: service_healthy

volumes:
  model_cache:
```

Install NVIDIA drivers on the GEX44 via Hetzner's installimage or manual setup:

```bash
# Verify GPU after provisioning
nvidia-smi

# Install Docker + NVIDIA Container Toolkit
curl -fsSL https://get.docker.com | sh
distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
apt-get update && apt-get install -y nvidia-container-toolkit
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

### Phase 3: Parallel run and validation (Week 3)

Run both endpoints simultaneously. Route 10% of production traffic to Hetzner via weighted DNS or application-level feature flag:

```python
# Traffic split during validation
import os
import random

HETZNER_ENDPOINT = os.environ["HETZNER_INFERENCE_URL"]
AWS_ENDPOINT = os.environ["AWS_INFERENCE_URL"]
HETZNER_WEIGHT = float(os.environ.get("HETZNER_TRAFFIC_WEIGHT", "0.10"))

def get_inference_endpoint() -> str:
    if random.random() < HETZNER_WEIGHT:
        return HETZNER_ENDPOINT
    return AWS_ENDPOINT
```

Compare error rates, P95 latency, and token throughput for 7 days minimum. Do not cut over on cost projections alone — validate production behavior.

### Phase 4: Cutover and decommission (Week 4)

1. Shift DNS/load balancer weights: 10% → 50% → 100% over 72 hours
2. Snapshot EBS volumes and export model artifacts to S3 (keep as rollback)
3. Terminate AWS GPU instances after 14-day rollback window
4. Downgrade or remove NAT Gateway if no remaining AWS compute depends on it
5. Update CI/CD pipelines to deploy to Hetzner via SSH or self-hosted GitHub Actions runner

**Rollback plan:** Keep the AWS AMI and launch template for 30 days. Weighted DNS flip back to AWS takes under 5 minutes if Hetzner hardware fails.

---

## Performance Benchmarks: Latency, Throughput, Cost per 1M Tokens

All benchmarks run July 2026, same model (`meta-llama/Llama-3.1-8B-Instruct`), same vLLM version (0.8.5), batch size 256, max sequence length 8192. Client location: Frankfurt. Load: 50 concurrent users, random prompt lengths 128–2048 tokens.

### Latency

| Metric | AWS `p3.2xlarge` | AWS `g5.2xlarge` | Hetzner GEX44 |
|---|---|---|---|
| TTFT P50 | 142 ms | 89 ms | 76 ms |
| TTFT P95 | 310 ms | 178 ms | 145 ms |
| TTFT P99 | 520 ms | 290 ms | 240 ms |
| Inter-token latency P50 | 18 ms | 12 ms | 11 ms |
| End-to-end (512 token response) P50 | 9.8 s | 6.4 s | 5.9 s |
| End-to-end P95 | 14.2 s | 8.9 s | 8.1 s |

GEX44 wins on every latency percentile vs p3 — expected given Ada Lovelace vs Volta. Against `g5.2xlarge`, GEX44 is slightly faster on TTFT, roughly equivalent on sustained generation. The latency advantage for EU users comes partly from **eliminating NAT Gateway overhead** and co-locating inference with the API layer in Falkenstein.

### Throughput

| Metric | AWS `p3.2xlarge` | AWS `g5.2xlarge` | Hetzner GEX44 |
|---|---|---|---|
| Max tokens/sec (single stream) | 52 | 78 | 84 |
| Max tokens/sec (50 concurrent) | 680 | 1,120 | 1,240 |
| Max requests/min (saturated) | 42 | 68 | 74 |
| GPU utilization at saturation | 94% | 91% | 88% |
| Power draw at saturation | 250W | 195W | 140W |

At 50 concurrent streams, GEX44 delivers **1.8× the throughput of p3.2xlarge** at 12% of the cost.

### Cost per 1M tokens

Calculation: `(monthly_instance_cost) / (monthly_tokens_served)`. Assumes 70% average GPU utilization over 730 hours/month.

| Setup | Monthly cost | Tokens/month (est.) | Cost per 1M tokens |
|---|---|---|---|
| AWS `p3.2xlarge` | $2,234 | 890M | **$2.51** |
| AWS `g5.2xlarge` | $884 | 1.47B | **$0.60** |
| AWS `g5.2xlarge` (spot) | $263 | 1.47B | **$0.18** |
| Hetzner GEX44 | $272 | 1.63B | **$0.17** |
| Hetzner GEX44 + CX43 + CX53 + LB | $377 | 1.63B | **$0.23** (full stack) |

At production volume (~1.6B tokens/month), the full Hetzner stack costs **$0.23 per 1M tokens** all-in — including embeddings and vector search infrastructure. AWS p3 was **$2.51 per 1M tokens**, an 11× difference.

For context: OpenAI GPT-4o API pricing is ~$2.50–10.00 per 1M output tokens. Self-hosted inference on Hetzner brings marginal cost below $0.25 per 1M tokens — self-hosting breaks even against managed APIs above ~200M tokens/month.

### Embedding service benchmark (CPU, CX43 vs c6i.xlarge)

| Metric | AWS `c6i.xlarge` | Hetzner CX43 |
|---|---|---|
| `nomic-embed-text` docs/sec | 48 | 52 |
| P95 batch latency (32 docs) | 680 ms | 610 ms |
| Monthly cost | $124 | $19 |

Embedding workloads are CPU-bound. Hetzner cloud VPS at post-June-2026 pricing still undercuts AWS by 85% with comparable performance.

---

## Decision Framework for 2026

Cloud provider choice is not identity. Run the workload through this:

```
Are you serving user-facing inference with predictable traffic?
  YES → Hetzner GEX44/GEX131 (bare metal, flat pricing)
  NO  → Continue

Do you need multi-GPU training or FP16 70B+ without quantization?
  YES → AWS p4d/p5 (burst) or CoreWeave/Lambda (cheaper GPU cloud)
  NO  → Continue

Is your workload interruption-tolerant (batch, offline, internal tools)?
  YES → AWS g5 spot instances (approaches Hetzner pricing)
  NO  → Continue

Do you need sub-50ms latency for US East users?
  YES → AWS us-east-1 or a US provider — Hetzner adds 80–120ms transatlantic
  NO  → Continue

Do you require HIPAA BAA, FedRAMP, or SOC 2 with AWS-native audit?
  YES → AWS (or GCP/Azure with equivalent compliance)
  NO  → Continue

Is your monthly inference spend over $500 on AWS GPU instances?
  YES → Migration ROI exceeds 2 weeks of engineering time — do it
  NO  → Stay on AWS spot or managed API until volume justifies ops overhead

Are you running steady-state inference above 200M tokens/month?
  YES → Self-hosted Hetzner breaks even vs OpenAI/Anthropic API in month 1
  NO  → Managed API is cheaper when you factor in engineering time
```

### When AWS still wins in 2026

- **S3** — still nothing cheaper at scale for object storage. Keep it.
- **SageMaker for experimentation** — managed notebooks, experiment tracking, one-click deployment for data science teams without DevOps
- **Multi-region active-active** — AWS Global Accelerator + regional GPU pools for <100ms worldwide
- **Burst training** — spin up p4d for 48 hours, fine-tune, terminate. Paying $32.77/hr for 2 days beats owning hardware used twice a month
- **Managed inference (Bedrock)** — if your team has zero GPU ops capacity and volume is under 50M tokens/month
- **Spot + auto-scaling for batch** — nightly embedding jobs, document processing, eval runs

### When Hetzner wins in 2026

- **Steady-state inference** — chatbots, RAG APIs, code completion, internal copilots
- **European user base** — Falkenstein/Nuremberg/Helsinki DCs with GDPR by default
- **Cost-predictable scaling** — flat monthly rate, no billing surprises from egress or NAT
- **Single-GPU models up to 32B** — GEX44 covers the sweet spot for most production deployments
- **70B inference with quantization** — GEX131 at $1,397/month vs $23,922/month for p4d

For staging and CI GPU tests without committing to dedicated hardware, a <a href="https://www.digitalocean.com/?ref=thinkflow" rel="sponsored nofollow">DigitalOcean GPU Droplet</a> on hourly billing fills the gap — spin up for integration tests, destroy after.

---

## What We Kept on AWS

The migration was incremental, not ideological:

- **S3** for model artifacts, training data, and user uploads
- **SES** for transactional email ($0.10/1K emails, managed deliverability)
- **CloudFront** for static marketing site assets (the Next.js apps moved to Hetzner + Cloudflare)

Hybrid cloud is not a compromise. It is engineering pragmatism — use each provider where its unit economics and operational model fit.

---

## The Bottom Line

AWS GPU instances are priced for flexibility: spin up, scale out, tear down. That model is correct for training bursts and unpredictable workloads. It is **wrong for inference that runs 24/7 at predictable volume**.

In July 2026, a Hetzner GEX44 at €232/month delivers better inference performance than a p3.2xlarge at $2,234/month. The gap is not 10%. It is an order of magnitude. Add the supporting infrastructure — embeddings, vector DB, load balancer — and the full stack still costs **$377/month vs $2,745 on AWS**.

The migration is not free. It costs 3–4 weeks of engineering time, requires Docker/Terraform discipline, and demands a rollback plan. At $28K/year in savings, ROI pays back in under two weeks.

If the AWS GPU line item on the monthly bill looks familiar, [let's talk](https://thinkflow.ro/contact) — we deploy this stack for teams that need it running in production, not in a slide deck.
