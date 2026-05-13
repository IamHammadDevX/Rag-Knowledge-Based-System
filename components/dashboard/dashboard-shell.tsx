import SidebarNav from "@/components/dashboard/sidebar-nav";
import TopNav from "@/components/dashboard/top-nav";

type DashboardShellProps = {
  children: React.ReactNode;
};

function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="container py-4 md:py-5">
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <SidebarNav />
        <main className="min-w-0">
          <TopNav />
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
