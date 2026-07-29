---
title: "How to Run Local LLMs on Windows with Ollama"
description: "Complete guide to installing and running Ollama on Windows for local LLM inference."
date: "2026-07-21"
category: "AI Tools"
tags: [ollama, local-llm, windows]
affiliatePrograms: []
image: "/api/og?title=How+to+Run+Local+LLMs+on+Windows+with+Ollama&logos=&category=AI+Tools&tags=ollama,local-llm,windows"
---

# How to Run Local LLMs on Windows with Ollama

Running Large Language Models locally on Windows has never been easier thanks to Ollama. This guide walks you through the complete setup process from scratch, covering installation, model management, basic interaction, and programmatic integration. Each section includes practical commands, configuration tips, and troubleshooting pointers to help you get a reliable, offline LLM workflow up and running.

---

## Why Run LLMs Locally?

Deploying models on your own machine offers several concrete advantages:

- **Privacy** – Prompts and responses never leave your workstation, which is essential for handling sensitive data or proprietary information.
- **Cost predictability** – Once the model files are downloaded, there are no per‑token API charges or subscription fees.
- **Offline availability** – You can continue working in environments with limited or no internet connectivity.
- **Full control over model selection** – You can choose any model supported by Ollama, switch between versions, or experiment with custom quantizations without relying on a third‑party catalog.
- **Deterministic latency** – Local inference eliminates network jitter, making response times more predictable for interactive applications.

These benefits make local LLMs attractive for development, research, and production scenarios where data governance or budget constraints are paramount.

---

## Step 1: Install Ollama on Windows

### 1.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS        | Windows 10 64‑bit (version 1903 or later) | Windows 11 64‑bit |
| CPU       | x86‑64 with AVX2 support | Modern multi‑core CPU (e.g., AMD Ryzen 5 5600X or Intel i5‑12400) |
| RAM       | 8 GB | 16 GB+ (more RAM allows larger models or concurrent sessions) |
| GPU (optional) | NVIDIA GPU with Compute Capability ≥ 3.5 (for CUDA) | NVIDIA RTX 30‑series or newer with ≥ 6 GB VRAM |
| Disk space| 5 GB for Ollama binaries + model cache | 50 GB+ (models can range from a few hundred MB to tens of GB) |

> **Note:** Ollama can run purely on CPU; a GPU is only required if you want to accelerate inference with CUDA. No AMD or Intel GPU support is shipped in the official release at the time of writing.

### 1.2 Download and Install

1. Navigate to the official download page: <https://ollama.ai/download/windows>.
2. Click the **Windows Installer** button to obtain `OllamaSetup.exe`.
3. Run the installer. It will:
   - Copy the Ollama binary to `%LOCALAPPDATA%\Programs\Ollama`.
   - Register a Windows service named `ollama` that starts automatically on boot.
   - Add the Ollama executable directory to your `PATH` environment variable (requires a restart of any open terminals).
4. After installation, open a new PowerShell window and verify the service is active:

   ```powershell
   Get-Service -Name ollama | Format-List
   ```

   Expected output shows `Status : Running`.

### 1.3 Managing the Ollama Service

You can control the service manually if you need to stop it for maintenance or to free resources:

```powershell
# Stop the service
Stop-Service -Name ollama

# Start the service
Start-Service -Name ollama

# Restart (useful after changing configuration)
Restart-Service -Name ollama
```

The service logs are written to `%LOCALAPPDATA%\Ollama\logs\ollama.log`. Inspect this file if you encounter startup failures.

### 1.4 Environment Variables (Optional)

Ollama reads a few environment variables to tweak its behavior:

| Variable | Description | Example |
|----------|-------------|---------|
| `OLLAMA_HOST` | IP address and port the service binds to (default `127.0.0.1:11434`). Set to `0.0.0.0:11434` to listen on all interfaces. | `set OLLAMA_HOST=0.0.0.0:11434` |
| `OLLAMA_MODELS` | Directory where model files are stored (default `%LOCALAPPDATA%\Ollama\models`). | `set OLLAMA_MODELS=D:\OllamaModels` |
| `OLLAMA_MAX_LOADED_MODELS` | Maximum number of models kept in memory simultaneously (default `1`). Increase if you have ample RAM and want fast switching. | `set OLLAMA_MAX_LOADED_MODELS=2` |

