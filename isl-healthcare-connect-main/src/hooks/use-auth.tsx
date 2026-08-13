import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { HealthcareRole } from "@/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    role: HealthcareRole;
  }) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data: got }) => {
      setSession(got.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const metadata = (session?.user.user_metadata ?? {}) as { full_name?: string };
    return {
      session,
      user: session?.user ?? null,
      loading,
      displayName: metadata.full_name || session?.user.email?.split("@")[0] || "Ananya",
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async ({ email, password, fullName, role }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, healthcare_role: role },
          },
        });
        return {
          error: error?.message ?? null,
          needsConfirmation: !error && data.session === null,
        };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
