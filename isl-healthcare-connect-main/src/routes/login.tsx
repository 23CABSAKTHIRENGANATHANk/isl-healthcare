import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Log in — ISL Setu" },
      {
        name: "description",
        content:
          "Log in to continue your Indian Sign Language healthcare learning journey on ISL Setu.",
      },
      { property: "og:title", content: "Log in — ISL Setu" },
      { property: "og:description", content: "Continue your ISL healthcare learning journey." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const redirectTarget = Route.useSearch().redirect || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      void navigate({ to: redirectTarget as string });
      return;
    }

    if (!isSupabaseConfigured) {
      const autoLogin = async () => {
        setBusy(true);
        setError(null);
        const { error: signInError } = await signIn("demo@islsetu.local", "demo1234");
        setBusy(false);

        if (signInError) {
          setError(signInError);
          return;
        }

        toast.success("Demo access enabled");
        void navigate({ to: redirectTarget as string });
      };

      void autoLogin();
    }
  }, [user, signIn, navigate, redirectTarget]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await signIn(email || "demo@islsetu.local", password || "demo1234");
    setBusy(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    toast.success("Welcome back to ISL Setu");
    void navigate({ to: redirectTarget as string });
  };

  return (
    <div className="bg-gradient-hero">
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:py-24">
        <Logo size="lg" />
        <Card className="mt-8 w-full rounded-2xl border-border/70 shadow-lift">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Log in to continue learning Indian Sign Language for healthcare.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@hospital.org"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11"
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={busy}>
                {busy ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <LogIn aria-hidden="true" />
                )}
                {busy ? "Signing in…" : "Log in"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              New to ISL Setu?{" "}
              <Link
                to="/signup"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Your account stores your learning progress only. Camera footage from practice screens
              is not stored by default.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
