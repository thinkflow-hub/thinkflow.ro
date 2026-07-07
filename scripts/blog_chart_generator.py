"""
Blog Chart Generator — benchmark charts for blog articles.

Generates dark-theme charts matching thinkflow.ro design system using matplotlib.

Usage:
    python scripts/blog_chart_generator.py --slug vercel-roi-2026 --title "Monthly Cost at 10TB Bandwidth" --type bar --labels Vercel,Cloudflare,Hetzner --values 850,200,80
    python scripts/blog_chart_generator.py --slug vector-db-latency --title "p99 Latency (ms)" --type bar --labels Pinecone,Qdrant,Weaviate --values 4,3,7 --unit "ms"
    python scripts/blog_chart_generator.py --slug cost-scaling --title "Cost vs Scale" --type line --labels "10K","100K","1M","10M" --values 0,50,200,850 --unit "$"
"""

import argparse
import json
import os
from pathlib import Path

import matplotlib
matplotlib.use("AGG")  # no GUI needed

import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

from PIL import Image

# ── Paths ───────────────────────────────────────────────────────────────────
THINKFLOW_DIR = Path(__file__).parent.parent
BLOG_IMAGES_DIR = THINKFLOW_DIR / "public" / "images" / "blog"
FONTS_DIR = THINKFLOW_DIR / "public" / "fonts"

# ── Dark theme palette ──────────────────────────────────────────────────────
BG_COLOR = "#0a0a0f"
TEXT_COLOR = "#a0a0b0"
ACCENT = "#3b82f6"
ACCENT2 = "#60a5fa"
ACCENT3 = "#93c5fd"
GRID_COLOR = "#1a1a2e"
CARD_BG = "#12121a"

BAR_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#2563eb", "#7dd3fc"]
LINE_COLOR = "#3b82f6"
POINT_COLOR = "#60a5fa"

# ── Font ────────────────────────────────────────────────────────────────────

def _find_font():
    """Try to find a suitable TTF font, return None for default."""
    candidates = [
        FONTS_DIR / "Montserrat" / "Montserrat-Regular.ttf",
        FONTS_DIR / "Montserrat" / "Montserrat-Bold.ttf",
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return None


# ── Chart types ─────────────────────────────────────────────────────────────

def _bar_chart(fig, ax, labels, values, title, unit=""):
    """Draw a vertical bar chart."""
    x = np.arange(len(labels))
    bars = ax.bar(x, values, color=BAR_COLORS[:len(labels)], width=0.6, edgecolor="none", zorder=3)

    # Value labels on bars
    for bar, val in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + max(values) * 0.02,
            f"{val}{unit}" if unit else str(val),
            ha="center", va="bottom",
            fontsize=10, color=TEXT_COLOR,
        )

    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=10, color=TEXT_COLOR)
    ax.set_ylabel(unit, fontsize=10, color=TEXT_COLOR) if unit else None

    _style_axes(ax, title)


def _line_chart(fig, ax, labels, values, title, unit=""):
    """Draw a line chart with filled area."""
    x = np.arange(len(labels))

    ax.plot(x, values, color=LINE_COLOR, linewidth=2.5, marker="o", markersize=6,
            markerfacecolor=POINT_COLOR, markeredgecolor="none", zorder=3)
    ax.fill_between(x, values, alpha=0.08, color=ACCENT, zorder=1)

    # Point labels
    for i, (xi, val) in enumerate(zip(x, values)):
        ax.text(
            xi, val + max(values) * 0.03,
            f"{val}{unit}" if unit else str(val),
            ha="center", va="bottom",
            fontsize=9, color=TEXT_COLOR,
        )

    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=10, color=TEXT_COLOR)
    ax.set_ylabel(unit, fontsize=10, color=TEXT_COLOR) if unit else None
    ax.set_xlim(-0.3, len(labels) - 0.7)

    _style_axes(ax, title)


