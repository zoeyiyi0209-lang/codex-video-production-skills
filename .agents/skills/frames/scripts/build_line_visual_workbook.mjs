import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputPath = path.resolve(process.argv[2]);
const outputPath = path.resolve(process.argv[3]);
const previewPath = path.resolve(process.argv[4]);
const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));

const fmtTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(minutes).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
};

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("逐句台词画面");
sheet.showGridLines = false;
sheet.freezePanes.freezeRows(3);
sheet.freezePanes.freezeColumns(4);

sheet.getRange("A1:J1").merge();
sheet.getRange("A2:J2").merge();
sheet.getRange("C3:D3").merge();
sheet.getRange("A1").values = [[`${payload.title} · ${payload.line_count} 条台词 · ${payload.image_count} 张画面`]];
const sourceText = payload.source_url ? `源链接：${payload.source_url}` : "";
const noteText = payload.note || "台词按带时间码字幕整理；右侧画面来自对应时间区间。";
sheet.getRange("A2").values = [[
  `左侧为完整口语段，右侧为该时间区间内的代表画面。${noteText}${sourceText ? ` ${sourceText}` : ""}`,
]];
sheet.getRange("A3").values = [["序号"]];
sheet.getRange("B3").values = [["时间区间"]];
sheet.getRange("C3").values = [["逐句台词"]];
sheet.getRange("E3:J3").values = [[
  "同期画面 1",
  "同期画面 2",
  "同期画面 3",
  "同期画面 4",
  "同期画面 5",
  "同期画面 6",
]];

sheet.getRange("A1:J1").format = {
  fill: "#172033",
  font: { bold: true, color: "#FFFFFF", size: 16 },
  horizontalAlignment: "left",
  verticalAlignment: "center",
  rowHeightPx: 42,
};
sheet.getRange("A2:J2").format = {
  fill: "#E8EEF7",
  font: { color: "#35445F", size: 9 },
  horizontalAlignment: "left",
  verticalAlignment: "center",
  wrapText: true,
  rowHeightPx: 44,
};
sheet.getRange("A3:J3").format = {
  fill: "#2B5C92",
  font: { bold: true, color: "#FFFFFF", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  rowHeightPx: 30,
  borders: { preset: "all", style: "thin", color: "#C9D4E5" },
};

sheet.getRange("A:A").format.columnWidthPx = 34;
sheet.getRange("B:B").format.columnWidthPx = 82;
sheet.getRange("C:D").format.columnWidthPx = 100;
sheet.getRange("E:J").format.columnWidthPx = 70;

const imageWidth = 60;
const imageHeight = 107;
const firstDataRow = 4;

for (let i = 0; i < payload.lines.length; i++) {
  const item = payload.lines[i];
  const labelRow = firstDataRow + i * 2;
  const imageRow = labelRow + 1;
  const textLines = Math.max(1, Math.ceil(item.line.length / 15));
  const imageRowHeight = Math.max(imageHeight + 8, textLines * 17 - 26);
  const leftFill = i % 2 === 0 ? "#F7F9FC" : "#EDF3F9";
  const labelFill = i % 2 === 0 ? "#DCE6F3" : "#E7EEF7";

  sheet.getRange(`A${labelRow}:A${imageRow}`).merge();
  sheet.getRange(`B${labelRow}:B${imageRow}`).merge();
  sheet.getRange(`C${labelRow}:D${imageRow}`).merge();
  sheet.getRange(`A${labelRow}`).values = [[String(item.index).padStart(2, "0")]];
  sheet.getRange(`B${labelRow}`).values = [[item.timecode]];
  sheet.getRange(`C${labelRow}`).values = [[item.line]];

  sheet.getRange(`A${labelRow}:B${imageRow}`).format = {
    fill: leftFill,
    font: { color: "#243653", size: 9, bold: true },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#CCD6E4" },
  };
  sheet.getRange(`C${labelRow}:D${imageRow}`).format = {
    fill: leftFill,
    font: { color: "#172033", size: 10 },
    horizontalAlignment: "left",
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#CCD6E4" },
  };
  sheet.getRange(`E${labelRow}:J${labelRow}`).format = {
    fill: labelFill,
    font: { color: "#243653", size: 7, bold: true },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    rowHeightPx: 28,
    borders: { preset: "all", style: "thin", color: "#CCD6E4" },
  };
  sheet.getRange(`E${imageRow}:J${imageRow}`).format = {
    fill: "#F8FAFC",
    rowHeightPx: imageRowHeight,
    borders: { preset: "all", style: "thin", color: "#CCD6E4" },
  };

  const labels = Array.from({ length: 6 }, (_, index) => {
    const frame = item.images[index];
    return frame ? `帧 ${String(frame.frame).padStart(6, "0")}\n${fmtTime(frame.time)}` : "";
  });
  sheet.getRange(`E${labelRow}:J${labelRow}`).values = [labels];

  for (let j = 0; j < item.images.length; j++) {
    const frame = item.images[j];
    const bytes = await fs.readFile(path.join(payload.frames_dir, frame.file));
    sheet.images.add({
      dataUrl: `data:image/jpeg;base64,${bytes.toString("base64")}`,
      anchor: {
        from: {
          row: imageRow - 1,
          col: 4 + j,
          rowOffsetPx: 4,
          colOffsetPx: 5,
        },
        extent: { widthPx: imageWidth, heightPx: imageHeight },
      },
    });
  }
}

const firstCheck = await workbook.inspect({
  kind: "table",
  range: "'逐句台词画面'!A1:J9",
  include: "values,formulas",
  tableMaxRows: 9,
  tableMaxCols: 10,
  maxChars: 8000,
});
process.stdout.write(`${firstCheck.ndjson}\n`);

const middleRow = firstDataRow + Math.floor(payload.lines.length / 2) * 2;
const middleCheck = await workbook.inspect({
  kind: "table",
  range: `'逐句台词画面'!A${middleRow}:J${middleRow + 1}`,
  include: "values,formulas",
  tableMaxRows: 2,
  tableMaxCols: 10,
  maxChars: 4000,
});
process.stdout.write(`${middleCheck.ndjson}\n`);

const lastRow = firstDataRow + (payload.lines.length - 1) * 2;
const lastCheck = await workbook.inspect({
  kind: "table",
  range: `'逐句台词画面'!A${lastRow}:J${lastRow + 1}`,
  include: "values,formulas",
  tableMaxRows: 2,
  tableMaxCols: 10,
  maxChars: 4000,
});
process.stdout.write(`${lastCheck.ndjson}\n`);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
process.stdout.write(`${errors.ndjson}\n`);

const preview = await workbook.render({
  sheetName: "逐句台词画面",
  range: "A1:J13",
  scale: 1,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
process.stdout.write(JSON.stringify({
  outputPath,
  lineCount: payload.line_count,
  imageCount: payload.image_count,
  sheetCount: 1,
}) + "\n");
