"""
Generate Flux backgrounds for blog hero images.

Batch generates 20 backgrounds (5 per cluster) using ComfyUI Flux img2img.
Run overnight: python scripts/generate_backgrounds.py

Output: public/images/blog/backgrounds/bg-{01..20}.webp
"""

import io
import json
import sys
import time
from pathlib import Path

import requests
from PIL import Image, ImageDraw

THINKFLOW_DIR = Path(__file__).parent.parent
BG_DIR = THINKFLOW_DIR / "public" / "images" / "blog" / "backgrounds"
TEMP_DIR = THINKFLOW_DIR / "public" / "images" / "blog"

OPENCLAW_DIR = Path("M:/thinkflow/openclaw")
COMFFY_WORKFLOW = OPENCLAW_DIR / "comfy_workflows" / "flux_img2img.json"
COMFFYUI_URL = "http://127.0.0.1:8188"

CANVAS_W = 1200
CANVAS_H = 630

CLUSTER_PROMPTS = {
    "ai": (
        "Abstract AI infrastructure visualization, deep navy blue gradient background, "
        "glowing neural network nodes connected by thin cyan lines, floating geometric data particles, "
        "soft volumetric lighting, high-end technology aesthetic, cinematic depth of field, "
        "clean professional composition, no text, no letters, 8k quality"
    ),
    "cloud": (
        "Abstract cloud hosting infrastructure visualization, dark charcoal to teal gradient, "
        "glowing data streams flowing diagonally, floating server nodes in deep space, "
        "subtle cyan and blue volumetric lighting, high-end technology aesthetic, "
        "cinematic atmosphere, clean professional composition, no text, no letters, 8k quality"
    ),
    "devops": (
        "Abstract DevOps infrastructure visualization, dark purple to navy gradient, "
        "glowing pipeline nodes connected by flowing light trails, floating container icons, "
        "subtle purple and blue volumetric lighting, high-end technology aesthetic, "
        "cinematic depth, clean professional composition, no text, no letters, 8k quality"
    ),
    "web": (
        "Abstract web development visualization, dark teal to navy gradient, "
        "glowing code particles floating in deep space, geometric web-like structures, "
        "subtle cyan and teal volumetric lighting, high-end technology aesthetic, "
        "cinematic atmosphere, clean professional composition, no text, no letters, 8k quality"
    ),
}


def create_gradient_input() -> Path:
    """Create a simple gradient PIL image for ComfyUI img2img input."""
    img = Image.new("RGB", (CANVAS_W, CANVAS_H))
    for y in range(CANVAS_H):
        t = y / CANVAS_H
        r = int(10 * (1 - t) + 2 * t)
        g = int(10 * (1 - t) + 2 * t)
        b = int(30 * (1 - t) + 8 * t)
        for x in range(CANVAS_W):
            img.putpixel((x, y), (r, g, b))

    # Subtle noise
    from random import randint
    px = img.load()
    for _ in range(int(CANVAS_W * CANVAS_H * 0.02)):
        x = randint(0, CANVAS_W - 1)
        y = randint(0, CANVAS_H - 1)
        r, g, b = px[x, y]
        o = randint(-6, 6)
        px[x, y] = (max(0, min(255, r + o)), max(0, min(255, g + o)), max(0, min(255, b + o)))

    path = TEMP_DIR / "_bg_input.png"
    img.save(path)
    return path


def check_comfyui() -> bool:
    try:
        r = requests.get(f"{COMFFYUI_URL}/system_stats", timeout=5)
        return r.status_code == 200
    except:
        return False


