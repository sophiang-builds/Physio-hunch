"""Register one individually illustrated character atlas from a green-screen 4 × 4 sheet."""
import argparse
import csv
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "assets/characters/expansion"
ILLUSTRATED = ART / "illustrated.json"
CELL = 256
HEIGHT = 224
BASELINE = 248


def register(source):
    with Image.open(source) as original:
        sheet = original.convert("RGBA")
    if sheet.width != sheet.height or sheet.width < CELL * 4:
        raise ValueError("Expected a square source at least 1024 pixels wide.")
    atlas = Image.new("RGBA", (CELL * 4, CELL * 4))
    seen = set()
    for index in range(16):
        row, col = divmod(index, 4)
        bounds = tuple(round(value * sheet.width / 4) for value in (col, row, col + 1, row + 1))
        tile = np.array(sheet.crop(bounds))
        red, green, blue = [tile[..., channel].astype(np.int16) for channel in range(3)]
        key = (green > 75) & (green > red * 1.19 + 12) & (green > blue * 1.19 + 12)
        tile[key | (tile[..., 3] == 0)] = 0
        pose = Image.fromarray(tile)
        box = pose.getbbox()
        if not box or min(box[0], box[1], pose.width - box[2]) < 2:
            raise ValueError(f"Pose {index} is empty or touches its cell boundary.")
        # A waist crop at the last row's canvas edge is safe; internal rows need a gap.
        if row != 3 and pose.height - box[3] < 2:
            raise ValueError(f"Pose {index} is empty or touches its cell boundary.")
        pose = pose.crop(box)
        width = round(pose.width * HEIGHT / pose.height)
        if width > CELL - 8:
            raise ValueError(f"Pose {index} is too wide for the registered cell.")
        pose = pose.resize((width, HEIGHT), Image.Resampling.NEAREST)
        data = (pose.size, pose.tobytes())
        if data in seen:
            raise ValueError(f"Duplicate drawing in pose {index}.")
        seen.add(data)
        atlas.paste(pose, (col * CELL + (CELL-width)//2, row * CELL + BASELINE-HEIGHT))
    return atlas


def refresh_contact_sheet(cases):
    size = 72
    board = Image.new("RGB", (size * 10, size * 10), "#f7f3ea")
    for index, case in enumerate(cases):
        with Image.open(ART / "portraits" / f"{case['id']}.png") as portrait:
            thumb = portrait.convert("RGBA").resize((size, size), Image.Resampling.NEAREST)
            board.paste(thumb, (index % 10 * size, index // 10 * size), thumb)
    board.save(ART / "contact-sheet.png", optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case_id")
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    with (ROOT / "cases/expansion/cases.psv").open(encoding="utf-8", newline="") as file:
        cases = list(csv.DictReader(file, delimiter="|"))
    if args.case_id not in {case["id"] for case in cases}:
        parser.error("Unknown case ID.")

    atlas = register(args.source)
    atlas.save(ART / "atlases" / f"{args.case_id}.png", optimize=True)
    atlas.crop((0, 0, CELL, CELL)).save(ART / "portraits" / f"{args.case_id}.png", optimize=True)
    ids = set(json.loads(ILLUSTRATED.read_text())) if ILLUSTRATED.exists() else set()
    ids.add(args.case_id)
    ILLUSTRATED.write_text(json.dumps(sorted(ids), indent=2) + "\n")
    refresh_contact_sheet(cases)
    print(f"Registered 16 poses and a front portrait for case {args.case_id}.")


if __name__ == "__main__":
    main()
