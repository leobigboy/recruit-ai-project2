"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

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

  // Helper function to fetch profile
  const fetchProfile = async (userId: string) => {
    try {
      console.log("📋 Fetching profile for user:", userId);
      const { data: prof, error } = await supabase
        .from("cv_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("❌ Profile fetch error:", error);
        return null;
      }
      
      console.log("✅ Profile fetched:", prof ? "Found" : "Not found");
      return prof || null;
    } catch (err) {
      console.error("❌ Profile fetch exception:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Initialize auth state
    const initAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        // Set timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn("⚠️ Auth initialization timeout - setting loading to false");
            setLoading(false);
          }
        }, 8000); // 8 second timeout (increased for slow connections)

        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clear timeout if successful
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("❌ Session error:", error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        
        if (!mounted) return;

        if (session?.user) {
          console.log("✅ Session found:", session.user.email);
          setUser(session.user);
          setLoading(false); // Set loading false immediately when user found
          
          // Fetch profile in background (non-blocking)
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
          }
        } else {
          console.log("ℹ️ No session found");
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
        clearTimeout(timeoutId);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth state change:", event, session?.user?.email || "no user");

        if (!mounted) return;

        // Always ensure loading is false after auth state change
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log("✅ User signed in");
            setUser(session.user);
            setLoading(false); // Set loading false immediately
            
            // Fetch profile in background
            const prof = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(prof);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("👋 User signed out");
            setUser(null);
            setProfile(null);
            setLoading(false);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log("🔄 Token refreshed");
            setUser(session.user);
            setLoading(false);
          } else if (session?.user) {
            setUser(session.user);
            setLoading(false);
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        } catch (err) {
          console.error("❌ Auth state change error:", err);
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("🔑 Signing in:", email);
    
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        console.error("❌ Sign in error:", result.error);
        return result;
      }
      
      console.log("✅ Sign in successful");
      
      // Fetch profile immediately
      if (result.data?.user) {
        setUser(result.data.user);
        const prof = await fetchProfile(result.data.user.id);
        setProfile(prof);
        setLoading(false); // Ensure loading is false
      }
      
      return result;
    } catch (err) {
      console.error("❌ Sign in exception:", err);
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    console.log("👋 Signing out");
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
    } catch (err) {
      console.error("❌ Sign out error:", err);
      // Even if sign out fails, clear local state
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("📝 Signing up:", email);
    
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        console.error("❌ Sign up error:", error);
        throw error;
      }
      
      if (data?.user) {
        console.log("✅ Sign up successful");
        setUser(data.user);
        // Profile might not exist yet for new users
        const prof = await fetchProfile(data.user.id);
        setProfile(prof);
        setLoading(false);
      }
      
      return data;
    } catch (err) {
      console.error("❌ Sign up exception:", err);
      setLoading(false);
      throw err;
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) throw new Error("No authenticated user");
    
    console.log("💾 Updating profile");
    
    try {
      const { error, data: updated } = await supabase
        .from("cv_profiles")
        .update(data)
        .eq("id", user.id)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Profile update error:", error);
        throw error;
      }
      
      console.log("✅ Profile updated");
      setProfile(updated);
      return updated;
    } catch (err) {
      console.error("❌ Profile update exception:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
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