"""Remove silver/gray blobs from neon PNG icons; crop and resize to match card icons."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent.parent / "public"
MAX_DIM = 115

FILES = [
    BASE / "assets" / "icon" / "event-updates-icon.png",
    BASE / "icons" / "event-updates-icon.png",
]


def process_neon_icon(path: Path, max_dim: int = MAX_DIM) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    rgb = arr[:, :, :3]
    max_c = np.max(rgb, axis=2)
    min_c = np.min(rgb, axis=2)
    sat = max_c - min_c

    is_black = max_c <= 22
    is_silver = (sat < 50) & (max_c > 55) & (max_c < 235)
    keep = ~(is_black | is_silver)

    alpha = np.where(keep, np.clip((max_c - 15) * 2.2, 0, 255), 0).astype(np.uint8)
    neon_core = (sat > 60) & (max_c > 40)
    alpha = np.where(neon_core, np.maximum(alpha, arr[:, :, 3].astype(np.uint8)), alpha)

    out = np.zeros_like(arr, dtype=np.uint8)
    out[:, :, :3] = rgb.astype(np.uint8)
    out[:, :, 3] = alpha

    im = Image.fromarray(out, "RGBA")
    bbox = im.getbbox()
    if not bbox:
        raise RuntimeError(f"No visible content after processing: {path}")

    im = im.crop(bbox)
    w, h = im.size
    scale = max_dim / max(w, h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    im.save(path, optimize=True)
    print(f"Processed {path} -> {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    for file_path in FILES:
        if file_path.exists():
            process_neon_icon(file_path)
        else:
            print(f"Skip (missing): {file_path}")
