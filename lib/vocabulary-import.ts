"use client";

import * as XLSX from "xlsx";
import mammoth from "mammoth";

export interface ParsedWord {
  word: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  uzbek?: string;
  rus?: string;
  image_url?: string;
  audio_url?: string;
}

// Column header aliases (case-insensitive)
const COLUMN_MAP: Record<string, keyof ParsedWord> = {
  word: "word",
  "part of speech": "partOfSpeech",
  partofspeech: "partOfSpeech",
  pos: "partOfSpeech",
  definition: "definition",
  example: "example",
  "example sentence": "example",
  uzbek: "uzbek",
  uz: "uzbek",
  russian: "rus",
  rus: "rus",
  ru: "rus",
  image_url: "image_url",
  "image url": "image_url",
  image: "image_url",
  audio_url: "audio_url",
  "audio url": "audio_url",
  audio: "audio_url",
};

function normalizeHeader(h: string): keyof ParsedWord | undefined {
  return COLUMN_MAP[h.trim().toLowerCase()];
}

// ─── Excel (.xlsx / .xls) ────────────────────────────────────────────────────
export async function parseExcel(file: File): Promise<ParsedWord[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });

  if (rows.length === 0) return [];

  // Map raw headers to our fields
  const rawHeaders = Object.keys(rows[0]);
  const headerMap: Record<string, keyof ParsedWord> = {};
  for (const h of rawHeaders) {
    const mapped = normalizeHeader(h);
    if (mapped) headerMap[h] = mapped;
  }

  return rows
    .map((row) => {
      const w: Partial<ParsedWord> = {};
      for (const [raw, field] of Object.entries(headerMap)) {
        const val = String(row[raw] ?? "").trim();
        if (val) w[field] = val;
      }
      return w;
    })
    .filter((w): w is ParsedWord => !!w.word);
}

// ─── HTML table extractor (shared by .doc and .docx) ────────────────────────
function extractWordsFromHtml(html: string): ParsedWord[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const table = doc.querySelector("table");

  if (!table) {
    // Fallback: try line-based parsing (tab-separated)
    return parseTabSeparated(doc.body.textContent ?? "");
  }

  const trs = Array.from(table.querySelectorAll("tr"));
  if (trs.length < 2) return [];

  // First row = headers
  const headerCells = Array.from(trs[0].querySelectorAll("td, th"));
  const headers: (keyof ParsedWord | undefined)[] = headerCells.map((c) =>
    normalizeHeader(c.textContent ?? ""),
  );

  const words: ParsedWord[] = [];
  for (let i = 1; i < trs.length; i++) {
    const cells = Array.from(trs[i].querySelectorAll("td, th"));
    const w: Partial<ParsedWord> = {};
    cells.forEach((cell, idx) => {
      const field = headers[idx];
      const val = (cell.textContent ?? "").trim();
      if (field && val) w[field] = val;
    });
    if (w.word) words.push(w as ParsedWord);
  }

  return words;
}

// ─── DOC (HTML-based .doc files) ─────────────────────────────────────────────
// Our template is an HTML file saved as .doc — read it as text/HTML directly
export async function parseDoc(file: File): Promise<ParsedWord[]> {
  const text = await file.text();
  return extractWordsFromHtml(text);
}

// ─── DOCX (ZIP-based Office Open XML) ────────────────────────────────────────
export async function parseDocx(file: File): Promise<ParsedWord[]> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return extractWordsFromHtml(result.value);
}

// ─── TXT (tab-separated or comma-separated) ─────────────────────────────────
export async function parseTxt(file: File): Promise<ParsedWord[]> {
  const text = await file.text();
  return parseTabSeparated(text);
}

function parseTabSeparated(text: string): ParsedWord[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // Detect separator: tab or comma
  const separator = lines[0].includes("\t") ? "\t" : ",";

  const rawHeaders = lines[0].split(separator);
  const headers: (keyof ParsedWord | undefined)[] = rawHeaders.map((h) =>
    normalizeHeader(h),
  );

  const words: ParsedWord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);
    const w: Partial<ParsedWord> = {};
    cols.forEach((val, idx) => {
      const field = headers[idx];
      const v = val.trim();
      if (field && v) w[field] = v;
    });
    if (w.word) words.push(w as ParsedWord);
  }

  return words;
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
export async function parseVocabularyFile(file: File): Promise<ParsedWord[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcel(file);
  }
  if (name.endsWith(".docx")) {
    return parseDocx(file);
  }
  if (name.endsWith(".doc")) {
    return parseDoc(file);
  }
  if (name.endsWith(".txt") || name.endsWith(".csv")) {
    return parseTxt(file);
  }
  throw new Error(
    "Unsupported file type. Please upload .xlsx, .xls, .doc, .docx, .txt, or .csv",
  );
}

// ─── Template generators ─────────────────────────────────────────────────────
const TEMPLATE_HEADERS = [
  "word",
  "partOfSpeech",
  "definition",
  "example",
  "uzbek",
  "rus",
  "image_url",
  "audio_url",
];

const SAMPLE_ROWS = [
  [
    "ubiquitous",
    "adjective",
    "found everywhere",
    "Smartphones are ubiquitous in modern life.",
    "hamma joyda mavjud",
    "повсеместный",
    "",
    "",
  ],
  [
    "mitigate",
    "verb",
    "to make less severe",
    "Planting trees can mitigate the effects of climate change.",
    "yumshatmoq",
    "смягчить",
    "",
    "",
  ],
];

export function downloadExcelTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...SAMPLE_ROWS]);

  // Set column widths
  ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({
    wch: Math.max(h.length, 18),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vocabulary");
  XLSX.writeFile(wb, "vocabulary_template.xlsx");
}

export function downloadTxtTemplate() {
  const lines = [
    TEMPLATE_HEADERS.join("\t"),
    ...SAMPLE_ROWS.map((r) => r.join("\t")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vocabulary_template.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDocxTemplate() {
  // Generate a simple HTML-based docx table (basic .doc format Word can open)
  const tableRows = [TEMPLATE_HEADERS, ...SAMPLE_ROWS]
    .map(
      (row) =>
        "<tr>" +
        row
          .map((c) => `<td style="padding:4px;border:1px solid #ccc">${c}</td>`)
          .join("") +
        "</tr>",
    )
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>Vocabulary Template</title></head>
    <body>
      <h2>Vocabulary Import Template</h2>
      <p>Fill in the table below and save as .docx before importing.</p>
      <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse">
        ${tableRows}
      </table>
    </body>
    </html>`;

  const blob = new Blob([html], {
    type: "application/vnd.ms-word;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vocabulary_template.doc";
  a.click();
  URL.revokeObjectURL(url);
}
