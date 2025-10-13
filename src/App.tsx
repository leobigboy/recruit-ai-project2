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

// Layouts / Pages (giữ nguyên)
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
import AIToolsPage from "./pages/AI/AIToolsPage";
import OffersPage from "./pages/OffersPage";
import CategorySettingsPage from "./components/settings/CategorySettings";
import { RegisterPage } from "./pages/RegisterPage";
import UsersPage from "./pages/User";

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

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children ?? <Outlet />}</>;
};

// ----------------------------------------------------------------------

const router = createBrowserRouter([
  // Root redirect -> login
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // Auth pages
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  // Protected app routes
  {
    path: "/app",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> }, // /app
      { path: "mo-ta-cong-viec", element: <JobsPage /> },
      { path: "ung-vien", element: <CandidatesPage /> },
      { path: "lich-phong-van", element: <InterviewsPage /> },
      { path: "loc-cv", element: <CVFilterPage /> },
      { path: "danh-gia", element: <ReviewsPage /> },
      { path: "quan-ly-email", element: <EmailManagementPage /> },
      { path: "cai-dat", element: <SettingsPage /> },
      { path: "cai-dat/danh-muc", element: <CategorySettingsPage /> },
      { path: "nguoi-dung", element: <UsersPage /> },
      { path: "ai", element: <AIToolsPage /> },     // /app/ai
      { path: "offers", element: <OffersPage /> }, // /app/offers
    ],
  },

  // Catch-all
  { path: "*", element: <Navigate to="/login" replace /> },
]);

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