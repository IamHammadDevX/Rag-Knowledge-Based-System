import { Skeleton } from "@/components/ui/skeleton";

function App() {
  return (
    <div className="container py-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-4 h-72" />
    </div>
  );
}

export default App;
