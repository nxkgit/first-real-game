"""Draws the placeholder card picture (public/assets/cards/default.png): flat colour, one geometric
shape, no creative content. Real card art replaces it per card as <card-id>.png. 2:1, 320x160."""
from PIL import Image, ImageDraw

W, H = 320, 160
img = Image.new("RGB", (W, H), (58, 64, 84))
d = ImageDraw.Draw(img)
d.rectangle([0, H * 0.62, W, H], fill=(46, 51, 69))
cx, cy, r = W // 2, H // 2, 44
d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=(96, 106, 138))
d.polygon([(cx, cy - r // 2), (cx + r // 2, cy), (cx, cy + r // 2), (cx - r // 2, cy)], fill=(130, 142, 178))
img.save("public/assets/cards/default.png")
