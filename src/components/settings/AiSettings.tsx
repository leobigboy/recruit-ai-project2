// src/components/settings/AiSettings.tsx
"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bot, Gem, CheckCircle2 } from "lucide-react"

export function AiSettings() {
  const [openAIEnabled, setOpenAIEnabled] = useState(false)
  const [geminiEnabled, setGeminiEnabled] = useState(true)
  const [testMode, setTestMode] = useState<"openai" | "gemini">("gemini")

  return (
    <div className="space-y-6">
      {/* Card Cài đặt OpenAI & Gemini */}
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt AI</CardTitle>
          <CardDescription>
            Cấu hình OpenAI và Google Gemini để sử dụng các tính năng AI trong hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* OpenAI Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Cài đặt OpenAI</h4>
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input id="openai-key" type="password" placeholder="sk-..." />
              <a href="#" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Lấy API key từ OpenAI Platform <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-endpoint">OpenAI Endpoint</Label>
              <Input id="openai-endpoint" defaultValue="https://api.openai.com/v1" />
              <p className="text-xs text-muted-foreground">Endpoint mặc định của OpenAI API.</p>
            </div>
          </div>

          <Separator />

          {/* Google Gemini AI */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Google Gemini AI</h4>
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <div className="flex items-center justify-between gap-2">
                <Input id="gemini-key" type="password" placeholder="******************" />
                <span className="flex items-center gap-2 text-sm text-green-600 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Đã cấu hình
                </span>
              </div>
              <a href="#" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Lấy API key từ Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-3 rounded-lg border bg-blue-50/50 p-4 dark:bg-blue-900/20">
              <Label>Cài đặt nhanh</Label>
              <p className="text-sm text-muted-foreground">Sử dụng API key mặc định để test tính năng.</p>
              <Button variant="outline" className="w-full bg-white dark:bg-transparent">
                Dùng key mặc định
              </Button>
            </div>
          </div>
          
          <Separator />

          {/* Kích hoạt */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-activation" className="font-medium">Kích hoạt Gemini AI</Label>
              <div className="flex items-center gap-2">
                <Switch 
                  id="gemini-activation" 
                  checked={geminiEnabled} 
                  onCheckedChange={setGeminiEnabled}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                />
                <span className={`text-sm ${geminiEnabled ? "text-green-600 font-medium" : "text-gray-500"}`}>
                  {geminiEnabled ? "Đang bật" : "Đang tắt"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="openai-activation" className="font-medium">Kích hoạt OpenAI</Label>
              <div className="flex items-center gap-2">
                <Switch 
                  id="openai-activation" 
                  checked={openAIEnabled} 
                  onCheckedChange={setOpenAIEnabled}
                  className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300"
                />
                <span className={`text-sm ${openAIEnabled ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  {openAIEnabled ? "Đang bật" : "Đang tắt"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-start pt-4">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Lưu cài đặt AI
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Card Trạng thái AI Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle>Trạng thái AI Services</CardTitle>
          </div>
          <CardDescription>
            Tổng quan tình trạng cấu hình các dịch vụ AI
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OpenAI */}
          <div className="flex flex-col justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">OpenAI</div>
                <p className="text-sm text-muted-foreground">
                  AI Evaluation, Phân tích CV, Tạo câu hỏi phỏng vấn
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {openAIEnabled ? "Đã kích hoạt" : "Chưa cấu hình"}
              </span>
              <Button variant="outline" size="sm">
                {openAIEnabled ? "Chưa cấu hình" : "Đã cấu hình"}
              </Button>
            </div>
          </div>

          {/* Gemini AI */}
          <div className="flex flex-col justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white">
                <Gem className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Gemini AI</div>
                <p className="text-sm text-muted-foreground">
                  AI Job Matching, Phân tích độ phù hợp CV-JD
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                {geminiEnabled ? "Đã kích hoạt" : "Chưa cấu hình"}
              </span>
              <Button variant="outline" size="sm">
                {geminiEnabled ? "Đã cấu hình" : "Chưa cấu hình"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====================== */}
      {/* Test tính năng */}
      {/* ====================== */}
      <Card>
        <CardHeader>
          <CardTitle>Test tính năng</CardTitle>
          <CardDescription>Kiểm tra hoạt động của các dịch vụ AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={testMode === "openai" ? "default" : "outline"}
              className="flex items-center gap-2 justify-center"
              onClick={() => setTestMode("openai")}
            >
              <Bot className="h-4 w-4" />
              Test OpenAI
            </Button>
            <Button
              variant={testMode === "gemini" ? "default" : "outline"}
              className="flex items-center gap-2 justify-center"
              onClick={() => setTestMode("gemini")}
            >
              <Gem className="h-4 w-4" />
              Test Gemini AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ====================== */}
      {/* Chi tiết cấu hình */}
      {/* ====================== */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết cấu hình</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>OpenAI API Key:</span>
            <span className="text-gray-500">
              {openAIEnabled ? "AIz****************9RT8" : "Chưa cấu hình"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Gemini API Key:</span>
            <span className="text-gray-500">
              {geminiEnabled ? "AIz****************X7YQ" : "Chưa cấu hình"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ====================== */}
      {/* Tính năng AI có sẵn */}
      {/* ====================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle>Tính năng AI có sẵn</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✔️ Đánh giá ứng viên với AI</p>
          <p>✔️ Phân tích CV tự động</p>
          <p>✔️ Gợi ý JD thông minh</p>
        </CardContent>
      </Card>
    </div>
  )
}