import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
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
  const main = useRef<HTMLElement>(null);
  useEffect(() => { main.current?.scrollTo({ top: 0 }); }, [pathname]);
  return <div className="app-frame app-shell mx-auto flex max-w-md flex-col">
    <main ref={main} className="app-content min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
    <nav aria-label="Main navigation" className="app-navigation z-50 shrink-0 select-none border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 pt-2">
        {tabs.map(({ to, label, icon: Icon }) => { const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1.5 text-[10px] ${active ? "text-accent" : "text-muted-foreground"}`}>
            <Icon className={`h-5 w-5 ${active ? "neon-icon" : ""}`} strokeWidth={1.7}/>{label}
          </Link>;
        })}
      </div>
    </nav>
  </div>;
}
