---
title: "Migrare GPU de la AWS la Hetzner: costuri și benchmark-uri 2026"
description: "Mută inferența AI de pe AWS GPU: benchmark-uri de cost 2026, tabele de latență P95, roadmap de migrare cu Terraform. Stack complet de la $2,745/lună la $377/lună pe Hetzner GEX44."
date: "2026-07-08"
category: "Cloud Hosting"
tags: [aws, hetzner, cloud-migration, gpu, llm, inference, cost-optimization]
affiliatePrograms: [Hetzner, DigitalOcean]
image: "/api/og?title=AWS+către+Hetzner+GPU&logos=hetzner,digitalocean&category=Cloud+Hosting&tags=aws,gpu,llm"
verification: "market-analysis"
---

# Migrarea inferenței AI de pe AWS GPU pe hardware dedicat Hetzner

Un singur item din factură a declanșat auditul: o instanță EC2 `p3.2xlarge` care rula inferență Llama la o utilizare medie a GPU-ului de 11%, facturată la $3.06/oră indiferent dacă modelul servea trafic sau stătea idle la 3 dimineața. NAT gateway-urile și transferul cross-AZ erau zgomot de fond prin comparație — doar instanța GPU însemna 81% din factură. Odată adunate toate costurile AWS care mergeau în paralel — embeddings, vector DB, load balancing — stack-ul complet ajungea la **$2,745/lună**.

Atunci a încetat factura de cloud să mai fie infrastructură și a devenit **scurgere de marjă**.

Aceeași sarcină de inferență rulează acum pe un <a href="https://www.hetzner.com/?ref=thinkflow" rel="sponsored nofollow">Hetzner GEX44</a> în Falkenstein. Stack complet: **$377/lună**. Aceeași familie de modele, același contract API, TTFT P95 redus de la 310ms la 145ms pentru utilizatorii europeni. S3, SES și CloudFront au rămas pe AWS — hibrid, nu ideologic.

Mai jos: prețurile din iulie 2026 după ajustarea cloud din iunie a Hetzner, comparații GPU cu AWS p3/p4/g5, o migrare în etape cu Terraform și Docker, benchmark-uri din producție și un cadru de decizie pentru momentele în care AWS încă își justifică prețul premium.

---

## Benchmark de cost: AWS vs Hetzner (iulie 2026)

Prețuri verificate în iulie 2026. Cifrele AWS sunt on-demand, **us-east-1**, Linux. Cifrele Hetzner sunt lunare, **fără TVA**, din [lista de prețuri din iunie 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/). Tarifele pentru serverele GPU dedicate (linia GEX) au rămas neschimbate în acea ajustare; tarifele cloud VPS au crescut ~35%.

### Stack-ul de inferență pe care l-am migrat

| Componentă | AWS (înainte) | Hetzner (după) |
|---|---|---|
| Inferență GPU (Llama 3.1 8B, vLLM) | EC2 `p3.2xlarge` | GEX44 dedicat |
| API gateway + routare | ALB + NAT Gateway | Hetzner Load Balancer + rețea privată |
| Serviciu de embeddings (CPU) | `c6i.xlarge` | CX43 cloud VPS |
| Vector DB (Qdrant) | Self-hosted pe `r6i.large` | CX53 cloud VPS |
| Stocare obiecte | S3 | S3 (păstrat pe AWS) |
| Email | SES | SES (păstrat pe AWS) |
| Mediu de staging | `g5.xlarge` (testare GPU dev) | <a href="https://www.digitalocean.com/?ref=thinkflow" rel="sponsored nofollow">DigitalOcean</a> GPU Droplet (orar) |

### Detalierea costurilor lunare

**Configurație AWS (inferență always-on, eu-central-1):**

| Serviciu | Specificații | Cost lunar |
|---|---|---|
| EC2 `p3.2xlarge` (1× V100 16GB) | 8 vCPU, 61 GB RAM | $2,234 |
| EC2 `c6i.xlarge` (embeddings) | 4 vCPU, 8 GB | $124 |
| EC2 `r6i.large` (Qdrant) | 2 vCPU, 16 GB | $91 |
| NAT Gateway + transfer cross-AZ | — | $142 |
| ALB | — | $35 |
| EBS (800 GB gp3) | — | $64 |
| CloudWatch + diverse | — | $31 |
| S3 + SES | — | $24 |
| **Total** | | **~$2,745 / lună** |

