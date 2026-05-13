import { BarChart3, FileText, MessageSquare, Settings, Upload } from "lucide-react";

export const DASHBOARD_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Upload Documents", href: "/dashboard/upload", icon: Upload },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Document Library", href: "/dashboard/documents", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;
