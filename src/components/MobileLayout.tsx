import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import iconHome from "@/assets/icon-home.png";
import iconCamera from "@/assets/icon-camera.png";
import iconGarden from "@/assets/icon-garden.png";
import iconLibrary from "@/assets/icon-library.png";
import iconSparkle from "@/assets/icon-sparkle.png";

const tabs = [
  { to: "/", label: "Home", icon: iconHome },
  { to: "/scan", label: "Scan", icon: iconCamera },
  { to: "/identify", label: "ID", icon: iconSparkle },
  { to: "/garden", label: "Garden", icon: iconGarden },
  { to: "/library", label: "Library", icon: iconLibrary },
] as const;

export function MobileLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {tabs.map(({ to, label, icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-all ${
                  active ? "text-leaf" : "text-muted-foreground"
                }`}
              >
                <img
                  src={icon}
                  alt=""
                  width={40}
                  height={40}
                  className={`h-9 w-9 object-contain drop-shadow-md transition-transform ${
                    active ? "scale-110 -translate-y-0.5" : "opacity-80"
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
