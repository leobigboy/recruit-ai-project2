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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use ref to prevent multiple initializations
  const initialized = useRef(false);
  const fetchingProfile = useRef(false);

  // Helper function to fetch profile
  const fetchProfile = async (userId: string) => {
    // Prevent concurrent fetches
    if (fetchingProfile.current) {
      return null;
    }

    try {
      fetchingProfile.current = true;
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
    } finally {
      fetchingProfile.current = false;
    }
  };

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initialized.current) {
      console.log("⏭️ Auth already initialized, skipping");
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
          
          // Fetch profile without blocking
          fetchProfile(session.user.id).then(prof => {
            if (mounted) {
              setProfile(prof);
            }
          });
        } else {
          console.log("ℹ️ No session found");
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
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
        console.log("🔄 Auth state change:", event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log("✅ User signed in:", session.user.email);
          setUser(session.user);
          
          // Fetch profile
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("👋 User signed out");
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("🔄 Token refreshed");
          // Don't update user, just log
        }
        
        // Ensure loading is false
        if (mounted && loading) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  const signIn = async (email: string, password: string) => {
    console.log("🔑 Signing in:", email);
    
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        console.error("❌ Sign in error:", result.error);
        return result;
      }
      
      console.log("✅ Sign in successful");
      
      // onAuthStateChange will handle setting user and profile
      return result;
    } catch (err) {
      console.error("❌ Sign in exception:", err);
      throw err;
    }
  };

  const signOut = async () => {
    console.log("👋 Signing out");
    try {
      // Clear local state first
      setUser(null);
      setProfile(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      console.log("✅ Signed out successfully");
    } catch (err) {
      console.error("❌ Sign out error:", err);
      // Even if error, clear local state
      setUser(null);
      setProfile(null);
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
        
        const prof = await fetchProfile(data.user.id);
        setProfile(prof);
      }
      
      return data;
    } catch (err) {
      console.error("❌ Sign up exception:", err);
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