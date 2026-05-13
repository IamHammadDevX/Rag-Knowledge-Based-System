import mammoth from "mammoth";

const normalizeText = (input: string) =>
  input
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const extractTextFromFile = async (buffer: Buffer, mimeType: string, fileName: string) => {
  const lowerName = fileName.toLowerCase();

  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) {
    // Dynamic import to avoid Next.js SSR issues with pdfjs-dist
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return normalizeText(parsed.text || "");
  }

  if (
    mimeType.includes("officedocument.wordprocessingml.document") ||
    lowerName.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return normalizeText(parsed.value || "");
  }

  if (mimeType.includes("text") || lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return normalizeText(buffer.toString("utf-8"));
  }

  throw new Error("Unsupported file format. Supported types: PDF, DOCX, TXT.");
};
