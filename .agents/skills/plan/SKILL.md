---
name: plan
description: Turn one or more video scripts in pasted text, DOCX, PDF, TXT, or Markdown into a high-efficiency filming plan by extracting required visuals, grouping shared scenes, props, wardrobe, lighting, and talent states, ordering batches to minimize resets, and producing a practical time schedule and Excel checklist. Use when the user asks for a 拍摄计划、周末拍摄时间表、多个脚本合并拍摄、按场景集中拍、素材拍摄安排、道具服装清单、拍摄效率优化，or wants to know which similar scenes can be filmed together.
---

# Plan

Convert scripts into a scene-batched production plan that a solo creator or small team can follow directly.

## Workflow

1. Read every supplied script completely. Preserve script identity and section order.
2. Extract every explicitly requested visual plus visuals implied by the spoken content.
3. Normalize the extracted shots using the fields in [planning-schema.md](references/planning-schema.md).
4. Mark shots that can share the same setup. Group primarily by location and lighting, then by wardrobe, hair/makeup state, props, and performer state.
5. Build shoot batches before assigning clock times. Minimize setup changes without harming continuity or required light conditions.
6. Schedule fixed-condition shots first: sunrise/morning sun, public locations, helpers, booked spaces, wet scenes, cooking time, or daylight-sensitive shots.
7. Order each location from clean/dry to messy/wet and from intact hair/makeup to actions that disturb them. Put reset-heavy shots last.
8. Add setup, travel, meal, battery charging, data backup, and 10–15% contingency time. Do not create an unrealistically packed schedule.
9. Produce the deliverables below. Use the Spreadsheets skill for the workbook and follow its render-and-verify requirements.

## Default assumptions

Proceed without blocking questions when reasonable:

- Treat “this weekend” as Saturday and Sunday in the user's timezone.
- Assume a solo creator using a phone or camera, tripod, light, and microphone.
- Assume vertical 9:16 short-form video unless the script or user says otherwise.
- Use Saturday for controllable indoor work and Sunday morning for outdoor/daylight work when no constraints are given.
- Plan 5–10 seconds per B-roll take, with a medium/wide version and a detail version for important actions.
- Plan one consolidated talking-head block and distinguish scripts with a quick top, accessory, or framing change.
- If the user gives only one script, still group by setup and include a compact schedule.

Ask at most one concise question only when a missing constraint would materially change the plan, such as a single available half-day versus a full weekend. Otherwise state the assumption and continue.

## Optimization rules

- Do not schedule script-by-script unless the user explicitly requests it.
- Reuse neutral lifestyle B-roll across scripts only when the image genuinely supports both lines.
- Keep product-specific, recipe-specific, directional massage, and before/after evidence shots distinct.
- For kitchen work, batch ingredient layouts, overhead inserts, pouring, stirring, steam, and finished drinks. Reuse clean glassware and neutral liquids where truthful; never fabricate a result or claim.
- For beauty/wellness work, shoot clean product display and intact makeup first; removal, oil, water, bath, sweat, and hair-disturbing actions later.
- For outdoor work, cluster nearby locations and include travel, changing, weather, and safety buffers.
- When an action has medical, skin-irritation, heat, traffic, water, or exercise risk, plan a safe illustrative shot rather than repeated real exposure solely for filming.
- Flag time-sensitive dates or claims for verification before publication, but do not derail the filming plan unless they change a required scene.

## Required deliverables

Create one `.xlsx` workbook by default, plus a short chat summary. Include these sheets:

1. `拍摄总时间表`: date, time, batch/location, task, scripts served, wardrobe, key props, duration, status.
2. `分场景镜头清单`: scene, spoken section/line, primary visual, alternate B-roll, framing/action, scripts served, filming note, status.
3. `道具服装清单`: packing group, item, use, scripts served, preparation status, note.
4. `拍摄检查清单`: technical, continuity, safety, backup, and missing-shot checks.

Use clear Chinese labels, frozen headers, wrapped text, useful column widths, filters or tables where appropriate, and dropdown status fields. Color-code script columns or script names consistently. Save only the final workbook as a user-facing deliverable.

If the user explicitly asks only for a chat table, provide the schedule in chat and skip Excel. If the user asks for a line-by-line storyboard, use the `shots` skill instead or alongside this skill; this skill remains responsible for cross-script batching and the master schedule.

## Quality gate

Before delivery, verify:

- Every major script section maps to at least one primary visual.
- Shared scenes are genuinely consolidated.
- Required daylight, wet/messy, makeup, cooking, travel, and helper constraints are respected.
- The schedule includes setup, meal, backup, and contingency time.
- No person is expected to be in two places or incompatible wardrobe/makeup states at once.
- Workbook text is visible, status fields work, no formula errors exist, and every sheet passes visual inspection.
