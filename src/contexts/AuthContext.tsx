"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthContextType = {
  user: any | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  setProfile: (p: any) => void;
  signUp: (email: string, password: string) => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        if (!mounted) return;
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: prof, error } = await supabase
            .from("cv_profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (!mounted) return;
          setProfile(error ? null : prof ?? null);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth init error", err);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setProfile(undefined);
      if (session?.user) {
        const { data: prof, error } = await supabase
          .from("cv_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(error ? null : prof ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      try { listener?.subscription?.unsubscribe(); } catch {}
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setUser(data?.user ?? null);
    return data;
  };

  const updateProfile = async (data: any) => {
    if (!user) throw new Error("No authenticated user");
    const { error, data: updated } = await supabase
      .from("cv_profiles")
      .update(data)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(updated);
    return updated;
  };
return (
    <AuthContext.Provider
      value={{
        user,
        profile: profile ?? null,
        loading,
        signIn,
        signOut,
        setProfile,
        signUp,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};