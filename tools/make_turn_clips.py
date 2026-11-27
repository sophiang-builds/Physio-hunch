"""Export reusable quarter-turn GIFs. Run python3 tools/make_turn_clips.py."""
import json
import math
from pathlib import Path

from PIL import Image

from make_turn_gifs import IDS, VIEWS, ease, frame

ROOT = Path(__file__).resolve().parents[1]
CHARACTERS = ROOT / "assets" / "characters"
OUTPUT = CHARACTERS / "turn-clips"
CAMERA = {
    "front": (1.00, 0.55),
    "right": (1.12, 0.40),
    "back": (0.94, 0.55),
    "left": (1.12, 0.40),
}
CLIP_SIZE = (320, 320)
STEPS = 18
FRAME_MS = 40
END_HOLD_MS = 280


def make_frames(source, target, start, end, palette):
    zoom_start, anchor_start = CAMERA[start]
    zoom_end, anchor_end = CAMERA[end]
    frames = []
    for step in range(STEPS + 1):
        t = step / STEPS
        progress = ease(t)
        zoom = zoom_start + (zoom_end - zoom_start) * progress
        anchor = anchor_start + (anchor_end - anchor_start) * progress
        width = 1 - 0.16 * math.sin(math.pi * t)
        mix = ease(min(1, max(0, (t - 0.39) / 0.22)))
        if mix == 0:
            result = frame(source, zoom, anchor, width)
        elif mix == 1:
            result = frame(target, zoom, anchor, width)
        else:
            before = frame(source, zoom, anchor, width)
            after = frame(target, zoom, anchor, width)
            result = Image.blend(before, after, mix)
        reduced = result.resize(CLIP_SIZE, Image.Resampling.NEAREST)
        frames.append(reduced.quantize(palette=palette, dither=Image.Dither.NONE))
    return frames


def main():
    manifest = {
        "patients": {},
        "camera": {view: {"zoom": zoom, "anchorY": anchor} for view, (zoom, anchor) in CAMERA.items()},
        "durationMs": STEPS * FRAME_MS + END_HOLD_MS,
    }
    for patient in IDS:
        sprites = {}
        for view in VIEWS:
            with Image.open(CHARACTERS / "sprites" / f"{patient}-{view}.png") as sprite:
                sprites[view] = sprite.convert("RGBA")
        colour_samples = Image.new("RGB", (CLIP_SIZE[0], CLIP_SIZE[1] * len(VIEWS)))
        for index, view in enumerate(VIEWS):
            sample = frame(sprites[view], *CAMERA[view]).resize(CLIP_SIZE, Image.Resampling.NEAREST)
            colour_samples.paste(sample, (0, index * CLIP_SIZE[1]))
        palette = colour_samples.quantize(colors=128)
        folder = OUTPUT / patient
        folder.mkdir(parents=True, exist_ok=True)
        routes = {}
        for index, start in enumerate(VIEWS):
            routes[start] = {}
            for direction in (-1, 1):
                end = VIEWS[(index + direction) % len(VIEWS)]
                path = folder / f"{start}-to-{end}.gif"
                frames = make_frames(sprites[start], sprites[end], start, end, palette)
                # Omitting the GIF loop extension makes each clip a one-shot.
                frames[0].save(
                    path, save_all=True, append_images=frames[1:],
                    duration=[FRAME_MS] * STEPS + [END_HOLD_MS],
                    optimize=True, disposal=1,
                )
                routes[start][end] = path.relative_to(OUTPUT).as_posix()
        manifest["patients"][patient] = routes
        print(f"{patient}: {sum(map(len, routes.values()))} GIFs")
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
