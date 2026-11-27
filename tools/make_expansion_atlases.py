"""Generate the expansion's pixel portraits and 16-view atlases from the case roster."""
import argparse
import csv
import math
from pathlib import Path
import random

import numpy as np
from PIL import Image, ImageColor

REPO = Path(__file__).resolve().parents[1]
ROSTER = REPO / "cases/expansion/cases.psv"
OUTPUT = REPO / "assets/characters/expansion"
SIZE = 96
CELL = 256
SKINS = dict(fair="#f1c0a1", light="#dba27d", medium="#c88f67", olive="#b98057",
             tan="#bd7954", brown="#986047", deep="#70422f")
CLOTHES = dict(violet="#775597", amber="#b87a3a", teal="#357679", rose="#ad6679",
               navy="#535b86", moss="#677e52", rust="#a65947")
BUILDS = dict(child=(20, 12), petite=(24, 13), slim=(25, 14), average=(29, 15),
              athletic=(31, 17), broad=(34, 19))


def lighter(colour, ratio):
    return "#" + "".join(f"{min(255, round(channel * ratio)):02x}" for channel in ImageColor.getrgb(colour))


def character(case):
    skin_key, hairstyle, outfit, build, extra = case["character"].split(";")
    skin, cloth = SKINS[skin_key], CLOTHES[outfit]
    age = int(case["age"])
    rng = random.Random(int(case["id"]))
    hair = rng.choice(["#3b2928", "#29252c", "#51352d", "#79513a", "#a6764e"])
    if skin_key in {"deep", "brown"}:
        hair = rng.choice(["#332526", "#27232b", "#46302c"])
    if age >= 65:
        hair = rng.choice(["#8c8187", "#a49a9b", "#b6a9a4", "#c4b8ad"])
    width, depth = BUILDS[build]
    hx = rng.uniform(12.1, 14.5) + (1.0 if build == "child" else 0)
    hy = rng.uniform(16, 18)
    eye_width = rng.uniform(1.2, 1.65)
    eye_spacing = rng.uniform(4.2, 5.4)
    nose = rng.uniform(1.8, 3.1)
    shape = []

    def add(x, y, z, rx, ry, rz, colour, mask=None):
        shape.append(((x, y, z), (rx, ry, rz), ImageColor.getrgb(colour), mask))

    # Torso, shoulders and collar. Geometry is shared across every viewing angle.
    add(0, 89, 0, width, 37, depth, cloth)
    for side in (-1, 1):
        add(side * (width - 7), 80, 0, 10, 18, depth * .74, cloth)
    add(0, 58, 0, 7.3, 13.5, 7, skin)
    add(0, 60, depth * .62, 10, 4.4, 4.4, lighter(cloth, .62))
    add(0, 56.5, depth * .74, 7.4, 3.5, 2.2, skin)
    if case["area"] in {"Occupational and community", "Cardiorespiratory and acute"}:
        for side in (-1, 1):
            add(side * 11, 79, depth*.89, 4.5, 2.7, 1.3, lighter(cloth, .74))
    elif build == "child":
        add(0, 76, depth*.96, 7.2, 2.5, 1.5, lighter(cloth, 1.32))
    if case["area"] == "Sports and performance":
        for side in (-1, 1):
            add(side * (width-8), 66, 2, 2.7, 6.3, depth * .64, "#e3d6b9")

    # Eyes, nose and mouth sit on the head in world space and self-occlude.
    add(0, 35, 0, hx, hy, 11.6, skin)
    add(0, 44, 2.9, hx * .72, 9, 9.1, skin)
    for side in (-1, 1):
        add(side * (hx-.6), 38, 0.9, 2.5, 4.4, 2.9, skin)
        add(side * eye_spacing, 34, 10.6, 2.9, 1.55, 1.3, "#efe1d6")
        add(side * eye_spacing, 34.0, 11.65, eye_width, 1.4, 0.65, "#362837")
        add(side * eye_spacing, 30.8, 10.85, 2.9, .75, .65, hair)
    add(0, 38, 11.1, nose, 3.6, 3.3, skin)
    add(0, 44.7, 11.25, rng.uniform(2.5, 4.3), .75, .75, "#814f4f")
    if age > 65:
        for side in (-1, 1):
            add(side * 5.8, 36.55, 10.7, 2.4, .48, .64, "#9a7063" if skin_key != "deep" else "#57383f")
    if extra in {"beard", "stubble"}:
        beard = hair if extra == "beard" else "#795a54"
        add(0, 48.0, 4.6, hx * .68, 5.3 if extra == "beard" else 3.1, 7.2, beard)
    if extra == "glasses":
        for side in (-1, 1):
            add(side * eye_spacing, 34.2, 11.9, 4.15, 2.8, .6, "#593c55", "rim")
            add(side * (hx-1.1), 33.8, 5.7, .8, .75, 5.8, "#593c55")
        add(0, 33.55, 12, 2, .65, .6, "#593c55")
    if extra == "freckles":
        for side in (-1, 1):
            for pos in (4.6, 6.8, 8.2):
                add(side*pos, 39.4 + rng.uniform(-1, 1), 11.0-pos*.12, .45, .45, .5, "#995a50")

    if hairstyle == "wrap":
        add(0, 29, -1.5, hx + 1.65, 14.7, 13.1, cloth, "cap")
        for side in (-1, 1):
            add(side * (hx-.8), 44, -2.6, 4.1, 15, 8.2, cloth)
        add(0, 49, -8, 11, 14, 7, cloth)
    elif hairstyle == "bald":
        add(0, 28, -3.1, hx + .4, 10, 11, hair, "receding")
    else:
        add(0, 27, -1.4, hx + 1.35, 12.3, 12.9, hair, "cap")
        if hairstyle in {"long", "bob", "braid", "locs", "short"}:
            length = {"long":23, "bob":13.5, "braid":15, "locs":17, "short":8}[hairstyle]
            add(0, 34 + length * .48, -6.6, hx + 1.1, length, 7.2, hair)
            if hairstyle != "short":
                for side in (-1, 1):
                    add(side * (hx-1.7), 36 + length * .51, -1.7, 3.6, length*.75, 6, hair)
        if hairstyle in {"pony", "bun", "braid"}:
            add(0 if hairstyle=="bun" else 4, 25, -11, 7.9, 8.5, 7.4, hair)
            if hairstyle != "bun":
                add(5.5, 40, -13, 5.8, 17 if hairstyle=="pony" else 20, 5.8, hair)
        if hairstyle == "quiff":
            add(-3, 20, 4.2, 10, 7.6, 8.2, hair)
        if hairstyle in {"puffs", "locs"}:
            for side in (-1, 1):
                add(side*(hx-1), 21, -2, 7, 7, 6.6, hair)
    if hairstyle not in {"bald", "wrap"}:
        for index in range(4):
            x = -8 + 4.9 * index
            y = 20.0 + (abs(x) / 8) ** 2 * 1.65
            add(x, y, 5.4, 3.8, 3.0, 4.75, lighter(hair, 1.12 + .04 * (index % 2)))
    return shape


def render(shape, angle):
    sine, cosine = math.sin(angle), math.cos(angle)
    depth = np.full((SIZE, SIZE), -np.inf)
    rgb = np.zeros((SIZE, SIZE, 3), dtype=np.uint8)
    for (x, y, z), (rx, ry, rz), colour, mask in shape:
        center_x = x*cosine + z*sine + SIZE/2
        center_z = -x*sine + z*cosine
        radius_x = math.hypot(rx*cosine, rz*sine)
        left = max(0, math.floor(center_x-radius_x))
        right = min(SIZE, math.ceil(center_x+radius_x)+1)
        top, bottom = max(0, math.floor(y-ry)), min(SIZE, math.ceil(y+ry)+1)
        yy, xx = np.ogrid[top:bottom, left:right]
        u, v = xx - center_x + .5, yy - y + .5
        a = sine*sine/rx**2 + cosine*cosine/rz**2
        b = u*sine*cosine*(1/rz**2 - 1/rx**2)
        c = u*u*(cosine*cosine/rx**2 + sine*sine/rz**2) + (v/ry)**2 - 1
        discriminant = b*b-a*c
        d = (-b + np.sqrt(np.maximum(0,discriminant)))/a
        local_x, local_z = cosine*u-sine*d, sine*u+cosine*d
        subdepth = depth[top:bottom,left:right]
        visible = (discriminant >= 0) & (d+center_z > subdepth)
        if mask == "cap":
            visible &= (local_z < 1) | (v < 2.2 + .13*np.abs(local_x))
        if mask == "receding":
            visible &= (local_z < -3) & (v > 0)
        if mask == "rim":
            visible &= (local_x/rx)**2 + (v/ry)**2 > .59
        nx, ny, nz = local_x/rx**2, v/ry**2, local_z/rz**2
        normal = np.maximum(1e-7, np.sqrt(nx**2+ny**2+nz**2))
        light = (-.54*nx-.65*ny+.53*nz)/normal
        tones = np.select([light < -.22, light < .19, light < .58], [.62, .79, .96], default=1.10)
        rgb[top:bottom,left:right][visible] = np.clip(np.array(colour)*tones[visible,None],0,255)
        subdepth[visible] = (d+center_z)[visible]

    alpha = np.isfinite(depth)
    neighbours = [np.roll(alpha, offset, axis=axis) for axis in (0,1) for offset in (-1,1)]
    edge = alpha & ~np.logical_and.reduce(neighbours)
    rgb[edge] = (49,34,48)
    return Image.fromarray(np.dstack((rgb, alpha.astype(np.uint8)*255)))


def export(case):
    shape = character(case)
    atlas = Image.new("RGBA", (4*CELL,4*CELL))
    for index in range(16):
        pose = render(shape, index*math.tau/16)
        if index == 0:
            pose.save(OUTPUT / "portraits" / f"{case['id']}.png", optimize=True)
        tile = pose.resize((CELL,CELL), Image.Resampling.NEAREST)
        atlas.paste(tile, (index%4*CELL,index//4*CELL))
    atlas.save(OUTPUT / "atlases" / f"{case['id']}.png", optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ids", nargs="*", help="Optional case IDs. The default renders the complete roster.")
    args = parser.parse_args()
    (OUTPUT / "portraits").mkdir(parents=True, exist_ok=True)
    (OUTPUT / "atlases").mkdir(parents=True, exist_ok=True)
    with ROSTER.open(encoding="utf-8", newline="") as rows:
        cases = list(csv.DictReader(rows, delimiter="|"))
    selection = [case for case in cases if not args.ids or case["id"] in args.ids]
    if args.ids and set(args.ids) != {case["id"] for case in selection}:
        parser.error("Unknown case ID")
    for case in selection:
        export(case)
    print(f"Rendered {len(selection)} characters with 16 poses each")


if __name__ == "__main__":
    main()
