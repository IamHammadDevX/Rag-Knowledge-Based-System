const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
const huggingFaceModel =
  process.env.HUGGINGFACE_EMBED_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const huggingFaceEndpoint = `https://api-inference.huggingface.co/models/${huggingFaceModel}`;

// Simple cache for embeddings to avoid redundant API calls
const embeddingCache = new Map<string, number[]>();

const toVector = (payload: unknown): number[] => {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected HuggingFace embedding format.");
  }

  if (payload.length === 0) {
    return [];
  }

  if (typeof payload[0] === "number") {
    return payload as number[];
  }

  if (Array.isArray(payload[0]) && typeof payload[0][0] === "number") {
    const vectors = payload as number[][];
    const dimension = vectors[0].length;
    const summed = Array.from({ length: dimension }, () => 0);

    vectors.forEach((vector) => {
      vector.forEach((value, index) => {
        summed[index] += value;
      });
    });

    return summed.map((value) => value / vectors.length);
  }

  throw new Error("Unable to normalize HuggingFace embedding response.");
};

export const generateEmbedding = async (text: string) => {
  if (!huggingFaceApiKey) {
    throw new Error("HUGGINGFACE_API_KEY is missing.");
  }

  const cleanText = text.trim();
  if (!cleanText) {
    return [];
  }

  // Check cache first
  const cacheKey = cleanText.slice(0, 100); // Use first 100 chars as key
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  // Retry logic with exponential backoff
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(huggingFaceEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${huggingFaceApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: cleanText.slice(0, 4000),
          options: { wait_for_model: true },
        }),
      });

      const rawText = await response.text();
      const data = (() => {
        try {
          return JSON.parse(rawText);
        } catch {
          return rawText;
        }
      })();

      if (!response.ok) {
        lastError = new Error(
          `HuggingFace error (${response.status}): ${
            typeof data === "string" ? data.slice(0, 100) : JSON.stringify(data).slice(0, 100)
          }`
        );

        // 429 = Rate limit, retry with backoff
        if (response.status === 429 && attempt < maxRetries - 1) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`[HuggingFace] Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw lastError;
      }

      const vector = toVector(data);
      embeddingCache.set(cacheKey, vector);
      return vector;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries - 1) {
        console.error("[HuggingFace] All retry attempts failed:", lastError.message);
        throw lastError;
      }

      const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error("Unknown HuggingFace error");
};
