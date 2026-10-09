"""Builds the game's art files in public/assets from the raw packs in assets/ (git-ignored).

Run once after changing which pack files the game uses:  python tools/prepareAssets.py
(set ASSETS_RAW to the folder holding the raw packs if it is not ./assets)
Needs Pillow (pip install pillow). Sources and licences are listed in public/assets/CREDITS.md.
"""
import io
import os
import sys
import zipfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# the raw packs are git-ignored; ASSETS_RAW points at them from another checkout (e.g. a git worktree)
RAW = os.environ.get('ASSETS_RAW', os.path.join(ROOT, 'assets'))
OUT = os.path.join(ROOT, 'public', 'assets')

# which pack file stands in for what (placeholder choices; change freely)
MAP_ICONS = {'combat': 'flag', 'elite': 'skull', 'rest': 'campfire', 'shop': 'houseChimney', 'event': 'runis', 'boss': 'castle'}
ICONS = ['axe', 'heart', 'shield', 'potionRed', 'potionGreen', 'scroll', 'dagger', 'coin', 'tome', 'wand', 'gemBlue']
TRIMMED_ICONS = {'gemBlue'}  # drawn small inside the 64px frame: cropped to the artwork (kept square) so it sizes like the others
BACKGROUNDS = {'grass': 'backgroundColorGrass', 'forest': 'backgroundColorForest', 'fall': 'backgroundColorFall', 'desert': 'backgroundColorDesert', 'castles': 'backgroundCastles'}
# animated pixel enemies: spritesheets.zip files, kept as they are (frame size is in the file name)
PIXEL_SHEETS = {'gnu': 'gnu-120x100', 'disciple': 'disciple-45x51', 'minion': 'minion-45x66'}
# pixel stills: 604x604 pictures in assets/pixel_stills/ (the "Instagram_last" files), drawn at ~9.4x a
# 64x64 original. Neutral names, in file-name order; shrunk back to 64x64 and trimmed (pixel-<letter>).
PIXEL_STILL_NATIVE = 64
# painted characters sheet: quadrants, in reading order
ENEMIES = ['skeleton', 'goblin', 'fighter', 'brute']
ENEMY_MAX_HEIGHT = 200
# the hero: the dark-elf witch (craftpix free pack): four near-identical portraits, no attack or death art
HERO_ZIP = 'dark_elf_character_witch.zip'
HERO_FACES = [f'Character2_face{i}.png' for i in range(1, 5)]


def zip_image(zip_name: str, inner_suffix: str) -> Image.Image:
    with zipfile.ZipFile(os.path.join(RAW, zip_name)) as z:
        name = next(n for n in z.namelist() if n.replace('\\', '/').endswith(inner_suffix))
        return Image.open(io.BytesIO(z.read(name))).convert('RGBA')


def square_trim(img: Image.Image) -> Image.Image:
    """Crops to the visible artwork and pads to a square, so the picture keeps its shape when shown at a square size."""
    art = img.crop(img.getbbox())
    side = max(art.size)
    out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    out.paste(art, ((side - art.width) // 2, (side - art.height) // 2))
    return out


def save(img: Image.Image, *parts: str) -> None:
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)
    print('wrote', os.path.relpath(path, ROOT), img.size)


def build_ashlands() -> None:
    """The animated ashlands backdrop: assets/backgrounds/Ashlands_1.gif becomes one PNG per frame
    (backgrounds/ashlands-0.png ...). The game plays them in order (src/data/art.ts ASHLANDS)."""
    path = os.path.join(RAW, 'backgrounds', 'Ashlands_1.gif')
    if not os.path.exists(path):
        print('skipped ashlands: no', os.path.relpath(path, ROOT))
        return
    gif = Image.open(path)
    durations = set()
    for i in range(gif.n_frames):
        gif.seek(i)
        durations.add(gif.info.get('duration'))
        save(gif.convert('RGB'), 'backgrounds', f'ashlands-{i}.png')
    print(f'ashlands: {gif.n_frames} frames of {gif.size[0]}x{gif.size[1]}, frame time(s) in ms: {sorted(durations)} (ASHLANDS in src/data/art.ts must match)')


def main() -> None:
    if 'ashlands' in sys.argv[1:]:  # only the animated backdrop, when the other raw packs are not at hand
        build_ashlands()
        return
    for kind, name in MAP_ICONS.items():
        save(zip_image('kenney_cartography-pack.zip', f'PNG/Default/{name}.png'), 'map', f'{kind}.png')
    for name in ICONS:
        icon = zip_image('RavenmoreIconPack.02.2014.zip', f'64/{name}.png')
        if name in TRIMMED_ICONS:
            icon = square_trim(icon)
        save(icon, 'icons', f'{name}.png')
    save(zip_image('kenney_fantasy-ui-borders.zip', 'PNG/Default/Border/panel-border-009.png'), 'ui', 'border.png')

    for name, file in BACKGROUNDS.items():
        save(zip_image('kenney_background-elements-remastered.zip', f'Backgrounds/{file}.png').convert('RGB'), 'backgrounds', f'{name}.png')
    build_ashlands()

    for name, file in PIXEL_SHEETS.items():
        save(zip_image('spritesheets.zip', f'/{file}.png'), 'pixel', f'{name}.png')

    sheet = Image.open(os.path.join(RAW, 'characters.png')).convert('RGBA')
    w, h = sheet.size
    for i, name in enumerate(ENEMIES):
        x, y = (i % 2) * (w // 2), (i // 2) * (h // 2)
        quad = sheet.crop((x, y, x + w // 2, y + h // 2))
        quad = quad.crop(quad.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
        if quad.height > ENEMY_MAX_HEIGHT:
            quad = quad.resize((round(quad.width * ENEMY_MAX_HEIGHT / quad.height), ENEMY_MAX_HEIGHT), Image.LANCZOS)
        save(quad, 'enemies', f'{name}.png')

    still_dir = os.path.join(RAW, 'pixel_stills')
    for letter, file in zip('abcdefghijklmnopqrstuvwxyz', sorted(f for f in os.listdir(still_dir) if f.endswith('.png'))):
        img = Image.open(os.path.join(still_dir, file)).convert('RGBA')
        img = img.resize((PIXEL_STILL_NATIVE, PIXEL_STILL_NATIVE), Image.NEAREST)
        save(img.crop(img.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()), 'enemies', f'pixel-{letter}.png')

    with zipfile.ZipFile(os.path.join(RAW, HERO_ZIP)) as z:  # top-level files only: icons/ holds 64px copies
        faces = [Image.open(io.BytesIO(z.read(n))).convert('RGBA') for n in HERO_FACES]
    fw, fh = faces[0].size
    strip = Image.new('RGBA', (fw * len(faces), fh))
    for i, f in enumerate(faces):
        strip.paste(f, (i * fw, 0))
    save(strip, 'hero', 'hero.png')
    print(f'hero frames: {len(faces)} of {fw}x{fh} (idle only; attack and death are drawn in code)')


if __name__ == '__main__':
    main()
