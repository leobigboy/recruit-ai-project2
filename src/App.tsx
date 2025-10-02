// src/App.tsx
import React from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";

// Layouts / Pages
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import { ReviewsPage } from "./pages/ReviewsPage";//

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
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "mo-ta-cong-viec",
        element: <JobsPage />,
      },
      { 
        path: "ung-vien", 
        element: <CandidatesPage />
      },
      { 
        path: "lich-phong-van", 
        element: <InterviewsPage /> 
      },
      { 
        path: "danh-gia",
        element: <ReviewsPage />
      },
      // Thêm các trang khác vào đây trong tương lai
    ],
  },

  // Catch-all
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
