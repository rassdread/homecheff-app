#!/usr/bin/env python3
"""Generate public logo/icon variants from the approved canonical primary asset.

Source priority:
1. public/brand/homecheff-logo-primary.png (repo SSOT full mark, 886×886)
2. Optional operator override via HC_LOGO_SOURCE env

IMPORTANT: public/icon-192.png is the certified Production square mark
(SHA-256 7f84f4c4…ad37de). Prefer deriving favicons / maskable from that
file when present so Studio/Growth sync stays byte-compatible.
"""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "public" / "brand"
PUBLIC = ROOT / "public"
APP = ROOT / "app"

PRIMARY_REPO = BRAND_DIR / "homecheff-logo-primary.png"
CERTIFIED_SQUARE = PUBLIC / "icon-192.png"

BRAND_GREEN = (16, 185, 129)  # #10b981
WHITE = (255, 255, 255)


def load_primary() -> Image.Image:
    override = os.environ.get("HC_LOGO_SOURCE")
    if override:
        path = Path(override)
        if not path.exists():
            raise SystemExit(f"HC_LOGO_SOURCE missing: {path}")
        return Image.open(path).convert("RGBA")
    if PRIMARY_REPO.exists():
        return Image.open(PRIMARY_REPO).convert("RGBA")
    raise SystemExit(f"Approved logo source missing: {PRIMARY_REPO}")


def load_square_master() -> Image.Image:
    """Prefer certified square export for app icons."""
    if CERTIFIED_SQUARE.exists():
        return Image.open(CERTIFIED_SQUARE).convert("RGBA")
    return load_primary()


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    img.save(path, format="PNG", optimize=True)


def resize_square(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.Resampling.LANCZOS)


def on_white(img: Image.Image, size: int, padding_ratio: float = 0.0) -> Image.Image:
    pad = int(size * padding_ratio)
    inner = max(1, size - pad * 2)
    scaled = resize_square(img, inner)
    canvas = Image.new("RGBA", (size, size), (*WHITE, 255))
    canvas.paste(scaled, (pad, pad), scaled)
    return canvas


def make_og_brand(img: Image.Image) -> Image.Image:
    width, height = 1200, 630
    canvas = Image.new("RGB", (width, height), BRAND_GREEN)
    logo_size = 420
    logo = resize_square(img, logo_size)
    x = (width - logo_size) // 2
    y = (height - logo_size) // 2 - 20
    canvas.paste(logo, (x, y), logo)
    draw = ImageDraw.Draw(canvas)
    draw.text((width // 2, y + logo_size + 36), "HomeCheff", fill=WHITE, anchor="mm")
    return canvas


def sync_android_launcher(img: Image.Image) -> None:
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    res_root = ROOT / "android" / "app" / "src" / "main" / "res"
    for folder, size in densities.items():
        base = res_root / folder
        base.mkdir(parents=True, exist_ok=True)
        icon = on_white(img, size, padding_ratio=0.12)
        save_png(icon, base / "ic_launcher.png")
        save_png(icon, base / "ic_launcher_round.png")
        fg = on_white(img, size, padding_ratio=0.18)
        save_png(fg, base / "ic_launcher_foreground.png")


def main() -> None:
    primary = load_primary()
    square = load_square_master()
    BRAND_DIR.mkdir(parents=True, exist_ok=True)

    save_png(primary, BRAND_DIR / "homecheff-logo-primary.png")
    save_png(primary, PUBLIC / "logo.png")
    save_png(primary, PUBLIC / "homecheff-globeman.png")

    if not CERTIFIED_SQUARE.exists():
        save_png(resize_square(primary, 192), CERTIFIED_SQUARE)

    save_png(resize_square(square, 512), PUBLIC / "icon-512.png")
    save_png(resize_square(square, 96), PUBLIC / "icon-96x96.png")
    save_png(resize_square(square, 96), PUBLIC / "icon.png")
    save_png(on_white(square, 512, padding_ratio=0.14), PUBLIC / "icon-maskable-512.png")

    for path, size in (
        (PUBLIC / "favicon-16.png", 16),
        (PUBLIC / "favicon-32.png", 32),
        (PUBLIC / "favicon-48.png", 48),
        (PUBLIC / "apple-touch-icon.png", 180),
        (APP / "icon.png", 48),
        (APP / "apple-icon.png", 180),
    ):
        save_png(on_white(square, size, 0.0), path)

    save_png(make_og_brand(primary), PUBLIC / "og-brand.png")

    ico_sizes = [16, 32, 48]
    ico_images = [resize_square(square, s) for s in ico_sizes]
    ico_images[-1].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
    )

    sync_android_launcher(square)
    print("generate-canonical-logo-assets: done (icon-192 preserved if present)")


if __name__ == "__main__":
    main()