def _horizontal_bar_chart(fig, ax, labels, values, title, unit=""):
    """Draw a horizontal bar chart (good for rankings)."""
    y = np.arange(len(labels))
    bars = ax.barh(y, values, color=BAR_COLORS[:len(labels)], height=0.5, edgecolor="none", zorder=3)

    for bar, val in zip(bars, values):
        ax.text(
            bar.get_width() + max(values) * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"{val}{unit}" if unit else str(val),
            ha="left", va="center",
            fontsize=10, color=TEXT_COLOR,
        )

    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=10, color=TEXT_COLOR)
    ax.set_xlabel(unit, fontsize=10, color=TEXT_COLOR) if unit else None
    ax.invert_yaxis()

    _style_axes(ax, title)


# ── Axes styling ────────────────────────────────────────────────────────────

def _style_axes(ax, title):
    """Apply dark theme styling to axes."""
    ax.set_facecolor(CARD_BG)
    ax.set_title(title, fontsize=13, color="#e0e0f0", pad=16, fontweight="bold")
    ax.tick_params(colors=TEXT_COLOR, labelsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(GRID_COLOR)
    ax.spines["bottom"].set_color(GRID_COLOR)
    ax.grid(axis="y", color=GRID_COLOR, linewidth=0.5, alpha=0.5)
    ax.set_axisbelow(True)


# ── Main generation ─────────────────────────────────────────────────────────

CHART_TYPES = {
    "bar": _bar_chart,
    "line": _line_chart,
    "hbar": _horizontal_bar_chart,
}


def generate(slug: str, title: str, chart_type: str, labels: list[str], values: list[float], unit: str = "") -> Path:
    """Generate a chart image and return the output path."""
    BLOG_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(8, 5), facecolor=BG_COLOR)

    drawer = CHART_TYPES.get(chart_type)
    if not drawer:
        print(f"  Unknown chart type '{chart_type}', using bar")
        drawer = _bar_chart

    drawer(fig, ax, labels, values, title, unit)

    fig.tight_layout(pad=1.5)

    # Save as PNG first (higher quality temp), then WebP
    temp_path = BLOG_IMAGES_DIR / f"_chart_{slug}.png"
    fig.savefig(temp_path, dpi=144, facecolor=BG_COLOR, edgecolor="none", bbox_inches="tight")
    plt.close(fig)

    # Convert to WebP
    img = Image.open(temp_path).convert("RGB")
    output_path = BLOG_IMAGES_DIR / f"{slug}-ch1.webp"
    img.save(output_path, "WEBP", quality=88, method=6)

    # Cleanup temp
    temp_path.unlink(missing_ok=True)

    print(f"  Chart saved: {output_path}")
    print(f"  Size: {output_path.stat().st_size / 1024:.1f} KB")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Generate benchmark chart for blog articles")
    parser.add_argument("--slug", required=True, help="Article slug")
    parser.add_argument("--title", required=True, help="Chart title")
    parser.add_argument("--type", default="bar", choices=["bar", "line", "hbar"], help="Chart type")
    parser.add_argument("--labels", required=True, help="Comma-separated labels (e.g. Vercel,Cloudflare,Hetzner)")
    parser.add_argument("--values", required=True, help="Comma-separated numeric values (e.g. 850,200,80)")
    parser.add_argument("--unit", default="", help="Unit suffix (e.g. $, ms, %)")
    parser.add_argument("--nth", default=1, type=int, help="Chart sequence number (default 1 → slug-ch1.webp)")

    args = parser.parse_args()

    labels = [l.strip() for l in args.labels.split(",")]
    values = [float(v.strip()) for v in args.values.split(",")]

    if len(labels) != len(values):
        print(f"Error: {len(labels)} labels but {len(values)} values")
        sys.exit(1)

    result = generate(args.slug, args.title, args.type, labels, values, args.unit)
    if result:
        print(f"\nDone: {result}")
    else:
        print("\nFailed")
        sys.exit(1)


if __name__ == "__main__":
    main()
