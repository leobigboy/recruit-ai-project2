"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";  // Fix: Sử dụng react-router-dom thay vì next/router

type AuthContextType = {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  setProfile: (p: any) => void;
  signUp: (email: string, password: string) => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
  checkSession: () => Promise<boolean>; // Thêm hàm check
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Fix: Sử dụng useNavigate thay vì useRouter

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

  // Thêm hàm check session và force logout nếu invalid
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        await signOut();
        return false;
      }
      return true;
    } catch {
      await signOut();
      return false;
    }
  };

  // Hàm signIn đầy đủ (fix lỗi 'result')
  const signIn = async (email: string, password: string) => {
    console.log("🔑 Signing in:", email);
    
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });  // Thêm const result
      
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
    } finally {
      setLoading(false);  // Thêm finally để luôn false
    }
  };

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
      navigate('/login'); // Fix: Sử dụng navigate thay vì router.push
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
    } finally {
      setLoading(false);
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
    } finally {
      setLoading(false);
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
            console.warn("⚠️ Auth initialization timeout - forcing sign out");
            signOut();
          }
        }, 8000);

        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("❌ Session error:", error);
          if (mounted) {
            await signOut(); // Force logout on error
          }
          return;
        }
        
        if (!mounted) return;

        if (session?.user) {
          console.log("✅ Session found:", session.user.email);
          setUser(session.user);
          setLoading(false);
          
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
          }
        } else {
          console.log("ℹ️ No session found - redirecting to login");
          if (mounted) {
            navigate('/login'); // Fix: Sử dụng navigate
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
        clearTimeout(timeoutId);
        if (mounted) {
          signOut();
        }
      }
    };

    initAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth state change:", event, session?.user?.email || "no user");

        if (!mounted) return;

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            setLoading(false);
            const prof = await fetchProfile(session.user.id);
            if (mounted) setProfile(prof);
          } else if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            navigate('/login'); // Fix: Sử dụng navigate
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user);
            setLoading(false);
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
            navigate('/login');
          }
        } catch (err) {
          console.error("❌ Auth state change error:", err);
          if (mounted) {
            signOut();
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signOut,
        setProfile,
        signUp,  // Fix: Sử dụng signUp
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