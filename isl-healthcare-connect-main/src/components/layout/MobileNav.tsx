import { Link } from "@tanstack/react-router";
import { GraduationCap, Hand, Home, LayoutDashboard, Mic } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/practice", label: "Practice", icon: Hand },
  { to: "/voicebridge", label: "Voice", icon: Mic },
  { to: "/dashboard", label: "Me", icon: LayoutDashboard },
] as const;

/** Native-app style bottom navigation for small screens. */
export function MobileNav() {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary font-semibold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
