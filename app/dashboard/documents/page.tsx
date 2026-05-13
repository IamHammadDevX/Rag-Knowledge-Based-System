"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteDocument, getDocuments, retryDocument } from "@/lib/api/documents";
import { KnowledgeDocument } from "@/types/documents";

function App() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadDocuments = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await getDocuments();
      setDocuments(response.data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load documents");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDocuments().catch(() => {
      // no-op
    });
  }, []);

  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");

    if (!hasProcessing) {
      return;
    }

    const intervalId = setInterval(() => {
      loadDocuments(true).catch(() => {
        // no-op
      });
    }, 3500);

    return () => clearInterval(intervalId);
  }, [documents]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success("Document removed");
      setDocuments((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);

    try {
      await retryDocument(id);
      toast.success("Re-indexing started. Status will update shortly.");
      await loadDocuments(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Library</h1>
        <p className="text-sm text-muted-foreground">Manage all uploaded knowledge assets and indexing states.</p>
      </div>

      <Card className="glass rounded-2xl border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle>All documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents found. Upload your first file.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col gap-3 rounded-xl border bg-background/70 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type} • {Math.round(doc.size / 1024)} KB • {new Date(doc.createdAt).toLocaleString()}
                    </p>
                    {doc.status === "failed" && doc.errorMessage ? (
                      <p className="mt-1 text-xs text-destructive">Error: {doc.errorMessage}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === "indexed" ? "default" : "secondary"}>{doc.status}</Badge>
                    {doc.status === "failed" ? (
                      <Button
                        variant="outline"
                        onClick={() => handleRetry(doc.id)}
                        disabled={retryingId === doc.id}
                      >
                        <RefreshCcw className={`mr-2 h-4 w-4 ${retryingId === doc.id ? "animate-spin" : ""}`} />
                        Retry
                      </Button>
                    ) : null}
                    <Button variant="outline" size="icon" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
