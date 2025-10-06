import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function AISettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 min-h-screen">
      {/* --- Cài đặt AI --- */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold">⚙️ Cài đặt AI</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cấu hình OpenAI & Google Gemini AI để sử dụng các tính năng AI trong hệ thống
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* --- OpenAI --- */}
          <div className="space-y-4">
            <Label className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              OpenAI API Key
            </Label>
            <div className="flex flex-col gap-3">
              <Input placeholder="sk-..." className="max-w-xl" />
              <a
                href="https://platform.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Lấy API key từ OpenAI Platform
              </a>
            </div>

            {/* --- Test + Kích hoạt --- */}
            <div className="flex items-center justify-between mt-2">
              <Switch id="enableOpenAI" />
              <Button variant="outline" className="mx-auto">
                🤖 Test OpenAI
              </Button>
            </div>
          </div>

          <hr />

          {/* --- Gemini AI --- */}
          <div className="space-y-4">
            <Label className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Google Gemini AI
            </Label>
            <div className="flex flex-col gap-3">
              <Input placeholder="Gemini API Key" className="max-w-xl" />
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Lấy API key từ Google AI Studio
              </a>
            </div>

            <div className="flex items-center justify-between mt-2">
              <Switch id="enableGemini" />
              <Button variant="outline" className="mx-auto">
                💎 Test Gemini AI
              </Button>
            </div>
          </div>

          <div className="pt-6 flex justify-center">
            <Button className="bg-primary text-white hover:bg-primary/90">
              💾 Lưu cài đặt AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Trạng thái AI Services --- */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold">✅ Trạng thái AI Services</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tổng quan tình trạng cấu hình các dịch vụ AI
          </p>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-green-200 bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> OpenAI
            </div>
            <p className="text-sm text-gray-600 mt-1">
              AI Evaluation, Phân tích CV, Tạo câu hỏi phỏng vấn
            </p>
            <p className="text-xs text-green-600 mt-1 font-medium">Đã kích hoạt</p>
          </div>

          <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-700 font-semibold">
              <Sparkles className="w-5 h-5" /> Gemini AI
            </div>
            <p className="text-sm text-gray-600 mt-1">
              AI Job Matching, Phân tích độ phù hợp CV-JD
            </p>
            <p className="text-xs text-green-600 mt-1 font-medium">Đã kích hoạt</p>
          </div>
        </CardContent>
      </Card>

      {/* --- Tính năng AI có sẵn --- */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold">🤖 Tính năng AI có sẵn</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Đánh giá ứng viên với AI</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Phân tích CV tự động</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Gợi ý JD thông minh</span>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" size="sm">
              💾 Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