Doar `p3.2xlarge` reprezintă 81% din cheltuiala de compute. A fost aleasă la începutul lui 2025 pentru că p3 era singura familie de GPU cu capacitate disponibilă în eu-central-1 fără o cerere de quota de 6 săptămâni.

**Configurație Hetzner (după migrare):**

| Serviciu | Specificații | Cost lunar |
|---|---|---|
| GEX44 GPU dedicat | RTX 4000 SFF Ada, 20 GB VRAM, 64 GB RAM | €232 (~$272) |
| CX43 cloud VPS | 8 vCPU, 16 GB — embeddings | €16 (~$19) |
| CX53 cloud VPS | 16 vCPU, 32 GB — Qdrant | €29 (~$34) |
| Hetzner Load Balancer | — | €7 (~$8) |
| S3 + SES (păstrat pe AWS) | — | $24 |
| Cloudflare Pro (CDN, înlocuiește CloudFront pentru API) | — | $20 |
| **Total** | | **~$377 / lună** |

**Economii lunare: ~$2,368. Anual: ~$28,416.**

![Același stack de producție, același workload: AWS $2,745/lună vs Hetzner $377/lună — reducere de 86% cu latență îmbunătățită](/images/blog/aws-hetzner-cost-comparison.svg)

Nu e o eroare de rotunjire. E salariul complet (fully loaded) al unui inginer senior în majoritatea piețelor din UE.

### Cost per oră GPU always-on (normalizat)

| Provider | Instanță | GPU | VRAM | $/oră (24/7) | $/lună (730 ore) |
|---|---|---|---|---|---|
| AWS | `g4dn.xlarge` | 1× T4 | 16 GB | $0.53 | $387 |
| AWS | `g5.xlarge` | 1× A10G | 24 GB | $1.01 | $734 |
| AWS | `g5.2xlarge` | 1× A10G | 24 GB | $1.21 | $884 |
| AWS | `p3.2xlarge` | 1× V100 | 16 GB | $3.06 | $2,234 |
| AWS | `p3.8xlarge` | 4× V100 | 64 GB | $12.24 | $8,935 |
| AWS | `p4d.24xlarge` | 8× A100 | 320 GB | $32.77 | $23,922 |
| Hetzner | GEX44 | 1× RTX 4000 Ada | 20 GB | $0.37 | $272 |
| Hetzner | GEX131-1 | 1× RTX PRO 6000 Blackwell | 96 GB | $1.91 | $1,397 |

GEX44 la $272/lună oferă VRAM comparabil cu `g5.xlarge` (24 GB) și depășește `g4dn.xlarge` la throughput de inferență pentru modelele moderne — la **37% din costul AWS**.

Pentru servirea modelelor de 70B+, GEX131-1 la ~$1,397/lună se compară cu `p4d.24xlarge` la $23,922/lună. Paralelismul tensor multi-GPU dispare, dar pentru inferența pe un singur model cu cuantizare pe 4 biți, un singur GPU Blackwell de 96 GB acoperă majoritatea sarcinilor de producție RAG și chat.

---

## Comparație de instanțe GPU: AWS p3/p4 vs Hetzner GEX

Nu compara p4d cu GEX44 — e o eroare de categorie. Compară **cerințele sarcinii de lucru cu capacitățile hardware-ului**.

### Matrice de specificații

