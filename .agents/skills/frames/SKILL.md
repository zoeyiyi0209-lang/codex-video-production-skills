---
name: frames
description: Turn a local or downloadable video plus timestamped subtitles into an Excel sheet with each complete spoken line on the left and 1–6 corresponding in-time video frames on the right, including frame numbers and timestamps. Use for 左边台词右边画面、逐句台词画面对照、每句话对应几个画面、口播台词截图表、视频台词分镜 Excel, or transcript-to-frame contact sheets.
---

# Frames

Create a verified `.xlsx` that maps every spoken beat to representative frames from the same time interval.

## Inputs and defaults

- Require a readable local video and timestamped SRT.
- For a public video URL, obtain the video and prefer its public `source` or `zh-CN` subtitle track.
- If no SRT exists, use an available transcription workflow to create one. If transcription is unavailable, ask for an SRT instead of inventing timecodes.
- Use balanced frame selection by default: threshold `20`, maximum gap `1.0` second.
- Keep at most `6` images per spoken line.
- Never modify the source video.

## Required companion workflow

Use the installed Spreadsheets skill for workbook authoring and verification. Load workspace dependencies and use only its provided Node.js, Python, `@oai/artifact-tool`, LibreOffice, and Poppler paths.

## Workflow

1. Create a job-specific directory under `work/` and a final `.xlsx` path under `outputs/`.
2. Obtain the local video and SRT. Preserve the original source files.
3. Parse the SRT:

   ```sh
   <bundled-python> scripts/parse_srt.py \
     --srt <video.srt> \
     --output <job>/subtitle_blocks.json
   ```

4. Read all subtitle blocks. Create `<job>/segments.json` using [references/segment-schema.md](references/segment-schema.md).
   - Merge fragments split mid-word or mid-sentence.
   - Preserve every spoken word in original order.
   - Use every source subtitle index exactly once.
   - Correct only obvious recognition errors supported by on-screen subtitles or strong context.
5. Compile the frame extractor:

   ```sh
   CLANG_MODULE_CACHE_PATH=<job>/clang-cache xcrun clang -fobjc-arc \
     -framework Foundation -framework AVFoundation -framework CoreMedia \
     -framework CoreImage -framework CoreGraphics -framework CoreVideo \
     -framework ImageIO scripts/extract_frames.m -o <job>/extract_frames
   ```

6. Extract analysis frames and filter consecutive similar frames:

   ```sh
   <job>/extract_frames <video> <job>/analysis_frames <job>/analysis.csv - 92 0.52

   <bundled-python> scripts/select_keyframes.py \
     --manifest <job>/analysis.csv \
     --frames-dir <job>/analysis_frames \
     --output <job>/selected.txt \
     --threshold 20 \
     --max-gap-seconds 1.0

   <job>/extract_frames <video> <job>/keyframes <job>/keyframes.csv \
     <job>/selected.txt 180 0.62
   ```

   Run the extractor outside the sandbox if AVFoundation reports a decoder or hypervisor permission failure; this is a read-only scan.

7. Map each reviewed line to frames from its own time interval:

   ```sh
   <bundled-python> scripts/map_line_visuals.py \
     --blocks <job>/subtitle_blocks.json \
     --segments <job>/segments.json \
     --manifest <job>/keyframes.csv \
     --frames-dir <job>/keyframes \
     --output <job>/line_visuals.json \
     --max-images 6
   ```

8. Copy `scripts/build_line_visual_workbook.mjs` into the job directory. Create a `node_modules` symlink beside it pointing to the loader-provided Node modules directory. Build:

   ```sh
   <bundled-node> <job>/build_line_visual_workbook.mjs \
     <job>/line_visuals.json \
     <outputs>/video-line-visuals.xlsx \
     <job>/artifact-preview.png
   ```

## Workbook layout

- One line/beat uses two worksheet rows.
- Columns `A:D` are the left panel: sequence number, time interval, and wrapped transcript.
- Columns `E:J` are the right panel: up to six chronological images.
- Put original frame number and `mm:ss.mmm` timestamp above every image.
- Freeze title/header rows and the left transcript panel.
- Hide gridlines and use restrained alternating fills.
- Keep source URL and transcription note in the top note row.

## Verification

Before delivery:

1. Confirm `map_line_visuals.py` reports no missing, duplicated, or reordered subtitle blocks.
2. Confirm `line_visuals.json.image_count` matches the number of embedded files under `xl/media/`.
3. Run `unzip -t` on the workbook.
4. Inspect the first, middle, and last spoken rows and scan for formula errors with artifact-tool.
5. Render the worksheet with artifact-tool to verify text layout.
6. Convert the workbook to PDF with loader-provided `soffice`, render the first page with loader-provided `pdftoppm`, and visually confirm that the left panel plus all six image columns fit. The artifact-tool renderer may omit floating images.
7. Keep only the final `.xlsx` in `outputs/`.

Report subtitle block count, final spoken-line count, embedded image count, frame-selection preset, and final file size.

## Failure handling

- If the video has no readable track, stop and report it.
- If macOS cannot decode it, use an available local FFmpeg only when it succeeds; otherwise request MP4/H.264.
- If subtitles cannot be obtained or transcribed, request an SRT instead of fabricating dialogue or timing.
- If `@oai/artifact-tool` is unavailable, report the blocker instead of switching spreadsheet libraries.
- Preserve any successful workbook while retrying a different density or transcript segmentation.
