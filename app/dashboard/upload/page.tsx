"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth-store";
import { uploadFileInChunks } from "@/lib/api/uploads";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const user = useAuthStore((state) => state.user);

  const totalProgress = useMemo(() => {
    if (!files.length) {
      return 0;
    }

    const total = files.reduce((acc, file) => acc + (progressMap[file.name] ?? 0), 0);
    return Math.round(total / files.length);
  }, [files, progressMap]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
    setProgressMap({});
  };

  const handleUpload = async () => {
    if (!files.length || !user?.email) {
      toast.error("Select at least one file first.");
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        await uploadFileInChunks(file, (progress) => {
          setProgressMap((previous) => ({
            ...previous,
            [file.name]: progress,
          }));
        });
      }

      toast.success(`${files.length} file(s) uploaded and queued for live RAG indexing.`);
      setFiles([]);
      setProgressMap({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-sm text-muted-foreground">
          Live pipeline enabled: chunked upload → Appwrite storage → extraction (PDF/DOCX/TXT) → embeddings → Pinecone indexing.
        </p>
      </div>

      <Card className="glass rounded-2xl border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Document ingestion pipeline
          </CardTitle>
          <CardDescription>
            Supports PDF, DOCX, and TXT files with chunked upload for reliability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFiles}
            className="w-full rounded-lg border bg-background/80 px-3 py-2 text-sm"
          />

          {files.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-background/70 p-3">
              {files.map((file) => {
                const progress = progressMap[file.name] ?? 0;
                const done = progress >= 100;

                return (
                  <div key={`${file.name}-${file.size}`} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{file.name}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{Math.round(file.size / 1024)} KB</span>
                        {done && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                    <Progress value={progress} />
                  </div>
                );
              })}
            </div>
          )}

          {uploading && (
            <div className="rounded-lg border bg-background/70 p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Total progress</span>
                <span>{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} />
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? "Uploading & indexing..." : "Start live ingestion"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