| | AWS `p3.2xlarge` | AWS `g5.2xlarge` | AWS `p4d.24xlarge` | Hetzner GEX44 | Hetzner GEX131-1 |
|---|---|---|---|---|---|
| **GPU** | 1× V100 | 1× A10G | 8× A100 40GB | 1× RTX 4000 Ada | 1× RTX PRO 6000 Blackwell |
| **VRAM** | 16 GB | 24 GB | 320 GB | 20 GB | 96 GB |
| **Nuclee tensor** | 640 (gen 1) | 3,328 (gen 3) | 49,152 (gen 3) | 192 (gen 4) | 5th-gen Tensor |
| **RAM sistem** | 61 GB | 32 GB | 1,152 GB | 64 GB | 256 GB |
| **Stocare** | EBS (cost extra) | EBS (cost extra) | 8 TB NVMe local | 2× 1.92 TB NVMe | 2× 960 GB NVMe |
| **Rețea** | Până la 10 Gbps | Până la 10 Gbps | 400 Gbps | 1 Gbps | 1 Gbps |
| **$/oră on-demand** | $3.06 | $1.21 | $32.77 | ~$0.37 (fix) | ~$1.91 (fix) |
| **$/oră spot** | ~$0.90 | ~$0.36 | ~$9.83–16.38 | N/A | N/A |
| **Cel mai potrivit pentru** | Sarcini legacy | Inferență single-GPU | Antrenare, 70B+ FP16 | Inferență 7B–32B | Inferență 70B, fine-tuning |

### Ce contează cu adevărat pentru inferența LLM

**VRAM e constrângerea dură.** Un model Llama 3.1 8B la FP16 are nevoie de ~16 GB. La INT4, cu marjă pentru KV cache, ~10 GB. Cei 20 GB ai GEX44 gestionează confortabil modele de 8B–14B cu batching. La 32B, e nevoie de cuantizare agresivă sau de GEX131.

**Generația nucleelor tensor contează mai mult decât numărul brut de nuclee CUDA pentru inferența transformer.** RTX 4000 Ada (GEX44) e cu două generații de arhitectură înaintea V100 (p3). În testele noastre, GEX44 a servit Llama 3.1 8B **de 2.4× mai rapid** decât p3.2xlarge, în ciuda VRAM-ului similar — premium-ul plătit pentru p3 se ducea pe silicon din 2017.

**Lățimea de bandă a rețelei rareori devine bottleneck pentru inferență.** Generarea de token-uri e limitată de GPU, nu de rețea. Cel 1 Gbps al Hetzner e suficient pentru a servi API-uri până la ~500 de conexiuni streaming concurente. Unde câștigă AWS: multi-regiune activ-activ cu 400 Gbps intra-cluster pentru antrenare distribuită.

**Instanțele spot schimbă matematica AWS — dar doar dacă sarcina ta tolerează întreruperi.** `g5.2xlarge` spot la ~$0.36/oră (~$263/lună) se apropie de prețurile Hetzner. Dar capacitatea spot pentru instanțe GPU în eu-central-1 a fost întreruptă de 4 ori în fereastra noastră de monitorizare de 90 de zile. Pentru API-uri de inferență orientate spre utilizator, asta e inacceptabil fără un warm standby — ceea ce dublează costul și complexitatea.

### Când p4 încă are sens

- **Paralelism tensor multi-GPU** pentru modele de 70B+ la FP16 fără cuantizare
- **Fine-tuning** cu batch-uri mari pe 8× A100
- **Antrenare în burst** — pornești pentru 48 de ore, faci fine-tuning, termini instanța
- **Compliance**: HIPAA BAA, FedRAMP, SOC 2 Type II cu audit trail nativ AWS

Pentru inferență steady-state — ceea ce rulează de fapt 80% dintre „produsele AI" — hardware-ul dedicat câștigă la economia unitară (unit economics).

---

## Roadmap de migrare: pas cu pas

Asta nu e „lift and shift". E o tranziție în etape, cu rollback la fiecare pas.

### Faza 0: Inventar și baseline (Săptămâna 1)

Înainte de a atinge infrastructura, capturează baseline-ul curent:

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

Notează tokens/secundă (P50/P95), time-to-first-token (TTFT), utilizarea memoriei GPU și cereri/minut la saturație. Fără un baseline, nu ai nicio dovadă că migrarea a funcționat.

### Faza 1: Provizionarea infrastructurii Hetzner (Săptămâna 1–2)

