import React, { useEffect, useState, Suspense } from "react";
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
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import CVFilterPage from "./pages/CV-filter-page";
import { LoginPage } from "./pages/LoginPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { EmailManagementPage } from "./pages/EmailManagementPage";
import SettingsPage from "./pages/SettingsPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import AIToolsPage from "./pages/AI/AIToolsPage";
import OffersPage from "./pages/OffersPage";
import CategorySettingsPage from "./components/settings/CategorySettings";
import { RegisterPage } from "./pages/RegisterPage";
import UsersPage from "./pages/User";

// ----------------------------------------------------------------------
// RequireAuth Component - Protect routes with authentication
// ----------------------------------------------------------------------

const RequireAuth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch (err) {
        console.warn("Lỗi kiểm tra session:", err);
        setIsAuthenticated(false);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated - render children or outlet
  return <>{children ?? <Outlet />}</>;
};

// ----------------------------------------------------------------------
// Router Configuration
// ----------------------------------------------------------------------

const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  // Protected routes
  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      // Dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      
      // Main features
      { path: "mo-ta-cong-viec", element: <JobsPage /> },
      { path: "ung-vien", element: <CandidatesPage /> },
      { path: "phong-van", element: <InterviewsPage /> },
      { path: "loc-cv", element: <CVFilterPage /> },
      { path: "danh-gia", element: <ReviewsPage /> },
      { path: "quan-ly-email", element: <EmailManagementPage /> },
      
      // Settings
      { path: "cai-dat", element: <SettingsPage /> },
      { path: "cai-dat/danh-muc", element: <CategorySettingsPage /> },
      { path: "cai-dat/thong-tin-ca-nhan", element: <ProfileSettingsPage /> },
      
      // Additional features
      { path: "nguoi-dung", element: <UsersPage /> },
      { path: "ai", element: <AIToolsPage /> },
      { path: "offers", element: <OffersPage /> },
    ],
  },

  // Catch-all - redirect to login
  { path: "*", element: <Navigate to="/login" replace /> },
]);

// ----------------------------------------------------------------------
// App Component
// ----------------------------------------------------------------------

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Đang tải...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}