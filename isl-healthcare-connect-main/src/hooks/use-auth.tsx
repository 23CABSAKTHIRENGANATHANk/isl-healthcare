import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { AppUser, HealthcareRole } from "@/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  displayName: string;
  role: HealthcareRole;
  currentLevel: string;
  learningStreak: number;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    role: HealthcareRole;
  }) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMeta?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          role: (data.role as HealthcareRole) || "nurse",
          hospital_id: data.hospital_id,
          sector: "healthcare",
          level: (data.current_level as "bronze" | "silver" | "gold") || "bronze",
          created_at: data.created_at,
        });
      } else {
        // Fallback: build temporary profile from metadata or upsert
        const fallbackName = (userMeta?.["full_name"] as string) || userEmail?.split("@")[0] || "Healthcare Worker";
        const fallbackRole = (userMeta?.["healthcare_role"] as HealthcareRole) || "nurse";
        
        const fallbackUser: AppUser = {
          id: userId,
          full_name: fallbackName,
          email: userEmail || "",
          role: fallbackRole,
          hospital_id: null,
          sector: "healthcare",
          level: "bronze",
          created_at: new Date().toISOString(),
        };
        setProfile(fallbackUser);

        // Attempt creation if table is available
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: fallbackName,
          email: userEmail || "",
          role: fallbackRole,
        } as never);
      }
    } catch (err) {
      console.warn("[Auth] Failed to load profile:", err);
    }
  }, []);

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        void fetchProfile(
          initialSession.user.id,
          initialSession.user.email,
          initialSession.user.user_metadata as Record<string, unknown>
        );
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void fetchProfile(
          nextSession.user.id,
          nextSession.user.email,
          nextSession.user.user_metadata as Record<string, unknown>
        );
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata as Record<string, unknown>);
    }
  }, [user, fetchProfile]);

  const value = useMemo<AuthContextValue>(() => {
    const metadata = (user?.user_metadata ?? {}) as { full_name?: string; healthcare_role?: HealthcareRole };
    const name = profile?.full_name || metadata.full_name || user?.email?.split("@")[0] || "Healthcare Staff";
    const userRole = profile?.role || metadata.healthcare_role || "nurse";

    return {
      session,
      user,
      profile,
      loading,
      displayName: name,
      role: userRole,
      currentLevel: profile?.level || "bronze",
      learningStreak: 0,
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        if (data.user) {
          await fetchProfile(data.user.id, data.user.email, data.user.user_metadata as Record<string, unknown>);
        }
        return { error: null };
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

        if (error) return { error: error.message, needsConfirmation: false };

        if (data.user) {
          // Attempt immediate profile upsert
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              full_name: fullName,
              email,
              role,
            } as never);
          } catch (e) {
            console.warn("[Auth] Profile upsert on signup:", e);
          }
        }

        return {
          error: null,
          needsConfirmation: !error && data.session === null,
        };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      },
      refreshProfile,
    };
  }, [session, user, profile, loading, fetchProfile, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
