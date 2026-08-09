import argparse
import csv
import json
from pathlib import Path


def fmt_time(value: float) -> str:
    minutes = int(value // 60)
    seconds = int(value % 60)
    millis = round((value - int(value)) * 1000)
    return f"{minutes:02d}:{seconds:02d}.{millis:03d}"


def choose_evenly(items, limit):
    if len(items) <= limit:
        return items
    positions = [round(i * (len(items) - 1) / (limit - 1)) for i in range(limit)]
    chosen = []
    seen = set()
    for position in positions:
        if position not in seen:
            chosen.append(items[position])
            seen.add(position)
    return chosen


def main():
    parser = argparse.ArgumentParser(description="Map reviewed transcript segments to filtered video frames.")
    parser.add_argument("--blocks", required=True)
    parser.add_argument("--segments", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--frames-dir", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--max-images", type=int, default=6)
    args = parser.parse_args()

    blocks_payload = json.loads(Path(args.blocks).read_text(encoding="utf-8"))
    segments_payload = json.loads(Path(args.segments).read_text(encoding="utf-8"))
    blocks = blocks_payload["blocks"]
    by_index = {block["index"]: block for block in blocks}
    expected_indexes = [block["index"] for block in blocks]
    seen_indexes = []

    with open(args.manifest, newline="", encoding="utf-8") as handle:
        frames = [
            {
                "frame": int(row["frame"]),
                "time": float(row["time_seconds"]),
                "file": row["file"],
            }
            for row in csv.DictReader(handle)
        ]
    if not frames:
        raise SystemExit("Keyframe manifest is empty.")

    lines = []
    for number, segment in enumerate(segments_payload["segments"], start=1):
        source_indexes = segment["source_indexes"]
        if not source_indexes:
            raise SystemExit(f"Segment {number} has no source_indexes.")
        if any(index not in by_index for index in source_indexes):
            raise SystemExit(f"Segment {number} references an unknown subtitle block.")
        seen_indexes.extend(source_indexes)
        start = by_index[source_indexes[0]]["start"]
        end = by_index[source_indexes[-1]]["end"]
        matching = [frame for frame in frames if start <= frame["time"] < end]
        if not matching:
            midpoint = (start + end) / 2
            matching = [min(frames, key=lambda frame: abs(frame["time"] - midpoint))]
        images = choose_evenly(matching, args.max_images)
        lines.append(
            {
                "index": number,
                "source_indexes": source_indexes,
                "start": start,
                "end": end,
                "duration": round(end - start, 3),
                "timecode": f"{fmt_time(start)}–{fmt_time(end)}",
                "line": segment["line"].strip(),
                "images": images,
            }
        )

    if seen_indexes != expected_indexes:
        missing = [index for index in expected_indexes if index not in seen_indexes]
        duplicates = sorted({index for index in seen_indexes if seen_indexes.count(index) > 1})
        raise SystemExit(f"Subtitle reconciliation failed. Missing={missing}, duplicates={duplicates}, order={seen_indexes}")
    if any(not line["line"] for line in lines):
        raise SystemExit("A reviewed line is empty.")

    output = {
        "title": segments_payload["title"],
        "source_url": segments_payload.get("source_url", ""),
        "note": segments_payload.get("note", ""),
        "subtitle_block_count": len(blocks),
        "line_count": len(lines),
        "image_count": sum(len(line["images"]) for line in lines),
        "frames_dir": str(Path(args.frames_dir).resolve()),
        "lines": lines,
    }
    Path(args.output).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                "subtitle_blocks": output["subtitle_block_count"],
                "lines": output["line_count"],
                "images": output["image_count"],
                "start": lines[0]["timecode"].split("–")[0],
                "end": lines[-1]["timecode"].split("–")[1],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
