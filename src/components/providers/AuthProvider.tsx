"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<any>;
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function NoopAuthProvider({ children }: { children: React.ReactNode }) {
    const noopValue = useMemo<AuthContextType>(
        () => ({
            user: null,
            session: null,
            loading: false,
            signUp: async () => ({ data: null, error: null }),
            signIn: async () => ({ data: null, error: null }),
            signOut: async () => ({ error: null }),
        }),
        []
    );
    return <AuthContext.Provider value={noopValue}>{children}</AuthContext.Provider>;
}

function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const hasSupabase =
        typeof window !== "undefined"
            ? !!(
                process.env.NEXT_PUBLIC_SUPABASE_URL &&
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            )
            : !!(
                process.env.NEXT_PUBLIC_SUPABASE_URL &&
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

    if (!hasSupabase) {
        return <NoopAuthProvider>{children}</NoopAuthProvider>;
    }

    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
