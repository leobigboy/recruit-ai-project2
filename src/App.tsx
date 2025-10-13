// src/App.tsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { EmailPage } from "./pages/EmailPage";

const router = createBrowserRouter([
  // Public Routes (Authentication)
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  // Protected Routes (Main Application)
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
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
        element: <CandidatesPage />,
      },
      {
        path: "lich-phong-van",
        element: <InterviewsPage />,
      },
      {
        path: "danh-gia",
        element: <ReviewsPage />,
      },
      {
        path: "quan-ly-email",
        element: <EmailPage />,
      },
      {
        path: "cai-dat",
        element: <SettingsPage />,
      },
    ],
  },
  // Catch all - redirect to home
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;