After changing any variable, restart the Ollama service for the change to take effect.

---

## Step 2: Pull Your First Model

Ollama uses a declarative model registry. The `ollama pull` command downloads the specified model manifest and its associated weight files, then stores them in the model directory.

### 2.1 Choosing a Model

The Ollama library hosts a variety of open‑weight models, including:

- **Qwen2.5 series** (e.g., `qwen2.5-7b`, `qwen2.5-14b`) – strong general‑purpose performance.
- **Llama 3 series** (e.g., `llama3-8b`, `llama3-70b`) – Meta’s latest releases.
- **Mistral** (e.g., `mistral-7b`, `mixtral-8x7b`) – efficient architectures with good reasoning.
- **Phi‑3** (e.g., `phi3-mini`, `phi3-medium`) – Microsoft’s compact models suitable for lower‑end hardware.

Select a model whose size fits your RAM/VRAM constraints. As a rule of thumb, a 7 B parameter model in 4‑bit quantization needs roughly 3–4 GB of RAM; the same model in 8‑bit needs about 6 GB.

### 2.2 Pulling the Model

Open PowerShell (or Command Prompt) and execute:

```powershell
ollama pull qwen2.5-7b
```

You will see progress output similar to:

```
pulling manifest
pulling 7b2a5c1d...: 100% ██████████ 3.2GB/3.2GB
verifying sha256
success
```

The command performs the following steps internally:

1. Retrieves the model manifest from the Ollama registry.
2. Downloads each layer (typically the weight file and tokenizer) in parallel.
3. Verifies SHA‑256 checksums to guarantee integrity.
4. Extracts and places the files under `%LOCALAPPDATA%\Ollama\models\qwen2.5-7b`.

### 2.3 Managing Multiple Models

- **List installed models**

  ```powershell
  ollama list
  ```

  Output shows model name, size, and last modified timestamp.

- **Remove a model** (to free space)

  ```powershell
  ollama rm qwen2.5-7b
  ```

- **Update a model** (if a newer version appears in the registry)

  ```powershell
  ollama pull qwen2.5-7b   # re‑pulls; Ollama will reuse unchanged layers
  ```

- **Pre‑load a model** (keep it resident in memory for low‑latency access)

  ```powershell
  ollama run qwen2.5-7b   # starts an interactive session; the model stays loaded until you exit
  ```

  Alternatively, you can send an empty prompt to the API to load the model without entering a REPL (see Step 4).

### 2.4 Handling Download Interruptions

If your connection drops, simply re‑run the same `ollama pull` command. Ollama’s storage layout is content‑addressable; it will skip already‑downloaded layers and resume from where it left off.

---

## Step 3: Basic Usage

Once a model is present locally, you can interact with it via the Ollama CLI, which provides a simple REPL (Read‑Eval‑Print Loop) and one‑shot execution modes.

### 3.1 Interactive REPL

Launch an interactive session:

```powershell
ollama run qwen2.5-7b
```

You will see a prompt like:

```
>>> 
```

Enter your question or instruction and press **Enter**. The model streams the response token by token. To exit, type `/bye` or press `Ctrl+C`.

**Example session:**

```
>>> Explain what RAG is in simple terms
Retrieval-Augmented Generation (RAG) combines a retriever that fetches relevant documents from a knowledge base with a generator that produces answers based on those documents. This grounds the model’s output in factual information, reducing hallucinations.
>>> /bye
```

### 3.2 One‑Shot Execution

For scripting or quick queries, you can pass the prompt directly:

```powershell
ollama run qwen2.5-7b "Explain what RAG is in simple terms"
```

The command prints the full response and then returns to the shell. This mode is ideal for batch processing or embedding in CI pipelines.

### 3.3 Adjusting Generation Parameters

