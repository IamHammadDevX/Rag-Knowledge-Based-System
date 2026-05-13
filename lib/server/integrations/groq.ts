const groqApiKey = process.env.GROQ_API_KEY;
const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const generateGroqCompletion = async (messages: GroqMessage[]) => {
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqModel,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Groq completion failed.");
  }

  return {
    content: data?.choices?.[0]?.message?.content || "No answer generated.",
    usage: data?.usage,
  };
};