def generate_background(prompt: str, seed: int, index: int) -> bool:
    """Generate one background image via ComfyUI Flux img2img."""
    print(f"\n[{index}/20] Generating background (seed={seed})...")

    # Load workflow
    workflow = json.loads(COMFFY_WORKFLOW.read_text(encoding="utf-8"))

    # Inject params
    for node_id, node in workflow.items():
        ct = node.get("class_type", "")
        if ct == "LoadImage":
            node["inputs"]["image"] = "_bg_input.png"
        elif ct == "CLIPTextEncode":
            if "text" in node["inputs"] and node["inputs"]["text"] == "":
                if node["inputs"]["text"] == "":
                    node["inputs"]["text"] = prompt
                elif "blurry" not in node["inputs"].get("text", ""):
                    node["inputs"]["text"] = prompt
        elif ct == "KSampler":
            node["inputs"]["seed"] = seed
            node["inputs"]["denoise"] = 0.8
            node["inputs"]["steps"] = 15

    # Upload input image
    input_path = TEMP_DIR / "_bg_input.png"
    with open(input_path, "rb") as f:
        upload = requests.post(
            f"{COMFFYUI_URL}/upload/image",
            files={"image": ("_bg_input.png", f, "image/png")},
            timeout=30,
        )
    if upload.status_code != 200:
        print(f"  Upload failed: HTTP {upload.status_code}")
        return False

    # Queue prompt
    try:
        resp = requests.post(
            f"{COMFFYUI_URL}/prompt",
            json={"prompt": workflow},
            timeout=30,
        )
        result = resp.json()
        if "error" in result:
            print(f"  ComfyUI error: {result['error']}")
            return False
        prompt_id = result.get("prompt_id", "")
    except Exception as e:
        print(f"  Prompt error: {e}")
        return False

    # Poll for completion
    for attempt in range(90):
        time.sleep(3)
        try:
            status = requests.get(f"{COMFFYUI_URL}/history/{prompt_id}", timeout=10)
            if status.status_code == 200:
                history = status.json()
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for node_id, node_outputs in outputs.items():
                        for img_data in node_outputs.get("images", []):
                            filename = img_data.get("filename", "")
                            subfolder = img_data.get("subfolder", "")
                            img_url = f"{COMFFYUI_URL}/view?filename={filename}&subfolder={subfolder}&type=output"
                            img_resp = requests.get(img_url, timeout=30)
                            if img_resp.status_code == 200:
                                bg_path = BG_DIR / f"bg-{index:02d}.webp"
                                img = Image.open(io.BytesIO(img_resp.content)).convert("RGB")
                                img = img.resize((CANVAS_W, CANVAS_H), Image.LANCZOS)
                                img.save(bg_path, "WEBP", quality=90, method=6)
                                print(f"  Saved: {bg_path.name} ({bg_path.stat().st_size / 1024:.1f} KB)")
                                return True
                    break
        except:
            continue
        if attempt % 10 == 0 and attempt > 0:
            print(f"  Waiting... ({attempt * 3}s)")

    print(f"  No output from ComfyUI (seed={seed})")
    return False


def main():
    print("=== ThinkFLOW Background Generator ===")
    print(f"Output: {BG_DIR}")
    print(f"Count: 20 backgrounds (5 per cluster)")
    print()

    if not check_comfyui():
        print("ERROR: ComfyUI is not running at", COMFFYUI_URL)
        sys.exit(1)

    BG_DIR.mkdir(parents=True, exist_ok=True)

    # Create input gradient
    gradient_path = create_gradient_input()
    print(f"Input gradient created: {gradient_path}")

    # Generate backgrounds per cluster
    import random
    random.seed(42)

    index = 1
    successes = 0

    cluster_list = ["ai", "ai", "ai", "ai", "ai", "cloud", "cloud", "cloud", "cloud", "cloud",
                    "devops", "devops", "devops", "devops", "devops", "web", "web", "web", "web", "web"]

    for cluster in cluster_list:
        prompt = CLUSTER_PROMPTS[cluster]
        seed = random.randint(100000, 999999)
        if generate_background(prompt, seed, index):
            successes += 1
        index += 1

    # Cleanup
    gradient_path.unlink(missing_ok=True)

    print(f"\n=== Done: {successes}/20 backgrounds generated ===")
    print(f"Location: {BG_DIR}")

    if successes < 20:
        print(f"WARNING: {20 - successes} backgrounds failed. Re-run to fill gaps.")
        sys.exit(1)


if __name__ == "__main__":
    main()
