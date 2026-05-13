import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeDocument } from "@/types/documents";

interface RecentDocumentsProps {
  documents: KnowledgeDocument[];
}

function RecentDocuments({ documents }: RecentDocumentsProps) {
  return (
    <Card className="glass rounded-2xl border-white/20 dark:border-white/10">
      <CardHeader>
        <CardTitle>Recent documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet. Use Upload Documents to get started.</p>
        ) : (
          documents.slice(0, 5).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border bg-background/70 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{Math.round(doc.size / 1024)} KB • {new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
              <Badge variant={doc.status === "indexed" ? "default" : "secondary"}>{doc.status}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default RecentDocuments;
