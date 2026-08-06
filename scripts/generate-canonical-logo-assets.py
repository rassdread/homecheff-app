#!/usr/bin/env python3
"""Generate public logo/icon variants from the approved canonical primary asset."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
APPROVED_SOURCE = Path(
    "/Users/sergioarrias/.cursor/projects/Users-sergioarrias-Homecheff-app-git/assets/"
    "2339BC13-0560-43CC-863E-7AA018C9BCE1_1_105_c-e5c5c204-d01e-451b-b84d-72ec6d7d041e.png"
)
BRAND_DIR = ROOT / "public" / "brand"
PUBLIC = ROOT / "public"
APP = ROOT / "app"

BRAND_GREEN = (16, 185, 129)  # #10b981
WHITE = (255, 255, 255)


def load_primary() -> Image.Image:
    if not APPROVED_SOURCE.exists():
        raise SystemExit(f"Approved logo source missing: {APPROVED_SOURCE}")
    img = Image.open(APPROVED_SOURCE).convert("RGBA")
    return img


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    img.save(path, format="PNG", optimize=True)


def resize_square(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.Resampling.LANCZOS)


def padded_square(img: Image.Image, size: int, padding_ratio: float = 0.08) -> Image.Image:
    pad = int(size * padding_ratio)
    inner = size - pad * 2
    scaled = resize_square(img, inner)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
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


def make_favicon_ico(sizes: dict[str, int]) -> None:
    images: list[Image.Image] = []
    primary = load_primary()
    for path, size in sizes.items():
        if path.endswith(".ico"):
            images.append(resize_square(primary, size))
        else:
            save_png(resize_square(primary, size), ROOT / path.lstrip("/"))
    ico_path = ROOT / "public" / "favicon.ico"
    images[0].save(
        ico_path,
        format="ICO",
        sizes=[(img.width, img.height) for img in images],
        append_images=images[1:],
    )


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
        icon = padded_square(img, size, padding_ratio=0.12)
        save_png(icon, base / "ic_launcher.png")
        save_png(icon, base / "ic_launcher_round.png")
        fg = padded_square(img, size, padding_ratio=0.18)
        save_png(fg, base / "ic_launcher_foreground.png")


def main() -> None:
    primary = load_primary()
    BRAND_DIR.mkdir(parents=True, exist_ok=True)

    save_png(primary, BRAND_DIR / "homecheff-logo-primary.png")
    save_png(primary, PUBLIC / "logo.png")
    save_png(primary, PUBLIC / "homecheff-globeman.png")

    square_exports = {
        PUBLIC / "icon-512.png": 512,
        PUBLIC / "icon-192.png": 192,
        PUBLIC / "icon-96x96.png": 96,
        PUBLIC / "icon.png": 96,
        PUBLIC / "favicon-48.png": 48,
        PUBLIC / "favicon-32.png": 32,
        PUBLIC / "apple-touch-icon.png": 180,
        APP / "icon.png": 48,
        APP / "apple-icon.png": 180,
    }
    for path, size in square_exports.items():
        save_png(resize_square(primary, size), path)

    save_png(make_og_brand(primary), PUBLIC / "og-brand.png")

    ico_sizes = [16, 32, 48]
    ico_images = [resize_square(primary, s) for s in ico_sizes]
    ico_images[-1].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[:-1],
    )

    sync_android_launcher(primary)
    print("generate-canonical-logo-assets: done")


if __name__ == "__main__":
    main()
