"""
Blog Image Generator — Premium blog hero images.

Pipeline:
  1. PIL composits frosted glass card collage on pre-generated Flux background
  2. ComfyUI Flux refine (async queue or sync)

Usage:
    python scripts/blog_image_generator.py --slug vercel-roi-2026 --affiliates Vercel --cluster "Cloud Hosting"
    python scripts/blog_image_generator.py --slug best-vector-database-rag-2026 --affiliates Pinecone Qdrant Weaviate --cluster "AI Infrastructure"
    python scripts/blog_image_generator.py --slug vercel-roi-2026 --affiliates Vercel --title "Vercel ROI 2026" --cluster "Cloud Hosting"
"""

import argparse
import io
import json
import math
import random
import sys
import time
import zipfile
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Paths ───────────────────────────────────────────────────────────────────
THINKFLOW_DIR = Path(__file__).parent.parent
BLOG_IMAGES_DIR = THINKFLOW_DIR / "public" / "images" / "blog"
LOGOS_CACHE_DIR = BLOG_IMAGES_DIR / "logos"
BG_DIR = BLOG_IMAGES_DIR / "backgrounds"
FONTS_DIR = THINKFLOW_DIR / "public" / "fonts"

OPENCLAW_DIR = Path("M:/thinkflow/openclaw")
COMFFY_WORKFLOW = OPENCLAW_DIR / "comfy_workflows" / "flux_img2img.json"
COMFFYUI_URL = "http://127.0.0.1:8188"

REFINE_QUEUE_FILE = BLOG_IMAGES_DIR / "_refine_queue.json"

# ── Canvas ──────────────────────────────────────────────────────────────────
CANVAS_W = 1200
CANVAS_H = 630
OUTPUT_SIZE = (CANVAS_W, CANVAS_H)

# ── Cluster theme config ────────────────────────────────────────────────────
CLUSTER_THEMES = {
    "AI Infrastructure": {
        "accent": (59, 130, 246),      # #3b82f6
        "accent_light": (96, 165, 250), # #60a5fa
        "accent_dark": (30, 64, 175),   # #1e40af
        "glow": (59, 130, 246, 40),
    },
    "Cloud Hosting": {
        "accent": (6, 182, 212),        # #06b6d4
        "accent_light": (34, 211, 238), # #22d3ee
        "accent_dark": (14, 116, 144),  # #0e7490
        "glow": (6, 182, 212, 40),
    },
    "DevOps": {
        "accent": (139, 92, 246),       # #8b5cf6
        "accent_light": (167, 139, 250),# #a78bfa
        "accent_dark": (109, 40, 217),  # #6d28d9
        "glow": (139, 92, 246, 40),
    },
    "Web Development": {
        "accent": (20, 184, 166),       # #14b8a6
        "accent_light": (45, 212, 191), # #2dd4bf
        "accent_dark": (13, 148, 136),  # #0d9488
        "glow": (20, 184, 166, 40),
    },
}

DEFAULT_THEME = {
    "accent": (59, 130, 246),
    "accent_light": (96, 165, 250),
    "accent_dark": (30, 64, 175),
    "glow": (59, 130, 246, 40),
}

# ── Glass card premium styling ─────────────────────────────────────────────
CARD_W = 150
CARD_H = 170
CARD_RADIUS = 16
CARD_BORDER_W = 1.5
LOGOS_MAX_W = 80
LOGOS_MAX_H = 50
LABEL_SIZE = 10

# ── Layout variants ─────────────────────────────────────────────────────────
LAYOUT_VARIANTS = ["centered", "bottom_row", "hero_split", "diagonal"]


def get_theme(cluster: str) -> dict:
    return CLUSTER_THEMES.get(cluster, DEFAULT_THEME)


