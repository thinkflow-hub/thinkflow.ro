from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import requests, os, math, re

FONT_DIR = "D:/WebDev/thinkflow.ro/public/fonts"
OUTPUT = "D:/WebDev/thinkflow.ro/public/logo-inline.svg"

def download_google_font(name, weight):
    css_url = f"https://fonts.googleapis.com/css2?family={name}:wght@{weight}&display=swap"
    r = requests.get(css_url, headers={"User-Agent": "Mozilla/5.0"})
    urls = re.findall(r"url\((https://[^)]+)\)", r.text)
    if urls:
        r2 = requests.get(urls[0], headers={"User-Agent": "Mozilla/5.0"})
        if r2.status_code == 200 and len(r2.content) > 1000:
            path = os.path.join(FONT_DIR, f"{name}-{weight}.ttf")
            with open(path, "wb") as out:
                out.write(r2.content)
            return path
    return None

def get_font_metrics(font_path):
    font = TTFont(font_path)
    upem = font["head"].unitsPerEm
    os2 = font["OS/2"]
    ascent = abs(os2.sTypoAscender or os2.usWinAscent)
    descent = abs(os2.sTypoDescender or 0)
    font.close()
    return upem, ascent, descent

def text_to_paths(text, font_path, target_ascent, letter_spacing=0):
    font = TTFont(font_path)
    glyphset = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    upem, ascent, descent = get_font_metrics(font_path)
    scale = target_ascent / ascent

    paths = []
    current_x = 0

    for char in text:
        glyph_name = cmap.get(ord(char))
        if not glyph_name:
            current_x += target_ascent * 0.5
            continue

        glyph = glyphset[glyph_name]
        pen = SVGPathPen(glyphset)
        glyph.draw(pen)
        path_d = pen.getCommands()

        if path_d:
            paths.append({"d": path_d, "x": current_x})

        advance = hmtx[glyph_name][0]
        current_x += advance * scale + letter_spacing

    font.close()
    return paths, current_x, scale

bscript_path = os.path.join(FONT_DIR, "BlackSignature.otf")
upem, ascent, descent = get_font_metrics(bscript_path)
print(f"BlackSignature OTF - upem={upem}, ascent={ascent}, descent={descent}")

think_paths, think_width, think_scale = text_to_paths("Think", bscript_path, 48)

montserrat_path = os.path.join(FONT_DIR, "Montserrat-ExtraBold.ttf")
if not os.path.exists(montserrat_path):
    print("Downloading Montserrat ExtraBold...")
    montserrat_path = download_google_font("Montserrat", "ExtraBold")

flow_paths, flow_width, flow_scale = text_to_paths("FLOW", montserrat_path, 36, letter_spacing=2)

gap = 14
flow_offset_x = think_width + gap
svg_w = math.ceil(flow_offset_x + flow_width + 4)
svg_h = 64

print(f"Think width: {think_width:.1f}, Flow width: {flow_width:.1f}, Total: {svg_w}x{svg_h}")

svg_parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" fill="none">']

for p in think_paths:
    svg_parts.append(
        f'  <path d="{p["d"]}" fill="#ededed" transform="translate({p["x"]:.2f}, {svg_h - 4}) scale({think_scale:.8f}, -{think_scale:.8f})"/>'
    )

for p in flow_paths:
    svg_parts.append(
        f'  <path d="{p["d"]}" fill="#1e40af" transform="translate({p["x"] + flow_offset_x:.2f}, {svg_h - 4}) scale({flow_scale:.8f}, -{flow_scale:.8f})"/>'
    )

svg_parts.append('</svg>')

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("\n".join(svg_parts))

print(f"Done -> {OUTPUT}")
