"""Remove solid black backgrounds from PNG assets while preserving neon glow."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent.parent / "public"

FILES = [
    BASE / "icons" / "play-icon-blue.png",
    BASE / "assets" / "icon" / "play-icon-blue.png",
    BASE / "branding" / "vital-seed-logo.png",
    BASE / "music" / "hallelujah-anyhow-cover.png",
    BASE / "images" / "hallelujah-anyhow-cover.png",
]

# Silver-blob neon icons: use scripts/process-neon-icon.py instead of remove_black_bg.


def remove_black_bg(path: Path, threshold: int = 20, soften: int = 35) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    rgb = arr[:, :, :3]
    max_c = np.max(rgb, axis=2)

    alpha = np.clip((max_c - threshold) * (255.0 / soften), 0, 255)
    alpha = np.where(max_c <= threshold, 0, alpha)

    arr[:, :, 3] = alpha
    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    out.save(path, optimize=True)
    print(f"Processed: {path} ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    for file_path in FILES:
        if file_path.exists():
            remove_black_bg(file_path)
        else:
            print(f"Skip (missing): {file_path}")
