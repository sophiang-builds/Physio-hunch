"""Render a turning GIF for each patient from the sheet sprites.

Motion matches the app (ios/PhysioHunch/Views/Components.swift, PatientStage):
  - wrong test: the head gives a small 'no' shake (rows above the neck sway, shoulders stay still)
  - right test: the patient turns one view (front, right, back, left) while the camera
    cuts smoothly between three shots: wide (waist up), medium (chest and face), close (face).
Run from the repository root: python3 tools/make_turn_gifs.py
"""
import math, random
from PIL import Image, ImageDraw

IDS = ["ankle", "sciatica", "stroke", "postop", "cardiac"]
VIEWS = ["front", "right", "back", "left"]
SHOTS = {"wide": (1.0, 0.55), "medium": (1.32, 0.40), "close": (1.72, 0.30)}  # zoom, vertical anchor
NECK = 0.50                 # fraction of sprite height where the head meets the shoulders
SIZE, SPRITE_H, FPS = 400, 330, 30
ROOM, LILAC = (247, 243, 234), (215, 200, 241)

def ease(t): return t * t * (3 - 2 * t)
def ease_io(t): return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2

def head_shake(sprite, dx):
    w, h = sprite.size
    out = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
    neck = int(h * NECK)
    for y in range(h):
        k = 1.0 if y < neck - h * .1 else max(0.0, (neck - y) / (h * .1)) if y < neck else 0.0
        row = sprite.crop((0, y, w, y + 1))
        out.paste(row, (round(dx * k), y), row)
    return out

def frame(sprite, zoom, anchor_y, sx=1.0, lift=0.0):
    img = Image.new("RGB", (SIZE, SIZE), ROOM)
    d = ImageDraw.Draw(img)
    px, py = SIZE / 2, anchor_y * SIZE
    tr = lambda x, y: (px + zoom * (x - px), py + zoom * (y - py))
    # backdrop disc
    cx, cy = tr(SIZE / 2, SIZE * .47); r = 150 * zoom
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=LILAC)
    def place(sp, alpha, scale_x):
        base = SPRITE_H / sp.height
        w = max(1, round(sp.width * base * zoom * scale_x)); h = round(sp.height * base * zoom)
        s = sp.resize((w, h), Image.NEAREST)
        if alpha < 1: s.putalpha(s.getchannel("A").point(lambda a: int(a * alpha)))
        bx, by = tr(SIZE / 2, SIZE - lift)
        img.paste(s, (round(bx - w / 2), round(by - h)), s)
    place(sprite, 1.0, sx)
    return img

def render(pid, seed):
    sp = {v: Image.open(f"assets/characters/sprites/{pid}-{v}.png").convert("RGBA") for v in VIEWS}
    rnd = random.Random(seed)
    frames = []
    hold = lambda v, shot, n: frames.extend(frame(sp[v], *SHOTS[shot]) for _ in range(n))
    hold("front", "wide", 18)
    # wrong test: head shake "no"
    for i in range(22):
        t = i / 21
        dx = 5 * math.sin(t * math.pi * 5) * (1 - t)
        frames.append(frame(head_shake(sp["front"], dx), *SHOTS["wide"]))
    hold("front", "wide", 10)
    # right tests: turn + camera move. Shot order: medium, close, then random in/out.
    shot = "wide"; view = 0
    order = ["medium", "close"]
    for turn in range(4):
        nxt = order[turn] if turn < len(order) else rnd.choice([s for s in SHOTS if s != shot])
        if turn == 3: nxt = "wide"
        z0, a0 = SHOTS[shot]; z1, a1 = SHOTS[nxt]
        a, b = VIEWS[view], VIEWS[(view + 1) % 4]
        n = 26
        for i in range(n + 1):
            t = i / n; c = ease_io(t)
            zoom = z0 + (z1 - z0) * c; ay = a0 + (a1 - a0) * c
            lift = math.sin(math.pi * t) * 6
            # body keeps depth side-on: narrowest at 55% width; views cross-fade through the middle
            sx = 1 - .45 * math.sin(math.pi * t)
            u = min(1, max(0, (t - .4) / .2))
            if u <= 0: frames.append(frame(sp[a], zoom, ay, sx, lift))
            elif u >= 1: frames.append(frame(sp[b], zoom, ay, sx, lift))
            else: frames.append(Image.blend(frame(sp[a], zoom, ay, sx, lift), frame(sp[b], zoom, ay, sx, lift), ease(u)))
        shot, view = nxt, (view + 1) % 4
        hold(b, shot, 20)
    return frames

if __name__ == "__main__":
    for i, pid in enumerate(IDS):
        fr = render(pid, i)
        pal = [f.convert("P", palette=Image.ADAPTIVE, colors=128) for f in fr]
        pal[0].save(f"assets/characters/gifs/{pid}-turn.gif", save_all=True, append_images=pal[1:],
                    duration=int(1000 / FPS), loop=0, optimize=True, disposal=1)
        print(pid, len(fr), "frames")
