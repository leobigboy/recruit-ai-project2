// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Star,
  Mail,
  Settings,
  Building2,
} from "lucide-react";
import { UserMenu } from "./UserMenu";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from 'react-i18next';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon: Icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-white text-primary shadow-md font-semibold"
        : "text-white/90 hover:bg-white/15 hover:text-white hover:translate-x-1"
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </Link>
);

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const [companyName, setCompanyName] = useState('Recruit AI');
  const [loading, setLoading] = useState(true);

  const navItems = [
    { to: "/", label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: "/mo-ta-cong-viec", label: t('nav.jobs'), icon: Briefcase },
    { to: "/ung-vien", label: t('nav.candidates'), icon: Users },
    { to: "/lich-phong-van", label: t('nav.interviews'), icon: Calendar },
    { to: "/danh-gia", label: t('nav.reviews'), icon: Star },
    { to: "/quan-ly-email", label: t('nav.email'), icon: Mail },
    { to: "/cai-dat", label: t('nav.settings'), icon: Settings },
  ];

  useEffect(() => {
    // Load company name từ database
    async function loadCompanyName() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_company_profile')
        .select('company_name')
        .single();
      
      if (data && data.company_name) {
        setCompanyName(data.company_name);
      }
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading company name:", error);
      }
      
      setLoading(false);
    }
    
    loadCompanyName();
    
    // Subscribe để cập nhật real-time khi company name thay đổi
    const channel = supabase
      .channel('company_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cv_company_profile'
        },
        (payload) => {
          if (payload.new && (payload.new as any).company_name) {
            setCompanyName((payload.new as any).company_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside 
      className="w-64 h-screen bg-gradient-to-b from-primary to-primary/90 shadow-xl flex flex-col p-4 fixed"
      style={{
        background: `linear-gradient(180deg, 
          var(--sidebar-bg, hsl(var(--primary))) 0%, 
          var(--sidebar-bg, hsl(var(--primary))) 100%)`
      }}
    >
      {/* Company Header */}
      <div className="px-4 py-3 mb-6 border-b border-white/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 
            className="text-xl font-bold text-primary-foreground truncate drop-shadow-sm" 
            title={companyName}
          >
            {loading ? 'Loading...' : companyName}
          </h1>
        </div>
        <p className="text-xs text-primary-foreground/80 ml-9">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin">
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
      <div className="mt-auto pt-4 border-t border-white/20">
        <UserMenu />
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </aside>
  );
}