import React, { useEffect, useState } from "react"
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom"
// Kéo AuthContext từ branch Hậu2 (nếu cần) hoặc chỉ sử dụng Supabase
import { supabase } from "@/lib/supabaseClient" 
// import { AuthProvider } from "@/contexts/AuthContext"; // Dùng nếu muốn có Context Provider

// Layouts / Pages - Hợp nhất tất cả các imports
import { MainLayout } from "./components/layout/MainLayout"
import { DashboardPage } from "./pages/DashboardPage"
import { JobsPage } from "./pages/JobsPage" // mo-ta-cong-viec
import { CandidatesPage } from "./pages/CandidatesPage" // ung-vien
import { InterviewsPage } from "./pages/InterviewsPage" // lich-phong-van
import { ReviewsPage } from "./pages/ReviewsPage" // danh-gia
import { EmailManagementPage } from "./pages/EmailManagementPage" // quan-ly-email
import CVFilterPage from "./pages/CV-filter-page" // loc-cv
import LoginPage from "./pages/login" // Public route
import SignupPage from "./pages/signup" // Public route
import ForgotPasswordPage from "./pages/forgot-password" // Public route
import SettingsPage from "./pages/SettingsPage"
import CategorySettingsPage from "./components/settings/CategorySettings"
import UsersPage from "./pages/User" // nguoi-dung
import AIToolsPage from "./pages/AI/AIToolsPage" // ai
import OffersPage from "./pages/OffersPage" // offers
import Authorization from "./pages/Authorization" // Component Auth ngoài cùng

// ----------------------------------------------------------------------

/**
 * Component kiểm tra xác thực (RequireAuth)
 * Giữ lại logic Supabase từ HEAD
 */
const RequireAuth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      // Giả định supabase đã được khởi tạo
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

/**
 * Cấu hình Router - Hợp nhất tất cả các routes từ cả hai nhánh
 */
const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },

  // Protected Routes (App Routes)
  {
    path: "/app",
    element: (
      // Sử dụng RequireAuth để bảo vệ các tuyến đường
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> }, // Bảng điều khiển
      { path: "mo-ta-cong-viec", element: <JobsPage /> }, // Từ Hậu2
      { path: "ung-vien", element: <CandidatesPage /> }, // Từ Hậu2
      { path: "lich-phong-van", element: <InterviewsPage /> }, // Từ Hậu2
      { path: "loc-cv", element: <CVFilterPage /> }, // Từ HEAD
      { path: "danh-gia", element: <ReviewsPage /> }, // Từ Hậu2
      { path: "quan-ly-email", element: <EmailManagementPage /> }, // Từ HEAD (dùng tên Management)
      { path: "cai-dat", element: <SettingsPage /> },
      { path: "cai-dat/danh-muc", element: <CategorySettingsPage /> }, // Từ HEAD
      { path: "nguoi-dung", element: <UsersPage /> }, // Từ HEAD
      { path: "ai", element: <AIToolsPage /> }, // Từ HEAD
      { path: "offers", element: <OffersPage /> }, // Từ HEAD
    ],
  },

  // Catch all - redirect
  { path: "*", element: <Navigate to="/app" replace /> },
])

// ----------------------------------------------------------------------

/**
 * Component App cuối cùng
 * Giữ lại component Authorization bao ngoài từ HEAD
 */
export default function App() {
  return (
    // Component Authorization ngoài cùng để quản lý các trạng thái chung
    <Authorization> 
      <RouterProvider router={router} />
    </Authorization>
  )
}