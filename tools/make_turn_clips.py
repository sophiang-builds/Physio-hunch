"""Export one-shot quarter-turn GIFs from the registered 16-pose atlases."""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "assets" / "characters"
OUTPUT = ROOT / "turn-clips"
VIEWS = ("front", "right", "back", "left")
CAMERA = {"front": 1.00, "right": 1.31, "back": 0.84, "left": 1.31}
ROOM, LILAC = "#f7f3ea", "#d7c8f1"
CELL = 256
SIZE = 320
BASELINE = 311
POSES_PER_QUARTER = 4
STEPS = 16
FRAME_MS = 40
END_HOLD_MS = 280


def read_poses(path):
    with Image.open(path) as image:
        atlas = image.convert("RGBA")
    if atlas.size != (CELL * 4, CELL * 4):
        raise ValueError(f"Expected a 4 × 4 atlas of {CELL} px cells: {path}")
    return [
        atlas.crop((x, y, x + CELL, y + CELL))
        for y in range(0, atlas.height, CELL)
        for x in range(0, atlas.width, CELL)
    ]


def render(pose, zoom):
    scene = Image.new("RGB", (SIZE, SIZE), ROOM)
    ImageDraw.Draw(scene).ellipse((45, 35, 275, 265), fill=LILAC)
    side = round(CELL * zoom)
    sprite = pose.resize((side, side), Image.Resampling.NEAREST)
    bottom_padding = round(8 * zoom)
    scene.paste(sprite, ((SIZE - side) // 2, BASELINE + bottom_padding - side), sprite)
    return scene


def make_frames(poses, view_index, direction, palette):
    start = VIEWS[view_index]
    end = VIEWS[(view_index + direction) % len(VIEWS)]
    start_zoom, end_zoom = CAMERA[start], CAMERA[end]
    frames = []
    for step in range(STEPS + 1):
        t = step / STEPS
        eased = t * t * (3 - 2 * t)
        offset = round(POSES_PER_QUARTER * t)
        pose_index = (view_index * POSES_PER_QUARTER + direction * offset) % len(poses)
        zoom = start_zoom + (end_zoom - start_zoom) * eased
        frames.append(render(poses[pose_index], zoom).quantize(palette=palette, dither=Image.Dither.NONE))
    return frames


def export_patient(path):
    poses = read_poses(path)
    patient = path.stem
    samples = Image.new("RGB", (CELL * 4, CELL * 4 + 24), ROOM)
    ImageDraw.Draw(samples).rectangle((0, CELL * 4, CELL * 4 - 1, samples.height - 1), fill=LILAC)
    for index, pose in enumerate(poses):
        samples.paste(pose, (index % 4 * CELL, index // 4 * CELL), pose)
    palette = samples.quantize(colors=192)
    folder = OUTPUT / patient
    folder.mkdir(parents=True, exist_ok=True)
    routes = {}
    for index, start in enumerate(VIEWS):
        routes[start] = {}
        for direction in (-1, 1):
            end = VIEWS[(index + direction) % len(VIEWS)]
            filename = folder / f"{start}-to-{end}.gif"
            frames = make_frames(poses, index, direction, palette)
            # The absence of a loop extension lets players hold the end pose.
            frames[0].save(
                filename, save_all=True, append_images=frames[1:],
                duration=[FRAME_MS] * STEPS + [END_HOLD_MS],
                optimize=True, disposal=1,
            )
            routes[start][end] = filename.relative_to(OUTPUT).as_posix()
    return routes


def main():
    manifest = {
        "patients": {},
        "camera": {view: {"zoom": zoom, "anchorY": BASELINE / SIZE} for view, zoom in CAMERA.items()},
        "durationMs": STEPS * FRAME_MS + END_HOLD_MS,
        "poseCount": 16,
        "atlases": {},
    }
    for path in sorted((ROOT / "pose-atlases").glob("*.png")):
        manifest["patients"][path.stem] = export_patient(path)
        manifest["atlases"][path.stem] = f"../pose-atlases/{path.name}"
        print(f"{path.stem}: 8 GIFs from 16 poses")
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
