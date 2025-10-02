// src/components/layout/MainLayout.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
  return (
    <div className="flex relative">
      <Sidebar />
      <main className="flex-1 ml-64 relative z-0">
        <Outlet />
      </main>
    </div>
  );
}