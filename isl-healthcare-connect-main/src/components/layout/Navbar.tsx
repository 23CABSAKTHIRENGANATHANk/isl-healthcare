import { Link, useNavigate } from "@tanstack/react-router";
import {
  Accessibility,
  Building2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Hand,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  ShieldCheck,
  Sparkles,
  UserCog,
} from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

export const primaryNav = [
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/practice", label: "Practice", icon: Hand },
  { to: "/voicebridge", label: "VoiceBridge", icon: Mic },
  { to: "/certification", label: "Certification", icon: Sparkles },
] as const;

export const moreNav = [
  { to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { to: "/assessment", label: "Assessment", icon: ClipboardCheck },
  { to: "/hospital", label: "Hospital Dashboard", icon: Building2 },
  { to: "/admin", label: "Admin & Trainer", icon: UserCog },
  { to: "/about", label: "About ISL Setu", icon: ShieldCheck },
  { to: "/accessibility", label: "Responsible AI & Accessibility", icon: Accessibility },
] as const;

function getInitials(name: string): string {
  if (!name) return "IS";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Navbar() {
  const { user, displayName, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/", replace: true });
  };

  const isAdminOrDoctor =
    ["doctor", "trainer", "admin"].includes(role?.toLowerCase() || "") ||
    Boolean(user?.email?.includes("admin"));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6"
      >
        <Logo />

        <ul className="ml-4 hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {moreNav.slice(0, 2).map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-full border border-border/80 bg-muted/40 py-1.5 pl-2 pr-3 transition-all hover:bg-muted/70 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-xs"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-xs">
                      {getInitials(displayName || user.email || "US")}
                    </span>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-bold text-foreground max-w-[130px] truncate">
                        {displayName || user.email?.split("@")[0] || "Clinician"}
                      </span>
                      <span className="text-[10px] font-semibold text-teal-400 capitalize">
                        {role || "Healthcare Staff"}
                      </span>
                    </div>
                    <ChevronDown className="size-3.5 text-muted-foreground ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl">
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <p className="text-xs font-bold text-foreground">{displayName || "Clinician"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer flex items-center gap-2">
                      <LayoutDashboard className="size-4 text-primary" />
                      <span>My Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdminOrDoctor ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer flex items-center gap-2 text-teal-400 font-medium">
                        <UserCog className="size-4 text-teal-400" />
                        <span>Admin Control Center</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void handleSignOut()}
                    className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild variant="hero" className="hidden sm:inline-flex">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo asLink={false} />
                </SheetTitle>
              </SheetHeader>

              {user ? (
                <div className="mt-4 mb-2 flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground">
                    {getInitials(displayName || user.email || "US")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {displayName || "Clinician"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground font-mono">
                      {user.email}
                    </p>
                    <span className="inline-block mt-0.5 rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-400 capitalize">
                      {role || "Healthcare Staff"}
                    </span>
                  </div>
                </div>
              ) : null}

              <ul className="mt-4 space-y-1">
                {[...primaryNav, ...moreNav].map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                      activeProps={{ className: "bg-accent font-semibold" }}
                    >
                      <item.icon className="size-5 text-primary" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2 border-t border-border pt-6">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={() => void handleSignOut()}>
                    <LogOut aria-hidden="true" className="mr-1.5 size-4" />
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="hero" className="w-full">
                      <Link to="/signup" onClick={() => setOpen(false)}>
                        Create free account
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