# ── Logo-to-domain mapping ──────────────────────────────────────────────────
LOGO_DOMAINS = {
    "Vercel": "vercel.com",
    "Pinecone": "pinecone.io",
    "Weaviate": "weaviate.io",
    "Qdrant": "qdrant.tech",
    "Chroma": "trychroma.com",
    "Milvus": "milvus.io",
    "Zilliz": "zilliz.com",
    "Cloudflare": "cloudflare.com",
    "Supabase": "supabase.com",
    "ElevenLabs": "elevenlabs.io",
    "Hetzner": "hetzner.com",
    "Fly.io": "fly.io",
    "OpenAI": "openai.com",
    "Anthropic": "anthropic.com",
    "Google": "google.com",
    "AWS": "aws.amazon.com",
    "Microsoft": "microsoft.com",
    "GitHub": "github.com",
    "GitLab": "gitlab.com",
    "Datadog": "datadoghq.com",
    "New Relic": "newrelic.com",
    "DigitalOcean": "digitalocean.com",
    "Linode": "linode.com",
    "Netlify": "netlify.com",
    "Render": "render.com",
    "Railway": "railway.app",
    "MongoDB": "mongodb.com",
    "Redis": "redis.com",
    "PostgreSQL": "postgresql.org",
    "MySQL": "mysql.com",
    "Docker": "docker.com",
    "Kubernetes": "kubernetes.io",
    "Nginx": "nginx.com",
    "FastAPI": "fastapi.tiangolo.com",
    "LangChain": "langchain.com",
    "LlamaIndex": "llamaindex.ai",
    "Ollama": "ollama.com",
    "ComfyUI": "comfy.org",
    "Stripe": "stripe.com",
    "Algora": "algora.io",
}


# ── Font helpers ────────────────────────────────────────────────────────────

def _download_google_font(name: str) -> Path | None:
    font_dir = FONTS_DIR / name
    font_dir.mkdir(parents=True, exist_ok=True)

    repo = "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf"
    targets = ["Montserrat-Bold.ttf", "Montserrat-Regular.ttf", "Montserrat-ExtraBold.ttf"]

    for fname in targets:
        target = font_dir / fname
        if target.exists():
            return target

    try:
        url = f"{repo}/Montserrat-Bold.ttf"
        r = requests.get(url, timeout=30, headers={"User-Agent": "ThinkFLOW/1.0"})
        if r.status_code == 200 and len(r.content) > 1000:
            target = font_dir / "Montserrat-Bold.ttf"
            target.write_bytes(r.content)
            return target
    except Exception as e:
        print(f"  Font download: {e}")
    return None


FONT_CACHE = {}

def _get_font(size: int = 14, bold: bool = False, extrabold: bool = False) -> ImageFont.FreeTypeFont:
    key = (size, bold, extrabold)
    if key in FONT_CACHE:
        return FONT_CACHE[key]

    name = "Montserrat"
    fname = f"{name}-ExtraBold.ttf" if extrabold else f"{name}-Bold.ttf" if bold else f"{name}-Regular.ttf"
    font_path = FONTS_DIR / name / fname

    if not font_path.exists():
        _download_google_font(name)
        font_path = FONTS_DIR / name / fname
        if not font_path.exists():
            font_path = FONTS_DIR / name / "Montserrat-Bold.ttf"

    try:
        if font_path.exists():
            font = ImageFont.truetype(str(font_path), size)
            FONT_CACHE[key] = font
            return font
    except:
        pass

    # Fallback
    try:
        arial = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
        font = ImageFont.truetype(arial, size)
        FONT_CACHE[key] = font
        return font
    except:
        return ImageFont.load_default()


# ── Logo fetching ───────────────────────────────────────────────────────────

