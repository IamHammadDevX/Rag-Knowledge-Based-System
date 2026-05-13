type ChunkOptions = {
  chunkSize: number;
  overlap: number;
};

const DEFAULT_OPTIONS: ChunkOptions = {
  chunkSize: 1200,
  overlap: 180,
};

export const splitIntoChunks = (text: string, options?: Partial<ChunkOptions>) => {
  const { chunkSize, overlap } = { ...DEFAULT_OPTIONS, ...options };
  const cleanText = text.trim();

  if (!cleanText) {
    return [] as string[];
  }

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < cleanText.length) {
    const maxEnd = Math.min(cleanText.length, cursor + chunkSize);
    let end = maxEnd;

    if (maxEnd < cleanText.length) {
      const lastSpace = cleanText.lastIndexOf(" ", maxEnd);
      if (lastSpace > cursor + Math.floor(chunkSize * 0.6)) {
        end = lastSpace;
      }
    }

    chunks.push(cleanText.slice(cursor, end).trim());
    cursor = Math.max(end - overlap, end === cleanText.length ? end : end - overlap);

    if (chunks.length > 2000) {
      break;
    }
  }

  return chunks.filter(Boolean);
};
