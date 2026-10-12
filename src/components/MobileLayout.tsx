import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Search, ScanLine, Sprout, BookOpen } from "lucide-react";
const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/guides", label: "Search", icon: Search },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/garden", label: "My Garden", icon: Sprout },
  { to: "/library", label: "Library", icon: BookOpen },
] as const;
export function MobileLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <div className="app-frame mx-auto flex min-h-screen max-w-md flex-col">
    <main className="flex-1 pb-24">{children}</main>
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 pb-4 pt-3">
        {tabs.map(({ to, label, icon: Icon }) => { const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className={`h-5 w-5 ${active ? "neon-icon" : ""}`} strokeWidth={1.7}/>{label}
          </Link>;
        })}
      </div>
    </nav>
  </div>;
}
