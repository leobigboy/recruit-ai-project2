import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Sparkles, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface AIConfig {
  id?: string;
  openai_api_key?: string;
  openai_endpoint?: string;
  gemini_api_key?: string;
  is_openai_enabled?: boolean;
  is_gemini_enabled?: boolean;
  profile_id?: string;
}

const AiSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<'unconfigured' | 'configured' | 'error'>('unconfigured');
  const [geminiStatus, setGeminiStatus] = useState<'unconfigured' | 'configured' | 'error'>('unconfigured');
  
  const [config, setConfig] = useState<AIConfig>({
    openai_api_key: '',
    openai_endpoint: 'https://api.openai.com/v1',
    gemini_api_key: '',
    is_gemini_enabled: false,
    is_openai_enabled: false,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cv_ai_settings')
      .select('*')
      .single();
    
    if (data) {
      setConfig(data);
      // Check status based on existing keys
      if (data.openai_api_key && data.openai_api_key.length > 0) {
        setOpenAIStatus('configured');
      }
      if (data.gemini_api_key && data.gemini_api_key.length > 0) {
        setGeminiStatus('configured');
      }
    }
    if (error && error.code !== 'PGRST116') {
      console.error("Error loading AI config:", error);
    }
    setLoading(false);
  };

  const handleInputChange = (field: keyof AIConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Reset status when key is changed
    if (field === 'openai_api_key') {
      setOpenAIStatus('unconfigured');
    }
    if (field === 'gemini_api_key') {
      setGeminiStatus('unconfigured');
    }
  };

  const testOpenAI = async () => {
    if (!config.openai_api_key || !config.openai_endpoint) {
      alert('Vui lòng nhập OpenAI API Key và Endpoint');
      return;
    }

    setTestingOpenAI(true);
    try {
      const response = await fetch('/api/test-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.openai_api_key,
          endpoint: config.openai_endpoint
        })
      });

      const data = await response.json();

      if (data.success) {
        setOpenAIStatus('configured');
        alert('✅ Kết nối OpenAI thành công!');
      } else {
        setOpenAIStatus('error');
        alert(`❌ Kết nối OpenAI thất bại: ${data.error}`);
      }
    } catch (error: any) {
      setOpenAIStatus('error');
      alert('❌ Lỗi khi kết nối OpenAI: ' + (error.message || 'Unknown error'));
      console.error('OpenAI test error:', error);
    } finally {
      setTestingOpenAI(false);
    }
  };

  const testGemini = async () => {
    if (!config.gemini_api_key) {
      alert('Vui lòng nhập Gemini API Key');
      return;
    }

    setTestingGemini(true);
    try {
      // Sử dụng endpoint v1beta thay vì v1 để tránh CORS
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.gemini_api_key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Hello'
              }]
            }]
          })
        }
      );

      const data = await response.json();
      
      if (response.ok && data.candidates) {
        setGeminiStatus('configured');
        alert('✅ Kết nối Gemini AI thành công!');
      } else if (data.error) {
        setGeminiStatus('error');
        alert(`❌ Kết nối Gemini AI thất bại: ${data.error.message}`);
      } else {
        setGeminiStatus('error');
        alert('❌ Kết nối Gemini AI thất bại. Vui lòng kiểm tra lại API Key.');
      }
    } catch (error) {
      setGeminiStatus('error');
      alert('❌ Lỗi khi kết nối Gemini AI. Vui lòng kiểm tra API Key và thử lại.');
      console.error('Gemini test error:', error);
    } finally {
      setTestingGemini(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cv_ai_settings')
      .upsert({ 
        ...config, 
        id: config.id || undefined,
        profile_id: config.profile_id || undefined
      });
    
    setSaving(false);
    if (error) {
      alert("❌ Lỗi! Không thể lưu cài đặt AI.");
      console.error(error);
    } else {
      alert("✅ Đã lưu cài đặt AI thành công!");
      loadConfig();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: AI Configuration */}
      <div className="border rounded-lg bg-white p-6 space-y-6">
        {/* OpenAI Configuration */}
        <div className="space-y-6 pb-6 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Cài đặt AI</h3>
                {openAIStatus === 'configured' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {openAIStatus === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
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
              {openAIStatus === 'configured' && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Đã cấu hình và kết nối thành công</p>
                </div>
              )}
              {openAIStatus === 'error' && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600 font-medium">Kết nối thất bại</p>
                </div>
              )}
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
        <div className="space-y-6 pb-6 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">G</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Google Gemini AI</h3>
                {geminiStatus === 'configured' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {geminiStatus === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
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
                  placeholder="AIza..."
                />
                {geminiStatus === 'configured' && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                )}
                {geminiStatus === 'error' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-600" />
                )}
              </div>
              {geminiStatus === 'configured' && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Đã cấu hình và kết nối thành công</p>
                </div>
              )}
              {geminiStatus === 'error' && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600 font-medium">Kết nối thất bại</p>
                </div>
              )}
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
                      gemini_api_key: 'AIzaSyDemoKeyForTestingPurpose'
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
        <div className="space-y-6">
          {/* Enable Gemini AI */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label htmlFor="is_gemini_enabled" className="text-base font-semibold">
                Kích hoạt Gemini AI
              </Label>
              <p className="text-sm text-muted-foreground">
                Bật/tắt tính năng AI Job Matching với Gemini
              </p>
            </div>
            <Switch
              id="is_gemini_enabled"
              checked={config.is_gemini_enabled || false}
              onCheckedChange={(checked) => handleInputChange('is_gemini_enabled', checked)}
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
            />
          </div>

          {/* Enable OpenAI */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label htmlFor="is_openai_enabled" className="text-base font-semibold">
                Kích hoạt OpenAI
              </Label>
              <p className="text-sm text-muted-foreground">
                Bật/tắt các tính năng OpenAI trong hệ thống
              </p>
            </div>
            <Switch
              id="is_openai_enabled"
              checked={config.is_openai_enabled || false}
              onCheckedChange={(checked) => handleInputChange('is_openai_enabled', checked)}
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
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Lưu cài đặt AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Section 2: AI Services Status */}
      <div className="border rounded-lg bg-white p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Trạng thái AI Services</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Tổng quan tình trạng cấu hình các dịch vụ AI
        </p>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OpenAI Card */}
          <div className="border rounded-lg p-4 bg-gray-50">
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
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                openAIStatus === 'configured' 
                  ? 'text-green-600 bg-green-50' 
                  : openAIStatus === 'error'
                  ? 'text-red-600 bg-red-50'
                  : 'text-muted-foreground bg-gray-100'
              }`}>
                {openAIStatus === 'configured' ? 'Đã cấu hình' : openAIStatus === 'error' ? 'Lỗi' : 'Chưa cấu hình'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${
                config.is_openai_enabled ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-muted-foreground">
                {config.is_openai_enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
              </span>
            </div>
          </div>

          {/* Gemini AI Card */}
          <div className="border rounded-lg p-4 bg-gray-50">
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
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                geminiStatus === 'configured' 
                  ? 'text-blue-600 bg-blue-50' 
                  : geminiStatus === 'error'
                  ? 'text-red-600 bg-red-50'
                  : 'text-muted-foreground bg-gray-100'
              }`}>
                {geminiStatus === 'configured' ? 'Đã cấu hình' : geminiStatus === 'error' ? 'Lỗi' : 'Chưa cấu hình'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${
                config.is_gemini_enabled ? 'bg-blue-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-muted-foreground">
                {config.is_gemini_enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Features */}
        <div className="space-y-3">
          <h4 className="font-semibold">Test tính năng</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-center"
              disabled={!config.openai_api_key || testingOpenAI}
              onClick={testOpenAI}
            >
              {testingOpenAI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang test...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 text-gray-400" />
                  Test OpenAI
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={!config.gemini_api_key || testingGemini}
              onClick={testGemini}
            >
              {testingGemini ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang test...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                  Test Gemini AI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="space-y-3">
          <h4 className="font-semibold">Chi tiết cấu hình</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">OpenAI API Key:</span>
              <span className={openAIStatus === 'configured' ? 'text-green-600' : 'text-muted-foreground'}>
                {config.openai_api_key && config.openai_api_key.length > 7 
                  ? config.openai_api_key.substring(0, 7) + '...' 
                  : 'Chưa cấu hình'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Gemini API Key:</span>
              <span className={geminiStatus === 'configured' ? 'text-blue-600' : 'text-muted-foreground'}>
                {config.gemini_api_key && config.gemini_api_key.length > 8
                  ? config.gemini_api_key.substring(0, 4) + '••••••••••••••••••••••••••••' + config.gemini_api_key.substring(config.gemini_api_key.length - 4) 
                  : 'Chưa cấu hình'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Available AI Features */}
      <div className="border rounded-lg bg-white p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Tính năng AI có sẵn</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="font-medium">Đánh giá ứng viên với AI</span>
            <span className={`text-xs px-3 py-1 rounded ${
              openAIStatus === 'configured' && config.is_openai_enabled
                ? 'text-green-600 bg-green-50 font-medium'
                : 'text-muted-foreground bg-gray-100'
            }`}>
              {openAIStatus === 'configured' && config.is_openai_enabled ? 'Đã kích hoạt' : 'Chưa cấu hình'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <span className="font-medium">Phân tích CV tự động</span>
            <span className={`text-xs px-3 py-1 rounded ${
              openAIStatus === 'configured' && config.is_openai_enabled
                ? 'text-green-600 bg-green-50 font-medium'
                : 'text-muted-foreground bg-gray-100'
            }`}>
              {openAIStatus === 'configured' && config.is_openai_enabled ? 'Đã kích hoạt' : 'Chưa cấu hình'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="font-medium">Gợi ý JD thông minh</span>
            <span className={`text-xs px-3 py-1 rounded ${
              geminiStatus === 'configured' && config.is_gemini_enabled
                ? 'text-blue-600 bg-blue-50 font-medium'
                : 'text-muted-foreground bg-gray-100'
            }`}>
              {geminiStatus === 'configured' && config.is_gemini_enabled ? 'Đã kích hoạt' : 'Chưa cấu hình'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSettings;