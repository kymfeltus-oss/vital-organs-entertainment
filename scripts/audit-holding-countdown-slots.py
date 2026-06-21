from PIL import Image
import numpy as np
import sys

PNG_W, PNG_H = 926, 1698
WIDTH_RATIO = (PNG_W * 1920) / (PNG_H * 1080)
X_OFFSET = (1 - WIDTH_RATIO) / 2 * 100

SLOTS = [
    ("days", 9.4, 41.2, 12.8, 9.2),
    ("hours", 29.2, 41.5, 13.8, 9.0),
    ("minutes", 52.6, 41.5, 13.8, 9.0),
    ("seconds", 75.8, 41.2, 13.8, 9.2),
]

im = np.array(Image.open("public/holding page/holding-room.png").convert("RGB"))
failures = 0

for sid, left, top, width, height in SLOTS:
    cx = left + width / 2
    cy = top + height / 2
    px, py = int(PNG_W * cx / 100), int(PNG_H * cy / 100)
    rx = int(PNG_W * width / 200)
    ry = int(PNG_H * height / 200)
    bright = total = 0
    for dy in range(-ry, ry + 1):
        for dx in range(-rx, rx + 1):
            x, y = px + dx, py + dy
            if x < 0 or y < 0 or x >= PNG_W or y >= PNG_H:
                continue
            total += 1
            if im[y, x].max() > 150:
                bright += 1
    ratio = bright / total if total else 0
    stage_left = X_OFFSET + left * WIDTH_RATIO
    stage_top = top
    ok = ratio >= 0.06
    failures += 0 if ok else 1
    status = "PASS" if ok else "FAIL"
    print(
        f"{status} {sid:7} stage({stage_left:.2f}%, {stage_top:.2f}%) "
        f"bright={ratio * 100:.1f}%"
    )

print(f"letterbox x={X_OFFSET:.2f}% width-scale={WIDTH_RATIO:.4f}")
sys.exit(1 if failures else 0)