Ollama exposes several sampling parameters via command‑line flags:

| Flag | Purpose | Typical Values |
|------|---------|----------------|
| `-t` / `--temperature` | Controls randomness; lower = more deterministic. | `0.2` (factual), `0.7` (balanced), `1.0` (creative) |
| `-k` / `--top-k` | Limits sampling to the top *k* tokens. | `40` |
| `-p` / `--top-p` | Nucleus sampling; probability mass cutoff. | `0.9` |
| `-n` / `--num-predict` | Maximum number of tokens to generate. | `128` |
| `--seed` | Fixed seed for reproducible outputs. | `42` |

**Example:** Generate a concise answer with low temperature:

```powershell
ollama run qwen2.5-7b -t 0.2 -n 64 "Summarize the benefits of local LLMs"
```

### 3.4 Streaming vs. Non‑Streaming Output

By default, `ollama run` streams tokens as they are produced. To disable streaming (useful when capturing the full output in a variable), add the `--no-stream` flag:

```powershell
ollama run qwen2.5-7b --no-stream "List three steps to install Ollama"
```

The command will buffer the entire response and print it once generation finishes.

### 3.5 Common Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `error: model not found` | Model name typo or not pulled. | Verify with `ollama list`; pull the correct model. |
| `CUDA error: out of memory` | GPU VRAM insufficient for the selected model/quantization. | Switch to a smaller model, use CPU-only mode (`set OLLAMA_HOST=127.0.0.1:11434; ollama run ...`), or enable GPU offloading with `OLLAMA_GPU_LAYERS` (if supported). |
| Slow first response, then fast | Model loading latency on first use. | Pre‑load the model with an empty prompt or keep a session open. |
| Service fails to start after installer | Port 11434 already in use. | Identify the conflicting process (`netstat -ano | findstr 11434`) and stop it, or change `OLLAMA_HOST` to another port. |

---

## Step 4: Integrate with Your Code

Ollama exposes a lightweight HTTP API that mirrors the OpenAI chat completion format, making it straightforward to call from any language capable of issuing HTTP requests.

### 4.1 API Endpoint Overview

- **Base URL:** `http://127.0.0.1:11434` (or the host/port defined by `OLLAMA_HOST`).
- **Primary endpoint:** `/api/chat` (POST) – accepts a JSON payload similar to OpenAI’s `/v1/chat/completions`.
- **Alternative endpoint:** `/api/generate` (POST) – for raw completion style prompts (non‑chat).

The API returns JSON with a `message` field containing the model’s reply. Streaming is supported via `Transfer-Encoding: chunked` when the `"stream": true` flag is set.

### 4.2 Minimal Example with `curl`

```bash
curl http://127.0.0.1:11434/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
        "model": "qwen2.5-7b",
        "messages": [
          { "role": "system", "content": "You are a helpful assistant." },
          { "role": "user",   "content": "Explain what RAG is in simple terms." }
        ],
        "stream": false
      }'
```

**Expected JSON response (pretty‑printed):**

```json
{
  "model": "qwen2.5-7b",
  "created_at": "2025-09-25T14:32:10.123456Z",
  "message": {
    "role": "assistant",
    "content": "Retrieval-Augmented Generation (RAG) combines a retriever that fetches relevant documents from a knowledge base with a generator that produces answers based on those documents. This grounds the model’s output in factual information, reducing hallucinations."
  },
  "done": true
}
```

### 4.3 Using Python (Requests)

```python
import requests
import json

url = "http://127.0.0.1:11434/api/chat"
payload = {
    "model": "qwen2.5-7b",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user",   "content": "Explain what RAG is in simple terms."}
    ],
    "stream": False
}

response = requests.post(url, json=payload)
response.raise_for_status()
data = response.json()
print(data["message"]["content"])
```

**Notes:**

- Install the `requests` library via `pip install requests` if not already present.
- For streaming, set `"stream": True` and iterate over `response.iter_lines()`; each line is a JSON chunk.

### 4.4 Using LangChain

