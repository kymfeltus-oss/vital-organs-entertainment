"""Build full-width 1290×192 bottom-nav banner — single-layer capsule, no icon recomposite."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "public" / "bottom-menu-bar"
LOG_PATH = ROOT / ".cursor" / "debug-baf5b9.log"
MASTER_CANDIDATES = (
    DIR / "bottom-menu-bar.master.png",
    DIR / "bottom-menu-barb.png",
    DIR / "bottom-menu-bar.png",
)
OUT = DIR / "bottom-menu-bar.png"
META = DIR / "bottom-menu-bar.meta.json"
CANVAS_W, CANVAS_H = 1290, 192
CAP_FRACTION = 0.09


def log_build_event(hypothesis_id: str, message: str, data: dict) -> None:
    payload = {
        "sessionId": "baf5b9",
        "runId": "nav-build",
        "hypothesisId": hypothesis_id,
        "location": "build-bottom-nav-canvas.py",
        "message": message,
        "data": data,
        "timestamp": int(__import__("time").time() * 1000),
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")


def is_chroma_key_green(arr: np.ndarray) -> np.ndarray:
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]
    return (a > 20) & (g > 230) & (r < 40) & (b < 40)


def is_green_pixel(arr: np.ndarray) -> np.ndarray:
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


def inner_capsule_mask(arr: np.ndarray) -> np.ndarray:
    """Single capsule silhouette — excludes chroma green and outer black letterbox."""
    rgb_sum = arr[:, :, 0].astype(np.int16) + arr[:, :, 1].astype(np.int16) + arr[:, :, 2].astype(np.int16)
    visible = (arr[:, :, 3] > 24) & (rgb_sum > 30) & ~is_green_pixel(arr)
    return visible


def resolve_source() -> Path:
    for candidate in MASTER_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit(
        "No bottom-nav source PNG found. Add bottom-menu-bar.master.png or bottom-menu-barb.png."
    )


def crop_inner_capsule(source: Image.Image) -> Image.Image:
    arr = np.array(source.convert("RGBA"))
    mask = inner_capsule_mask(arr)
    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise SystemExit("No inner capsule found in source PNG.")

    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    return source.crop((x0, y0, x1 + 1, y1 + 1))


def nine_slice_horizontal(img: Image.Image, target_w: int, left_cap: int, right_cap: int) -> Image.Image:
    w, h = img.size
    left_cap = min(left_cap, max(1, w // 4))
    right_cap = min(right_cap, max(1, w // 4))
    mid_w = w - left_cap - right_cap
    if mid_w < 1:
        return img.resize((target_w, h), Image.Resampling.LANCZOS)

    target_mid = max(1, target_w - left_cap - right_cap)
    left = img.crop((0, 0, left_cap, h))
    mid = img.crop((left_cap, 0, left_cap + mid_w, h))
    right = img.crop((w - right_cap, 0, w, h))
    mid_resized = mid.resize((target_mid, h), Image.Resampling.LANCZOS)

    out = Image.new("RGBA", (target_w, h), (0, 0, 0, 0))
    out.paste(left, (0, 0), left)
    out.paste(mid_resized, (left_cap, 0), mid_resized)
    out.paste(right, (target_w - right_cap, 0), right)
    return out


def build_full_width_banner(pill: Image.Image) -> Image.Image:
    """Scale to artboard height, then 9-slice to full width — one layer, no icon recomposite."""
    scaled_h = CANVAS_H
    scaled_w = max(1, round(pill.width * scaled_h / pill.height))
    scaled = pill.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

    left_cap = max(28, round(scaled_w * CAP_FRACTION))
    right_cap = left_cap
    stretched = nine_slice_horizontal(scaled, CANVAS_W, left_cap, right_cap)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    canvas.paste(stretched, (0, 0), stretched)
    return canvas


def measure_halo_duplication(canvas: Image.Image) -> int:
    """Semi-transparent mid-brightness pixels often indicate double-composite halos."""
    arr = np.array(canvas)
    rgb = arr[:, :, :3].astype(np.int16).sum(axis=2)
    a = arr[:, :, 3]
    return int(((a > 24) & (a < 200) & (rgb > 90) & (rgb < 360)).sum())


def assert_no_green(canvas: Image.Image) -> None:
    arr = np.array(canvas)
    green_count = int(is_chroma_key_green(arr).sum())
    if green_count > 0:
        raise SystemExit(f"Output still contains {green_count} chroma-key green pixels.")


def main() -> None:
    src_path = resolve_source()
    source = Image.open(src_path).convert("RGBA")
    pill = crop_inner_capsule(source)
    canvas = build_full_width_banner(pill)
    assert_no_green(canvas)
    halo_px = measure_halo_duplication(canvas)
    canvas.save(OUT)

    hotspot = {
        "left": 0.0,
        "width": 100.0,
        "top": 0.0,
        "height": 100.0,
    }

    meta = {
        "source": src_path.name,
        "canvas": {"width": CANVAS_W, "height": CANVAS_H},
        "pill": {
            "width": CANVAS_W,
            "height": CANVAS_H,
            "offsetX": 0,
            "offsetY": 0,
        },
        "hotspotInsetPercent": hotspot,
        "layout": "full-width-single-layer",
        "haloDuplicationPixels": halo_px,
        "greenPixelsRemaining": 0,
    }
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    log_build_event(
        "NAV-H2",
        "built single-layer bottom nav asset",
        {
            "source": src_path.name,
            "cropSize": [pill.size[0], pill.size[1]],
            "outputSize": [CANVAS_W, CANVAS_H],
            "haloDuplicationPixels": halo_px,
            "layout": "full-width-single-layer",
        },
    )

    print(f"Source: {src_path.name} ({source.size[0]}x{source.size[1]})")
    print(f"Inner capsule crop: {pill.size[0]}x{pill.size[1]}")
    print(f"Wrote {OUT} ({CANVAS_W}x{CANVAS_H}) single-layer full-width capsule")
    print(f"haloDuplicationPixels={halo_px}")
    print(json.dumps(hotspot))


if __name__ == "__main__":
    main()
