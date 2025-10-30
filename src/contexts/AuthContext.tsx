"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type SignUpOptions = {
  data?: {
    full_name?: string;
  }
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setProfile: (p: any) => void;
  signUp: (email: string, password: string, options?: SignUpOptions) => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Prevent double initialization
  const initialized = useRef(false);
  
  // Keep track of current user to prevent duplicate updates on tab focus
  const userRef = useRef<User | null>(null);

  // Update ref whenever user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Helper function to fetch profile by auth_user_id
  const fetchProfile = async (authUserId: string) => {
    try {
      console.log("📋 Fetching user profile for auth_user_id:", authUserId);
      
      const { data: prof, error } = await supabase
        .from("cv_profiles")
        .select("*")
        .eq("auth_user_id", authUserId)
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

  // Helper function to create profile
  const createProfile = async (authUserId: string, email: string, fullName?: string) => {
    try {
      console.log("📝 Creating new profile for:", email);
      
      const { data: newProfile, error } = await supabase
        .from("cv_profiles")
        .insert([
          {
            auth_user_id: authUserId,
            email: email,
            full_name: fullName || '',
            role: 'candidate',
            status: 'active'
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error("❌ Profile creation error:", error);
        throw error;
      }
      
      console.log("✅ Profile created successfully");
      return newProfile;
    } catch (err) {
      console.error("❌ Profile creation exception:", err);
      throw err;
    }
  };

  useEffect(() => {
    // Run only once - prevent double initialization
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
          userRef.current = session.user;
          
          // Fetch user's profile
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
          }
        } else {
          console.log("ℹ️ No session found");
          setUser(null);
          setProfile(null);
          userRef.current = null;
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
          // CRITICAL FIX: Prevent duplicate updates when tab becomes active
          if (userRef.current && userRef.current.id === session.user.id) {
            console.log("⏭️ User already signed in, skipping duplicate SIGNED_IN event");
            return;
          }
          
          console.log("✅ User signed in (new or different user)");
          setUser(session.user);
          userRef.current = session.user;
          
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("👋 User signed out");
          setUser(null);
          setProfile(null);
          userRef.current = null;
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("🔄 Token refreshed (no state update needed)");
          // Token refreshed, but don't update state - prevents unnecessary re-renders
        } else if (event === 'USER_UPDATED') {
          console.log("👤 User updated");
          // User metadata updated, update user state but don't refetch profile
          if (session?.user) {
            setUser(session.user);
            userRef.current = session.user;
          }
        }
      }
    );

    return () => {
      console.log("🧹 Cleaning up AuthProvider");
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency - run once only

  const signIn = async (email: string, password: string) => {
    console.log("🔑 Signing in:", email);
    
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        console.error("❌ Sign in error:", result.error);
        return { data: null, error: result.error };
      }
      
      console.log("✅ Sign in successful");
      // onAuthStateChange will handle setting user and profile
      return { data: result.data, error: null };
    } catch (err) {
      console.error("❌ Sign in exception:", err);
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error("Unknown error") 
      };
    }
  };

  const signOut = async () => {
    console.log("👋 Signing out");
    
    try {
      // Clear state first
      setUser(null);
      setProfile(null);
      userRef.current = null;
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Sign out error:", error);
      } else {
        console.log("✅ Signed out successfully");
      }
    } catch (err) {
      console.error("❌ Sign out exception:", err);
      // Still clear state even if error
      setUser(null);
      setProfile(null);
      userRef.current = null;
    }
  };

  const signUp = async (email: string, password: string, options?: SignUpOptions) => {
    try {
      console.log("📝 Signing up:", email);
      
      // Step 1: Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options?.data?.full_name || ''
          }
        }
      });

      if (authError) {
        console.error("❌ Auth sign up error:", authError);
        return { data: null, error: authError };
      }

      if (!authData.user) {
        console.error("❌ No user returned from sign up");
        return { data: null, error: new Error("No user returned") };
      }

      console.log("✅ Auth user created:", authData.user.id);

      // Step 2: Check if profile already exists (might be created by database trigger)
      let existingProfile = await fetchProfile(authData.user.id);
      
      if (!existingProfile) {
        // Step 3: Create profile manually if not exists
        try {
          const newProfile = await createProfile(
            authData.user.id,
            email,
            options?.data?.full_name
          );
          existingProfile = newProfile;
        } catch (profileError) {
          console.error("❌ Profile creation failed:", profileError);
          // Continue anyway - profile might be created by trigger with delay
        }
      }

      // Step 4: Update state
      setUser(authData.user);
      setProfile(existingProfile);
      userRef.current = authData.user;

      console.log("✅ Sign up complete");
      return { data: authData, error: null };
      
    } catch (err) {
      console.error("❌ Sign up exception:", err);
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error("Unknown error") 
      };
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) {
      console.error("❌ No authenticated user");
      throw new Error("No authenticated user");
    }
    
    console.log("💾 Updating profile for user:", user.id);
    
    try {
      const { error, data: updated } = await supabase
        .from("cv_profiles")
        .update(data)
        .eq("auth_user_id", user.id)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Profile update error:", error);
        throw error;
      }
      
      console.log("✅ Profile updated successfully");
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
        updateProfile 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};