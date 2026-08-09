# Codex Video Production Skills

一组面向短视频创作者与小型制作团队的 Codex Skills，用于把脚本、字幕和视频素材转换为可执行的拍摄计划与 Excel 工作表。

## Skills

| Skill | 中文名称 | 用途 |
|---|---|---|
| `plan-efficient-video-shoots` | 高效拍摄计划 | 合并多份脚本中的共用场景、道具、服装、灯光与人物状态，生成高效率拍摄时间表和执行清单。 |
| `script-to-shot-excel` | 逐句拍摄表生成器 | 把视频脚本拆成逐句台词、主画面、B-roll、机位动作、屏幕信息与拍摄批次，并生成 Excel。 |
| `video-line-visual-excel` | 逐句台词画面对照 | 将带时间戳字幕的视频整理成“左侧逐句台词、右侧同期多画面”的 Excel 对照表。 |

## 安装

在 Codex 中调用 `$skill-installer`，然后提供相应 Skill 的 GitHub 目录地址：

```text
请从以下地址安装这个 Skill：
https://github.com/zoeyiyi0209-lang/codex-video-production-skills/tree/main/.agents/skills/plan-efficient-video-shoots
```

将地址最后一段替换为以下任一名称即可安装另外两个 Skill：

```text
script-to-shot-excel
video-line-visual-excel
```

也可以克隆整个仓库。在该仓库中启动 Codex 时，Codex 会发现 `.agents/skills/` 下的三个 Skill。

## 使用示例

```text
使用 $plan-efficient-video-shoots，把这些脚本合并成周末高效拍摄计划。

使用 $script-to-shot-excel，把这份口播脚本制作成逐句拍摄 Excel。

使用 $video-line-visual-excel，把这个视频和 SRT 制作成逐句台词画面对照表。
```

## 运行要求

- 生成 Excel 时需要 Codex 的 Spreadsheets Skill 及其工作区依赖。
- `video-line-visual-excel` 的原生视频抽帧流程使用 macOS AVFoundation，并需要可读取的视频与带时间戳的 SRT 字幕。
- 仓库不包含 API Key、访问令牌、用户素材或生成结果。

## 目录结构

```text
.agents/skills/
├── plan-efficient-video-shoots/
├── script-to-shot-excel/
└── video-line-visual-excel/
```

## License

[MIT](LICENSE)
