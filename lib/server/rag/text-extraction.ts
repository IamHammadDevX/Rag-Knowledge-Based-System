import mammoth from "mammoth";
import PDFParser from "pdf2json";

type ExtractionResult = {
  text: string;
  method: "pdf2json" | "pdf-parse" | "docx-mammoth" | "plain-text";
  warning?: string;
};

const normalizeText = (input: string) =>
  input
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parsePdfTextWithPdf2Json = async (buffer: Buffer) =>
  new Promise<string>((resolve, reject) => {
    const parser = new (PDFParser as any)(null, 1);

    parser.on("pdfParser_dataError", (error: any) => {
      reject(new Error(error?.parserError?.toString?.() || "PDF parsing failed via pdf2json."));
    });

    parser.on("pdfParser_dataReady", (pdfData: any) => {
      const pages = pdfData?.Pages || [];
      const text = pages
        .flatMap((page: any) => page?.Texts || [])
        .flatMap((textBlock: any) => textBlock?.R || [])
        .map((run: any) => safeDecode(run?.T || ""))
        .join(" ");

      resolve(normalizeText(text));
    });

    parser.parseBuffer(buffer);
  });

const parsePdfTextWithPdfParse = async (buffer: Buffer) => {
  const pdfModule = await import("pdf-parse");
  const parser = new (pdfModule as any).PDFParse({
    data: new Uint8Array(buffer),
  });

  const parsed = await parser.getText();
  await parser.destroy?.();

  if (typeof parsed === "string") {
    return normalizeText(parsed);
  }

  if (parsed?.text && typeof parsed.text === "string") {
    return normalizeText(parsed.text);
  }

  return "";
};

const parsePdfText = async (buffer: Buffer) => {
  try {
    const textFromPdf2json = await parsePdfTextWithPdf2Json(buffer);
    if (textFromPdf2json.length > 0) {
      return {
        text: textFromPdf2json,
        method: "pdf2json" as const,
      };
    }
  } catch {
    // Continue to fallback parser
  }

  const textFromPdfParse = await parsePdfTextWithPdfParse(buffer);
  return {
    text: textFromPdfParse,
    method: "pdf-parse" as const,
  };
};

export const extractTextFromFile = async (
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractionResult> => {
  const lowerName = fileName.toLowerCase();

  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) {
    const parsed = await parsePdfText(buffer);

    if (!parsed.text) {
      throw new Error(
        "No extractable text found in this PDF. If it's a scanned/image-only PDF, please use OCR-enabled files."
      );
    }

    return {
      text: parsed.text,
      method: parsed.method,
    };
  }

  if (
    mimeType.includes("officedocument.wordprocessingml.document") ||
    lowerName.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = normalizeText(parsed.value || "");

    if (!text) {
      throw new Error("DOCX parsing succeeded but extracted text is empty.");
    }

    return {
      text,
      method: "docx-mammoth",
    };
  }

  if (mimeType.includes("text") || lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    const text = normalizeText(buffer.toString("utf-8"));

    if (!text) {
      throw new Error("Text file is empty.");
    }

    return {
      text,
      method: "plain-text",
    };
  }

  throw new Error("Unsupported file format. Supported types: PDF, DOCX, TXT.");
};
