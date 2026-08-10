# Reviewed segment schema

Create one UTF-8 JSON file after reviewing `subtitle_blocks.json`:

```json
{
  "title": "视频标题｜逐句台词画面对照",
  "source_url": "https://example.com/video",
  "note": "明显同音错字已按画面字幕保守校正；仅还原原视频表达。",
  "segments": [
    {
      "source_indexes": [1, 2],
      "line": "合并后的完整口语段，保持原意和原顺序。"
    },
    {
      "source_indexes": [3],
      "line": "下一条口语段。"
    }
  ]
}
```

Rules:

- Use every subtitle block index exactly once and in ascending order.
- Merge fragments split mid-sentence or mid-word.
- Keep one natural spoken beat per row; normally target 2–10 seconds.
- Do not silently omit, duplicate, reorder, summarize, or intensify the wording.
- Correct only obvious recognition errors supported by on-screen subtitles or strong context.
- Keep medical, financial, legal, or product claims as attributed transcript text; do not endorse them.
- Do not add Markdown inside cell text.
