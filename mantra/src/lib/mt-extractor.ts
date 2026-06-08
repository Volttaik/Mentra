export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    mimeType === "text/csv" ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv")
  ) {
    return buffer.toString("utf8");
  }

  if (
    mimeType === "application/pdf" ||
    lower.endsWith(".pdf")
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParseModule = require("pdf-parse");
      const pdfParse = (typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default) as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      return result.text || "";
    } catch {
      return `[PDF content from ${fileName} — text extraction unavailable]`;
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch {
      return `[DOCX content from ${fileName} — text extraction unavailable]`;
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lower.endsWith(".pptx")
  ) {
    return `[Presentation: ${fileName}]\n\nThis presentation has been secured in the Mentra MT format. Content is available through the Mentra viewer.`;
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    lower.endsWith(".xlsx")
  ) {
    return `[Spreadsheet: ${fileName}]\n\nThis spreadsheet has been secured in the Mentra MT format. Content is available through the Mentra viewer.`;
  }

  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    lower.endsWith(".zip")
  ) {
    return `[Course Bundle: ${fileName}]\n\nThis bundle has been secured in the Mentra MT format. All included materials are available through the Mentra viewer.`;
  }

  return `[File: ${fileName}]\n\nThis content has been secured in the Mentra MT format.`;
}

export function isTextExtractable(mimeType: string, fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/pdf" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.ms-excel" ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".pptx") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".zip")
  );
}