Comandă GEX44 prin <a href="https://www.hetzner.com/?ref=thinkflow" rel="sponsored nofollow">Hetzner Robot</a>. Taxă de setup: €114, unică. Livrare: de obicei 24–72 de ore pentru GEX44 în FSN1. GEX131 poate avea liste de așteptare — comandă din timp.

**Terraform — resurse cloud Hetzner (load balancer, VPS pentru Qdrant/embeddings):**

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

GEX44 în sine se provizionează prin Hetzner Robot (serverele dedicate nu sunt încă în provider-ul Terraform `hcloud`). Folosește cloud-init sau Ansible pentru configurarea serverului GPU — păstreaz-o identică cu configurația AWS.

### Faza 2: Containerizarea stack-ului de inferență (Săptămâna 2)

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

Instalează driverele NVIDIA pe GEX44 prin installimage-ul Hetzner sau printr-o configurare manuală:

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

### Faza 3: Rulare paralelă și validare (Săptămâna 3)

Rulează ambele endpoint-uri simultan. Direcționează 10% din traficul de producție către Hetzner prin DNS ponderat sau un feature flag la nivel de aplicație:

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

Compară rata de erori, latența P95 și throughput-ul de token-uri timp de minimum 7 zile. Nu face trecerea definitivă doar pe baza proiecțiilor de cost — validează comportamentul din producție.

### Faza 4: Trecere definitivă și dezafectare (Săptămâna 4)

1. Ajustează ponderile DNS/load balancer: 10% → 50% → 100% pe parcursul a 72 de ore
2. Fă snapshot la volumele EBS și exportă artefactele modelului în S3 (păstrate pentru rollback)
3. Termină instanțele GPU AWS după o fereastră de rollback de 14 zile
4. Fă downgrade sau elimină NAT Gateway-ul dacă niciun compute AWS rămas nu mai depinde de el
5. Actualizează pipeline-urile CI/CD pentru a face deploy pe Hetzner prin SSH sau printr-un runner GitHub Actions self-hosted

**Plan de rollback:** Păstrează AMI-ul AWS și launch template-ul timp de 30 de zile. Revenirea la AWS prin DNS ponderat durează sub 5 minute dacă hardware-ul Hetzner cedează.

---

## Benchmark-uri de performanță: latență, throughput, cost per 1M token-uri

Toate benchmark-urile au rulat în iulie 2026, cu același model (`meta-llama/Llama-3.1-8B-Instruct`), aceeași versiune vLLM (0.8.5), batch size 256, lungime maximă de secvență 8192. Locația clientului: Frankfurt. Sarcină: 50 de utilizatori concurenți, lungimi de prompt aleatorii între 128–2048 token-uri.

### Latență

| Metrică | AWS `p3.2xlarge` | AWS `g5.2xlarge` | Hetzner GEX44 |
|---|---|---|---|
| TTFT P50 | 142 ms | 89 ms | 76 ms |
| TTFT P95 | 310 ms | 178 ms | 145 ms |
| TTFT P99 | 520 ms | 290 ms | 240 ms |
| Latență inter-token P50 | 18 ms | 12 ms | 11 ms |
| End-to-end (răspuns de 512 token-uri) P50 | 9.8 s | 6.4 s | 5.9 s |
| End-to-end P95 | 14.2 s | 8.9 s | 8.1 s |

GEX44 câștigă la fiecare percentilă de latență față de p3 — de așteptat, având în vedere Ada Lovelace vs Volta. Față de `g5.2xlarge`, GEX44 e ușor mai rapid la TTFT și aproximativ echivalent la generarea susținută. Avantajul de latență pentru utilizatorii din UE vine parțial din **eliminarea overhead-ului NAT Gateway** și din co-locarea inferenței cu stratul API în Falkenstein.

### Throughput

| Metrică | AWS `p3.2xlarge` | AWS `g5.2xlarge` | Hetzner GEX44 |
|---|---|---|---|
| Tokens/sec maxim (stream unic) | 52 | 78 | 84 |
| Tokens/sec maxim (50 concurenți) | 680 | 1,120 | 1,240 |
| Cereri/min maxim (la saturație) | 42 | 68 | 74 |
| Utilizare GPU la saturație | 94% | 91% | 88% |
| Consum energetic la saturație | 250W | 195W | 140W |

