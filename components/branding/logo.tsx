import { BrainCircuit } from "lucide-react";

type LogoProps = {
  compact?: boolean;
};

function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg">
        <BrainCircuit className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold">Knowledge IQ</p>
          <p className="text-xs text-muted-foreground">Enterprise RAG Suite</p>
        </div>
      )}
    </div>
  );
}

export default Logo;