LangChain provides an `Ollama` wrapper that mimics the OpenAI API, enabling seamless substitution in existing chains.

```python
from langchain_community.llms import Ollama

llm = Ollama(model="qwen2.5-7b", temperature=0.2)
prompt = "Explain what RAG is in simple terms."
result = llm.invoke(prompt)
print(result)
```

LangChain handles HTTP connections, retries, and optional streaming internally.

### 4.5 Calling from C# (HttpClient)

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        var request = new
        {
            model = "qwen2.5-7b",
            messages = new[]
            {
                new { role = "system", content = "You are a helpful assistant." },
                new { role = "user",   content = "Explain what RAG is in simple terms." }
            },
            stream = false
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("http://127.0.0.1:11434/api/chat", content);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);
        var contentElement = doc.RootElement.GetProperty("message")
                                 .GetProperty("content")
                                 .GetString();
        Console.WriteLine(contentElement);
    }
}
```

### 4.6 Advanced API Features

- **Tool Use / Function Calling** – If the model supports it (e.g., certain Llama 3 variants), you can pass a `tools` array in the payload to enable the model to request external tool invocations.
- **Embedding Endpoint** – Some models expose `/api/embeddings` for generating vector representations; consult the specific model’s documentation.
- **Model Info** – `GET /api/tags` returns a JSON list of locally available models with size and digest metadata, useful for dynamic model selection in applications.

### 4.7 Security Considerations

- The Ollama service binds to `127.0.0.1` by default, preventing external access. If you change `OLLAMA_HOST` to `0.0.0.0` or a specific LAN address, ensure your Windows firewall rules restrict access to trusted clients only.
- No authentication is built into the API; rely on network‑level protections (firewall, VPN) or place a reverse proxy with auth in front if you need to expose the service beyond the local machine.

---

## Additional Tips & Best Practices

1. **Quantization Awareness** – Ollama automatically downloads the quantized version appropriate for your hardware (usually 4‑bit for CPU, 8‑bit for GPU). You can force a specific quantization by appending `-q4_0`, `-q5_1`, etc., to the model name when pulling (if available). Example: `ollama pull llama3-8b-q4_0`.

2. **Model Caching Across Projects** – Since models are stored under `%LOCALAPPDATA%\Ollama\models`, you can back up this folder or symlink it to a larger drive to preserve models between Windows reinstalls.

3. **Monitoring Resource Usage** – Use Windows Task Manager or `ollama ps` (if the CLI provides it) to see which models are currently loaded in memory. This helps avoid accidental oversubscription of RAM.

4. **Automating Model Pulls in CI** – Add a step in your CI pipeline that runs `ollama pull <model>` before executing tests that depend on a specific LLM. Cache the model directory between runs to avoid repeated downloads.

5. **Combining with Local Vector Stores** – For RAG workflows, pair Ollama with an embedded vector database like FAISS, Chroma, or LanceDB, all of which have Python bindings and run entirely on disk. Store your documents locally, generate embeddings with Ollama’s `/api/embeddings` endpoint (if supported), and retrieve relevant chunks before prompting the model.

6. **Keeping Ollama Updated** – Periodically revisit <https://ollama.ai/download/windows> to download the latest installer. The update process preserves your existing model cache; you only need to restart the service afterward.

7. **Logging and Debugging** – Increase verbosity by setting the environment variable `OLLAMA_LOG_LEVEL=debug` before starting the service. Logs appear in `%LOCALAPPDATA%\Ollama\logs\ollama.log` and can help diagnose startup or inference issues.

---

## Conclusion

By following the steps outlined above, you have a fully functional, private LLM stack running on Windows with Ollama. You can pull models suited to your hardware, interact with them via a friendly CLI, and integrate them into any application through a simple REST API. Because all computation stays on your machine, you retain complete control over data privacy, cost, and availability—key ingredients for modern AI‑driven development workflows.

Feel free to experiment with different model families, adjust sampling parameters to match your use case, and combine Ollama with local retrieval systems to build powerful Retrieval‑Augmented Generation pipelines without ever leaving your workstation. Happy modeling!