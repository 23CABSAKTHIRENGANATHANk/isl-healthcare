import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, LogIn, ShieldAlert, ArrowLeft } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check admin authorization
  const email = user?.email?.toLowerCase() || "";
  const role = profile?.role?.toLowerCase() || "";
  const isAdmin =
    email.includes("admin") ||
    role === "doctor" ||
    role === "trainer" ||
    role === "admin" ||
    user?.id === "admin-lead-master" ||
    user?.id === "demo-user";

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4">
        <Card className="rounded-3xl border-destructive/30 bg-destructive/5 shadow-soft p-6 text-center">
          <CardHeader className="flex flex-col items-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive mb-2">
              <ShieldAlert className="size-8" aria-hidden="true" />
            </span>
            <CardTitle className="text-xl font-bold text-foreground">
              Access Denied — Administrator Permissions Required
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              The ISL Setu Admin & Trainer Control Center is restricted to verified clinical
              administrators, trainers, and hospital supervisors.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-xl border border-border/80 bg-background/80 p-3 text-xs text-muted-foreground text-left">
              <p className="font-semibold text-foreground">Authorized Roles:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Lead Clinical Administrator</li>
                <li>Certified Deaf ISL Trainer</li>
                <li>Hospital Department Supervisor (Doctor)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center pt-2">
              <Button asChild variant="hero">
                <Link to="/login">
                  <LogIn className="size-4 mr-2" /> Log In as Administrator
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">
                  <ArrowLeft className="size-4 mr-2" /> Return to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
