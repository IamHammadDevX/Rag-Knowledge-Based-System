import AuthGate from "@/components/auth/auth-gate";
import DashboardShell from "@/components/dashboard/dashboard-shell";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

function App({ children }: DashboardLayoutProps) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}

export default App;
