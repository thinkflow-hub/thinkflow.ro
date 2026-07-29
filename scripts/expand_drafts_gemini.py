"""
Expand blog drafts using Gemini 2.0 Flash (free) or OpenRouter fallback.

Usage:
    python scripts/expand_drafts_gemini.py
    python scripts/expand_drafts_gemini.py --provider openrouter
    python scripts/expand_drafts_gemini.py --dry-run
    python scripts/expand_drafts_gemini.py --target-word-count 2000

Requires GEMINI_API_KEY or OPENROUTER_API_KEY in .env.local or environment.
"""

import os
import json
import re
import sys
import time
import argparse
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

DRAFTS_DIR = Path(__file__).parent.parent / "src" / "content" / "blog" / "en" / "_drafts"
EXPANDED_DIR = DRAFTS_DIR / "_expanded"
ENV_FILE = Path(__file__).parent.parent / ".env.local"

GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"

DEFAULT_WORD_COUNT = 1500

def load_env(key_name):
    val = os.environ.get(key_name)
    if val:
        return val
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith(f"{key_name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

def parse_frontmatter(text):
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)", text, re.DOTALL)
    if match:
        return match.group(1), match.group(2).strip()
    return None, text.strip()

def extract_title(content):
    m = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    return m.group(1) if m else "Untitled"

def build_prompt(original_content, original_frontmatter, target_words):
    title = extract_title(original_content) if original_content else "Technical Article"
    return f"""You are a technical writer. Expand this article to at least {target_words} words.

Keep the same:
- Technical depth and accuracy
- Voice and tone (professional, direct)
- Structure (headings, lists, code blocks)
- Markdown formatting

Do NOT add:
- Fictional statistics or made-up claims
- Affiliate links (we add those separately)
- Disclaimer text (we have it site-wide)

Original title: {title}

Original content:
{original_content}

Write the expanded version below. Start with the title as H1 (#), then the full article."""

def call_gemini(prompt, api_key):
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192}
    }).encode()
    req = Request(f"{GEMINI_API}?key={api_key}", data=payload,
                  headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read())
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError(f"No candidates: {data}")
        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not text:
            raise RuntimeError(f"Empty text: {data}")
        return text

def call_openrouter(prompt, api_key):
    payload = json.dumps({
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 8192,
        "temperature": 0.7,
    }).encode()
    req = Request(OPENROUTER_API, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }, method="POST")
    with urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read())
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError(f"No choices: {data}")
        text = choices[0].get("message", {}).get("content", "")
        if not text:
            raise RuntimeError(f"Empty text: {data}")
        return text

def expand_draft(filepath, api_key, provider, target_words, dry_run):
    print(f"\n{'='*60}")
    print(f">>  {filepath.name}  [{provider}]")
    print(f"{'='*60}")

    try:
        raw = filepath.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  ERROR: Read error: {e}")
        return False

    frontmatter, content = parse_frontmatter(raw)
    word_count = len(content.split())

    if word_count >= target_words:
        print(f"  OK: Already {word_count} words (target: {target_words}) -- skipping")
        return True

    print(f"  Words: {word_count} -> target: {target_words}")
    prompt = build_prompt(content, frontmatter, target_words)

    if dry_run:
        print(f"  DRY-RUN: would call {provider}")
        print(f"  Prompt preview: {prompt[:200]}...")
        return True

    caller = call_gemini if provider == "gemini" else call_openrouter

    for attempt in range(3):
        try:
            print(f"  Calling {provider} (attempt {attempt+1})...")
            expanded = caller(prompt, api_key)
            expanded_words = len(expanded.split())
            print(f"  OK: Expanded to {expanded_words} words")
            break
        except HTTPError as e:
            body = e.read().decode()
            if e.code == 429 and attempt < 2:
                wait = 45
                print(f"  RATE-LIMITED (429), retrying in {wait}s...")
                time.sleep(wait)
                continue
            print(f"  ERROR: {e.code}: {body[:200]}")
            return False
        except Exception as e:
            print(f"  ERROR: {e}")
            return False
    else:
        print(f"  ERROR: Failed after 3 attempts")
        return False

    EXPANDED_DIR.mkdir(parents=True, exist_ok=True)
    out_path = EXPANDED_DIR / filepath.name

    if frontmatter:
        final = f"---\n{frontmatter}\n---\n\n{expanded}"
    else:
        final = expanded

    out_path.write_text(final, encoding="utf-8")
    print(f"  SAVED: {out_path.relative_to(Path.cwd())}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Expand blog drafts with AI")
    parser.add_argument("--target-word-count", type=int, default=DEFAULT_WORD_COUNT)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--provider", choices=["gemini", "openrouter"], default="gemini")
    args = parser.parse_args()

    if args.provider == "openrouter":
        api_key = load_env("OPENROUTER_API_KEY")
        if not api_key and not args.dry_run:
            print("ERROR: OPENROUTER_API_KEY not found in .env.local")
            sys.exit(1)
        label = f"OpenRouter ({OPENROUTER_MODEL})"
    else:
        api_key = load_env("GEMINI_API_KEY")
        if not api_key and not args.dry_run:
            print("ERROR: GEMINI_API_KEY not found.")
            print("  Add to .env.local: GEMINI_API_KEY=your_key")
            print("  Get one at https://aistudio.google.com/apikey")
            print("  Or use: --provider openrouter (needs OPENROUTER_API_KEY)")
            sys.exit(1)
        label = "Gemini 2.0 Flash"

    print(f"Provider: {label}")
    print(f"Target:   {args.target_word_count} words")
    print(f"Drafts:   {DRAFTS_DIR}")

    drafts = sorted(DRAFTS_DIR.glob("*.md"))
    if not drafts:
        print("  No .md files found in _drafts/")
        return

    print(f"  Found {len(drafts)} draft(s)\n")

    success = 0
    for draft in drafts:
        ok = expand_draft(draft, api_key, args.provider, args.target_word_count, args.dry_run)
        if ok:
            success += 1

    print(f"\n{'='*60}")
    if args.dry_run:
        print(f"Dry-run complete. {success}/{len(drafts)} would be processed.")
    else:
        print(f"Done. {success}/{len(drafts)} articles expanded -> {EXPANDED_DIR}")
        print(f"   Review and move back to ../ when ready.")

if __name__ == "__main__":
    main()
