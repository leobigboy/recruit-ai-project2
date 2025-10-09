// src/App.tsx
import React from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";

// Layouts / Pages
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import CVFilterPage from "./pages/CV-filter-page";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import ForgotPasswordPage from "./pages/forgot-password";

// Additional pages
import { ReviewsPage } from "./pages/ReviewsPage";
import { EmailManagementPage } from "./pages/EmailManagementPage";
import { SettingsPage } from "./pages/SettingsPage";

// New pages
import AIToolsPage from "./pages/AI/AIToolsPage";
import OffersPage from "./pages/OffersPage";
import { CategoryPage } from "./components/settings/CategorySettings";

// RequireAuth wrapper
const RequireAuth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isAuthenticated =
    typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children ?? <Outlet />}</>;
};

const router = createBrowserRouter([
  // Root redirect -> login
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // Auth pages
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },

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
      { path: "cai-dat/danh-muc", element: <CategoryPage /> },  // Category route under settings

      // New pages
      { path: "ai", element: <AIToolsPage /> },       // /app/ai
      { path: "offers", element: <OffersPage /> },   // /app/offers
    ],
  },

  // Catch-all
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}