"use client";

import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function App() {
  const [sessionId] = useState(() => uuidv4());
  const [pending, setPending] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: "assistant",
      content: "I’m your enterprise knowledge assistant. Ask me anything about your uploaded documents.",
    },
  ]);

  const canSend = useMemo(() => question.trim().length > 0 && !pending, [pending, question]);

  const handleSend = async () => {
    if (!canSend) {
      return;
    }

    const prompt = question.trim();
    setQuestion("");
    setPending(true);

    const userMessage: ChatMessage = { id: uuidv4(), role: "user", content: prompt };
    setMessages((previous) => [...previous, userMessage]);

    try {
      const response = await apiClient<{ answer: string }>(API_ROUTES.ask, {
        method: "POST",
        body: JSON.stringify({
          question: prompt,
          sessionId,
        }),
      });

      setMessages((previous) => [
        ...previous,
        {
          id: uuidv4(),
          role: "assistant",
          content: response.data?.answer ?? "No response from assistant.",
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ask question");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-sm text-muted-foreground">Scaffold response mode is active. RAG retrieval will be plugged in next phase.</p>
      </div>

      <Card className="glass rounded-2xl border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle>Knowledge Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 h-[420px] space-y-3 overflow-y-auto rounded-xl border bg-background/70 p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about policies, docs, or onboarding data..."
            />
            <Button onClick={handleSend} disabled={!canSend}>
              {pending ? "Thinking..." : <SendHorizonal className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
