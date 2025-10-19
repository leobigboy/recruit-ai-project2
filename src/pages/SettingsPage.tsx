// src/pages/SettingsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Building2, Bot, Mail, Bell, FolderTree, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompanySettings } from "@/components/settings/CompanySettings"
import AiSettings from "@/components/settings/AiSettings"
import { supabase } from "@/lib/supabaseClient"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { EmailSettings } from "@/components/settings/EmailSettings"
import { useTranslation } from 'react-i18next'

interface CompanyProfile {
  id?: string;
  company_name?: string;
  website?: string;
  company_description?: string;
  company_address?: string;
  contact_email?: string;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("company");
  const [profile, setProfile] = useState<CompanyProfile>({});
  const [loading, setLoading] = useState(true);

  // Định nghĩa tabs với translation
  const tabs = [
    { id: "company", label: t('settings.tabs.company'), icon: Building2 },
    { id: "ai", label: t('settings.tabs.ai'), icon: Bot },
    { id: "email", label: t('settings.tabs.email'), icon: Mail },
    { id: "notifications", label: t('settings.tabs.notifications'), icon: Bell },
    { id: "categories", label: t('settings.tabs.categories'), icon: FolderTree },
    { id: "users", label: t('settings.tabs.users'), icon: Users },
    { id: "permissions", label: t('settings.tabs.permissions'), icon: Shield },
  ];

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
    // Chỉ lưu cho tab Company, các tab khác có nút lưu riêng
    if (activeTab !== "company") {
      return;
    }

    // Validation
    if (!profile.company_name || profile.company_name.trim() === '') {
      alert(t('settings.messages.nameRequired'));
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('cv_company_profile')
        .upsert({ 
          ...profile, 
          id: profile.id || undefined,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Save error:", error);
        alert(t('settings.messages.saveError') + ' ' + error.message);
      } else {
        alert(t('settings.messages.saveSuccess'));
        
        // Reload lại profile để đảm bảo data mới nhất
        const { data: updatedData } = await supabase
          .from('cv_company_profile')
          .select('*')
          .single();
        
        if (updatedData) {
          setProfile(updatedData);
        }
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      alert(t('settings.messages.unexpectedError') + ' ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
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
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "email" && <EmailSettings />}
        </div>
        
        {/* Chỉ hiển thị nút Save cho tab Company */}
        {activeTab === "company" && (
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              {t('settings.buttons.cancel')}
            </Button>
            <Button 
              size="lg" 
              onClick={handleSave} 
              disabled={loading || !profile.company_name}
            >
              {loading ? t('settings.buttons.saving') : t('settings.buttons.save')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}