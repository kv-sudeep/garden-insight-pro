import { Link, useLocation } from "@tanstack/react-router";
import { Home, Camera, Sprout, BookOpen } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/scan", label: "Scan", icon: Camera },
  { to: "/garden", label: "Garden", icon: Sprout },
  { to: "/library", label: "Library", icon: BookOpen },
] as const;

export function MobileLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                  active ? "text-leaf" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