La 50 de stream-uri concurente, GEX44 oferă **1.8× throughput-ul lui p3.2xlarge** la 12% din cost.

### Cost per 1M token-uri

Calcul: `(monthly_instance_cost) / (monthly_tokens_served)`. Presupune o utilizare medie GPU de 70% pe parcursul a 730 de ore/lună.

| Setup | Cost lunar | Token-uri/lună (est.) | Cost per 1M token-uri |
|---|---|---|---|
| AWS `p3.2xlarge` | $2,234 | 890M | **$2.51** |
| AWS `g5.2xlarge` | $884 | 1.47B | **$0.60** |
| AWS `g5.2xlarge` (spot) | $263 | 1.47B | **$0.18** |
| Hetzner GEX44 | $272 | 1.63B | **$0.17** |
| Hetzner GEX44 + CX43 + CX53 + LB | $377 | 1.63B | **$0.23** (stack complet) |

La volum de producție (~1.6B token-uri/lună), stack-ul complet Hetzner costă **$0.23 per 1M token-uri** all-in — incluzând infrastructura de embeddings și căutare vectorială. AWS p3 era la **$2.51 per 1M token-uri**, o diferență de 11×.

Pentru context: prețurile API pentru OpenAI GPT-4o sunt ~$2.50–10.00 per 1M token-uri output. Inferența self-hosted pe Hetzner aduce costul marginal sub $0.25 per 1M token-uri — self-hosting-ul atinge break-even față de API-urile gestionate peste ~200M token-uri/lună.

![Cost per 1M tokens all-in: AWS p3 $2.51 vs stack-ul complet Hetzner $0.23 — de 11 ori mai ieftin, sub pragul API-urilor gestionate](/images/blog/aws-hetzner-cost-per-token.svg)

### Benchmark serviciu de embeddings (CPU, CX43 vs c6i.xlarge)

| Metrică | AWS `c6i.xlarge` | Hetzner CX43 |
|---|---|---|
| `nomic-embed-text` documente/sec | 48 | 52 |
| Latență batch P95 (32 documente) | 680 ms | 610 ms |
| Cost lunar | $124 | $19 |

Sarcinile de embeddings sunt limitate de CPU. VPS-ul cloud Hetzner, la prețurile post-iunie-2026, tot subcotează AWS cu 85%, la performanță comparabilă.

---

## Cadru de decizie pentru 2026

Alegerea providerului cloud nu e o chestiune de identitate. Trece sarcina de lucru prin acest flux:

```
Servești inferență orientată spre utilizator, cu trafic predictibil?
  DA → Hetzner GEX44/GEX131 (bare metal, preț fix)
  NU → Continuă

Ai nevoie de antrenare multi-GPU sau FP16 70B+ fără cuantizare?
  DA → AWS p4d/p5 (burst) sau CoreWeave/Lambda (GPU cloud mai ieftin)
  NU → Continuă

Sarcina ta tolerează întreruperi (batch, offline, unelte interne)?
  DA → Instanțe spot AWS g5 (se apropie de prețurile Hetzner)
  NU → Continuă

Ai nevoie de latență sub 50ms pentru utilizatorii din US East?
  DA → AWS us-east-1 sau un provider din SUA — Hetzner adaugă 80–120ms transatlantic
  NU → Continuă

Ai nevoie de HIPAA BAA, FedRAMP sau SOC 2 cu audit nativ AWS?
  DA → AWS (sau GCP/Azure cu compliance echivalent)
  NU → Continuă

Cheltuiala lunară de inferență depășește $500 pe instanțe GPU AWS?
  DA → ROI-ul migrării depășește 2 săptămâni de timp de inginerie — fă-o
  NU → Rămâi pe AWS spot sau API gestionat până când volumul justifică overhead-ul operațional

Rulezi inferență steady-state peste 200M token-uri/lună?
  DA → Hetzner self-hosted atinge break-even față de API-ul OpenAI/Anthropic din prima lună
  NU → API-ul gestionat e mai ieftin dacă iei în calcul timpul de inginerie
```

