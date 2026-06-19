"""Crop green chroma, isolate the nav pill, and export a 1290×192 (20:3) banner."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "public" / "bottom-menu-bar"
MASTER_CANDIDATES = (
    DIR / "bottom-menu-bar.master.png",
    DIR / "bottom-menu-barb.png",
    DIR / "bottom-menu-bar.png",
)
OUT = DIR / "bottom-menu-bar.png"
META = DIR / "bottom-menu-bar.meta.json"
CANVAS_W, CANVAS_H = 1290, 192


def is_chroma_key_green(arr: np.ndarray) -> np.ndarray:
    """Pure #00FF00 canvas green only — not teal/cyan icon glow."""
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]
    return (a > 20) & (g > 230) & (r < 40) & (b < 40)


def is_green_pixel(arr: np.ndarray) -> np.ndarray:
    """Detect chroma-key green (#00FF00 and near-neighbors)."""
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    a = arr[:, :, 3]
    return is_chroma_key_green(arr) | (
        (a > 20)
        & (g > 200)
        & (r < 80)
        & (b < 80)
        & ((g - r) > 120)
        & ((g - b) > 120)
    )


def visible_content_mask(arr: np.ndarray) -> np.ndarray:
    """Non-transparent pixels that are not chroma green."""
    rgb_sum = arr[:, :, 0].astype(np.int16) + arr[:, :, 1].astype(np.int16) + arr[:, :, 2].astype(np.int16)
    return (arr[:, :, 3] > 20) & (rgb_sum > 30) & ~is_green_pixel(arr)


def resolve_source() -> Path:
    for candidate in MASTER_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit(
        "No bottom-nav source PNG found. Add bottom-menu-bar.master.png or bottom-menu-barb.png."
    )


def crop_pill(source: Image.Image) -> Image.Image:
    arr = np.array(source.convert("RGBA"))
    mask = visible_content_mask(arr)
    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise SystemExit("No pill content found after green removal.")

    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    return source.crop((x0, y0, x1 + 1, y1 + 1))


def fit_to_banner(pill: Image.Image) -> tuple[Image.Image, dict[str, int]]:
    pw, ph = pill.size
    scale = min(CANVAS_W / pw, CANVAS_H / ph)
    target_w = max(1, round(pw * scale))
    target_h = max(1, round(ph * scale))
    resized = pill.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    offset_x = (CANVAS_W - target_w) // 2
    offset_y = (CANVAS_H - target_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    return canvas, {
        "width": target_w,
        "height": target_h,
        "offsetX": offset_x,
        "offsetY": offset_y,
    }


def assert_no_green(canvas: Image.Image) -> None:
    arr = np.array(canvas)
    green_count = int(is_chroma_key_green(arr).sum())
    if green_count > 0:
        raise SystemExit(f"Output still contains {green_count} chroma-key green pixels — crop failed.")


def main() -> None:
    src_path = resolve_source()
    source = Image.open(src_path).convert("RGBA")
    pill = crop_pill(source)
    canvas, pill_meta = fit_to_banner(pill)
    assert_no_green(canvas)
    canvas.save(OUT)

    hotspot = {
        "left": round((pill_meta["offsetX"] / CANVAS_W) * 100, 4),
        "width": round((pill_meta["width"] / CANVAS_W) * 100, 4),
        "top": round((pill_meta["offsetY"] / CANVAS_H) * 100, 4),
        "height": round((pill_meta["height"] / CANVAS_H) * 100, 4),
    }

    meta = {
        "source": src_path.name,
        "canvas": {"width": CANVAS_W, "height": CANVAS_H},
        "pill": pill_meta,
        "hotspotInsetPercent": hotspot,
        "greenPixelsRemaining": 0,
    }
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print(f"Source: {src_path.name} ({source.size[0]}x{source.size[1]})")
    print(f"Cropped pill: {pill.size[0]}x{pill.size[1]}")
    print(
        f"Wrote {OUT} ({CANVAS_W}x{CANVAS_H}) "
        f"scaled pill={pill_meta['width']}x{pill_meta['height']} "
        f"offset=({pill_meta['offsetX']}, {pill_meta['offsetY']})"
    )
    print(json.dumps(hotspot))


if __name__ == "__main__":
    main()
