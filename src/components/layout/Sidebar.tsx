// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Star,
  Mail,
  Settings,
  Filter,
  Bot,
  FileText,
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

/** Nav item using NavLink (absolute paths under /app) */
const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
  const baseClass =
    "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors";
  const activeClass = "bg-blue-600 text-white";
  const inactiveClass = "text-gray-700 hover:bg-blue-50";

  return (
    <NavLink
      to={to}
      end={to === "/app"}
      className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
};

export function Sidebar() {
  const navItems: Array<NavItemProps> = [
    { to: "/app", label: "Bảng điều khiển", icon: LayoutDashboard },
    { to: "/app/mo-ta-cong-viec", label: "Mô tả công việc", icon: Briefcase },
    { to: "/app/ung-vien", label: "Ứng viên", icon: Users },
    { to: "/app/lich-phong-van", label: "Lịch phỏng vấn", icon: Calendar },
    { to: "/app/danh-gia", label: "Đánh giá phỏng vấn", icon: Star },
    { to: "/app/loc-cv", label: "Lọc CV", icon: Filter },
    { to: "/app/quan-ly-email", label: "Quản lý email", icon: Mail },
    { to: "/app/cai-dat", label: "Cài đặt", icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-white shadow-md flex flex-col p-4 fixed">
      <div className="px-4 py-2 mb-4">
        <h1 className="text-xl font-bold text-blue-600">Recruit AI</h1>
        <p className="text-xs text-gray-500">Hệ thống quản lý tuyển dụng</p>
      </div>

      <nav className="flex-1 space-y-2 overflow-auto pr-2">
        {navItems.map((item) => (
          <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}

        {/* Single AI parent link (opens AIToolsPage) */}
        <NavLink
          to="/app/ai"
          className={({ isActive }) =>
            `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"
            }`
          }
        >
          <Bot className="w-5 h-5 mr-3" />
          <span className="truncate">AI thông minh</span>
        </NavLink>

        {/* Extra tools */}
        <NavLink
          to="/app/offers"
          className={({ isActive }) =>
            `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"
            }`
          }
        >
          <FileText className="w-5 h-5 mr-3" />
          <span className="truncate">Offer Management</span>
        </NavLink>
      </nav>

      <div className="mt-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            A
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Admin</div>
            <div className="text-xs text-gray-500">admin@company.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