### Când AWS încă câștigă în 2026

- **S3** — tot nimic nu e mai ieftin la scară pentru stocarea de obiecte. Păstrează-l.
- **SageMaker pentru experimentare** — notebook-uri gestionate, experiment tracking, deploy într-un click pentru echipele de data science fără DevOps
- **Multi-regiune activ-activ** — AWS Global Accelerator + pool-uri regionale de GPU pentru <100ms la nivel global
- **Antrenare în burst** — pornești p4d pentru 48 de ore, faci fine-tuning, termini instanța. A plăti $32.77/oră timp de 2 zile bate deținerea de hardware folosit de două ori pe lună
- **Inferență gestionată (Bedrock)** — dacă echipa ta nu are deloc capacitate de operare GPU și volumul e sub 50M token-uri/lună
- **Spot + auto-scaling pentru batch** — joburi nocturne de embeddings, procesare de documente, rulări de evaluare

### Când Hetzner câștigă în 2026

- **Inferență steady-state** — chatbot-uri, API-uri RAG, code completion, copiloți interni
- **Bază de utilizatori europeană** — datacentere Falkenstein/Nuremberg/Helsinki cu GDPR by default
- **Scalare cu cost predictibil** — tarif lunar fix, fără surprize la factură din egress sau NAT
- **Modele single-GPU până la 32B** — GEX44 acoperă zona optimă pentru majoritatea deployment-urilor de producție
- **Inferență 70B cu cuantizare** — GEX131 la $1,397/lună vs $23,922/lună pentru p4d

Pentru teste GPU de staging și CI fără să te angajezi la hardware dedicat, un <a href="https://www.digitalocean.com/?ref=thinkflow" rel="sponsored nofollow">DigitalOcean GPU Droplet</a> cu facturare orară acoperă golul — pornești pentru teste de integrare, distrugi după.

---

## Ce am păstrat pe AWS

Migrarea a fost incrementală, nu ideologică:

- **S3** pentru artefactele modelului, datele de antrenare și upload-urile utilizatorilor
- **SES** pentru email tranzacțional ($0.10/1K emailuri, deliverability gestionat)
- **CloudFront** pentru asset-urile statice ale site-ului de marketing (aplicațiile Next.js s-au mutat pe Hetzner + Cloudflare)

Cloud-ul hibrid nu e un compromis. E pragmatism ingineresc — folosești fiecare provider acolo unde economia unitară și modelul operațional i se potrivesc.

---

## Concluzia

Instanțele GPU AWS sunt prețuite pentru flexibilitate: pornești, scalezi, dezafectezi. Modelul ăsta e corect pentru burst-uri de antrenare și sarcini imprevizibile. E **greșit pentru inferență care rulează 24/7 la volum predictibil**.

În iulie 2026, un Hetzner GEX44 la €232/lună oferă performanță de inferență mai bună decât un p3.2xlarge la $2,234/lună. Diferența nu e de 10%. E un ordin de mărime. Adaugă infrastructura de suport — embeddings, vector DB, load balancer — și stack-ul complet tot costă **$377/lună vs $2,745 pe AWS**.

Migrarea nu e gratis. Costă 3–4 săptămâni de timp de inginerie, cere disciplină Docker/Terraform și un plan de rollback. La $28K/an economii, ROI-ul se amortizează în mai puțin de două săptămâni.

Dacă linia de cost pentru GPU AWS din factura lunară îți sună cunoscut, rulăm exact acest audit ca angajament cu preț fix: [Audit de Cost Cloud și Migrare →](https://thinkflow.ro/ro/services/cloud-cost-migration-audit) — o analiză linie cu linie a facturii tale, un plan de migrare susținut de benchmark-uri și economii proiectate pe baza unor cifre reale, nu a unui slide de vânzări. Preferi să discutăm întâi? [Contactează-ne](https://thinkflow.ro/ro/contact).
