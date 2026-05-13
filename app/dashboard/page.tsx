"use client";

import { useEffect, useMemo, useState } from "react";
import AnalyticsCard from "@/components/dashboard/analytics-card";
import AssistantPanel from "@/components/dashboard/assistant-panel";
import RecentDocuments from "@/components/dashboard/recent-documents";
import { getDocuments } from "@/lib/api/documents";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { KnowledgeDocument } from "@/types/documents";

function App() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [health, setHealth] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const [docRes, healthRes] = await Promise.all([
        getDocuments(),
        apiClient<{ integrations: Record<string, boolean> }>(API_ROUTES.health),
      ]);

      setDocuments(docRes.data ?? []);
      setHealth(healthRes.data?.integrations ?? {});
    };

    load().catch(() => {
      // keep shell resilient in scaffold mode
    });
  }, []);

  const indexedCount = useMemo(
    () => documents.filter((document) => document.status === "indexed").length,
    [documents]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Enterprise RAG workspace health, documents, and assistant readiness.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard title="Total Documents" value={String(documents.length)} hint="Files in knowledge library" delay={0.05} />
        <AnalyticsCard title="Indexed Documents" value={String(indexedCount)} hint="Ready for retrieval" delay={0.1} />
        <AnalyticsCard
          title="Integration Readiness"
          value={`${Object.values(health).filter(Boolean).length}/4`}
          hint="Configured external services"
          delay={0.15}
        />
        <AnalyticsCard title="Assistant Status" value="Scaffold" hint="RAG logic intentionally deferred" delay={0.2} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentDocuments documents={documents} />
        </div>
        <AssistantPanel />
      </section>
    </div>
  );
}

export default App;
