"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";

function TopNav() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await apiClient(API_ROUTES.logout, { method: "POST" });
    } catch {
      // ignore scaffold errors
    } finally {
      logout();
      toast.success("Logged out");
      router.push("/login");
    }
  };

  return (
    <header className="glass mb-5 rounded-2xl px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Input placeholder="Search docs, prompts, team notes..." className="w-full md:w-96" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <div className="hidden rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground md:block">
            {user?.name ?? "Workspace Admin"}
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
