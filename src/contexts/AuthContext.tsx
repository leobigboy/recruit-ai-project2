"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Prevent double initialization
  const initialized = useRef(false);

  // Helper function to fetch profile (chỉ profile user, không phải system data)
  const fetchProfile = async (userId: string) => {
    try {
      console.log("📋 Fetching user profile for:", userId);
      
      const { data: prof, error } = await supabase
        .from("cv_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("❌ Profile fetch error:", error);
        return null;
      }
      
      console.log("✅ User profile:", prof ? "Found" : "Not found");
      return prof || null;
    } catch (err) {
      console.error("❌ Profile fetch exception:", err);
      return null;
    }
  };

  useEffect(() => {
    // Run only once
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Session error:", error);
        }
        
        if (!mounted) return;

        if (session?.user) {
          console.log("✅ Session found:", session.user.email);
          setUser(session.user);
          
          // Fetch user's profile (personal info only)
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
          }
        } else {
          console.log("ℹ️ No session found");
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
      } finally {
        if (mounted) {
          console.log("✅ Auth initialization complete");
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth event:", event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log("✅ User signed in");
          setUser(session.user);
          
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("👋 User signed out");
          setUser(null);
          setProfile(null);
        }
        // Ignore other events like TOKEN_REFRESHED
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("🔑 Signing in:", email);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      console.error("❌ Sign in error:", result.error);
    } else {
      console.log("✅ Sign in successful");
    }
    return result;
  };

  const signOut = async () => {
    console.log("👋 Signing out");
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  const signUp = async (email: string, password: string) => {
    console.log("📝 Signing up:", email);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    if (data?.user) {
      setUser(data.user);
      const prof = await fetchProfile(data.user.id);
      setProfile(prof);
    }
    return data;
  };

  const updateProfile = async (data: any) => {
    if (!user) throw new Error("No authenticated user");
    
    console.log("💾 Updating profile");
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, setProfile, signUp, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};