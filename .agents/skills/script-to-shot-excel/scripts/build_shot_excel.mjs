import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const [inputPath, outputPath, previewDir] = process.argv.slice(2);
if (!inputPath || !outputPath || !previewDir) {
  throw new Error("Usage: node build_shot_excel.mjs <shot_plan.json> <output.xlsx> <preview_dir>");
}

const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
  throw new Error("shot_plan.json must contain a non-empty rows array");
}

const required = ["line", "main", "broll", "camera", "screen", "why", "batch"];
const seen = new Set();
const rows = payload.rows.map((raw, i) => {
  const row = { ...raw };
  row.index = String(row.index ?? i + 1).padStart(2, "0");
  if (seen.has(row.index)) throw new Error(`Duplicate shot index: ${row.index}`);
  seen.add(row.index);
  for (const field of required) {
    if (typeof row[field] !== "string" || row[field].trim() === "") {
      throw new Error(`Row ${row.index} has an empty ${field} field`);
    }
  }
  row.status = row.status || "未拍";
  row.section = row.section || "未分节";
  row.timecode = row.timecode || "待确认";
  return row;
});

function compressShotNumbers(values) {
  const nums = values.map((v) => Number.parseInt(v, 10));
  if (nums.some(Number.isNaN)) return values.join("、");
  const result = [];
  let start = nums[0];
  let previous = nums[0];
  for (let i = 1; i <= nums.length; i += 1) {
    const current = nums[i];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    result.push(start === previous ? String(start).padStart(2, "0") : `${String(start).padStart(2, "0")}–${String(previous).padStart(2, "0")}`);
    start = current;
    previous = current;
  }
  return result.join("、");
}

const batchKeys = [...new Set(rows.map((row) => row.batch))];
const suppliedBatches = Array.isArray(payload.batches) ? payload.batches : [];
const batches = batchKeys.map((key, i) => {
  const supplied = suppliedBatches.find((item) => item.key === key) || {};
  const matching = rows.filter((row) => row.batch === key);
  const parts = key.split("｜");
  return {
    key,
    code: supplied.code || parts[0] || String.fromCharCode(65 + i),
    scene: supplied.scene || parts.slice(1).join("｜") || key,
    shots: supplied.shots || compressShotNumbers(matching.map((row) => row.index)),
    content: supplied.content || "按主表集中完成本批次的口播、动作与补拍素材",
    status: supplied.status || "未开始",
  };
});

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("逐句分镜");
const batchSheet = workbook.worksheets.add("拍摄批次");
const dataStart = 6;
const dataEnd = dataStart + rows.length - 1;
const noteRow = dataEnd + 2;
const batchStart = 4;
const batchEnd = batchStart + batches.length - 1;

const colors = {
  sage: "#355C59",
  sage2: "#4F746F",
  pale: "#EAF2EF",
  pale2: "#F6F8F7",
  gold: "#B28A55",
  ink: "#253230",
  muted: "#65706E",
  line: "#CAD8D4",
  white: "#FFFFFF",
  yellow: "#FEF3C7",
  green: "#DCFCE7",
  greenText: "#166534",
  red: "#FEE2E2",
  redText: "#991B1B",
  gray: "#F1F5F4",
};

function styleTitle(range) {
  range.format = {
    fill: colors.sage,
    font: { bold: true, color: colors.white, size: 20 },
    verticalAlignment: "center",
    horizontalAlignment: "left",
  };
  range.format.rowHeightPx = 44;
}

