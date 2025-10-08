import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Sparkles, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface AIConfig {
  id?: string;
  openai_api_key?: string;
  openai_endpoint?: string;
  gemini_api_key?: string;
  gemini_enabled?: boolean;
  openai_enabled?: boolean;
}

const AiSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<AIConfig>({
    openai_api_key: '',
    openai_endpoint: 'https://api.openai.com/v1',
    gemini_api_key: '',
    gemini_enabled: false,
    openai_enabled: false,
  });

  // Load AI configuration from database
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_ai_config')
        .select('*')
        .single();
      
      if (data) {
        setConfig(data);
      }
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading AI config:", error);
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleInputChange = (field: keyof AIConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cv_ai_config')
      .upsert({ ...config, id: config.id || undefined });
    
    setSaving(false);
    if (error) {
      alert("Lỗi! Không thể lưu cài đặt AI.");
      console.error(error);
    } else {
      alert("Đã lưu cài đặt AI thành công!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* OpenAI Configuration */}
      <div className="space-y-6 border-b pb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Cài đặt AI</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cấu hình OpenAI để sử dụng các tính năng AI trong hệ thống
            </p>
          </div>
        </div>

        <div className="space-y-4 pl-0">
          <div className="space-y-2">
            <Label htmlFor="openai_api_key" className="text-sm font-semibold">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                id="openai_api_key"
                type="text"
                value={config.openai_api_key || ''}
                onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                className="bg-gray-50 border-gray-200 pr-10"
                placeholder="sk-..."
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => navigator.clipboard.writeText(config.openai_api_key || '')}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Lấy API key từ{' '}
              <a 
                href="https://platform.openai.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai_endpoint" className="text-sm font-semibold">
              OpenAI Endpoint
            </Label>
            <Input
              id="openai_endpoint"
              type="text"
              value={config.openai_endpoint || ''}
              onChange={(e) => handleInputChange('openai_endpoint', e.target.value)}
              className="bg-gray-50 border-gray-200"
              placeholder="https://api.openai.com/v1"
            />
            <p className="text-xs text-muted-foreground">
              Endpoint mặc định của OpenAI API
            </p>
          </div>
        </div>
      </div>

      {/* Google Gemini AI Configuration */}
      <div className="space-y-6 border-b pb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">G</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Google Gemini AI</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cấu hình Google Gemini AI cho tính năng AI Job Matching và phân tích CV
            </p>
          </div>
        </div>

        <div className="space-y-4 pl-0">
          <div className="space-y-2">
            <Label htmlFor="gemini_api_key" className="text-sm font-semibold">
              Gemini API Key
            </Label>
            <div className="relative">
              <Input
                id="gemini_api_key"
                type="password"
                value={config.gemini_api_key || ''}
                onChange={(e) => handleInputChange('gemini_api_key', e.target.value)}
                className="bg-gray-50 border-gray-200 pr-10"
                placeholder="••••••••••••••••••••••••••••••••"
              />
              {config.gemini_api_key && config.gemini_api_key.length > 0 && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {config.gemini_api_key && config.gemini_api_key.length > 0 && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Đã cấu hình</p>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Lấy API key từ{' '}
              <a 
                href="https://aistudio.google.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Quick Settings Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-sm text-blue-900">Cài đặt nhanh</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Sử dụng API key mặc định để test tính năng
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                onClick={() => {
                  setConfig(prev => ({
                    ...prev,
                    gemini_api_key: '••••••••••••••••••••••••••••••••'
                  }));
                }}
              >
                Dùng key mặc định
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Enable/Disable Switches */}
      <div className="space-y-6 pt-6">
        {/* Enable Gemini AI */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Label htmlFor="gemini_enabled" className="text-base font-semibold">
              Kích hoạt Gemini AI
            </Label>
            <p className="text-sm text-muted-foreground">
              Bật/tắt tính năng AI Job Matching với Gemini
            </p>
          </div>
          <Switch
            id="gemini_enabled"
            checked={config.gemini_enabled || false}
            onCheckedChange={(checked) => handleInputChange('gemini_enabled', checked)}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
          />
        </div>

        {/* Enable OpenAI */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Label htmlFor="openai_enabled" className="text-base font-semibold">
              Kích hoạt OpenAI
            </Label>
            <p className="text-sm text-muted-foreground">
              Bật/tắt các tính năng OpenAI trong hệ thống
            </p>
          </div>
          <Switch
            id="openai_enabled"
            checked={config.openai_enabled || false}
            onCheckedChange={(checked) => handleInputChange('openai_enabled', checked)}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={handleSave} 
          disabled={saving}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt AI'}
        </Button>
      </div>

      {/* AI Services Status */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Trạng thái AI Services</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Tổng quan tình trạng cấu hình các dịch vụ AI
        </p>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* OpenAI Card */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">OpenAI</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI Evaluation, Phân tích CV, Tạo câu hỏi phỏng vấn
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                Chưa cấu hình
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">Đã kích hoạt</span>
            </div>
          </div>

          {/* Gemini AI Card */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">G</span>
                </div>
                <div>
                  <h4 className="font-semibold">Gemini AI</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI Job Matching, Phân tích độ phù hợp CV-JD
                  </p>
                </div>
              </div>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">
                Đã cấu hình
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-muted-foreground">Đã kích hoạt</span>
            </div>
          </div>
        </div>

        {/* Test Features */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold">Test tính năng</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-center"
              disabled={!config.openai_api_key}
            >
              <Sparkles className="h-4 w-4 mr-2 text-gray-400" />
              Test OpenAI
            </Button>
            <Button 
              variant="outline" 
              className="justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={!config.gemini_api_key}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
              Test Gemini AI
            </Button>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold">Chi tiết cấu hình</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">OpenAI API Key:</span>
              <span className="text-muted-foreground">
                {config.openai_api_key ? config.openai_api_key.substring(0, 7) + '...' : 'Chưa cấu hình'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Gemini API Key:</span>
              <span className="text-blue-600">
                {config.gemini_api_key ? config.gemini_api_key.substring(0, 4) + '••••••••••••••••••••••••••••' + config.gemini_api_key.substring(config.gemini_api_key.length - 4) : 'Chưa cấu hình'}
              </span>
            </div>
          </div>
        </div>

        {/* Available AI Features */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Tính năng AI có sẵn</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">Đánh giá ứng viên với AI</span>
              <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded">
                Chưa cấu hình
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">Phân tích CV tự động</span>
              <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded">
                Chưa cấu hình
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">Gợi ý JD thông minh</span>
              <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded">
                Chưa cấu hình
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSettings;