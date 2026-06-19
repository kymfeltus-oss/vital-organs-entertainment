"""Build 1290×192 chroma-key canvas with centered bottom-nav pill."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "public" / "bottom-menu-bar"
MASTER = DIR / "bottom-menu-bar.master.png"
OUT = DIR / "bottom-menu-bar.png"
META = DIR / "bottom-menu-bar.meta.json"
CANVAS_W, CANVAS_H = 1290, 192
CHROMA = (0, 255, 0, 255)


def main() -> None:
    src_path = MASTER if MASTER.exists() else OUT
    source = Image.open(src_path).convert("RGBA")

    if src_path == OUT and source.size != (CANVAS_W, CANVAS_H):
        source.save(MASTER)
        print(f"Saved master copy to {MASTER} ({source.size[0]}x{source.size[1]})")

    arr = np.array(source)
    mask = (arr[:, :, 3] > 20) & (
        arr[:, :, 0].astype(int) + arr[:, :, 1].astype(int) + arr[:, :, 2].astype(int) > 30
    )
    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise SystemExit("No visible pill content in source PNG")

    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    pill = source.crop((x0, y0, x1 + 1, y1 + 1))
    pw, ph = pill.size

    margin = 12
    inner_w, inner_h = CANVAS_W - margin * 2, CANVAS_H - margin * 2
    scale = min(inner_w / pw, inner_h / ph)
    target_w = max(1, round(pw * scale))
    target_h = max(1, round(ph * scale))
    pill = pill.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), CHROMA)
    offset_x = (CANVAS_W - target_w) // 2
    offset_y = (CANVAS_H - target_h) // 2
    canvas.paste(pill, (offset_x, offset_y), pill)
    canvas.save(OUT)

    meta = {
        "canvas": {"width": CANVAS_W, "height": CANVAS_H},
        "pill": {"width": target_w, "height": target_h, "offsetX": offset_x, "offsetY": offset_y},
        "hotspotInsetPercent": {
            "left": round((offset_x / CANVAS_W) * 100, 4),
            "width": round((target_w / CANVAS_W) * 100, 4),
            "top": round((offset_y / CANVAS_H) * 100, 4),
            "height": round((target_h / CANVAS_H) * 100, 4),
        },
    }
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print(
        f"Wrote {OUT} ({CANVAS_W}x{CANVAS_H}) "
        f"pill={target_w}x{target_h} margin L/R={offset_x} T/B={offset_y}"
    )
    print(json.dumps(meta["hotspotInsetPercent"]))


if __name__ == "__main__":
    main()
