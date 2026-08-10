#!/usr/bin/env python3
import argparse
import csv
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--frames-dir", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--threshold", type=float, default=20.0)
    parser.add_argument("--max-gap-seconds", type=float, default=1.0)
    args = parser.parse_args()

    manifest = Path(args.manifest)
    frames_dir = Path(args.frames_dir)
    rows = list(csv.DictReader(manifest.open(encoding="utf-8")))
    kept = []
    last_image = None
    last_time = None

    for row in rows:
        frame_time = float(row["time_seconds"])
        with Image.open(frames_dir / row["file"]) as source:
            current = source.convert("L").resize((24, 52))
        if last_image is None:
            keep = True
            difference = 255.0
        else:
            difference = ImageStat.Stat(ImageChops.difference(current, last_image)).mean[0]
            keep = difference >= args.threshold or frame_time - last_time >= args.max_gap_seconds
        if keep:
            kept.append(int(row["frame"]))
            last_image = current
            last_time = frame_time

    Path(args.output).write_text("\n".join(map(str, kept)) + "\n", encoding="utf-8")
    print(json.dumps({
        "source_frames": len(rows),
        "selected_frames": len(kept),
        "threshold": args.threshold,
        "max_gap_seconds": args.max_gap_seconds,
    }))


if __name__ == "__main__":
    main()
