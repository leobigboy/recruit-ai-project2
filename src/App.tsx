// src/App.tsx
import React, { Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AuthProvider } from "@/contexts/AuthContext";

// Import types
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// Layouts / Pages
import { MainLayout } from "@/components/layout/MainLayout";

// Safe namespace imports to avoid "has no default export" / named vs default mismatches
import * as DashboardPageModule from "@/pages/DashboardPage";
import * as JobsPageModule from "@/pages/JobsPage";
import * as CandidatesPageModule from "@/pages/CandidatesPage";
import * as InterviewsPageModule from "@/pages/InterviewsPage";
import * as CVFilterPageModule from "@/pages/CV-filter-page";
import * as LoginPageModule from "@/pages/LoginPage";
import * as ReviewsPageModule from "@/pages/ReviewsPage";
import * as EmailManagementPageModule from "@/pages/EmailManagementPage";
import * as SettingsPageModule from "@/pages/SettingsPage";
import * as ProfileSettingsPageModule from "@/pages/ProfileSettingsPage";
import * as AIToolsPageModule from "@/pages/AI/AIToolsPage";
import * as OffersPageModule from "@/pages/OffersPage";
import * as CategorySettingsModule from "@/components/settings/CategorySettings";
import * as RegisterPageModule from "@/pages/RegisterPage";
import * as UsersPageModule from "@/pages/User";

// Helper to pick component from module: prefer default, fallback to named export with common names
function resolveModuleComponent<M extends Record<string, any>>(mod: M, names: string[]) {
  if (!mod) return null;
  if (mod.default) return mod.default as React.ComponentType<any>;
  for (const n of names) {
    if (mod[n]) return mod[n] as React.ComponentType<any>;
  }
  const keys = Object.keys(mod);
  for (const k of keys) {
    const candidate = mod[k];
    if (typeof candidate === "function" || typeof candidate === "object") return candidate as React.ComponentType<any>;
  }
  return null;
}

const DashboardPage = resolveModuleComponent(DashboardPageModule, ["DashboardPage"]) ?? (() => <div>Missing Dashboard</div>);
const JobsPage = resolveModuleComponent(JobsPageModule, ["JobsPage"]) ?? (() => <div>Missing Jobs</div>);
const CandidatesPage = resolveModuleComponent(CandidatesPageModule, ["CandidatesPage"]) ?? (() => <div>Missing Candidates</div>);
const InterviewsPage = resolveModuleComponent(InterviewsPageModule, ["InterviewsPage"]) ?? (() => <div>Missing Interviews</div>);
const CVFilterPage = resolveModuleComponent(CVFilterPageModule, ["CVFilterPage", "CVFilter"]) ?? (() => <div>Missing CV Filter</div>);
const LoginPage = resolveModuleComponent(LoginPageModule, ["LoginPage"]) ?? (() => <div>Missing Login</div>);
const ReviewsPage = resolveModuleComponent(ReviewsPageModule, ["ReviewsPage"]) ?? (() => <div>Missing Reviews</div>);
const EmailManagementPage = resolveModuleComponent(EmailManagementPageModule, ["EmailManagementPage"]) ?? (() => <div>Missing Email Management</div>);
const SettingsPage = resolveModuleComponent(SettingsPageModule, ["SettingsPage"]) ?? (() => <div>Missing Settings</div>);
const ProfileSettingsPage = resolveModuleComponent(ProfileSettingsPageModule, ["ProfileSettingsPage"]) ?? (() => <div>Missing Profile Settings</div>);
const AIToolsPage = resolveModuleComponent(AIToolsPageModule, ["AIToolsPage"]) ?? (() => <div>Missing AI Tools</div>);
const OffersPage = resolveModuleComponent(OffersPageModule, ["OffersPage"]) ?? (() => <div>Missing Offers</div>);
const CategorySettingsPage = resolveModuleComponent(CategorySettingsModule, ["CategorySettingsPage","CategorySettings"]) ?? (() => <div>Missing Category Settings</div>);
const RegisterPage = resolveModuleComponent(RegisterPageModule, ["RegisterPage"]) ?? (() => <div>Missing Register</div>);
const UsersPage = resolveModuleComponent(UsersPageModule, ["UsersPage","User"]) ?? (() => <div>Missing Users</div>);

// FIXED: RequireAuth component with better error handling and timeout
const RequireAuth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkSession = async () => {
      try {
        // Set timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && checking) {
            console.warn('Session check timeout - redirecting to login');
            setIsAuthenticated(false);
            setChecking(false);
            setError('Session check timeout');
          }
        }, 5000); // 5 second timeout

        const { data, error: sessionError } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session check error:', sessionError);
          setError(sessionError.message);
          setIsAuthenticated(false);
          setChecking(false);
          return;
        }

        const hasSession = !!(data?.session);
        console.log('Session check result:', hasSession);
        setIsAuthenticated(hasSession);
        setChecking(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Session check exception:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsAuthenticated(false);
          setChecking(false);
        }
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        console.log('Auth state changed:', _event, !!session);
        setIsAuthenticated(!!session);
        setChecking(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Show loading state
  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p>Đang kiểm tra đăng nhập...</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children ?? <Outlet />}</>;
};

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "mo-ta-cong-viec", element: <JobsPage /> },
      { path: "ung-vien", element: <CandidatesPage /> },
      { path: "phong-van", element: <InterviewsPage /> },
      { path: "loc-cv", element: <CVFilterPage /> },
      { path: "danh-gia", element: <ReviewsPage /> },
      { path: "quan-ly-email", element: <EmailManagementPage /> },
      { path: "cai-dat", element: <SettingsPage /> },
      { path: "cai-dat/danh-muc", element: <CategorySettingsPage /> },
      { path: "cai-dat/thong-tin-ca-nhan", element: <ProfileSettingsPage /> },
      { path: "nguoi-dung", element: <UsersPage /> },
      { path: "ai", element: <AIToolsPage /> },
      { path: "offers", element: <OffersPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}