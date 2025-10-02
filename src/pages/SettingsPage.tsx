// src/pages/SettingsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Building2, Bot, Mail, Bell, FolderTree, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompanySettings } from "@/components/settings/CompanySettings"
import { AiSettings } from "@/components/settings/AiSettings"
import { supabase } from "@/lib/supabaseClient"

const tabs = [
  { id: "company", label: "Công ty", icon: Building2 },
  { id: "ai", label: "AI", icon: Bot },
  { id: "email", label: "Email", icon: Mail },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "categories", label: "Danh mục", icon: FolderTree },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "permissions", label: "Phân quyền", icon: Shield },
]

interface CompanyProfile {
    id?: string;
    company_name?: string;
    website?: string;
    company_description?: string;
    company_address?: string;
    contact_email?: string;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  
  // --- BỔ SUNG PHẦN CÒN THIẾU ---
  const [profile, setProfile] = useState<CompanyProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { data, error } = await supabase.from('cv_company_profile').select('*').single();
      if (data) setProfile(data);
      if (error && error.code !== 'PGRST116') console.error("Error fetching profile:", error);
      setLoading(false);
    }
    getProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfile(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('cv_company_profile').upsert({ ...profile, id: profile.id || undefined });
    setLoading(false);
    if (error) alert("Lỗi! Không thể lưu thay đổi.");
    else alert("Đã lưu thay đổi thành công!");
  };
  // --- KẾT THÚC PHẦN BỔ SUNG ---
  
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">Quản lý cấu hình và tùy chỉnh hệ thống</p>
        </div>

        <div className="flex gap-1 sm:gap-2 overflow-x-auto border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div>
          {activeTab === "company" && <CompanySettings profile={profile} handleInputChange={handleInputChange} />}
          {activeTab === "ai" && <AiSettings />}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button size="lg" onClick={handleSave} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  )
}