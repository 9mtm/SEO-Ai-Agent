"""
SEO Agent Brand Image Generator (forked from Flowxtra v3)
Standalone copy — lives in this repo, does NOT touch the Flowxtra source.
Generates branded blog banners and social images for seo-agent.net.

Supported formats:
  - blog    1200×630   (Open Graph / blog featured image — DEFAULT)
  - square  1080×1080  (Instagram/Facebook feed post)
  - story   1080×1920  (Instagram/Facebook/TikTok story or vertical reel still)

Usage:
    python generate_blog_banner.py --title "..." --emoji "🚀" --tag "FR" --out banner.png
    python generate_blog_banner.py --title "..." --format square --out post.png
    python generate_blog_banner.py --title "..." --format story  --out story.png

ROADMAP (NOT IMPLEMENTED YET):
  - --format reel-mp4  (animated vertical reel with text/icon animations)
    Will use PIL frame-by-frame + ffmpeg compositing. Pillow alone can't
    produce MP4. Plan: render N frames as PNG (intro slide-in, idle loop,
    outro fade), call ffmpeg from Python to combine into 1080×1920 MP4 at 30fps.
"""

import argparse
import json
import math
import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# RTL (Arabic / Hebrew) text shaping support
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    _RTL_AVAILABLE = True
except ImportError:
    _RTL_AVAILABLE = False


def is_rtl(text):
    """Return True if text contains Arabic or Hebrew characters."""
    if not text:
        return False
    for ch in text:
        cp = ord(ch)
        # Arabic, Arabic Supplement, Arabic Extended-A, Arabic Presentation Forms, Hebrew
        if (0x0590 <= cp <= 0x05FF) or (0x0600 <= cp <= 0x06FF) \
           or (0x0750 <= cp <= 0x077F) or (0x08A0 <= cp <= 0x08FF) \
           or (0xFB1D <= cp <= 0xFDFF) or (0xFE70 <= cp <= 0xFEFF):
            return True
    return False


def shape_for_display(text):
    """Reshape Arabic/Hebrew text and apply bidi algorithm for correct visual order.
    Returns text unchanged if not RTL or libs unavailable."""
    if not text or not _RTL_AVAILABLE or not is_rtl(text):
        return text
    try:
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except Exception:
        return text

# ── SEO Agent brand ──────────────────────────────────────────────────
BRAND_TEAL = "#4F46E5"        # indigo-600 (primary brand)
BRAND_TEAL_DARK = "#312E81"   # indigo-900
BRAND_TEAL_BRIGHT = "#818CF8" # indigo-400
BRAND_AMBER = "#F59E0B"
BRAND_AMBER_BRIGHT = "#FBBF24"

WHITE = "#F8FAFC"
WHITE_DIM = "#CBD5E1"

# Asset paths — relative to repo root so it works locally and on the server
_HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.environ.get("SEO_AGENT_BRAND_DIR", os.path.normpath(os.path.join(_HERE, "..", "public", "brand")))
LOGO_WHITE = os.path.join(ASSETS, "logos", "seo-agent-white.png")
LOGO_COLOR = os.path.join(ASSETS, "logos", "seo-agent-color.png")
ICON_WHITE = os.path.join(ASSETS, "icons", "icon-white.png")
ICON_COLOR = os.path.join(ASSETS, "icons", "icon-color.png")
LIBRARY = os.path.join(ASSETS, "library.json")
BRAND_URL = "seo-agent.net"

PALETTES = {
    "teal":    {"bg_top": "#062F38", "bg_bot": BRAND_TEAL,    "accent": BRAND_TEAL_BRIGHT, "highlight": BRAND_AMBER},
    "navy":    {"bg_top": "#0A1628", "bg_bot": "#0E3A52",     "accent": BRAND_TEAL_BRIGHT, "highlight": BRAND_AMBER},
    "indigo":  {"bg_top": "#1E1B4B", "bg_bot": "#312E81",     "accent": "#A78BFA",         "highlight": BRAND_AMBER_BRIGHT},
    "forest":  {"bg_top": "#022C22", "bg_bot": "#064E3B",     "accent": "#10B981",         "highlight": BRAND_AMBER_BRIGHT},
    "wine":    {"bg_top": "#1A0F1F", "bg_bot": "#581C87",     "accent": "#EC4899",         "highlight": BRAND_AMBER_BRIGHT},
    "carbon":  {"bg_top": "#020617", "bg_bot": "#0F172A",     "accent": "#10B981",         "highlight": BRAND_TEAL_BRIGHT},
    "overlay": {"bg_top": "#212B36", "bg_bot": "#212B36",     "accent": BRAND_TEAL,        "highlight": BRAND_AMBER},
}

# Format dimensions
FORMATS = {
    "blog":     {"w": 1200, "h": 630,  "label": "Open Graph blog header"},
    "square":   {"w": 1080, "h": 1080, "label": "Instagram/Facebook feed post"},
    "story":    {"w": 1080, "h": 1920, "label": "Instagram/TikTok story / vertical reel still"},
    "reel-mp4": {"w": 1080, "h": 1920, "label": "Instagram Reel / TikTok / YouTube Short — 1080x1920 4s @ 30fps animated MP4"},
}

def _find_font(candidates):
    """Return the first existing font path from a list, or None."""
    for p in candidates:
        if p and os.path.exists(p):
            return p
    return None

