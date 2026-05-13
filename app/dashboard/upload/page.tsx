"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDocument } from "@/lib/api/documents";
import { useAuthStore } from "@/stores/auth-store";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
  };

  const handleUpload = async () => {
    if (!files.length || !user?.email) {
      toast.error("Select at least one file first.");
      return;
    }

    setUploading(true);

    try {
      await Promise.all(
        files.map((file) =>
          createDocument({
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            uploadedBy: user.email,
          })
        )
      );

      toast.success(`${files.length} document(s) queued for indexing scaffold.`);
      setFiles([]);
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
        <p className="text-sm text-muted-foreground">Upload files now. Metadata will be tracked and later connected to Appwrite storage + RAG indexing.</p>
      </div>

      <Card className="glass rounded-2xl border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Document intake pipeline
          </CardTitle>
          <CardDescription>Foundation mode: we store file metadata now and keep upload/indexing integration-ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            multiple
            onChange={handleFiles}
            className="w-full rounded-lg border bg-background/80 px-3 py-2 text-sm"
          />

          {files.length > 0 && (
            <div className="space-y-2 rounded-lg border bg-background/70 p-3">
              {files.map((file) => (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground">{Math.round(file.size / 1024)} KB</span>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? "Uploading..." : "Queue metadata"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
