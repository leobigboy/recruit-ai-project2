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
import CategorySettingsPage from "@/components/settings/CategorySettings"
import UsersPage from "@/pages/User"
import Authorization from "@/pages/Authorization" // <-- render phân quyền ở tab Permissions
import { toast } from "sonner"

const tabs = [
  { id: "company", label: "Công ty", icon: Building2 },
  { id: "ai", label: "AI", icon: Bot },
  { id: "email", label: "Email", icon: Mail },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "category", label: "Danh mục", icon: FolderTree },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "permissions", label: "Phân quyền", icon: Shield },
]

interface CompanyProfile {
  id?: string
  company_name?: string
  website?: string
  company_description?: string
  company_address?: string
  contact_email?: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [profile, setProfile] = useState<CompanyProfile>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("cv_company_profile").select("*").single()
        if (error && error.code !== "PGRST116") throw error
        if (data) setProfile(data)
      } catch (err: any) {
        console.error(err)
        toast.error("Lỗi tải thông tin công ty: " + (err?.message ?? ""))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setProfile((prev) => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (activeTab !== "company") return

    try {
      setLoading(true)
      const { error } = await supabase.from("cv_company_profile").upsert({ ...profile, id: profile.id || undefined })
      if (error) throw error
      toast.success("Đã lưu thay đổi thành công!")
    } catch (err: any) {
      console.error(err)
      toast.error("Không thể lưu thay đổi: " + (err?.message ?? ""))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
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
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div>
          {activeTab === "company" && (
            <CompanySettings profile={profile} handleInputChange={handleInputChange} />
          )}

          {activeTab === "ai" && <AiSettings />}

          {activeTab === "notifications" && <NotificationSettings />}

          {activeTab === "email" && <EmailSettings />}

          {activeTab === "category" && <CategorySettingsPage />}

          {/* Người dùng */}
          {activeTab === "users" && (
            <div className="pt-6">
              <UsersPage />
            </div>
          )}

          {/* Phân quyền: render Authorization page UI */}
          {activeTab === "permissions" && (
            <div className="pt-6">
              <Authorization />
            </div>
          )}
        </div>

        {/* Chỉ hiển thị nút Save cho tab Company */}
        {activeTab === "company" && (
          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={handleSave} disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