FONT_BOLD = _find_font([
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/google-droid/DroidSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/liberation-sans/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
])
FONT_REG = _find_font([
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/google-droid/DroidSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]) or FONT_BOLD
FONT_EMOJI = _find_font([
    "C:/Windows/Fonts/seguiemj.ttf",
    "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
    "/System/Library/Fonts/Apple Color Emoji.ttc",
])  # may be None — emoji is auto-skipped if missing
if not FONT_BOLD:
    raise SystemExit("No system font found — install dejavu-sans or liberation-sans on Linux.")


# ── Mockup library — auto-pick the best image for an article ────────

def _load_library():
    """Load library.json. Returns empty if missing."""
    if not os.path.exists(LIBRARY):
        return {"assets": []}
    try:
        with open(LIBRARY, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"assets": []}


def _score_asset(asset, search_text, fmt, canvas_h):
    """
    Score how well an asset matches the article context.
    Higher = better. 0 = unsuitable.
    """
    # Format compatibility
    use_for = asset.get("use_for", ["*"])
    if "*" not in use_for and fmt not in use_for:
        return 0
    # Min canvas size gate
    if asset.get("min_format_height", 0) > canvas_h:
        return 0
    # Asset file must exist
    p = os.path.join(ASSETS, asset["path"])
    if not os.path.exists(p):
        return 0
    # Score by keyword overlap
    score = 0
    text_lc = search_text.lower()
    for kw in asset.get("keywords", []):
        kw_lc = kw.lower()
        if kw_lc in text_lc:
            # longer keyword matches score higher (more specific)
            score += len(kw_lc.split()) * 2
    return score


def pick_mockup(title, tag, fmt, canvas_h, mockup_pref="auto"):
    """
    Pick a mockup image from the library based on title + tag keywords.

    mockup_pref:
      'auto'  — pick best match by keywords; if no match, returns None
      'none'  — never pick a mockup
      'force' — pick any available asset (best by score, else first)
      <name>  — try to match a specific keyword like 'social-manager' or
                a path fragment like 'social-media-manager'
    Returns (asset_dict, abs_path) or (None, None).
    """
    if mockup_pref == "none":
        return None, None
    lib = _load_library()
    assets = lib.get("assets", [])
    if not assets:
        return None, None

    if mockup_pref not in ("auto", "force"):
        # Explicit name — match by path fragment first, then keywords
        for a in assets:
            if mockup_pref.lower() in a["path"].lower():
                p = os.path.join(ASSETS, a["path"])
                if os.path.exists(p):
                    return a, p
        # Fall through to keyword matching with the explicit name as search text
        search_text = mockup_pref
    else:
        search_text = f"{title or ''} {tag or ''}"

    scored = [(asset, _score_asset(asset, search_text, fmt, canvas_h)) for asset in assets]
    scored = [(a, s) for a, s in scored if s > 0]
    if scored:
        scored.sort(key=lambda x: -x[1])
        best = scored[0][0]
        return best, os.path.join(ASSETS, best["path"])

    # No keyword matches
    if mockup_pref == "force":
        # Use the first compatible asset
        for a in assets:
            p = os.path.join(ASSETS, a["path"])
            if (("*" in a.get("use_for", ["*"]) or fmt in a.get("use_for", []))
                    and a.get("min_format_height", 0) <= canvas_h
                    and os.path.exists(p)):
                return a, p
    return None, None


def paste_mockup_on_image(img, mockup_path, anchor, palette, fmt):
    """
    Paste a mockup screenshot/photo into the banner with a tasteful frame
    (rounded corners, subtle shadow, accent border). Layout depends on format.
    """
    if not mockup_path or not os.path.exists(mockup_path):
        return img
    try:
        mockup = Image.open(mockup_path).convert("RGBA")
    except Exception:
        return img
    w, h = img.size

    # Decide target box per format
    if fmt == "blog":
        # Right-side card (40% width, 60% height)
        target_w = int(w * 0.42)
        target_h = int(h * 0.60)
        pos_x = w - target_w - 60
        pos_y = (h - target_h) // 2 - 20
    elif fmt == "square":
        # Centered band, narrower than full width
        target_w = int(w * 0.74)
        target_h = int(h * 0.30)
        pos_x = (w - target_w) // 2
        pos_y = int(h * 0.10)
    elif fmt == "story":
        # Centered upper-third, leaves space for title and CTA below
        target_w = int(w * 0.78)
        target_h = int(h * 0.26)
        pos_x = (w - target_w) // 2
        pos_y = int(h * 0.07)
    elif fmt == "reel-mp4":
        # Same placement as story (the reel renderer composites this onto bg)
        target_w = int(w * 0.78)
        target_h = int(h * 0.26)
        pos_x = (w - target_w) // 2
        pos_y = int(h * 0.07)
    else:
        return img

    # Resize keeping aspect — fit inside target box (letterbox style)
    src_aspect = mockup.width / mockup.height
    tgt_aspect = target_w / target_h
    if src_aspect > tgt_aspect:
        # mockup is wider — fit by width
        new_w = target_w
        new_h = int(target_w / src_aspect)
    else:
        new_h = target_h
        new_w = int(target_h * src_aspect)
    mockup_r = mockup.resize((new_w, new_h), Image.LANCZOS)

    # Center inside target box
    cx = pos_x + (target_w - new_w) // 2
    cy = pos_y + (target_h - new_h) // 2

    # Round corners on the mockup
    radius = 18
    mask = Image.new("L", mockup_r.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, new_w, new_h], radius=radius, fill=255)
    mockup_r.putalpha(mask)

    # Soft shadow underneath
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [cx + 6, cy + 12, cx + new_w + 6, cy + new_h + 12],
        radius=radius, fill=(0, 0, 0, 130)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))

    # Composite shadow + mockup
    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, shadow)
    img_rgba.paste(mockup_r, (cx, cy), mockup_r)

    # Subtle accent stroke around the mockup
    border = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    accent = hex_to_rgb(palette["accent"])
    bd.rounded_rectangle(
        [cx, cy, cx + new_w, cy + new_h],
        radius=radius, outline=(*accent, 110), width=3
    )
    img_rgba = Image.alpha_composite(img_rgba, border)
    return img_rgba.convert("RGB")


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def make_gradient(top, bot, w, h):
    """Vertical gradient — fast row-by-row fill."""
    img = Image.new("RGB", (w, h), top)
    draw = ImageDraw.Draw(img)
    t = hex_to_rgb(top)
    b = hex_to_rgb(bot)
    for y in range(h):
        ratio = y / (h - 1)
        r = int(t[0] + (b[0] - t[0]) * ratio)
        g = int(t[1] + (b[1] - t[1]) * ratio)
        bcol = int(t[2] + (b[2] - t[2]) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, bcol))
    return img


