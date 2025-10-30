"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  checkSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const isNavigating = useRef(false);

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

  // Helper to navigate programmatically (only once)
  const navigateToLogin = () => {
    if (isNavigating.current) return;
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      isNavigating.current = true;
      window.location.href = '/login';
    }
  };

  // Check session validity
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // Sign in function
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
      }
      
      return result;
    } catch (err) {
      console.error("❌ Sign in exception:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    console.log("👋 Signing out");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ Sign out error:", err);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
      navigateToLogin();
    }
  };

  // Sign up function
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
        const prof = await fetchProfile(data.user.id);
        setProfile(prof);
      }
      
      return data;
    } catch (err) {
      console.error("❌ Sign up exception:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
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

  useEffect(() => {
    if (initialized) return; // Prevent re-initialization
    
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Initialize auth state
    const initAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        // Set timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn("⚠️ Auth initialization timeout");
            setLoading(false);
            setInitialized(true);
          }
        }, 8000);

        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (!mounted) return;

        if (session?.user) {
          console.log("✅ Session found:", session.user.email);
          setUser(session.user);
          
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
            setLoading(false);
            setInitialized(true);
          }
        } else {
          console.log("ℹ️ No session found");
          if (mounted) {
            setLoading(false);
            setInitialized(true);
            // Only redirect if not already on login page
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              navigateToLogin();
            }
          }
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
        clearTimeout(timeoutId);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth state change:", event);

        if (!mounted) return;

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            const prof = await fetchProfile(session.user.id);
            if (mounted) setProfile(prof);
            setLoading(false);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            setLoading(false);
            navigateToLogin();
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user);
            setLoading(false);
          }
        } catch (err) {
          console.error("❌ Auth state change error:", err);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [initialized]); // Only run once when initialized is false

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
        checkSession,
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