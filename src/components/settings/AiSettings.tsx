// src/components/settings/AiSettings.tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Sparkles, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { testGeminiConnection } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
    
    if (field === 'openai_api_key') {
      setOpenAIStatus('unconfigured');
    }
    if (field === 'gemini_api_key') {
      setGeminiStatus('unconfigured');
    }
  };

  const testOpenAI = async () => {
    if (!config.openai_api_key || !config.openai_endpoint) {
      alert(t('ai.messages.enterOpenAIKey'));
      return;
    }

    if (!config.openai_api_key.startsWith('sk-')) {
      alert(t('ai.messages.invalidOpenAIKey'));
      setOpenAIStatus('error');
      return;
    }

    if (!config.openai_endpoint.startsWith('https://')) {
      alert(t('ai.messages.invalidEndpoint'));
      setOpenAIStatus('error');
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
        alert(t('ai.messages.openAISuccess'));
      } else {
        setOpenAIStatus('error');
        alert(t('ai.messages.openAIFailed') + ' ' + data.error);
      }
    } catch (error: any) {
      setOpenAIStatus('error');
      alert(t('ai.messages.openAIError') + ' ' + (error.message || 'Unknown error'));
      console.error('OpenAI test error:', error);
    } finally {
      setTestingOpenAI(false);
    }
  };

  const testGemini = async () => {
    if (!config.gemini_api_key) {
      alert(t('ai.messages.enterGeminiKey'));
      return;
    }

    setTestingGemini(true);
    try {
      const result = await testGeminiConnection(config.gemini_api_key);
      
      if (result.success) {
        setGeminiStatus('configured');
        alert(t('ai.messages.geminiSuccess'));
      } else {
        setGeminiStatus('error');
        alert(t('ai.messages.geminiFailed') + ' ' + result.error);
      }
    } catch (error: any) {
      setGeminiStatus('error');
      alert(t('ai.messages.geminiError') + ' ' + (error.message || 'Unknown error'));
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
      alert(t('ai.messages.saveError'));
      console.error(error);
    } else {
      alert(t('ai.messages.saveSuccess'));
      loadConfig();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('ai.loading')}</p>
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
                <h3 className="text-lg font-semibold">{t('ai.openai.title')}</h3>
                {openAIStatus === 'configured' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {openAIStatus === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('ai.openai.description')}
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-0">
            <div className="space-y-2">
              <Label htmlFor="openai_api_key" className="text-sm font-semibold">
                {t('ai.openai.apiKey')}
              </Label>
              <div className="relative">
                <Input
                  id="openai_api_key"
                  type="text"
                  value={config.openai_api_key || ''}
                  onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                  className="bg-gray-50 border-gray-200 pr-10"
                  placeholder={t('ai.openai.apiKeyPlaceholder')}
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
                  <p className="text-xs text-green-600 font-medium">{t('ai.openai.configured')}</p>
                </div>
              )}
              {openAIStatus === 'error' && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600 font-medium">{t('ai.openai.invalid')}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('ai.openai.getKeyFrom')}{' '}
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
                {t('ai.openai.endpoint')}
              </Label>
              <Input
                id="openai_endpoint"
                type="text"
                value={config.openai_endpoint || ''}
                onChange={(e) => handleInputChange('openai_endpoint', e.target.value)}
                className="bg-gray-50 border-gray-200"
                placeholder={t('ai.openai.endpointPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('ai.openai.endpointDescription')}
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
                <h3 className="text-lg font-semibold">{t('ai.gemini.title')}</h3>
                {geminiStatus === 'configured' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {geminiStatus === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('ai.gemini.description')}
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-0">
            <div className="space-y-2">
              <Label htmlFor="gemini_api_key" className="text-sm font-semibold">
                {t('ai.gemini.apiKey')}
              </Label>
              <div className="relative">
                <Input
                  id="gemini_api_key"
                  type="password"
                  value={config.gemini_api_key || ''}
                  onChange={(e) => handleInputChange('gemini_api_key', e.target.value)}
                  className="bg-gray-50 border-gray-200 pr-10"
                  placeholder={t('ai.gemini.apiKeyPlaceholder')}
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
                  <p className="text-xs text-green-600 font-medium">{t('ai.gemini.configured')}</p>
                </div>
              )}
              {geminiStatus === 'error' && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600 font-medium">{t('ai.gemini.connectionFailed')}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('ai.gemini.getKeyFrom')}{' '}
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
                  <h4 className="font-semibold text-sm text-blue-900">{t('ai.gemini.quickSetup')}</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('ai.gemini.quickSetupDescription')}
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
                  {t('ai.gemini.useDefaultKey')}
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
                {t('ai.gemini.enable')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('ai.gemini.enableDescription')}
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
                {t('ai.openai.enable')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('ai.openai.enableDescription')}
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
                {t('ai.buttons.saving')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('ai.buttons.save')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Section 2: AI Services Status */}
      <div className="border rounded-lg bg-white p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">{t('ai.status.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('ai.status.description')}
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
                  <h4 className="font-semibold">{t('ai.services.openai.name')}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('ai.services.openai.description')}
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
                {openAIStatus === 'configured' ? t('ai.status.configured') : openAIStatus === 'error' ? t('ai.status.error') : t('ai.status.notConfigured')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${
                config.is_openai_enabled ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-muted-foreground">
                {config.is_openai_enabled ? t('ai.status.enabled') : t('ai.status.disabled')}
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
                  <h4 className="font-semibold">{t('ai.services.gemini.name')}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('ai.services.gemini.description')}
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
                {geminiStatus === 'configured' ? t('ai.status.configured') : geminiStatus === 'error' ? t('ai.status.error') : t('ai.status.notConfigured')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${
                config.is_gemini_enabled ? 'bg-blue-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-muted-foreground">
                {config.is_gemini_enabled ? t('ai.status.enabled') : t('ai.status.disabled')}
              </span>
            </div>
          </div>
        </div>

        {/* Test Features */}
        <div className="space-y-3">
          <h4 className="font-semibold">{t('ai.testFeatures.title')}</h4>
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
                  {t('ai.buttons.testing')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2 text-gray-400" />
                  {t('ai.buttons.testOpenAI')}
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
                  {t('ai.buttons.testing')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                  {t('ai.buttons.testGemini')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="space-y-3">
          <h4 className="font-semibold">{t('ai.configDetails.title')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('ai.configDetails.openaiKey')}</span>
              <span className={openAIStatus === 'configured' ? 'text-green-600' : 'text-muted-foreground'}>
                {config.openai_api_key && config.openai_api_key.length > 7 
                  ? config.openai_api_key.substring(0, 7) + '...' 
                  : t('ai.status.notConfigured')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('ai.configDetails.geminiKey')}</span>
              <span className={geminiStatus === 'configured' ? 'text-blue-600' : 'text-muted-foreground'}>
                {config.gemini_api_key && config.gemini_api_key.length > 8
                  ? config.gemini_api_key.substring(0, 4) + '••••••••••••••••••••••••••••' + config.gemini_api_key.substring(config.gemini_api_key.length - 4) 
                  : t('ai.status.notConfigured')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Available AI Features */}
      <div className="border rounded-lg bg-white p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">{t('ai.availableFeatures.title')}</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="font-medium">{t('ai.availableFeatures.aiEvaluation')}</span>
            <span className={`text-xs px-3 py-1 rounded ${
              openAIStatus === 'configured' && config.is_openai_enabled
                ? 'text-green-600 bg-green-50 font-medium'
                : 'text-muted-foreground bg-gray-100'
            }`}>
              {openAIStatus === 'configured' && config.is_openai_enabled ? t('ai.status.enabled') : t('ai.status.notConfigured')}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <span className="font-medium">{t('ai.availableFeatures.cvAnalysis')}</span>
            <span className={`text-xs px-3 py-1 rounded ${
              openAIStatus === 'configured' && config.is_openai_enabled
                ? 'text-green-600 bg-green-50 font-medium'
                : 'text-muted-foreground bg-gray-100'
            }`}>
              {openAIStatus === 'configured' && config.is_openai_enabled ? t('ai.status.enabled') : t('ai.status.notConfigured')}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="font-medium">{t('ai.availableFeatures.smartJD')}</span>
            <span className={`text-xs px-3 py-1 rounded ${
              geminiStatus === 'configured' && config.is_gemini_enabled
                ? 'text-blue-600 bg-blue-50 font-medium'
                : 'text-muted-foreground bg-gray-100'
            }`}>
              {geminiStatus === 'configured' && config.is_gemini_enabled ? t('ai.status.enabled') : t('ai.status.notConfigured')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSettings;