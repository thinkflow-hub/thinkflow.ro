"""
Expand blog drafts using Gemini 1.5 Flash API (free tier).

Usage:
    python scripts/expand_drafts_gemini.py
    python scripts/expand_drafts_gemini.py --target-word-count 2000
    python scripts/expand_drafts_gemini.py --dry-run

Requires GEMINI_API_KEY in .env.local or environment.
"""

import os
import json
import re
import sys
import argparse
from pathlib import Path
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

DRAFTS_DIR = Path(__file__).parent.parent / "src" / "content" / "blog" / "en" / "_drafts"
EXPANDED_DIR = DRAFTS_DIR / "_expanded"
ENV_FILE = Path(__file__).parent.parent / ".env.local"

GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

DEFAULT_WORD_COUNT = 1500

def load_env():
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return api_key
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

def parse_frontmatter(text):
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)", text, re.DOTALL)
    if match:
        frontmatter = match.group(1)
        content = match.group(2).strip()
        return frontmatter, content
    return None, text.strip()

def extract_title(content):
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    return title_match.group(1) if title_match else "Untitled"

def build_prompt(original_content, original_frontmatter, target_words):
    title = extract_title(original_content) if original_content else "Technical Article"
    content_preview = original_content[:500] if original_content else ""
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
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
        }
    }).encode()

    req = Request(
        f"{GEMINI_API}?key={api_key}",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError(f"No candidates returned: {data}")
            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not text:
                raise RuntimeError(f"Empty text in response: {data}")
            return text
    except HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"API error {e.code}: {body}")

def expand_draft(filepath, api_key, target_words, dry_run):
    print(f"\n{'='*60}")
    print(f">>  {filepath.name}")
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
        print(f"  DRY-RUN: would call Gemini")
        print(f"  Prompt preview: {prompt[:200]}...")
        return True

    print(f"  Calling Gemini 1.5 Flash...")
    try:
        expanded = call_gemini(prompt, api_key)
        expanded_words = len(expanded.split())
        print(f"  OK: Expanded to {expanded_words} words")
    except Exception as e:
        print(f"  ERROR: Gemini error: {e}")
        return False

    expanded_dir.mkdir(parents=True, exist_ok=True)
    out_path = expanded_dir / filepath.name

    if frontmatter:
        final = f"---\n{frontmatter}\n---\n\n{expanded}"
    else:
        final = expanded

    out_path.write_text(final, encoding="utf-8")
    print(f"  SAVED: {out_path.relative_to(Path.cwd())}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Expand blog drafts with Gemini")
    parser.add_argument("--target-word-count", type=int, default=DEFAULT_WORD_COUNT,
                        help=f"Target word count (default: {DEFAULT_WORD_COUNT})")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would be done without calling API")
    args = parser.parse_args()

    api_key = load_env()
    if not api_key and not args.dry_run:
        print("ERROR: GEMINI_API_KEY not found.")
        print(f"   Add to {ENV_FILE}:")
        print("   GEMINI_API_KEY=your_key_here")
        print("   Get a free key at https://aistudio.google.com/apikey")
        sys.exit(1)

    print(f"Scanning drafts in: {DRAFTS_DIR}")
    drafts = sorted(DRAFTS_DIR.glob("*.md"))

    if not drafts:
        print("  No .md files found in _drafts/")
        return

    print(f"  Found {len(drafts)} draft(s)\n")

    success = 0
    for draft in drafts:
        ok = expand_draft(draft, api_key, args.target_word_count, args.dry_run)
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
