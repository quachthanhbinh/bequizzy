"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { PhoneValue } from "@/components/PhoneInput";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  plan: "free" | "starter" | "growth" | "scale";
  role: "owner" | "admin" | "member";
  initials: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: PhoneValue;
  twoFaEnabled: boolean;
  /** True when the account has an email+password credential (not OAuth-only). */
  hasPassword: boolean;
  createdAt: string;
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithFacebook: () => Promise<{ error?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: PhoneValue;
  }) => Promise<{ error?: string }>;
  signOut: () => void;
  updateProfile: (data: Partial<Pick<AuthUser, "firstName" | "lastName" | "phone">>) => Promise<void>;
  /** Pass `current=null` when the user has no password yet (OAuth-only account). */
  updatePassword: (current: string | null, next: string) => Promise<{ error?: string }>;
  switchWorkspace: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setAuthCookie() {
  document.cookie = `rl-auth=1; path=/; max-age=86400; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `rl-auth=; path=/; max-age=0; SameSite=Lax`;
}

/** Persist Supabase session tokens so apiFetch can attach them to API calls. */
function syncSessionToStorage(accessToken: string, workspaceId: string) {
  if (typeof window === "undefined") return;
  if (accessToken) sessionStorage.setItem("revlooper_access_token", accessToken);
  if (workspaceId) sessionStorage.setItem("revlooper_workspace_id", workspaceId);
}

function clearSessionStorage() {
  sessionStorage.removeItem("revlooper_access_token");
  sessionStorage.removeItem("revlooper_workspace_id");
}

function buildAuthUser(supabaseUser: User, overrideWorkspaceId?: string): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};

  const fullName: string = meta.full_name ?? meta.name ?? "";
  const firstName: string = meta.firstName ?? fullName.split(" ")[0] ?? "User";
  const lastName: string = meta.lastName ?? fullName.split(" ").slice(1).join(" ") ?? "";
  const initials = (`${firstName[0] ?? ""}${lastName[0] ?? ""}`).toUpperCase() || "U";

  const defaultWorkspace: Workspace = {
    id: `ws-${supabaseUser.id}`,
    name: `${firstName}'s Workspace`,
    plan: "free",
    role: "owner",
    initials: initials.slice(0, 2),
  };

  const workspaces: Workspace[] = meta.workspaces ?? [defaultWorkspace];
  const activeWorkspaceId: string =
    overrideWorkspaceId ??
    meta.activeWorkspaceId ??
    workspaces[0]?.id ??
    `ws-${supabaseUser.id}`;

  // hasPassword = user has an email identity (i.e. was created with email+password
  // or has previously set a password after OAuth signup).
  const hasPassword = (supabaseUser.identities ?? []).some(
    (i) => i.provider === "email",
  );

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    firstName,
    lastName,
    phone: meta.phone ?? { dialCode: "+84", number: "" },
    twoFaEnabled: false,
    hasPassword,
    createdAt: supabaseUser.created_at,
    workspaces,
    activeWorkspaceId,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>();

  // Restore session from Supabase on mount
  useEffect(() => {
    // ── E2E test mode ─────────────────────────────────────────────────────────
    // When NEXT_PUBLIC_E2E_TEST=1 is set (inherited by the Playwright webServer),
    // bypass Supabase auth entirely and return a deterministic mock user so that
    // tests can render protected pages without real credentials.
    if (process.env.NEXT_PUBLIC_E2E_TEST === "1") {
      setUser({
        id: "e2e-user-id",
        email: "e2e@revlooper.com",
        firstName: "E2E",
        lastName: "Tester",
        phone: { dialCode: "+84", number: "" },
        twoFaEnabled: false,
        hasPassword: false,
        createdAt: "2024-01-01T00:00:00Z",
        workspaces: [
          {
            id: "e2e-workspace-id",
            name: "E2E Workspace",
            plan: "starter",
            role: "owner",
            initials: "EW",
          },
        ],
        activeWorkspaceId: "e2e-workspace-id",
      });
      // Populate sessionStorage so apiFetch sends X-Workspace-ID on all API calls.
      syncSessionToStorage("e2e-access-token", "e2e-workspace-id");
      setAuthCookie();
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser = buildAuthUser(session.user, activeWorkspaceId);
        setUser(authUser);
        setAuthCookie();
        syncSessionToStorage(session.access_token, authUser.activeWorkspaceId);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const authUser = buildAuthUser(session.user, activeWorkspaceId);
        setUser(authUser);
        setAuthCookie();
        syncSessionToStorage(session.access_token, authUser.activeWorkspaceId);
      } else {
        setUser(null);
        clearAuthCookie();
        clearSessionStorage();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(email: string, password: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "invalid_credentials" };
    setAuthCookie();
    return {};
  }
  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return {};
  }

  async function signInWithFacebook() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email,public_profile",
      },
    });
    if (error) return { error: error.message };
    return {};
  }

  async function signUp(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: PhoneValue;
  }) {
    const supabase = createClient();
    const wsId = `ws-${Date.now()}`;
    const initials = (`${data.firstName[0] ?? "W"}${data.lastName[0] ?? ""}`).toUpperCase();
    const defaultWorkspace: Workspace = {
      id: wsId,
      name: `${data.firstName}'s Workspace`,
      plan: "free",
      role: "owner",
      initials: initials.slice(0, 2),
    };

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          workspaces: [defaultWorkspace],
          activeWorkspaceId: wsId,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) return { error: "email_taken" };
      return { error: error.message };
    }
    return {};
  }

  function signOut() {
    const supabase = createClient();
    supabase.auth.signOut();
    setUser(null);
    clearAuthCookie();
    clearSessionStorage();
  }

  async function updateProfile(
    data: Partial<Pick<AuthUser, "firstName" | "lastName" | "phone">>
  ) {
    if (!user) return;
    const supabase = createClient();
    await supabase.auth.updateUser({ data });
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  }

  async function updatePassword(current: string | null, next: string) {
    if (!user) return { error: "not_authenticated" };
    const supabase = createClient();

    // Only verify current password when the account already has one.
    if (user.hasPassword) {
      if (!current) return { error: "incorrect_current" };
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInErr) return { error: "incorrect_current" };
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return { error: error.message };

    // Flip flag so the UI switches to "Change password" immediately.
    setUser((prev) => prev ? { ...prev, hasPassword: true } : prev);
    return {};
  }

  function switchWorkspace(id: string) {
    if (!user) return;
    if (!user.workspaces.some((w) => w.id === id)) return;
    setUser((prev) => prev ? { ...prev, activeWorkspaceId: id } : prev);
    setActiveWorkspaceId(id);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("revlooper_workspace_id", id);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signInWithGoogle, signInWithFacebook, signUp, signOut, updateProfile, updatePassword, switchWorkspace }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
