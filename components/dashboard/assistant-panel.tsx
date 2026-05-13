import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AssistantPanel() {
  return (
    <Card className="glass rounded-2xl border-white/20 dark:border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Ask policy questions, summarize large docs, and retrieve contextual answers from your knowledge base.
        </p>
        <Button asChild className="w-full">
          <Link href="/dashboard/chat">Open AI Chat</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default AssistantPanel;
