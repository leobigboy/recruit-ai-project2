// src/pages/EmailPage.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Mail, Clock, FileText, Search } from "lucide-react"

// --- Bắt đầu: Code từ file stat-card.tsx ---
interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  iconBg: string
}

function StatCard({ title, value, icon, iconBg }: StatCardProps) {
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-center">
        <div className={`rounded-full p-3 ${iconBg}`}>{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  )
}
// --- Kết thúc: Code từ file stat-card.tsx ---


// --- Bắt đầu: Code từ file template-card.tsx ---
interface Template {
  id: number
  title: string
  category: string
  categoryColor: string
  preview: string
  usedCount: number
  isDefault: boolean
}

interface TemplateCardProps {
  template: Template
}

function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="flex flex-col p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <Badge className={`${template.categoryColor} border-0`}>{template.category}</Badge>
        {template.isDefault && <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">Default</span>}
      </div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{template.title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">{template.preview}</p>
      <div className="mt-auto">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">Sử dụng Template</Button>
      </div>
    </Card>
  )
}
// --- Kết thúc: Code từ file template-card.tsx ---


// --- Bắt đầu: Code từ file email-dashboard.tsx ---
const templates: Template[] = [
  // ... (Dữ liệu mẫu bạn đã cung cấp) ...
  { id: 1, title: "Interview Invitation - Round 1", category: "Interview", categoryColor: "bg-pink-100 text-pink-700", preview: "Dear {{candidateName}}, We are pleased to invite you...", usedCount: 0, isDefault: true },
  { id: 2, title: "Pass Notice - Congratulations", category: "Offer", categoryColor: "bg-green-100 text-green-700", preview: "Dear {{candidateName}}, Congratulations! We are delighted...", usedCount: 0, isDefault: true },
  // Thêm các template khác vào đây
];

export function EmailPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Email</h1>
            <p className="mt-1 text-sm text-gray-600">Quản lý các mẫu email chuyên nghiệp</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-white"><FileText className="h-4 w-4" />Tạo Template</Button>
            <Button className="gap-2"><Send className="h-4 w-4" />Soạn Email</Button>
          </div>
        </div>
        
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Email đã gửi" value="0" icon={<Send className="h-6 w-6 text-blue-600" />} iconBg="bg-blue-100" />
          <StatCard title="Tỷ lệ mở" value="0.0%" icon={<Mail className="h-6 w-6 text-green-600" />} iconBg="bg-green-100" />
          <StatCard title="Đang chờ gửi" value="0" icon={<Clock className="h-6 w-6 text-orange-600" />} iconBg="bg-orange-100" />
          <StatCard title="Mẫu Email" value={templates.length.toString()} icon={<FileText className="h-6 w-6 text-purple-600" />} iconBg="bg-purple-100" />
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
            <TabsTrigger value="statistical">Thống kê</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Tìm kiếm templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 pl-9" />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    <SelectItem value="interview">Phỏng vấn</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
          
          {/* Các tab khác sẽ được làm sau */}
        </Tabs>
      </div>
    </div>
  )
}
// --- Kết thúc: Code từ file email-dashboard.tsx ---