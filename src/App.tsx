// src/App.tsx
import React, { useEffect, useState } from "react"
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"

// Layouts / Pages
import { MainLayout } from "./components/layout/MainLayout"
import { DashboardPage } from "./pages/DashboardPage"
import { JobsPage } from "./pages/JobsPage"
import { CandidatesPage } from "./pages/CandidatesPage"
import { InterviewsPage } from "./pages/InterviewsPage"
import CVFilterPage from "./pages/CV-filter-page"
import LoginPage from "./pages/login"
import SignupPage from "./pages/signup"
import ForgotPasswordPage from "./pages/forgot-password"

// Additional pages
import { ReviewsPage } from "./pages/ReviewsPage"
import { EmailManagementPage } from "./pages/EmailManagementPage"
import SettingsPage from "./pages/SettingsPage" // ✅ sửa chỗ này
import CategorySettingsPage from "./components/settings/CategorySettings"
import UsersPage from "./pages/User"
import AIToolsPage from "./pages/AI/AIToolsPage"
import OffersPage from "./pages/OffersPage"

// ✅ Authorization component
import Authorization from "./pages/Authorization"

// ----------------------------------------------------------------------

const RequireAuth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
    }
    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Đang kiểm tra đăng nhập...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children ?? <Outlet />}</>
}

// ----------------------------------------------------------------------

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },

  {
    path: "/app",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "mo-ta-cong-viec", element: <JobsPage /> },
      { path: "ung-vien", element: <CandidatesPage /> },
      { path: "lich-phong-van", element: <InterviewsPage /> },
      { path: "loc-cv", element: <CVFilterPage /> },
      { path: "danh-gia", element: <ReviewsPage /> },
      { path: "quan-ly-email", element: <EmailManagementPage /> },
      { path: "cai-dat", element: <SettingsPage /> },
      { path: "cai-dat/danh-muc", element: <CategorySettingsPage /> },
      { path: "nguoi-dung", element: <UsersPage /> },
      { path: "ai", element: <AIToolsPage /> },
      { path: "offers", element: <OffersPage /> },
    ],
  },

  { path: "*", element: <Navigate to="/login" replace /> },
])

// ----------------------------------------------------------------------

export default function App() {
  return (
    <Authorization>
      <RouterProvider router={router} />
    </Authorization>
  )
}
