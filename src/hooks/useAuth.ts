"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const isAdminBypass = process.env.NEXT_PUBLIC_ADMIN_BYPASS === 'true';
            if (!session && isAdminBypass) {
                const mockUser = {
                    id: 'admin-id-123',
                    email: 'admin@topsalesagent.ai',
                    aud: 'authenticated',
                    role: 'authenticated',
                    app_metadata: {},
                    user_metadata: { full_name: 'Admin User' },
                    created_at: new Date().toISOString(),
                };
                setUser(mockUser as any);
                setSession({
                    user: mockUser,
                    access_token: 'mock-token',
                    refresh_token: 'mock-token',
                    expires_in: 3600,
                    token_type: 'bearer',
                } as any);
            } else {
                setSession(session);
                setUser(session?.user ?? null);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const isAdminBypass = process.env.NEXT_PUBLIC_ADMIN_BYPASS === 'true';
            const currentUser = session?.user ?? null;

            if (!currentUser && isAdminBypass) {
                // Mock Admin User
                setUser({
                    id: 'admin-id-123',
                    email: 'admin@topsalesagent.ai',
                    aud: 'authenticated',
                    role: 'authenticated',
                    app_metadata: {},
                    user_metadata: { full_name: 'Admin User' },
                    created_at: new Date().toISOString(),
                } as any);
                setSession({
                    user: { id: 'admin-id-123' },
                    access_token: 'mock-token',
                    refresh_token: 'mock-token',
                    expires_in: 3600,
                    token_type: 'bearer',
                } as any);
            } else {
                setSession(session);
                setUser(currentUser);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = useCallback(
        async (email: string, password: string) => {
            const { data, error } = await supabase.auth.signUp({ email, password });
            return { data, error };
        },
        [supabase]
    );

    const signIn = useCallback(
        async (email: string, password: string) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            return { data, error };
        },
        [supabase]
    );

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    }, [supabase]);

    return { user, session, loading, signUp, signIn, signOut };
}
