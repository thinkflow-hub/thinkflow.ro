"""
Publish script — copies a SEO Factory article to thinkflow.ro blog and rebuilds.

Usage:
    python scripts/publish.py <article_dir>
    python scripts/publish.py E:\ContentFactory\seo_factory\outputs\6A6C2552_best_vector_database_for_RAG_i

The article_dir must contain:
    - _meta.json   (title, keyword, niche, affiliate_programs, word_count)
    - index.md     (article body in markdown)

Output: slug (e.g., "best-vector-database-rag-2026") printed to stdout.
"""

import json
import re
import sys
import subprocess
from datetime import datetime
from pathlib import Path


BLOG_DIR = Path(__file__).parent.parent / "src" / "content" / "blog"
SITE_DIR = Path(__file__).parent.parent


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:80]


def build_frontmatter(meta: dict, slug: str = "") -> str:
    keyword = meta.get("keyword", "Article")
    niche = meta.get("niche", "General")
    tags = [t.strip().lower().replace(" ", "-") for t in niche.replace(",", " ").split() if t.strip()]
    affiliate_programs = meta.get("affiliate_programs", [])
    word_count = meta.get("word_count", 0)
    description = meta.get("description", f"GEO-optimized comparison of {keyword}.")

    lines = ["---"]
    lines.append(f'title: "{keyword}"')
    lines.append(f'description: "{description[:160]}"')
    lines.append(f'date: "{datetime.now().strftime("%Y-%m-%d")}"')
    lines.append(f"category: \"{niche.split(',')[0].strip() if ',' in niche else niche}\"")
    lines.append(f"tags: {json.dumps(tags[:8])}")
    lines.append(f"affiliatePrograms: {json.dumps(affiliate_programs)}")
    if slug:
        lines.append(f'image: "/images/blog/{slug}.webp"')
    lines.append("---")
    return "\n".join(lines)


def publish(article_dir: str) -> str:
    art = Path(article_dir)
    if not art.is_dir():
        print(f"❌ Not a directory: {article_dir}", file=sys.stderr)
        sys.exit(1)

    meta_file = art / "_meta.json"
    index_file = art / "index.md"

    if not meta_file.exists():
        print(f"❌ Missing _meta.json in {article_dir}", file=sys.stderr)
        sys.exit(1)

    if not index_file.exists():
        print(f"❌ Missing index.md in {article_dir}", file=sys.stderr)
        sys.exit(1)

    meta = json.loads(meta_file.read_text(encoding="utf-8"))
    body = index_file.read_text(encoding="utf-8")

    keyword = meta.get("keyword", "Article")
    slug = slugify(keyword)

    # Remove existing frontmatter from body if present (Scribe sometimes adds it)
    body = re.sub(r"^---\n.*?\n---\n", "", body, flags=re.DOTALL).strip()

    frontmatter = build_frontmatter(meta, slug)
    full_content = f"{frontmatter}\n\n{body}\n"

    # Add affiliate disclosure footer if not present
    if "affiliate disclosure" not in body.lower():
        full_content += (
            "\n\n**Affiliate Disclosure:** This post contains affiliate links. "
            "If you choose to purchase through these links, we may earn a commission "
            "at no additional cost to you. We recommend products based on engineering "
            "merit and real-world testing, not just affiliate payouts."
        )

    # Write to blog directory
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    out_path = BLOG_DIR / f"{slug}.md"
    out_path.write_text(full_content, encoding="utf-8")

    print(f"== Published: {out_path.name}")
    print(f"   Title: {keyword}")
    print(f"   Slug: {slug}")
    print(f"   Words: {meta.get('word_count', '?')}")
    print(f"   Affiliates: {', '.join(meta.get('affiliate_programs', []))}")

    # Generate blog hero image (PIL composit on Flux bg — instant)
    affiliates = meta.get("affiliate_programs", [])
    if affiliates:
        keyword = meta.get("keyword", "")
        niche = meta.get("niche", "General")
        cluster = niche.split(",")[0].strip() if "," in niche else niche
        print(f"\n   Generating hero image for {slug}...")
        try:
            result = subprocess.run(
                [
                    sys.executable,
                    str(SITE_DIR / "scripts" / "blog_image_generator.py"),
                    "--slug", slug,
                    "--affiliates", *affiliates,
                    "--cluster", cluster,
                    "--title", keyword[:60],
                ],
                capture_output=True, text=True, timeout=120,
            )
            if result.returncode == 0:
                print(f"   Image: /images/blog/{slug}.webp")
            else:
                print(f"   Image generation stderr: {result.stderr.strip()}")
        except Exception as e:
            print(f"   Image generation error: {e}")

    return slug


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/publish.py <article_dir>", file=sys.stderr)
        sys.exit(1)

    slug = publish(sys.argv[1])
    print(slug)  # stdout — used by telegram_bridge