def add_decorative_layer(img, palette, seed=0):
    """Glow blobs + dot grid + diagonal accents — auto-scales with image size."""
    w, h = img.size
    # Scaling factor relative to the original 1200×630 design
    sx, sy = w / 1200.0, h / 630.0
    sm = min(sx, sy)

    random.seed(seed)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    accent = hex_to_rgb(palette["accent"])
    highlight = hex_to_rgb(palette["highlight"])

    # Big accent glow on right (or top-right for tall formats)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([w - int(380*sx), -int(120*sy), w + int(220*sx), int(480*sy)], fill=(*accent, 80))
    glow = glow.filter(ImageFilter.GaussianBlur(int(90*sm)))
    overlay = Image.alpha_composite(overlay, glow)

    # Smaller highlight glow bottom-right
    glow2 = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow2).ellipse(
        [w - int(280*sx), h - int(220*sy), w - int(30*sx), h + int(100*sy)],
        fill=(*highlight, 55))
    glow2 = glow2.filter(ImageFilter.GaussianBlur(int(70*sm)))
    overlay = Image.alpha_composite(overlay, glow2)

    od = ImageDraw.Draw(overlay)
    cell = max(20, int(26 * sm))
    # Faint dot grid lower-right
    for gx in range(w - int(400*sx), w - int(30*sx), cell):
        for gy in range(h - int(290*sy), h - int(30*sy), cell):
            od.ellipse([gx-1, gy-1, gx+1, gy+1], fill=(*accent, 95))

    # Diagonal accent lines top-right
    for i in range(6):
        offset = int(38 * sx) * i
        od.line(
            [(w - int(420*sx) + offset, 0), (w + int(100*sx), int(520*sy) - offset)],
            fill=(*accent, 65 - i*8), width=max(1, int(2*sm))
        )

    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def add_overlay_shadow_layer(img, palette, seed=0):
    """Charcoal + brand-teal glow + grid (recreated from overlay-shadow.svg)."""
    w, h = img.size
    sx, sy = w / 1200.0, h / 630.0
    sm = min(sx, sy)

    random.seed(seed)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    teal = hex_to_rgb(BRAND_TEAL)
    highlight = hex_to_rgb(palette["highlight"])

    # Big teal glow centered upper area
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx = w // 2 + random.randint(-int(100*sx), int(100*sx))
    cy = -int(50*sy) + random.randint(-int(30*sy), int(30*sy))
    rx, ry = int(520*sx), int(340*sy)
    gd.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(*teal, 200))
    glow = glow.filter(ImageFilter.GaussianBlur(int(110*sm)))
    overlay = Image.alpha_composite(overlay, glow)

    # Subtle white grid (matches the SVG: 0.13 opacity stroke)
    grid = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    cell = max(30, int(50 * sm))
    grid_color = (255, 255, 255, 25)
    grid_x_start = w // 2 + int(100 * sx)
    for x in range(grid_x_start, w + int(50*sx), cell):
        gd.line([(x, 0), (x, h)], fill=grid_color, width=1)
    grid_y_start = int(80 * sy)
    for y in range(grid_y_start, h, cell):
        gd.line([(grid_x_start, y), (w, y)], fill=grid_color, width=1)

    # Radial fade mask
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    fade_cx, fade_cy = w - int(200*sx), int(200*sy)
    fade_r = int(450 * sm)
    for r in range(fade_r, 0, -max(1, int(8*sm))):
        alpha = int(160 * (1 - r / fade_r))
        md.ellipse([fade_cx - r, fade_cy - r, fade_cx + r, fade_cy + r], fill=alpha)
    mask = mask.filter(ImageFilter.GaussianBlur(int(20*sm)))
    grid.putalpha(Image.eval(mask, lambda v: v))
    overlay = Image.alpha_composite(overlay, grid)

    # Tiny amber accent glow bottom-left
    warm = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(warm).ellipse(
        [-int(100*sx), h - int(200*sy), int(350*sx), h + int(150*sy)],
        fill=(*highlight, 35))
    warm = warm.filter(ImageFilter.GaussianBlur(int(80*sm)))
    overlay = Image.alpha_composite(overlay, warm)

    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def paste_logo_icon(img, palette, position, size):
    """Paste tinted brand icon mark at given (x, y) absolute position."""
    if not os.path.exists(ICON_WHITE):
        return img
    icon = Image.open(ICON_WHITE).convert("RGBA")
    aspect = icon.width / icon.height
    icon_h = size
    icon_w = int(size * aspect)
    icon = icon.resize((icon_w, icon_h), Image.LANCZOS)

    accent = hex_to_rgb(palette["accent"])
    icon_alpha = icon.split()[3]
    solid = Image.new("RGBA", icon.size, (*accent, 255))
    solid.putalpha(icon_alpha)
    tinted = solid

    # Glow behind
    g = Image.new("RGBA", img.size, (0, 0, 0, 0))
    px, py = position
    ImageDraw.Draw(g).ellipse(
        [px - 40, py - 40, px + icon_w + 40, py + icon_h + 40],
        fill=(*accent, 50)
    )
    g = g.filter(ImageFilter.GaussianBlur(40))
    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, g)
    img_rgba.paste(tinted, position, tinted)
    return img_rgba.convert("RGB")


