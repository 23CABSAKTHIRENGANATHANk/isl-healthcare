import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { HEALTHCARE_ROLES, type HealthcareRole } from "@/types";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your ISL Setu account" },
      {
        name: "description",
        content:
          "Sign up as a nurse, receptionist, pharmacist, ASHA/ANM worker, doctor or counsellor and start learning ISL.",
      },
      { property: "og:title", content: "Create your ISL Setu account" },
      {
        property: "og:description",
        content: "Learn ISL. Practice with AI. Communicate without barriers.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<HealthcareRole>("nurse");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signUp({ email, password, fullName, role });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setConfirmSent(true);
      return;
    }
    toast.success("Account created — welcome to ISL Setu");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="bg-gradient-hero">
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:py-24">
        <Logo size="lg" />
        <Card className="mt-8 w-full rounded-2xl border-border/70 shadow-lift">
          <CardContent className="p-6 sm:p-8">
            {confirmSent ? (
              <div className="space-y-4 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
                  <MailCheck className="size-6" aria-hidden="true" />
                </span>
                <h1 className="text-2xl font-bold text-foreground">Check your email to confirm</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to{" "}
                  <strong className="text-foreground">{email}</strong>. Open it to activate your
                  account, then log in.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Go to log in</Link>
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tell us your healthcare role so lessons and assessments match your work.
                </p>

                <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
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
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11"
                      aria-describedby="password-hint"
                    />
                    <p id="password-hint" className="text-xs text-muted-foreground">
                      Use at least 8 characters.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Healthcare role</Label>
                    <Select
                      value={role}
                      onValueChange={(value) => setRole(value as HealthcareRole)}
                    >
                      <SelectTrigger id="role" className="h-11">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {HEALTHCARE_ROLES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error ? (
                    <p
                      role="alert"
                      className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                    >
                      {error}
                    </p>
                  ) : null}

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                    {busy ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <UserPlus aria-hidden="true" />
                    )}
                    {busy ? "Creating account…" : "Create account"}
                  </Button>
                </form>

                <p className="mt-6 text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Log in
                  </Link>
                </p>
                <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ISL Setu credentials are platform credentials, not a government accreditation.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