def fetch_logo(program_name: str) -> Image.Image | None:
    LOGOS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = LOGOS_CACHE_DIR / f"{program_name.lower().replace(' ', '_')}.png"

    if cache_path.exists():
        return Image.open(cache_path).convert("RGBA")

    domain = LOGO_DOMAINS.get(program_name)
    if not domain:
        print(f"  No domain for '{program_name}', skipping")
        return None

    urls = [
        f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
        f"https://icons.duckduckgo.com/ip3/{domain}.ico",
    ]

    for url in urls:
        try:
            r = requests.get(url, timeout=10, headers={"User-Agent": "ThinkFLOW/1.0"})
            if r.status_code == 200 and len(r.content) > 100:
                img = Image.open(io.BytesIO(r.content)).convert("RGBA")
                if img.width < 32 or img.height < 32:
                    continue
                img.save(cache_path)
                return img
        except:
            continue

    # Text fallback
    try:
        img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        font = _get_font(40, bold=True)
        initial = program_name[0].upper()
        bbox = draw.textbbox((0, 0), initial, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text(((128 - tw) // 2, (128 - th) // 2 - 4), initial, font=font, fill=(59, 130, 246, 200))
        img.save(cache_path)
        return img
    except:
        return None


# ── Background selection ────────────────────────────────────────────────────

def pick_background() -> Image.Image | None:
    """Pick a random background from the pool. Returns None if pool is empty."""
    bgs = sorted(BG_DIR.glob("bg-*.webp"))
    bgs.extend(sorted(BG_DIR.glob("bg-*.png")))
    if not bgs:
        return None
    bg_path = random.choice(bgs)
    try:
        return Image.open(bg_path).convert("RGB")
    except:
        return None


def _create_gradient_fallback(width: int, height: int) -> Image.Image:
    """Gradient fallback when no background pool exists."""
    base = Image.new("RGB", (width, height))
    for y in range(height):
        t = y / height
        r = int(10 * (1 - t) + 2 * t)
        g = int(10 * (1 - t) + 2 * t)
        b = int(30 * (1 - t) + 8 * t)
        for x in range(width):
            base.putpixel((x, y), (r, g, b))
    return base


def _add_vignette(canvas: Image.Image, intensity: int = 60) -> Image.Image:
    """Add radial vignette overlay."""
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx, cy = CANVAS_W // 2, CANVAS_H // 2
    for i in range(80, 0, -1):
        r = int((i / 80) * max(CANVAS_W, CANVAS_H) * 0.7)
        alpha = int((1 - i / 80) * (intensity / 80))
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(0, 0, 0, alpha))
    return Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")


def _add_texture(canvas: Image.Image) -> Image.Image:
    """Add subtle noise texture."""
    from random import randint
    px = canvas.load()
    w, h = canvas.size
    for _ in range(int(w * h * 0.01)):
        x = randint(0, w - 1)
        y = randint(0, h - 1)
        r, g, b = px[x, y]
        o = randint(-4, 4)
        px[x, y] = (max(0, min(255, r + o)), max(0, min(255, g + o)), max(0, min(255, b + o)))
    return canvas


# ── Glass card with frosted glass effect ────────────────────────────────────

def _frosted_glass(canvas: Image.Image, x: int, y: int, w: int, h: int, radius: int, theme: dict) -> tuple[ImageDraw.ImageDraw, int, int]:
    """Draw a frosted glass card on the canvas. Returns (draw, cx, cy) for logo placement."""
    accent = theme["accent"]
    accent_light = theme["accent_light"]
    glow_color = theme["glow"]

    # 1. Outer glow
    glow_layer = Image.new("RGBA", (w + 30, h + 30), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_draw.rounded_rectangle(
        (15, 15, w + 15, h + 15), radius=radius + 4,
        fill=(*accent, 12),
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=10))
    canvas.paste(glow_layer, (x - 15, y - 15), glow_layer)

    # 2. Frosted glass (blurred background crop + fill)
    crop = canvas.crop((x, y, x + w, y + h)).convert("RGBA")
    # Downscale for efficiency, blur, upscale
    small = crop.resize((w // 4, h // 4), Image.LANCZOS)
    blurred = small.filter(ImageFilter.GaussianBlur(radius=3))
    blurred = blurred.resize((w, h), Image.LANCZOS)

    # Glass fill
    fill = Image.new("RGBA", (w, h), (255, 255, 255, 18))
    glass = Image.alpha_composite(blurred, fill)

    # 3. Subtle inner shadow (top edge)
    inner_shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(inner_shadow)
    sdraw.rounded_rectangle((0, 0, w, h), radius=radius, fill=(*accent, 6))
    glass = Image.alpha_composite(glass, inner_shadow)

    # Paste glass onto canvas
    canvas.paste(glass, (x, y), glass)

    # 4. Border (accent color, semi-transparent)
    border = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(border)
    bdraw.rounded_rectangle(
        (1, 1, w - 2, h - 2), radius=radius,
        outline=(*accent, 120), width=2,
    )
    canvas.paste(border, (x, y), border)

    # 5. Top shine
    shine = Image.new("RGBA", (w, h // 3), (0, 0, 0, 0))
    shdraw = ImageDraw.Draw(shine)
    shdraw.rounded_rectangle(
        (3, 3, w - 4, h // 3), radius=radius,
        fill=(255, 255, 255, 10),
    )
    canvas.paste(shine, (x, y), shine)

    return bdraw, x + w // 2, y + h // 2


def _draw_logo(canvas: Image.Image, logo_img: Image.Image | None, cx: int, cy: int, label: str, theme: dict):
    """Draw logo centered at (cx, cy) with label below."""
    draw = ImageDraw.Draw(canvas)
    accent = theme["accent_light"]

    if logo_img:
        logo = logo_img.copy()
        logo.thumbnail((LOGOS_MAX_W, LOGOS_MAX_H), Image.LANCZOS)
        lx = cx - logo.width // 2
        ly = cy - logo.height // 2 - 8
        canvas.paste(logo, (lx, ly), logo if logo.mode == "RGBA" else None)

    # Label
    font = _get_font(LABEL_SIZE, bold=False)
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    tx = cx - tw // 2
    ty = cy + 28
    # Subtle text shadow
    draw.text((tx + 1, ty + 1), label, font=font, fill=(0, 0, 0, 120))
    draw.text((tx, ty), label, font=font, fill=(200, 200, 220, 180))


# ── Layout variants ─────────────────────────────────────────────────────────

def layout_centered(canvas: Image.Image, logos: list, affiliates: list, theme: dict):
    """Variant 1: Centered grid — cards in 2-3 cols, title bar at bottom."""
    n = len(logos)
    if n == 0:
        return

    cols = min(n, 4)
    rows = math.ceil(n / cols)

    card_area_w = cols * CARD_W + (cols - 1) * 18
    card_area_h = rows * CARD_H + (rows - 1) * 18
    start_x = (CANVAS_W - card_area_w) // 2
    start_y = (CANVAS_H - card_area_h) // 2 - 20

    for i, (logo, aff) in enumerate(zip(logos, affiliates)):
        col = i % cols
        row = i // cols
        x = start_x + col * (CARD_W + 18)
        y = start_y + row * (CARD_H + 18)
        _frosted_glass(canvas, x, y, CARD_W, CARD_H, CARD_RADIUS, theme)
        _draw_logo(canvas, logo, x + CARD_W // 2, y + CARD_H // 2, aff, theme)


def layout_bottom_row(canvas: Image.Image, logos: list, affiliates: list, theme: dict):
    """Variant 2: Cards as bottom row, title area on top."""
    n = len(logos)
    if n == 0:
        return

    total_w = n * CARD_W + (n - 1) * 16
    start_x = (CANVAS_W - total_w) // 2
    start_y = CANVAS_H - CARD_H - 40

    for i, (logo, aff) in enumerate(zip(logos, affiliates)):
        x = start_x + i * (CARD_W + 16)
        _frosted_glass(canvas, x, start_y, CARD_W, CARD_H, CARD_RADIUS, theme)
        _draw_logo(canvas, logo, x + CARD_W // 2, start_y + CARD_H // 2, aff, theme)


def layout_hero_split(canvas: Image.Image, logos: list, affiliates: list, theme: dict):
    """Variant 3: Title area left, cards right (2-col split)."""
    n = len(logos)
    if n == 0:
        return

    cols = min(n, 2)
    rows = math.ceil(n / cols)
    card_area_w = cols * CARD_W + (cols - 1) * 16
    card_area_h = rows * CARD_H + (rows - 1) * 16
    start_x = CANVAS_W - card_area_w - 60
    start_y = (CANVAS_H - card_area_h) // 2

    for i, (logo, aff) in enumerate(zip(logos, affiliates)):
        col = i % cols
        row = i // cols
        x = start_x + col * (CARD_W + 16)
        y = start_y + row * (CARD_H + 16)
        _frosted_glass(canvas, x, y, CARD_W, CARD_H, CARD_RADIUS, theme)
        _draw_logo(canvas, logo, x + CARD_W // 2, y + CARD_H // 2, aff, theme)


def layout_diagonal(canvas: Image.Image, logos: list, affiliates: list, theme: dict):
    """Variant 4: Cards on diagonal path top-left to bottom-right."""
    n = len(logos)
    if n == 0:
        return

    for i, (logo, aff) in enumerate(zip(logos, affiliates)):
        t = i / max(n - 1, 1)
        x = int(40 + t * (CANVAS_W - CARD_W - 200))
        y = int(25 + t * (CANVAS_H - CARD_H - 25))
        _frosted_glass(canvas, x, y, CARD_W, CARD_H, CARD_RADIUS, theme)
        _draw_logo(canvas, logo, x + CARD_W // 2, y + CARD_H // 2, aff, theme)


LAYOUT_FUNCS = {
    "centered": layout_centered,
    "bottom_row": layout_bottom_row,
    "hero_split": layout_hero_split,
    "diagonal": layout_diagonal,
}


# ── Title rendering ─────────────────────────────────────────────────────────

def _render_title(canvas: Image.Image, title: str, theme: dict):
    """Render article title at bottom of canvas."""
    draw = ImageDraw.Draw(canvas)

    # Truncate long titles
    if len(title) > 60:
        title = title[:57] + "..."

    font_large = _get_font(22, bold=True)
    font_small = _get_font(10, bold=False)

    # Measure title
    bbox = draw.textbbox((0, 0), title, font=font_large)
    tw = bbox[2] - bbox[0]

    # Background bar for readability
    bar_h = 50
    bar_y = CANVAS_H - bar_h - 15
    bar = Image.new("RGBA", (CANVAS_W - 60, bar_h), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bar)
    bdraw.rounded_rectangle((0, 0, bar.width, bar_h), radius=8, fill=(0, 0, 0, 100))
    # Accent left border
    bdraw.rounded_rectangle((0, 0, 3, bar_h), radius=2, fill=(*theme["accent"], 180))
    canvas.paste(bar, (30, bar_y), bar)

    # Title text
    tx = 45
    ty = bar_y + (bar_h - 26) // 2
    # Shadow
    draw.text((tx + 1, ty + 1), title, font=font_large, fill=(0, 0, 0, 100))
    draw.text((tx, ty), title, font=font_large, fill=(230, 230, 245, 220))

    # "Read" indicator right side
    rx = CANVAS_W - 50
    rbox = draw.textbbox((0, 0), "READ", font=font_small)
    rw = rbox[2] - rbox[0]
    draw.text((rx - rw, ty + 18), "READ", font=font_small, fill=(*theme["accent"], 150))


# ── Watermark ───────────────────────────────────────────────────────────────

def _add_watermark(canvas: Image.Image):
    """Add subtle ThinkFLOW watermark."""
    draw = ImageDraw.Draw(canvas)
    font = _get_font(11, bold=False)
    text = "ThinkFLOW"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = CANVAS_W - tw - 18
    y = 12
    draw.text((x + 1, y + 1), text, font=font, fill=(0, 0, 0, 30))
    draw.text((x, y), text, font=font, fill=(200, 200, 220, 25))


# ── ComfyUI upload / refine ────────────────────────────────────────────────

def _upload_to_comfyui(path: Path) -> bool:
    try:
        with open(path, "rb") as f:
            r = requests.post(
                f"{COMFFYUI_URL}/upload/image",
                files={"image": (path.name, f, "image/png")},
                timeout=30,
            )
        return r.status_code == 200
    except:
        return False


def queue_async_refine(temp_path: Path, slug: str):
    """Queue a ComfyUI refine job (non-blocking). Returns prompt_id or None."""
    REFINE_QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)

    workflow_path = COMFFY_WORKFLOW
    if not workflow_path.exists():
        return None

    try:
        r = requests.get(f"{COMFFYUI_URL}/system_stats", timeout=3)
        if r.status_code != 200:
            return None
    except:
        return None

    # Upload the image
    if not _upload_to_comfyui(temp_path):
        return None

    # Load and inject workflow
    workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
    for node_id, node in workflow.items():
        ct = node.get("class_type", "")
        if ct == "LoadImage":
            node["inputs"]["image"] = temp_path.name
        elif ct == "CLIPTextEncode":
            if "text" in node["inputs"] and not node["inputs"]["text"]:
                node["inputs"]["text"] = "High-end technology dashboard, glass morphism, subtle reflections, professional cinematic lighting, octane render style, depth of field, hyper-detailed textures, no text"
        elif ct == "KSampler":
            node["inputs"]["denoise"] = 0.35
            node["inputs"]["steps"] = 12
            node["inputs"]["seed"] = int(time.time())

    resp = requests.post(f"{COMFFYUI_URL}/prompt", json={"prompt": workflow}, timeout=30)
    result = resp.json()
    if "error" in result:
        return None

    prompt_id = result.get("prompt_id", "")

    # Save to queue
    queue = []
    if REFINE_QUEUE_FILE.exists():
        try:
            queue = json.loads(REFINE_QUEUE_FILE.read_text(encoding="utf-8"))
        except:
            queue = []

    queue.append({
        "slug": slug,
        "prompt_id": prompt_id,
        "temp_path": str(temp_path),
        "queued_at": time.time(),
    })

    REFINE_QUEUE_FILE.write_text(json.dumps(queue, indent=2), encoding="utf-8")
    return prompt_id


# ── Main layout creation ────────────────────────────────────────────────────

def create_premium_layout(
    slug: str,
    affiliates: list[str],
    cluster: str = "",
    title: str = "",
    skip_comfy: bool = False,
) -> Path:
    """Create premium layout and return path to final image."""
    print(f"\n  Creating premium layout for: {slug}")
    print(f"  Affiliates: {', '.join(affiliates)}")
    theme = get_theme(cluster)

    BLOG_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Fetch logos
    logos = []
    valid_affiliates = []
    for aff in affiliates:
        img = fetch_logo(aff)
        logos.append(img)
        if img:
            valid_affiliates.append(aff)

    if not valid_affiliates:
        valid_affiliates = affiliates

    # 2. Background (pool or gradient)
    bg = pick_background()
    if bg:
        bg = bg.resize(OUTPUT_SIZE, Image.LANCZOS)
        canvas = bg.convert("RGB")
    else:
        canvas = _create_gradient_fallback(CANVAS_W, CANVAS_H)
        canvas = _add_texture(canvas)

    canvas = _add_vignette(canvas)

    # 3. Random layout variant
    variant = random.choice(LAYOUT_VARIANTS)

    layout_func = LAYOUT_FUNCS.get(variant, layout_centered)
    layout_func(canvas, logos, valid_affiliates, theme)

    # 4. Watermark
    _add_watermark(canvas)

    # 5. Title
    if title:
        _render_title(canvas, title, theme)

    # 6. Save temp
    temp_path = BLOG_IMAGES_DIR / f"_temp_{slug}.png"
    canvas.save(temp_path, "PNG")

    print(f"  Layout variant: {variant}")
    print(f"  Background: {'pool' if bg else 'gradient'}")
    print(f"  Temp saved: {temp_path.name}")

    # 7. ComfyUI refine (skip or sync)
    if not skip_comfy:
        pid = queue_async_refine(temp_path, slug)
        if pid:
            print(f"  Async refine queued: {pid[:8]}...")
        else:
            print(f"  No refine (ComfyUI busy or unavailable)")

    # 8. Final WebP
    img = Image.open(temp_path).convert("RGB")
    final_path = BLOG_IMAGES_DIR / f"{slug}.webp"
    img.save(final_path, "WEBP", quality=88, method=6)

    print(f"  Final: {final_path.name} ({final_path.stat().st_size / 1024:.1f} KB)")

    # 9. Cleanup temp
    temp_path.unlink(missing_ok=True)

    return final_path


# ── CLI ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate premium blog hero image")
    parser.add_argument("--slug", required=True, help="Article slug")
    parser.add_argument("--affiliates", nargs="+", required=True, help="Affiliate program names")
    parser.add_argument("--cluster", default="", help="Content cluster: AI Infrastructure, Cloud Hosting, DevOps, Web Development")
    parser.add_argument("--title", default="", help="Article title (rendered on the image)")
    parser.add_argument("--skip-comfy", action="store_true", help="Skip ComfyUI refine entirely")

    args = parser.parse_args()

    result = create_premium_layout(
        slug=args.slug,
        affiliates=args.affiliates,
        cluster=args.cluster,
        title=args.title,
        skip_comfy=args.skip_comfy,
    )

    if result:
        print(f"\n== Done: {result}")
        print(f"   URL: /images/blog/{args.slug}.webp")
    else:
        print("\n== Failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
