const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
const huggingFaceModel =
  process.env.HUGGINGFACE_EMBED_MODEL || "sentence-transformers/all-MiniLM-L6-v2";

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

  const response = await fetch(`https://api-inference.huggingface.co/models/${huggingFaceModel}`, {
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "HuggingFace embedding request failed.");
  }

  return toVector(data);
};