def paste_logo_wordmark(img, position, height):
    """Paste white Flowxtra wordmark at absolute (x, y)."""
    if not os.path.exists(LOGO_WHITE):
        return img
    logo = Image.open(LOGO_WHITE).convert("RGBA")
    aspect = logo.width / logo.height
    logo_h = height
    logo_w = int(height * aspect)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    img_rgba = img.convert("RGBA")
    img_rgba.paste(logo, position, logo)
    return img_rgba.convert("RGB")


def wrap_text(text, font, draw, max_width):
    words = text.split()
    lines, current = [], []
    for word in words:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def fit_title_font(draw, title, max_width, font_sizes, max_lines):
    """Pick the largest font size where text fits within max_width and max_lines."""
    for size in font_sizes:
        f = ImageFont.truetype(FONT_BOLD, size)
        lines = wrap_text(title, f, draw, max_width)
        if len(lines) <= max_lines:
            return f, lines
    f = ImageFont.truetype(FONT_BOLD, font_sizes[-1])
    return f, wrap_text(title, f, draw, max_width)


# ── Format-specific layouts ─────────────────────────────────────────

def render_blog(title, emoji, tag, palette, palette_name, seed, no_emoji, bg_style):
    """Horizontal 1200×630 — title left, decoration right, logo bottom-left, URL bottom-right."""
    w, h = 1200, 630
    use_overlay = (
        bg_style == "overlay"
        or (bg_style == "auto" and palette_name in ("teal", "navy", "carbon")
            and (seed % 100) < 35)
    )
    if use_overlay:
        img = make_gradient("#212B36", "#212B36", w, h)
        img = add_overlay_shadow_layer(img, palette, seed=seed)
    else:
        img = make_gradient(palette["bg_top"], palette["bg_bot"], w, h)
        img = add_decorative_layer(img, palette, seed=seed)

    if no_emoji or not emoji:
        img = paste_logo_icon(img, palette, position=(w - 240, 60), size=180)

    draw = ImageDraw.Draw(img)
    title_is_rtl = is_rtl(title)
    if tag:
        tag_font = ImageFont.truetype(FONT_BOLD, 22)
        tag_text = tag.upper() if not is_rtl(tag) else tag
        tag_text_shaped = shape_for_display(tag_text)
        bbox = draw.textbbox((0, 0), tag_text_shaped, font=tag_font)
        tw_, th_ = bbox[2]-bbox[0], bbox[3]-bbox[1]
        if title_is_rtl:
            tx, ty = w - 80 - tw_, 80
        else:
            tx, ty = 80, 80
        draw.rounded_rectangle([tx-22, ty-12, tx+tw_+22, ty+th_+18], radius=24, fill=palette["accent"])
        draw.text((tx, ty), tag_text_shaped, font=tag_font, fill="#062F38")

    if emoji and not no_emoji:
        try:
            ef = ImageFont.truetype(FONT_EMOJI, 140)
            ex = 60 if title_is_rtl else (w - 200)
            draw.text((ex, 60), emoji, font=ef, embedded_color=True)
        except Exception:
            pass

    title_font, title_lines = fit_title_font(draw, title, w - 200, [84, 76, 68, 60, 54, 48, 44], 4)
    line_h = title_font.size + 14
    total_h = len(title_lines) * line_h
    start_y = (h - total_h) // 2 + 30
    for i, line in enumerate(title_lines):
        line_shaped = shape_for_display(line)
        if title_is_rtl:
            bbox = draw.textbbox((0, 0), line_shaped, font=title_font)
            lw = bbox[2] - bbox[0]
            draw.text((w - 80 - lw, start_y + i * line_h), line_shaped, font=title_font, fill=WHITE)
        else:
            draw.text((80, start_y + i * line_h), line_shaped, font=title_font, fill=WHITE)
    if title_is_rtl:
        draw.rectangle([w - 200, start_y - 30, w - 80, start_y - 24], fill=palette["highlight"])
    else:
        draw.rectangle([80, start_y - 30, 200, start_y - 24], fill=palette["highlight"])

    img = paste_logo_wordmark(img, position=(70, h - 110), height=42)
    draw = ImageDraw.Draw(img)
    url_font = ImageFont.truetype(FONT_REG, 22)
    bbox = draw.textbbox((0, 0), BRAND_URL, font=url_font)
    uw = bbox[2] - bbox[0]
    draw.text((w - 80 - uw, h - 60), BRAND_URL, font=url_font, fill=WHITE_DIM)
    return img


