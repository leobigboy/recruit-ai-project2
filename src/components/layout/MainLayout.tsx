// src/components/layout/MainLayout.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64"> {/* ml-64 để tạo khoảng trống cho Sidebar */}
        <Outlet /> {/* Đây là nơi nội dung của các trang sẽ hiển thị */}
      </main>
    </div>
  );
}