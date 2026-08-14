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

export function Navbar() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/", replace: true });
  };

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
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  More
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {moreNav.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to} className="flex items-center gap-2">
                      <item.icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden sm:inline-flex">
                  <span className="grid size-6 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  {displayName}
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    My Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/certification" className="flex items-center gap-2">
                    <Sparkles className="size-4" aria-hidden="true" />
                    My Certifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void handleSignOut()}>
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <ul className="mt-6 space-y-1">
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
                    <LogOut aria-hidden="true" />
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
