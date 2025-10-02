// src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { SettingsPage } from "./pages/SettingsPage";
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
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
      {
        path: "cai-dat",
        element: <SettingsPage />
      }
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;