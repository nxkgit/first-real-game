"""Builds the game's art files in public/assets from the raw packs in assets/ (git-ignored).

Run once after changing which pack files the game uses:  python tools/prepareAssets.py
(set ASSETS_RAW to the folder holding the raw packs if it is not ./assets)
Needs Pillow (pip install pillow). Sources and licences are listed in public/assets/CREDITS.md.
"""
import io
import os
import zipfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# the raw packs are git-ignored; ASSETS_RAW points at them from another checkout (e.g. a git worktree)
RAW = os.environ.get('ASSETS_RAW', os.path.join(ROOT, 'assets'))
OUT = os.path.join(ROOT, 'public', 'assets')

# which pack file stands in for what (placeholder choices; change freely)
MAP_ICONS = {'combat': 'flag', 'elite': 'skull', 'rest': 'campfire', 'shop': 'houseChimney', 'event': 'runis', 'boss': 'castle'}
ICONS = ['axe', 'heart', 'shield', 'potionRed', 'potionGreen', 'scroll', 'dagger', 'coin', 'tome', 'wand']
BACKGROUNDS = {'grass': 'backgroundColorGrass', 'forest': 'backgroundColorForest', 'fall': 'backgroundColorFall', 'desert': 'backgroundColorDesert', 'castles': 'backgroundCastles'}
# animated pixel enemies: spritesheets.zip files, kept as they are (frame size is in the file name)
PIXEL_SHEETS = {'gnu': 'gnu-120x100', 'disciple': 'disciple-45x51', 'minion': 'minion-45x66'}
# painted characters sheet: quadrants, in reading order
ENEMIES = ['skeleton', 'goblin', 'fighter', 'brute']
ENEMY_MAX_HEIGHT = 200
HERO_FRAMES = [f'character_idle_{i}' for i in range(4)] + [f'character_sword_Attack_{i}' for i in range(4)] + [f'character_death_{i}' for i in range(3)]


def zip_image(zip_name: str, inner_suffix: str) -> Image.Image:
    with zipfile.ZipFile(os.path.join(RAW, zip_name)) as z:
        name = next(n for n in z.namelist() if n.replace('\\', '/').endswith(inner_suffix))
        return Image.open(io.BytesIO(z.read(name))).convert('RGBA')


def save(img: Image.Image, *parts: str) -> None:
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)
    print('wrote', os.path.relpath(path, ROOT), img.size)


def main() -> None:
    for kind, name in MAP_ICONS.items():
        save(zip_image('kenney_cartography-pack.zip', f'PNG/Default/{name}.png'), 'map', f'{kind}.png')
    for name in ICONS:
        save(zip_image('RavenmoreIconPack.02.2014.zip', f'64/{name}.png'), 'icons', f'{name}.png')
    save(zip_image('kenney_fantasy-ui-borders.zip', 'PNG/Default/Border/panel-border-009.png'), 'ui', 'border.png')

    for name, file in BACKGROUNDS.items():
        save(zip_image('kenney_background-elements-remastered.zip', f'Backgrounds/{file}.png').convert('RGB'), 'backgrounds', f'{name}.png')

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

    frames = [zip_image('fantasy_vector_character.zip', f'character with sword/{n}.png') for n in HERO_FRAMES]
    boxes = [f.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox() for f in frames]
    left, top = min(b[0] for b in boxes), min(b[1] for b in boxes)
    right, bottom = max(b[2] for b in boxes), max(b[3] for b in boxes)
    fw, fh = right - left, bottom - top
    strip = Image.new('RGBA', (fw * len(frames), fh))
    for i, f in enumerate(frames):
        strip.paste(f.crop((left, top, right, bottom)), (i * fw, 0))
    save(strip, 'hero', 'hero.png')
    print(f'hero frames: {len(frames)} of {fw}x{fh} (idle 0-3, attack 4-7, death 8-10)')


if __name__ == '__main__':
    main()
