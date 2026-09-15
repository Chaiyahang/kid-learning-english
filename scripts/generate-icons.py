#!/usr/bin/env python3
"""Generate PWA PNG icons from the toy-block artwork.

Draws at 1024px (2x) and downscales for crisp edges. Outputs:
  public/apple-touch-icon.png   180x180, full bleed (iOS home screen)
  public/icon-192.png           192x192, full bleed
  public/icon-512.png           512x512, full bleed
  public/icon-maskable-512.png  512x512, art scaled into the safe zone

Usage: python3 scripts/generate-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

SCALE = 2
SIZE = 512 * SCALE

SKY_TOP = (91, 148, 255)
SKY_BOTTOM = (47, 102, 239)
BLOCK_TOP = (255, 216, 105)
BLOCK_BOTTOM = (255, 192, 46)
BLOCK_FACE_TOP = (255, 233, 168)
BLOCK_FACE_SIDE = (239, 171, 18)
INK = (31, 42, 68)
WHITE = (255, 255, 255)
BLUE = (47, 102, 239)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_background(draw):
    for y in range(SIZE):
        draw.line([(0, y), (SIZE, y)], fill=lerp(SKY_TOP, SKY_BOTTOM, y / SIZE))


def draw_art(draw):
    # toy block: top face, right side, front face
    draw.polygon(
        [(176, 380), (256, 300), (744, 300), (664, 380)], fill=BLOCK_FACE_TOP
    )
    draw.polygon(
        [(664, 380), (744, 300), (744, 788), (664, 868)], fill=BLOCK_FACE_SIDE
    )
    draw.rounded_rectangle(
        (176, 380, 664, 868), radius=92, fill=lerp(BLOCK_TOP, BLOCK_BOTTOM, 0.5)
    )

    # letter A: two legs plus a crossbar
    draw.polygon([(392, 472), (444, 472), (336, 784), (284, 784)], fill=INK)
    draw.polygon([(392, 472), (444, 472), (552, 784), (500, 784)], fill=INK)
    draw.rounded_rectangle((312, 628, 520, 680), radius=16, fill=INK)

    # speech bubble with a tail and sound waves
    draw.rounded_rectangle((572, 184, 916, 420), radius=92, fill=WHITE)
    draw.polygon([(644, 408), (712, 408), (660, 484)], fill=WHITE)
    draw.ellipse((636, 278, 684, 326), fill=BLUE)
    wave_width = 22
    draw.arc((650, 256, 742, 348), start=270, end=90, fill=BLUE, width=wave_width)
    draw.arc((686, 232, 826, 372), start=270, end=90, fill=BLUE, width=wave_width)
    draw.arc((722, 208, 910, 396), start=270, end=90, fill=BLUE, width=wave_width)


def render_icon(maskable: bool) -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), SKY_TOP)
    draw = ImageDraw.Draw(image)
    draw_background(draw)

    if maskable:
        # Android crops to the centre; keep art inside the 80% safe zone.
        layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        draw_art(ImageDraw.Draw(layer))
        scaled = layer.resize((round(SIZE * 0.78), round(SIZE * 0.78)))
        image.paste(
            scaled,
            ((SIZE - scaled.width) // 2, (SIZE - scaled.height) // 2),
            scaled,
        )
    else:
        draw_art(draw)

    return image


def main() -> None:
    public = Path(__file__).resolve().parent.parent / "public"
    public.mkdir(exist_ok=True)

    flat = render_icon(maskable=False)
    maskable = render_icon(maskable=True)

    for size, name in ((180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        flat.resize((size, size), Image.LANCZOS).save(public / name, optimize=True)

    maskable.resize((512, 512), Image.LANCZOS).save(public / "icon-maskable-512.png", optimize=True)
    print("icons written to", public)


if __name__ == "__main__":
    main()
