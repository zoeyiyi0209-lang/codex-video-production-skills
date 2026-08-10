import argparse
import json
import re
from pathlib import Path


def parse_time(value: str) -> float:
    hours, minutes, rest = value.strip().split(":")
    seconds, millis = rest.replace(".", ",").split(",")
    return int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(millis) / 1000


def main():
    parser = argparse.ArgumentParser(description="Parse an SRT file into timestamped JSON blocks.")
    parser.add_argument("--srt", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    source = Path(args.srt)
    text = source.read_text(encoding="utf-8-sig").strip()
    blocks = []
    for raw_block in re.split(r"\n\s*\n", text):
        lines = [line.strip() for line in raw_block.splitlines() if line.strip()]
        if len(lines) < 3 or "-->" not in lines[1]:
            continue
        start_text, end_text = [part.strip() for part in lines[1].split("-->", 1)]
        blocks.append(
            {
                "index": int(lines[0]),
                "start": parse_time(start_text),
                "end": parse_time(end_text),
                "text": "".join(lines[2:]),
            }
        )
    if not blocks:
        raise SystemExit("No readable subtitle blocks found.")

    expected = list(range(blocks[0]["index"], blocks[0]["index"] + len(blocks)))
    actual = [block["index"] for block in blocks]
    if actual != expected:
        raise SystemExit("Subtitle indexes are not contiguous.")

    output = {
        "source_srt": str(source.resolve()),
        "block_count": len(blocks),
        "blocks": blocks,
    }
    Path(args.output).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"block_count": len(blocks), "start": blocks[0]["start"], "end": blocks[-1]["end"]}))


if __name__ == "__main__":
    main()
