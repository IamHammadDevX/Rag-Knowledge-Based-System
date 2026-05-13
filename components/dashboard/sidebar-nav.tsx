"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/branding/logo";
import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";

function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="glass sticky top-4 h-[calc(100vh-2rem)] w-full rounded-2xl p-3 md:w-64">
      <div className="mb-8 px-2 py-3">
        <Logo />
      </div>
      <nav className="space-y-1">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default SidebarNav;
