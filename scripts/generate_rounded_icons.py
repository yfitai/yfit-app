"""
Generate PWA icons for YFIT AI.

Two variants are produced:
  1. Regular icons (purpose: any)  — transparent background, rounded corners.
     Used by browsers and iOS Safari "Add to Home Screen".
  2. Maskable icon (purpose: maskable) — solid background colour, logo centred
     with 10% safe-zone padding on each side.
     Used by Android Chrome, which applies its own shape mask (squircle/circle).

The manifest should list BOTH variants so each platform picks the right one.
"""
from PIL import Image, ImageDraw
import os

SOURCE = "public/icon-512x512-original.png"
BG_COLOR = (15, 23, 42)          # #0f172a — matches manifest background_color
RADIUS_RATIO = 0.22               # ~22% corner radius for "any" icons
SAFE_ZONE = 0.10                  # 10% padding on each side for maskable icon

REGULAR_SIZES = [76, 120, 152, 180, 192, 512]
MASKABLE_SIZE = 512

os.makedirs("public", exist_ok=True)

# ── helpers ──────────────────────────────────────────────────────────────────

def make_regular_icon(source_path, size, radius_ratio):
    """Resize source, apply rounded-rectangle alpha mask, transparent corners."""
    img = Image.open(source_path).convert("RGBA").resize((size, size), Image.LANCZOS)
    radius = int(size * radius_ratio)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result


def make_maskable_icon(source_path, size, safe_zone, bg_color):
    """
    Solid background + logo centred inside the safe zone.
    Android applies its own shape; we must NOT pre-clip corners here.
    """
    padding = int(size * safe_zone)
    inner_size = size - 2 * padding

    logo = Image.open(source_path).convert("RGBA").resize((inner_size, inner_size), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (*bg_color, 255))
    canvas.paste(logo, (padding, padding), logo)
    return canvas


# ── generate regular icons ────────────────────────────────────────────────────

# Keep a pristine original to re-use for both variants
original_path = SOURCE
if not os.path.exists(original_path):
    # First run: back up the current 512 as the original
    import shutil
    shutil.copy("public/icon-512x512.png", original_path)
    print(f"Backed up original to {original_path}")

for size in REGULAR_SIZES:
    icon = make_regular_icon(original_path, size, RADIUS_RATIO)
    out_path = f"public/icon-{size}x{size}.png"
    icon.save(out_path, "PNG")
    print(f"[regular]   {out_path}  ({size}x{size}, radius={int(size * RADIUS_RATIO)}px)")

# Apple touch icon (180x180, no transparency — iOS ignores alpha on home screen icons)
apple = Image.open(original_path).convert("RGB").resize((180, 180), Image.LANCZOS)
apple.save("public/apple-touch-icon.png", "PNG")
print("[apple]     public/apple-touch-icon.png  (180x180, no alpha)")

# ── generate maskable icon ────────────────────────────────────────────────────

maskable = make_maskable_icon(original_path, MASKABLE_SIZE, SAFE_ZONE, BG_COLOR)
maskable.save("public/icon-maskable-512x512.png", "PNG")
print(f"[maskable]  public/icon-maskable-512x512.png  ({MASKABLE_SIZE}x{MASKABLE_SIZE}, padding={int(MASKABLE_SIZE * SAFE_ZONE)}px)")

print("\nAll icons generated.")
