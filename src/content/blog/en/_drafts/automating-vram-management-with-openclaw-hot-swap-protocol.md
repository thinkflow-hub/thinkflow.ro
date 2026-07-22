---
title: "Automating VRAM Management with OpenClaw Hot-Swap Protocol"
description: "Open-source VRAM hot-swap protocol for running Ollama + ComfyUI on a single 12GB GPU without OOM errors. Save/restore, anti-ping-pong, Gateway integration."
date: "2026-07-21"
category: "AI Infrastructure"
tags: [openclaw, vram, ollama, comfyui, gpu, optimization]
affiliatePrograms: []
image: "/api/og?title=Automating+VRAM+Management+with+OpenClaw+Hot-Swap+Protocol&logos=&category=AI+Infrastructure&tags=openclaw,vram,ollama"
---

## The Problem

Running both Ollama LLM inference and ComfyUI image generation on a single 12GB GPU is challenging. When both compete for VRAM, one crashes with OOM (Out of Memory).

## The VRAM Hot-Swap Protocol

We built a VRAM Hot-Swap Protocol for OpenClaw that:

- **Save/Restore Context**: Before swapping VRAM pools, saves which Ollama models are loaded. After the GPU task completes, restores the original models automatically.
- **Anti-Ping-Pong**: A 1-second cooldown + queue check prevents rapid swap cycles when multiple GPU tasks arrive in sequence.
- **Direct Ollama Unload**: Even for models loaded outside the orchestrator tracking (e.g., loaded by agents directly), the protocol detects and unloads them.

## Gateway Integration

The protocol is wired into the Gateway at /api/comfyui/generate and /api/factory/clip/process routes. Before any GPU task, VRAM is allocated (with automatic swap if needed). After the task, VRAM is freed and original models restored.

## Benchmarks

| Metric | Before | After |
|--------|--------|-------|
| VRAM free with Ollama + agents | ~1.2 GB | ~1.2 GB (same) |
| VRAM free after swap for ComfyUI | OOM crash | ~9.3 GB |
| Restore time (qwen2.5-7b) | N/A | ~3 seconds |
| Anti-ping-pong cooldown | N/A | 1 second |

## Try It

The protocol is open-source at github.com/thinkflow-hub/OpenClaw-Hardened-Core. Enable it by calling any GPU route through the Gateway:18880.