def render_square(title, emoji, tag, palette, palette_name, seed, no_emoji, bg_style):
    """Square 1080×1080 — centered title, emoji top, logo bottom, large URL strip."""
    w, h = 1080, 1080
    use_overlay = (
        bg_style == "overlay"
        or (bg_style == "auto" and palette_name in ("teal", "navy", "carbon")
            and (seed % 100) < 35)
    )
    if use_overlay:
        img = make_gradient("#212B36", "#212B36", w, h)
        img = add_overlay_shadow_layer(img, palette, seed=seed)
    else:
        img = make_gradient(palette["bg_top"], palette["bg_bot"], w, h)
        img = add_decorative_layer(img, palette, seed=seed)

    draw = ImageDraw.Draw(img)
    title_is_rtl = is_rtl(title)
    # Tag chip top-left (or top-right for RTL)
    if tag:
        tag_font = ImageFont.truetype(FONT_BOLD, 26)
        tag_text = tag.upper() if not is_rtl(tag) else tag
        tag_text_shaped = shape_for_display(tag_text)
        bbox = draw.textbbox((0, 0), tag_text_shaped, font=tag_font)
        tw_, th_ = bbox[2]-bbox[0], bbox[3]-bbox[1]
        if title_is_rtl:
            tx, ty = w - 80 - tw_, 80
        else:
            tx, ty = 80, 80
        draw.rounded_rectangle([tx-22, ty-14, tx+tw_+22, ty+th_+20], radius=28, fill=palette["accent"])
        draw.text((tx, ty), tag_text_shaped, font=tag_font, fill="#062F38")

    # Emoji or icon — centered top, larger
    if no_emoji or not emoji:
        # Icon centered, ~200px wide
        icon_size = 240
        icon_x = (w - icon_size * 1098 // 1674) // 2  # adjust for icon aspect
        img = paste_logo_icon(img, palette, position=(icon_x, 180), size=icon_size)
        draw = ImageDraw.Draw(img)
    elif emoji:
        try:
            ef = ImageFont.truetype(FONT_EMOJI, 200)
            # Center the emoji horizontally
            bbox = draw.textbbox((0, 0), emoji, font=ef, embedded_color=True)
            ew = bbox[2] - bbox[0]
            draw.text(((w - ew) // 2, 180), emoji, font=ef, embedded_color=True)
        except Exception:
            pass

    # Title — centered, large
    title_font, title_lines = fit_title_font(draw, title, w - 160, [96, 88, 76, 68, 60, 54], 4)
    line_h = title_font.size + 16
    total_h = len(title_lines) * line_h
    start_y = 500  # below the emoji/icon

    for i, line in enumerate(title_lines):
        line_shaped = shape_for_display(line)
        bbox = draw.textbbox((0, 0), line_shaped, font=title_font)
        lw = bbox[2] - bbox[0]
        draw.text(((w - lw) // 2, start_y + i * line_h), line_shaped, font=title_font, fill=WHITE)

    # Centered highlight bar above title
    draw.rectangle([(w // 2 - 60), start_y - 30, (w // 2 + 60), start_y - 24], fill=palette["highlight"])

    # Footer logo + URL — centered horizontally at bottom
    img = paste_logo_wordmark(img, position=(w // 2 - 120, h - 140), height=52)
    draw = ImageDraw.Draw(img)
    url_font = ImageFont.truetype(FONT_REG, 28)
    bbox = draw.textbbox((0, 0), BRAND_URL, font=url_font)
    uw = bbox[2] - bbox[0]
    draw.text(((w - uw) // 2, h - 70), BRAND_URL, font=url_font, fill=WHITE_DIM)
    return img


def render_story(title, emoji, tag, palette, palette_name, seed, no_emoji, bg_style,
                 mockup_path=None):
    """Vertical 1080×1920 — top tag, big emoji/icon, big title middle, CTA bottom, logo at very bottom.
    If mockup_path is provided, paste a small product/photo card between the tag and the icon."""
    w, h = 1080, 1920
    use_overlay = (
        bg_style == "overlay"
        or (bg_style == "auto" and palette_name in ("teal", "navy", "carbon")
            and (seed % 100) < 35)
    )
    if use_overlay:
        img = make_gradient("#212B36", "#212B36", w, h)
        img = add_overlay_shadow_layer(img, palette, seed=seed)
    else:
        img = make_gradient(palette["bg_top"], palette["bg_bot"], w, h)
        img = add_decorative_layer(img, palette, seed=seed)

    draw = ImageDraw.Draw(img)
    # Tag chip top-center
    if tag:
        tag_font = ImageFont.truetype(FONT_BOLD, 32)
        tag_text = tag.upper() if not is_rtl(tag) else tag
        tag_text_shaped = shape_for_display(tag_text)
        bbox = draw.textbbox((0, 0), tag_text_shaped, font=tag_font)
        tw_, th_ = bbox[2]-bbox[0], bbox[3]-bbox[1]
        tx = (w - tw_) // 2
        ty = 200
        draw.rounded_rectangle([tx-30, ty-18, tx+tw_+30, ty+th_+24], radius=36, fill=palette["accent"])
        draw.text((tx, ty), tag_text_shaped, font=tag_font, fill="#062F38")

    # Optional mockup card — between tag and icon (upper-third)
    if mockup_path:
        img = paste_mockup_on_image(img, mockup_path, "center", palette, "story")
        draw = ImageDraw.Draw(img)
        # Slide the icon/emoji and title down to make room
        icon_y = 660
        title_start_y = 1110
    else:
        icon_y = 380
        title_start_y = 880

    # Emoji or icon — large, centered, upper-third (or after mockup)
    if no_emoji or not emoji:
        icon_size = 320 if mockup_path else 380
        icon_x = (w - icon_size * 1098 // 1674) // 2
        img = paste_logo_icon(img, palette, position=(icon_x, icon_y), size=icon_size)
        draw = ImageDraw.Draw(img)
    elif emoji:
        try:
            esize = 260 if mockup_path else 320
            ef = ImageFont.truetype(FONT_EMOJI, esize)
            bbox = draw.textbbox((0, 0), emoji, font=ef, embedded_color=True)
            ew = bbox[2] - bbox[0]
            draw.text(((w - ew) // 2, icon_y), emoji, font=ef, embedded_color=True)
        except Exception:
            pass

    # Title — centered, very large
    title_font, title_lines = fit_title_font(draw, title, w - 160,
                                             [108, 96, 84, 76, 68, 60] if mockup_path
                                             else [120, 108, 96, 84, 76, 68], 5)
    line_h = title_font.size + 20
    start_y = title_start_y

    for i, line in enumerate(title_lines):
        line_shaped = shape_for_display(line)
        bbox = draw.textbbox((0, 0), line_shaped, font=title_font)
        lw = bbox[2] - bbox[0]
        draw.text(((w - lw) // 2, start_y + i * line_h), line_shaped, font=title_font, fill=WHITE)

    draw.rectangle([(w // 2 - 80), start_y - 50, (w // 2 + 80), start_y - 40], fill=palette["highlight"])

    # CTA pill near bottom
    cta_text = BRAND_URL
    cta_font = ImageFont.truetype(FONT_BOLD, 44)
    bbox = draw.textbbox((0, 0), cta_text, font=cta_font)
    cw, ch = bbox[2]-bbox[0], bbox[3]-bbox[1]
    cx = (w - cw) // 2
    cy = h - 380
    draw.rounded_rectangle([cx-50, cy-26, cx+cw+50, cy+ch+34], radius=60, fill=palette["accent"])
    draw.text((cx, cy), cta_text, font=cta_font, fill="#062F38")

    img = paste_logo_wordmark(img, position=(w // 2 - 150, h - 220), height=68)
    return img


# ── Animated reel MP4 ────────────────────────────────────────────────

def _ease_out_cubic(t):
    return 1 - (1 - t) ** 3


def _ease_in_out(t):
    return 0.5 * (1 - math.cos(math.pi * t))


def _back_out(t, s=1.70158):
    """Bounce-back easing — slight overshoot then settle."""
    t -= 1
    return t * t * ((s + 1) * t + s) + 1


def _draw_tag_chip(draw, tag, palette, x, y, opacity=255):
    """Draw the tag pill with given opacity."""
    if not tag:
        return
    tag_font = ImageFont.truetype(FONT_BOLD, 32)
    tag_text = tag.upper()
    bbox = draw.textbbox((0, 0), tag_text, font=tag_font)
    tw_, th_ = bbox[2]-bbox[0], bbox[3]-bbox[1]
    accent = hex_to_rgb(palette["accent"])
    draw.rounded_rectangle([x-30, y-18, x+tw_+30, y+th_+24], radius=36,
                           fill=(*accent, opacity))
    draw.text((x, y), tag_text, font=tag_font, fill=(6, 47, 56, opacity))


def _draw_centered_text(draw, text, font, y, w, color, opacity=255):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    if isinstance(color, str):
        color = hex_to_rgb(color)
    if len(color) == 3:
        color = (*color, opacity)
    draw.text(((w - tw) // 2, y), text, font=font, fill=color)


def render_reel_mp4(title, emoji, tag, palette, palette_name, seed, no_emoji,
                    bg_style, out_path, fps=30, duration_s=4.0, mockup_path=None):
    """
    Animated 1080×1920 MP4 reel.

    Timeline (4 seconds @ 30 fps = 120 frames):
      0.00–1.00s : tag chip drops in from above with fade
      0.50–1.50s : brand icon scales in with bounce overshoot
      1.20–2.30s : title slides up + fades in word-by-word feel
      2.30–4.00s : everything held; CTA pulses (radius + glow)

    Static decorative background is rendered ONCE and reused per frame.
    """
    import imageio.v2 as iio  # imported lazily so static formats don't pay for it
    import numpy as np

    w, h = 1080, 1920
    n_frames = int(fps * duration_s)

    # Render the static background once
    use_overlay = (
        bg_style == "overlay"
        or (bg_style == "auto" and palette_name in ("teal", "navy", "carbon")
            and (seed % 100) < 35)
    )
    if use_overlay:
        bg = make_gradient("#212B36", "#212B36", w, h)
        bg = add_overlay_shadow_layer(bg, palette, seed=seed)
    else:
        bg = make_gradient(palette["bg_top"], palette["bg_bot"], w, h)
        bg = add_decorative_layer(bg, palette, seed=seed)

    # Burn the optional mockup into the static background (fades in via global alpha
    # mask rather than per-frame compositing, which keeps the per-frame cost low)
    if mockup_path and os.path.exists(mockup_path):
        bg = paste_mockup_on_image(bg, mockup_path, "center", palette, "reel-mp4")

    # Pre-load and pre-tint the brand icon (saves time per frame)
    icon_full = None
    if (no_emoji or not emoji) and os.path.exists(ICON_WHITE):
        icon_src = Image.open(ICON_WHITE).convert("RGBA")
        accent = hex_to_rgb(palette["accent"])
        solid = Image.new("RGBA", icon_src.size, (*accent, 255))
        solid.putalpha(icon_src.split()[3])
        icon_full = solid  # 1098×1674 master

    # Pre-load logo
    logo_master = None
    if os.path.exists(LOGO_WHITE):
        logo_master = Image.open(LOGO_WHITE).convert("RGBA")

    # Pre-fit title font size and lines using a temp draw
    tmp_draw = ImageDraw.Draw(bg)
    title_font, title_lines = fit_title_font(tmp_draw, title, w - 160,
                                             [120, 108, 96, 84, 76, 68], 5)
    line_h = title_font.size + 20
    title_total_h = len(title_lines) * line_h
    title_start_y = 880

    # Pre-fit CTA font
    cta_font = ImageFont.truetype(FONT_BOLD, 44)

    # Open MP4 writer
    writer = iio.get_writer(out_path, fps=fps, codec="libx264",
                            quality=8, macro_block_size=1,
                            ffmpeg_params=["-pix_fmt", "yuv420p"])

    try:
        for frame_idx in range(n_frames):
            t = frame_idx / max(1, n_frames - 1)  # 0..1 over full duration
            t_sec = frame_idx / fps

            # Start from a copy of the static background
            frame = bg.copy().convert("RGBA")
            overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            od = ImageDraw.Draw(overlay)

            # Phase 1: tag chip drops in (0.0–1.0s)
            if tag:
                phase = max(0.0, min(1.0, t_sec / 1.0))
                eased = _ease_out_cubic(phase)
                tag_y_target = 200
                tag_y_start = -80
                tag_y = int(tag_y_start + (tag_y_target - tag_y_start) * eased)
                tag_alpha = int(255 * eased)
                # Compute centered x
                tf = ImageFont.truetype(FONT_BOLD, 32)
                bbox = od.textbbox((0, 0), tag.upper(), font=tf)
                tw_ = bbox[2] - bbox[0]
                tag_x = (w - tw_) // 2
                _draw_tag_chip(od, tag, palette, tag_x, tag_y, opacity=tag_alpha)

            # Phase 2: brand icon scales in with bounce (0.5–1.5s) — only when no_emoji or no emoji
            if icon_full is not None:
                phase = (t_sec - 0.5) / 1.0
                phase = max(0.0, min(1.0, phase))
                eased = _back_out(phase) if phase > 0 else 0
                target_size = 380
                cur_size = int(target_size * eased)
                if cur_size > 0:
                    aspect = icon_full.width / icon_full.height
                    cur_w = int(cur_size * aspect)
                    cur_h = cur_size
                    icon_resized = icon_full.resize((cur_w, cur_h), Image.LANCZOS)
                    # Adjust alpha for the early scale to fade in
                    if eased < 1.0:
                        a = int(255 * min(1.0, phase * 1.5))
                        # Modulate alpha
                        ia = icon_resized.split()[3]
                        ia = ia.point(lambda v: int(v * a / 255))
                        icon_resized.putalpha(ia)
                    icon_x = (w - cur_w) // 2
                    icon_y = 380 + (target_size - cur_h) // 2
                    overlay.paste(icon_resized, (icon_x, icon_y), icon_resized)
            elif emoji:
                # Static emoji at full size after 0.5s; before that fade in
                phase = max(0.0, min(1.0, (t_sec - 0.5) / 0.6))
                if phase > 0:
                    try:
                        ef = ImageFont.truetype(FONT_EMOJI, 320)
                        bbox = od.textbbox((0, 0), emoji, font=ef, embedded_color=True)
                        ew = bbox[2] - bbox[0]
                        # PIL doesn't easily support alpha for emoji; render to side image
                        emoji_img = Image.new("RGBA", (w, 400), (0, 0, 0, 0))
                        ed = ImageDraw.Draw(emoji_img)
                        ed.text(((w - ew) // 2, 0), emoji, font=ef, embedded_color=True)
                        ea = emoji_img.split()[3]
                        ea = ea.point(lambda v: int(v * phase))
                        emoji_img.putalpha(ea)
                        overlay.paste(emoji_img, (0, 380), emoji_img)
                    except Exception:
                        pass

            # Phase 3: title slides up + fades in (1.2–2.3s)
            phase = (t_sec - 1.2) / 1.1
            phase = max(0.0, min(1.0, phase))
            if phase > 0:
                eased = _ease_out_cubic(phase)
                t_alpha = int(255 * eased)
                y_offset = int(40 * (1 - eased))  # slide up 40px
                # Highlight bar fades in too
                hl = hex_to_rgb(palette["highlight"])
                od.rectangle([(w // 2 - 80), title_start_y - 50 + y_offset,
                              (w // 2 + 80), title_start_y - 40 + y_offset],
                             fill=(*hl, t_alpha))
                for i, line in enumerate(title_lines):
                    bbox = od.textbbox((0, 0), line, font=title_font)
                    lw = bbox[2] - bbox[0]
                    od.text(((w - lw) // 2, title_start_y + y_offset + i * line_h),
                            line, font=title_font, fill=(248, 250, 252, t_alpha))

            # Phase 4: CTA pulse (2.3–4.0s)
            phase = (t_sec - 2.3) / 1.7
            phase = max(0.0, min(1.0, phase))
            cta_alpha = int(255 * min(1.0, phase * 2))  # fade in fast
            if cta_alpha > 0:
                cta_text = BRAND_URL
                bbox = od.textbbox((0, 0), cta_text, font=cta_font)
                cw, ch = bbox[2]-bbox[0], bbox[3]-bbox[1]
                cx = (w - cw) // 2
                cy = h - 380
                # Pulse: 2 full cycles of slight breathing during the hold
                pulse_factor = 1.0
                if phase > 0.3:
                    pulse_phase = (phase - 0.3) * 4 * math.pi  # ~2 cycles
                    pulse_factor = 1.0 + 0.04 * math.sin(pulse_phase)
                pad_x = int(50 * pulse_factor)
                pad_y_top = int(26 * pulse_factor)
                pad_y_bot = int(34 * pulse_factor)
                accent = hex_to_rgb(palette["accent"])
                od.rounded_rectangle(
                    [cx - pad_x, cy - pad_y_top, cx + cw + pad_x, cy + ch + pad_y_bot],
                    radius=60, fill=(*accent, cta_alpha)
                )
                od.text((cx, cy), cta_text, font=cta_font,
                        fill=(6, 47, 56, cta_alpha))

            # Phase 5 — Logo always visible (fades in 0.0–0.6s, then stays full
            # opacity for the rest of the reel). Story/reel must always carry
            # the brand mark — not just at the end.
            if logo_master is not None:
                fade_phase = max(0.0, min(1.0, t_sec / 0.6))
                aspect = logo_master.width / logo_master.height
                lh = 68
                lw = int(lh * aspect)
                logo_r = logo_master.resize((lw, lh), Image.LANCZOS)
                if fade_phase < 1.0:
                    la = logo_r.split()[3].point(lambda v: int(v * fade_phase))
                    logo_r.putalpha(la)
                overlay.paste(logo_r, ((w - lw) // 2, h - 220), logo_r)

            # Composite overlay onto frame and write (imageio needs ndarray)
            composed = Image.alpha_composite(frame, overlay).convert("RGB")
            writer.append_data(np.asarray(composed))
    finally:
        writer.close()

    return out_path


# ── Main render entry point ─────────────────────────────────────────

def render_image(title, emoji=None, tag=None, palette_name="teal", out_path="banner.png",
                 seed=0, no_emoji=False, bg_style="auto", fmt="blog", mockup="auto"):
    if fmt not in FORMATS:
        raise SystemExit(f"Unknown format '{fmt}'. Choices: {list(FORMATS.keys())}")
    palette = PALETTES.get(palette_name, PALETTES["teal"])

    # Resolve mockup choice once (so the renderer + the reel both use the same)
    canvas_h = FORMATS[fmt]["h"]
    mockup_asset, mockup_path = pick_mockup(title, tag, fmt, canvas_h, mockup)

    if fmt == "blog":
        img = render_blog(title, emoji, tag, palette, palette_name, seed, no_emoji, bg_style)
        if mockup_path:
            img = paste_mockup_on_image(img, mockup_path, mockup_asset.get("anchor", "right"),
                                        palette, fmt)
    elif fmt == "square":
        img = render_square(title, emoji, tag, palette, palette_name, seed, no_emoji, bg_style)
        if mockup_path:
            img = paste_mockup_on_image(img, mockup_path, mockup_asset.get("anchor", "center"),
                                        palette, fmt)
    elif fmt == "story":
        img = render_story(title, emoji, tag, palette, palette_name, seed, no_emoji, bg_style,
                           mockup_path=mockup_path)
    elif fmt == "reel-mp4":
        return render_reel_mp4(title, emoji, tag, palette, palette_name, seed,
                               no_emoji, bg_style, out_path, mockup_path=mockup_path)
    else:
        raise SystemExit(f"Format '{fmt}' has no renderer implemented yet.")

    img.save(out_path, "PNG", optimize=True)
    return out_path


# Backward-compat alias for any caller that imports render_banner
def render_banner(title, emoji=None, tag=None, palette_name="teal", out_path="banner.png",
                  seed=0, no_emoji=False, bg_style="auto"):
    return render_image(title, emoji, tag, palette_name, out_path, seed, no_emoji, bg_style, "blog")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--emoji", default=None)
    p.add_argument("--tag", default=None)
    p.add_argument("--palette", default="teal", choices=list(PALETTES.keys()))
    p.add_argument("--out", default="banner.png")
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--no-emoji", action="store_true")
    p.add_argument("--bg-style", default="auto", choices=["auto", "gradient", "overlay"])
    p.add_argument("--format", dest="fmt", default="blog", choices=list(FORMATS.keys()),
                   help="Output dimensions/layout. blog=1200x630, square=1080x1080, story=1080x1920")
    p.add_argument("--mockup", default="auto",
                   help="Auto-pick a mockup from library.json based on title/tag keywords. "
                        "Use 'none' to disable, 'force' to always use one (best match), "
                        "or a path fragment like 'social-manager' to pick a specific asset.")
    args = p.parse_args()
    path = render_image(args.title, args.emoji, args.tag, args.palette,
                        args.out, args.seed, args.no_emoji, args.bg_style, args.fmt,
                        args.mockup)
    size = os.path.getsize(path)
    info = FORMATS[args.fmt]
    print(f"OK {path} ({size} bytes) — {info['w']}x{info['h']} {info['label']}")


if __name__ == "__main__":
    main()