function styleSummaryLabel(range) {
  range.format = {
    fill: colors.pale,
    font: { bold: true, color: colors.sage, size: 9 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
  range.format.rowHeightPx = 22;
}

function styleSummaryValue(range, numberFormat = null) {
  range.format = {
    fill: colors.white,
    font: { bold: true, color: colors.ink, size: 15 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
  if (numberFormat) range.format.numberFormat = numberFormat;
  range.format.rowHeightPx = 32;
}

sheet.showGridLines = false;
sheet.mergeCells("A1:K1");
sheet.getRange("A1").values = [[`${payload.title || "未命名视频"}｜逐句台词 × 拍摄画面对照表`]];
styleTitle(sheet.getRange("A1:K1"));

for (const [labelRange, valueRange, label] of [
  ["A2:B2", "A3:B3", "镜头总数"],
  ["D2:E2", "D3:E3", "已拍镜头"],
  ["G2:H2", "G3:H3", "拍摄进度"],
  ["J2:K2", "J3:K3", "建议成片"],
]) {
  sheet.mergeCells(labelRange);
  sheet.mergeCells(valueRange);
  sheet.getRange(labelRange.split(":")[0]).values = [[label]];
  styleSummaryLabel(sheet.getRange(labelRange));
}
sheet.getRange("A3").formulas = [[`=COUNTA(E${dataStart}:E${dataEnd})`]];
sheet.getRange("D3").formulas = [[`=COUNTIF(B${dataStart}:B${dataEnd},"已拍")`]];
sheet.getRange("G3").formulas = [["=IFERROR(D3/A3,0)"]];
sheet.getRange("J3").values = [[payload.suggested_duration || "待确认"]];
styleSummaryValue(sheet.getRange("A3:B3"), "0");
styleSummaryValue(sheet.getRange("D3:E3"), "0");
styleSummaryValue(sheet.getRange("G3:H3"), "0%");
styleSummaryValue(sheet.getRange("J3:K3"));

sheet.getRange("A5:K5").values = [[
  "镜头号", "拍摄状态", "章节", "时间码", "台词", "主画面", "补拍画面",
  "机位与动作", "字幕与声音", "抓人逻辑", "拍摄批次",
]];
sheet.getRange(`A${dataStart}:K${dataEnd}`).values = rows.map((row) => [
  row.index, row.status, row.section, row.timecode, row.line, row.main, row.broll,
  row.camera, row.screen, row.why, row.batch,
]);

const table = sheet.tables.add(`A5:K${dataEnd}`, true, "ShotPlanTable");
table.style = "TableStyleMedium2";
table.showHeaders = true;
table.showFilterButton = true;
table.showBandedRows = true;

sheet.getRange("A5:K5").format = {
  fill: colors.sage,
  font: { bold: true, color: colors.white, size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { bottom: { style: "medium", color: colors.sage } },
};
sheet.getRange("A5:K5").format.rowHeightPx = 36;
sheet.getRange(`A${dataStart}:K${dataEnd}`).format = {
  font: { color: colors.ink, size: 10 },
  verticalAlignment: "top",
  wrapText: true,
};
sheet.getRange(`A${dataStart}:K${dataEnd}`).format.rowHeightPx = 108;
sheet.getRange(`A${dataStart}:B${dataEnd}`).format.horizontalAlignment = "center";
sheet.getRange(`D${dataStart}:D${dataEnd}`).format.horizontalAlignment = "center";
sheet.getRange(`K${dataStart}:K${dataEnd}`).format.horizontalAlignment = "center";

for (const [col, px] of Object.entries({ A: 64, B: 88, C: 210, D: 112, E: 300, F: 430, G: 390, H: 390, I: 390, J: 320, K: 180 })) {
  sheet.getRange(`${col}:${col}`).format.columnWidthPx = px;
}

sheet.getRange(`B${dataStart}:B${dataEnd}`).dataValidation = {
  rule: { type: "list", values: ["未拍", "拍摄中", "已拍", "需补拍"] },
};
const statusRange = sheet.getRange(`B${dataStart}:B${dataEnd}`);
statusRange.conditionalFormats.add("containsText", { text: "已拍", format: { fill: colors.green, font: { color: colors.greenText, bold: true } } });
statusRange.conditionalFormats.add("containsText", { text: "拍摄中", format: { fill: colors.yellow, font: { color: colors.ink, bold: true } } });
statusRange.conditionalFormats.add("containsText", { text: "需补拍", format: { fill: colors.red, font: { color: colors.redText, bold: true } } });
statusRange.conditionalFormats.add("containsText", { text: "未拍", format: { fill: colors.gray, font: { color: colors.muted } } });

sheet.getRange(`E${dataStart}:E${dataEnd}`).format = {
  fill: "#FBFCFC",
  font: { bold: true, color: colors.ink, size: 10 },
  wrapText: true,
  verticalAlignment: "top",
};
sheet.getRange(`C${dataStart}:C${dataEnd}`).format.font = { bold: true, color: colors.sage2, size: 10 };
sheet.getRange(`K${dataStart}:K${dataEnd}`).format = {
  fill: colors.pale,
  font: { bold: true, color: colors.sage, size: 9 },
  wrapText: true,
  verticalAlignment: "top",
  horizontalAlignment: "center",
};

sheet.mergeCells(`A${noteRow}:K${noteRow}`);
const note = [
  "使用方法：一行对应一句台词与完整拍摄画面。先按拍摄批次集中完成同场景素材，再按时间码剪辑；B列可下拉更新拍摄状态。",
  payload.assumption_note,
].filter(Boolean).join(" ");
sheet.getRange(`A${noteRow}`).values = [[note]];
sheet.getRange(`A${noteRow}:K${noteRow}`).format = {
  fill: colors.pale2,
  font: { italic: true, color: colors.muted, size: 9 },
  wrapText: true,
  verticalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: colors.line },
};
sheet.getRange(`A${noteRow}:K${noteRow}`).format.rowHeightPx = 42;
sheet.freezePanes.freezeRows(5);
sheet.freezePanes.freezeColumns(5);

batchSheet.showGridLines = false;
batchSheet.mergeCells("A1:F1");
batchSheet.getRange("A1").values = [["按场景集中拍摄｜执行批次"]];
styleTitle(batchSheet.getRange("A1:F1"));
batchSheet.getRange("A3:F3").values = [["批次", "拍摄场景", "对应镜头", "集中拍摄内容", "镜头数", "现场状态"]];
batchSheet.getRange(`A${batchStart}:F${batchEnd}`).values = batches.map((batch) => [
  batch.code, batch.scene, batch.shots, batch.content, null, batch.status,
]);
for (let i = 0; i < batches.length; i += 1) {
  const row = batchStart + i;
  const key = batches[i].key.replaceAll('"', '""');
  batchSheet.getRange(`E${row}`).formulas = [[`=COUNTIF('逐句分镜'!$K$${dataStart}:$K$${dataEnd},"${key}")`]];
}
const batchTable = batchSheet.tables.add(`A3:F${batchEnd}`, true, "ShootingBatchesTable");
batchTable.style = "TableStyleMedium2";
batchTable.showHeaders = true;
batchTable.showFilterButton = true;
batchTable.showBandedRows = true;
batchSheet.getRange("A3:F3").format = {
  fill: colors.sage,
  font: { bold: true, color: colors.white, size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
batchSheet.getRange("A3:F3").format.rowHeightPx = 36;
batchSheet.getRange(`A${batchStart}:F${batchEnd}`).format = {
  font: { color: colors.ink, size: 10 },
  wrapText: true,
  verticalAlignment: "center",
};
batchSheet.getRange(`A${batchStart}:F${batchEnd}`).format.rowHeightPx = 64;
batchSheet.getRange(`A${batchStart}:C${batchEnd}`).format.horizontalAlignment = "center";
batchSheet.getRange(`E${batchStart}:F${batchEnd}`).format.horizontalAlignment = "center";
for (const [col, px] of Object.entries({ A: 70, B: 210, C: 170, D: 430, E: 90, F: 110 })) {
  batchSheet.getRange(`${col}:${col}`).format.columnWidthPx = px;
}
batchSheet.getRange(`F${batchStart}:F${batchEnd}`).dataValidation = {
  rule: { type: "list", values: ["未开始", "进行中", "已完成", "需补拍"] },
};
const batchStatus = batchSheet.getRange(`F${batchStart}:F${batchEnd}`);
batchStatus.conditionalFormats.add("containsText", { text: "已完成", format: { fill: colors.green, font: { color: colors.greenText, bold: true } } });
batchStatus.conditionalFormats.add("containsText", { text: "进行中", format: { fill: colors.yellow, font: { color: colors.ink, bold: true } } });
batchStatus.conditionalFormats.add("containsText", { text: "需补拍", format: { fill: colors.red, font: { color: colors.redText, bold: true } } });

const batchNoteRow = batchEnd + 2;
batchSheet.mergeCells(`A${batchNoteRow}:F${batchNoteRow}`);
batchSheet.getRange(`A${batchNoteRow}`).values = [[payload.batch_note || "建议先拍光线与场景最可控的批次，再完成外景或需要协调的素材。"]];
batchSheet.getRange(`A${batchNoteRow}:F${batchNoteRow}`).format = {
  fill: colors.pale,
  font: { bold: true, color: colors.sage, size: 10 },
  wrapText: true,
  verticalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: colors.line },
};
batchSheet.getRange(`A${batchNoteRow}:F${batchNoteRow}`).format.rowHeightPx = 44;
batchSheet.freezePanes.freezeRows(3);

await fs.mkdir(previewDir, { recursive: true });
const midStart = Math.max(dataStart, dataStart + Math.floor(rows.length / 2) - 2);
const midEnd = Math.min(dataEnd, midStart + 5);
const previewJobs = [
  ["shot_plan_top.png", { sheetName: "逐句分镜", range: `A1:K${Math.min(dataEnd, 12)}`, scale: 1.0, format: "png" }],
  ["shot_plan_middle.png", { sheetName: "逐句分镜", range: `A${midStart}:K${midEnd}`, scale: 1.0, format: "png" }],
  ["shot_plan_bottom.png", { sheetName: "逐句分镜", range: `A${Math.max(dataStart, dataEnd - 5)}:K${noteRow}`, scale: 1.0, format: "png" }],
  ["shooting_batches.png", { sheetName: "拍摄批次", range: `A1:F${batchNoteRow}`, scale: 1.2, format: "png" }],
];
for (const [name, options] of previewJobs) {
  const preview = await workbook.render(options);
  await fs.writeFile(path.join(previewDir, name), new Uint8Array(await preview.arrayBuffer()));
}

for (const [range, maxRows] of [[`A1:K${Math.min(dataEnd, 10)}`, 10], [`A${Math.max(dataStart, dataEnd - 4)}:K${dataEnd}`, 5]]) {
  const inspection = await workbook.inspect({
    kind: "table",
    sheetId: "逐句分镜",
    range,
    include: "values,formulas",
    tableMaxRows: maxRows,
    tableMaxCols: 11,
    tableMaxCellChars: 80,
    maxChars: 7000,
  });
  console.log(inspection.ndjson);
}
const batchInspection = await workbook.inspect({
  kind: "table",
  sheetId: "拍摄批次",
  range: `A3:F${batchEnd}`,
  include: "values,formulas",
  tableMaxRows: batches.length + 1,
  tableMaxCols: 6,
  maxChars: 5000,
});
console.log(batchInspection.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
