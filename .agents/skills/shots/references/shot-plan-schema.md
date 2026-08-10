# Shot plan JSON schema

Create one UTF-8 JSON object with this shape:

```json
{
  "title": "视频标题",
  "suggested_duration": "约 60 秒",
  "assumption_note": "默认竖屏 9:16，单人口播，可用手机与三脚架完成。",
  "batch_note": "先拍室内可控场景，再拍外景。",
  "rows": [
    {
      "index": "01",
      "status": "未拍",
      "section": "开场钩子",
      "timecode": "00:00–00:03",
      "line": "必须与原脚本中的 spoken beat 完全一致",
      "main": "可直接执行的主画面说明",
      "broll": "可直接执行的补拍或插入画面",
      "camera": "景别、角度、运动、焦点和剪辑点",
      "screen": "屏幕文字、图形、音效或环境声",
      "why": "该画面为什么能提升注意或理解",
      "batch": "A｜窗边/镜前"
    }
  ],
  "batches": [
    {
      "key": "A｜窗边/镜前",
      "code": "A",
      "scene": "窗边 / 镜前",
      "shots": "01–04、20",
      "content": "口播、状态特写、开头与结尾",
      "status": "未开始"
    }
  ]
}
```

## Required rules

- `rows` must be a non-empty array.
- Every row must contain non-empty `line`, `main`, `broll`, `camera`, `screen`, `why`, and `batch` strings.
- `index` must be unique and keep edit order. Use two digits for fewer than 100 shots.
- `status` defaults to `未拍`; allowed planned values are `未拍`, `拍摄中`, `已拍`, and `需补拍`.
- `timecode` values must be contiguous and increase in edit order when estimated.
- `batch` must exactly match one `batches[].key` value. If `batches` is omitted, the builder derives a basic batch sheet from unique row batch values.
- Keep line breaks inside a JSON string only when they are editorially meaningful.
- Do not place Markdown in cell values.

## Workbook output

The builder creates:

- `逐句分镜`: title, progress summary, filters, status dropdown, conditional formatting, frozen panes, and the full shot table.
- `拍摄批次`: scene-based production grouping, formula-driven shot counts, and batch status dropdown.

The workbook title uses `title`, suggested length uses `suggested_duration`, and the bottom note combines `assumption_note` with the standard operating instruction.
