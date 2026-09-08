import { Activity, FolderInput, Gauge, Shield } from "lucide-react";
import { Link, usePage, type Page } from "@/nav";
import { cn } from "@/lib/utils";

const NAV: { to: Page; label: string; icon: typeof Activity }[] = [
  { to: "/", label: "Radar", icon: Activity },
  { to: "/sources", label: "Sources", icon: FolderInput },
  { to: "/budgets", label: "Budgets", icon: Gauge },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePage();
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-border px-4 py-4 md:flex md:w-56 md:flex-col md:border-b-0 md:border-r md:px-5 md:py-6">
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <Shield className="size-4 text-accent" strokeWidth={1.75} />
          Burnwatch
        </div>
        <p className="mt-1 hidden text-xs text-faint md:block">On this device only</p>
        <nav className="mt-4 flex gap-1 md:mt-8 md:flex-col">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm md:flex-none md:justify-start",
                  active ? "bg-subtle text-fg" : "text-muted hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
