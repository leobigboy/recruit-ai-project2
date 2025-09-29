// src/components/layout/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Star,
  Mail,
  Settings,
} from "lucide-react";

// Định nghĩa kiểu cho một mục menu
interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon: Icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-blue-50"
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </Link>
);

export function Sidebar() {
  const location = useLocation();
  const navItems = [
    { to: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
    { to: "/mo-ta-cong-viec", label: "Mô tả công việc", icon: Briefcase },
    { to: "/ung-vien", label: "Ứng viên", icon: Users },
    { to: "/lich-phong-van", label: "Lịch phỏng vấn", icon: Calendar },
    { to: "/danh-gia", label: "Đánh giá phỏng vấn", icon: Star },
    { to: "/quan-ly-email", label: "Quản lý email", icon: Mail },
    { to: "/cai-dat", label: "Cài đặt", icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-white shadow-md flex flex-col p-4 fixed z-10">
      <div className="px-4 py-2 mb-4">
        <h1 className="text-xl font-bold text-blue-600">Recruit AI</h1>
        <p className="text-xs text-gray-500">Hệ thống quản lý tuyển dụng</p>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
          />
        ))}
      </nav>
      {/* User Profile Section */}
      <div className="mt-auto">
        {/* Sẽ thêm thông tin người dùng ở đây */}
      </div>
    </aside>
  );
}