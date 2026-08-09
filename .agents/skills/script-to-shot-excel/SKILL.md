---
name: script-to-shot-excel
description: Turn pasted or uploaded video scripts, voice-over copy, DOCX, PDF, TXT, or Markdown into a production-ready Excel shot list with one row per spoken line and matching primary visuals, B-roll, camera/action, on-screen text/audio, retention logic, timecodes, and shoot batches. Use for 逐句分镜、逐句台词拍摄对应表、脚本转拍摄清单、拍摄执行表、口播分镜 Excel, or any request to make a line-by-line filming spreadsheet.
---

# Script To Shot Excel

Create a detailed, editable `.xlsx` that a creator and camera operator can execute directly. Preserve the user's wording while making every spoken beat visually specific and retention-oriented.

## Workflow

### 1. Read the whole script

- Accept pasted text or an uploaded DOCX, PDF, TXT, or Markdown file.
- For DOCX or PDF, use the corresponding document/PDF skill and its required extraction workflow.
- Read all headings, body text, speaker labels, stage directions, and notes before segmenting.
- Treat headings as section labels unless they are clearly spoken aloud.

### 2. Segment spoken lines

- Create one row per natural spoken beat.
- Preserve every spoken word exactly and in original order. Do not silently polish or rewrite the script.
- Merge layout-only line breaks. Split long sentences at punctuation or a clear breath point so one row normally covers 2–6 seconds.
- Ensure each spoken segment appears exactly once: no omissions, duplicates, or reordered lines.
- If the script already has timecodes, preserve them. Otherwise estimate contiguous timecodes from a natural speaking pace.

### 3. Design the visuals

For every row, provide all of the following:

- `main`: the exact primary visual, subject action, setting, props, expression, and start/end state.
- `broll`: an alternate or insert shot that can hide a cut or strengthen proof, contrast, texture, or emotion.
- `camera`: shot size, camera height/angle, movement, speed, focus, and transition or cut point.
- `screen`: concise on-screen words, graphics, sound effects, ambience, or music cue.
- `why`: one sentence explaining the attention, comprehension, credibility, or emotional purpose.

Avoid vague directions such as “拍相关画面” or “配素材”. Write instructions that can be filmed without further interpretation.

### 4. Make the video more gripping

- Put the clearest result, contrast, tension, question, or surprising action in the first 1–3 seconds.
- Introduce a meaningful visual change every 2–5 seconds: framing, angle, action, prop, location, graphic, or B-roll.
- Use visual proof when the line claims a result; use contrast when the line describes a problem; use steps or progress graphics for processes.
- Reserve the largest emotional or visual payoff for a real turning point, not every line.
- End with a saveable summary, checklist, result reveal, or one clear CTA when the script supports it.
- Match the user's platform, aspect ratio, brand style, available locations, cast, and equipment when supplied. Otherwise assume a vertical 9:16 short video with one presenter and a phone-camera-friendly setup.

### 5. Group the shoot efficiently

- Assign every row a batch such as `A｜窗边/镜前`.
- Group by location, lighting, wardrobe, props, and performer state rather than final edit order.
- Add a batch plan that lists the scene, included shot numbers, concentrated shooting content, formula-driven shot count, and editable status.

### 6. Build the workbook

- Read [references/shot-plan-schema.md](references/shot-plan-schema.md) and create one UTF-8 JSON payload that matches it.
- Use the Spreadsheets skill and its bundled `@oai/artifact-tool` runtime; do not substitute another spreadsheet library.
- Work only in a writable task-specific `work/` directory. Copy [scripts/build_shot_excel.mjs](scripts/build_shot_excel.mjs) into that directory so Node can resolve the local `node_modules` symlink required by the Spreadsheets skill.
- Run:

```bash
<bundled-node> build_shot_excel.mjs shot_plan.json output.xlsx previews
```

- Save only the final `.xlsx` in the user-facing `outputs/` directory. Keep JSON, copied builders, logs, and previews in `work/`.

## Quality checks

Before delivery:

1. Reconcile the source script against the `line` column; every spoken character must be accounted for exactly once.
2. Confirm every row has a specific `main`, `broll`, `camera`, `screen`, `why`, and `batch` value.
3. Inspect the first, middle, and last rows plus the batch formulas.
4. Scan the workbook for formula errors.
5. Render and visually inspect both sheets. Fix clipped text, unreadable headers, awkward row heights, or unused blank sheets.
6. Export one final workbook and return one standalone Markdown link to it.

## Guardrails

- Do not invent brand facts, product functions, testimonials, statistics, or before/after proof.
- Do not intensify medical, financial, legal, or other high-stakes claims. Preserve the line and flag a possible compliance concern separately when relevant.
- Prefer original footage the user can realistically capture. Clearly label any optional stock, archival, screen recording, or generated asset.
- If a critical production constraint is missing, make a conservative default assumption and state it briefly in the workbook note instead of blocking progress.
