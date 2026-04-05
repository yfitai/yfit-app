"""
Generate rounded-corner PWA icons for YFIT AI.
Uses the existing icon-512x512.png as source and applies
an iOS/Android-style squircle mask (about 22% corner radius).
"""
from PIL import Image, ImageDraw
import os

SOURCE = "public/icon-512x512.png"
SIZES = [76, 120, 152, 180, 192, 512]
# Corner radius as a fraction of icon size — 22% matches iOS squircle closely
RADIUS_RATIO = 0.22

def make_rounded_icon(source_path, size, radius_ratio):
    img = Image.open(source_path).convert("RGBA").resize((size, size), Image.LANCZOS)
    radius = int(size * radius_ratio)

    # Create a rounded-rectangle mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)

    # Apply mask as alpha channel
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result

os.makedirs("public", exist_ok=True)

for size in SIZES:
    icon = make_rounded_icon(SOURCE, size, RADIUS_RATIO)
    out_path = f"public/icon-{size}x{size}.png"
    icon.save(out_path, "PNG")
    print(f"Saved {out_path} ({size}x{size}, radius={int(size * RADIUS_RATIO)}px)")

# Also update apple-touch-icon (180x180)
apple = make_rounded_icon(SOURCE, 180, RADIUS_RATIO)
apple.save("public/apple-touch-icon.png", "PNG")
print("Saved public/apple-touch-icon.png (180x180)")

print("\nAll icons generated with rounded corners.")
