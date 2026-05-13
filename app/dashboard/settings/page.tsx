"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";

function App() {
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiClient<{ integrations: Record<string, boolean> }>(API_ROUTES.health)
      .then((response) => setIntegrations(response.data?.integrations ?? {}))
      .catch(() => setIntegrations({}));
  }, []);

  const items = [
    { key: "appwrite", title: "Appwrite (Auth / DB / Storage)", env: "NEXT_PUBLIC_APPWRITE_*" },
    { key: "pinecone", title: "Pinecone (Vector DB)", env: "PINECONE_*" },
    { key: "groq", title: "Groq (LLM)", env: "GROQ_API_KEY" },
    { key: "huggingFace", title: "HuggingFace (Embeddings)", env: "HUGGINGFACE_API_KEY" },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Integration readiness and architecture status for production activation.</p>
      </div>

      <Card className="glass rounded-2xl border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>Live integrations are enabled from environment configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => {
            const configured = integrations[item.key] ?? false;
            return (
              <div key={item.key} className="flex items-center justify-between rounded-lg border bg-background/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Required env: {item.env}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {configured ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Configured
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-500" />
                      Pending
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
