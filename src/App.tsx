// src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";

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
      // Thêm các trang khác vào đây trong tương lai
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;