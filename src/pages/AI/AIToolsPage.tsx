// src/pages/ai/AIToolsPage.tsx
import React, { useState, useEffect } from "react";
import { 
  Bot, 
  FileText, 
  MessageSquare, 
  MessageCircle, 
  TrendingUp, 
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { supabase } from '@/lib/supabaseClient';

const tabs = [
  { id: "match", label: "Gợi ý ứng viên", icon: Bot },
  { id: "summarize", label: "Tóm tắt CV", icon: FileText },
  { id: "analysis", label: "Phân tích phỏng vấn", icon: MessageSquare },
  { id: "chatbot", label: "AI Virtual Assistant", icon: MessageCircle },
  { id: "predict", label: "Dự đoán tuyển dụng", icon: TrendingUp },
];

interface APIKeys {
  openrouter?: string;
}

export default function AIToolsPage() {
  const [active, setActive] = useState<string>("match");
  const [apiKeys, setApiKeys] = useState<APIKeys>({});
  const [tempKeys, setTempKeys] = useState<APIKeys>({});
  const [showKeys, setShowKeys] = useState({ openrouter: false });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const savedOpenRouter = localStorage.getItem("openrouter_api_key");
    const keys: APIKeys = {};
    
    if (savedOpenRouter) keys.openrouter = savedOpenRouter;
    
    setApiKeys(keys);
    setTempKeys(keys);
  }, []);

  const hasApiKey = !!apiKeys.openrouter;

  const handleSaveApiKey = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      const newKeys: APIKeys = {};
      
      if (tempKeys.openrouter?.trim()) {
        newKeys.openrouter = tempKeys.openrouter.trim();
        localStorage.setItem("openrouter_api_key", tempKeys.openrouter.trim());
      } else {
        localStorage.removeItem("openrouter_api_key");
      }
      
      setApiKeys(newKeys);
      setSaveStatus("saved");
      
      setTimeout(() => {
        setShowApiKeyModal(false);
        setSaveStatus("idle");
      }, 1500);
    }, 500);
  };

  const handleRemoveApiKey = () => {
    setApiKeys({});
    setTempKeys({});
    localStorage.removeItem("openrouter_api_key");
    setShowApiKeyModal(false);
  };

  const getMaskedKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "••••••••";
    return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">AI thông minh</h1>
        <button
          onClick={() => setShowApiKeyModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
            hasApiKey 
              ? "bg-green-100 text-green-700 hover:bg-green-200" 
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          <Key className="w-4 h-4" />
          <span className="text-sm font-medium">
            {hasApiKey ? "API Key đã cấu hình" : "Cần cấu hình API Key"}
          </span>
        </button>
      </div>

      {!hasApiKey && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Chưa cấu hình API Key</p>
            <p className="text-xs text-amber-700 mt-1">
              Vui lòng nhập OpenRouter API Key để sử dụng các chức năng AI. 
              <button 
                onClick={() => setShowApiKeyModal(true)}
                className="ml-1 underline font-medium"
              >
                Cấu hình ngay
              </button>
            </p>
          </div>
        </div>
      )}

      {hasApiKey && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">
              API đang hoạt động:
            </span>
            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded text-xs font-medium">
              OpenRouter AI (GPT-4o-mini)
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 items-center mb-6 flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              disabled={!hasApiKey}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
                !hasApiKey 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                  : isActive 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {hasApiKey ? (
          <>
            {active === "match" && <CandidateMatchUI apiKeys={apiKeys} />}
            {active === "summarize" && <SummarizeCVUI apiKeys={apiKeys} />}
            {active === "analysis" && <InterviewAnalysisUI apiKeys={apiKeys} />}
            {active === "chatbot" && <ChatbotUI apiKeys={apiKeys} />}
            {active === "predict" && <RecruitPredictUI apiKeys={apiKeys} />}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Vui lòng cấu hình API Key để sử dụng chức năng AI</p>
          </div>
        )}
      </div>

      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Cấu hình OpenRouter API Key
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <label className="block text-sm font-medium text-gray-700">
                    OpenRouter API Key
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showKeys.openrouter ? "text" : "password"}
                    value={tempKeys.openrouter || ""}
                    onChange={(e) => setTempKeys(prev => ({ ...prev, openrouter: e.target.value }))}
                    placeholder="sk-or-v1-..."
                    className="w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, openrouter: !prev.openrouter }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.openrouter ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lấy từ{" "}
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 underline"
                  >
                    OpenRouter Dashboard
                  </a>
                </p>
                {apiKeys.openrouter && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✓ Key hiện tại: {getMaskedKey(apiKeys.openrouter)}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveApiKey}
                  disabled={saveStatus === "saving"}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
                    saveStatus === "saved"
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                  }`}
                >
                  {saveStatus === "saving" ? (
                    "Đang lưu..."
                  ) : saveStatus === "saved" ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />
                      Đã lưu
                    </span>
                  ) : (
                    "Lưu API Key"
                  )}
                </button>
                
                {apiKeys.openrouter && (
                  <button
                    onClick={handleRemoveApiKey}
                    className="px-4 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Xóa
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setTempKeys(apiKeys);
                    setSaveStatus("idle");
                  }}
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>💡 Lưu ý:</strong> OpenRouter hỗ trợ nhiều AI models (GPT-4, Claude, Gemini...). 
                API key sẽ được lưu cục bộ trên trình duyệt của bạn.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TabUIProps {
  apiKeys: APIKeys;
}

function CandidateMatchUI({ apiKeys }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_jobs')
        .select('*')
        .eq('status', 'Đã đăng')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const handleRunMatch = async () => {
    if (!selectedJob && !jobDescription.trim()) {
      alert('Vui lòng chọn job hoặc nhập Job Description');
      return;
    }

    setLoading(true);
    try {
      const { data: cvData, error } = await supabase
        .from('cv_candidates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      if (!cvData || cvData.length === 0) {
        alert('Hiện chưa có CV nào trong hệ thống');
        setLoading(false);
        return;
      }

      let jobInfo = jobDescription;
      if (selectedJob) {
        const job = jobs.find(j => j.id === selectedJob);
        jobInfo = `${job?.title || ''}\n${job?.description || ''}`;
      }

      const prompt = `Bạn là AI chuyên phân tích CV và tuyển dụng.

Job Description:
${jobInfo}

Danh sách ứng viên (${cvData.length} CVs):
${cvData.map((cv: any, idx: number) => 
  `${idx + 1}. ${cv.full_name} - ${cv.university || 'N/A'} - ${cv.email} - Kinh nghiệm: ${cv.experience || 'N/A'}`
).join('\n')}

Nhiệm vụ: Phân tích và trả về top 5 ứng viên phù hợp nhất với job này.

Trả về JSON format:
{
  "matches": [
    {
      "name": "Tên ứng viên",
      "score": 85,
      "reason": "Lý do phù hợp",
      "email": "email@example.com"
    }
  ]
}`;

      const aiResponse = await callOpenRouterAPI(prompt, apiKeys.openrouter!);

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setResults(parsed.matches || []);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (err: any) {
      console.error('Error matching candidates:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Gợi ý ứng viên</h2>
      <p className="text-sm text-gray-600 mb-4">
        Chọn 1 job hoặc paste Job Description để AI trả về top ứng viên phù hợp.
      </p>

      <div className="space-y-3">
        <select 
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Chọn job...</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.title} - {job.department}
            </option>
          ))}
        </select>

        <textarea 
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full border rounded p-3 h-28" 
          placeholder="Hoặc paste Job Description..." 
        />

        <div className="flex gap-2">
          <button 
            onClick={handleRunMatch}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Đang xử lý..." : "Chạy gợi ý"}
          </button>
          <button 
            onClick={() => setResults([])}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Xóa
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <div className="text-sm text-gray-500 mb-2">Kết quả top {results.length} ứng viên:</div>
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i} className="p-3 bg-white rounded shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-sm text-gray-600">{r.email}</div>
                      <div className="text-xs text-gray-500 mt-1">{r.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{r.score}%</div>
                      <div className="text-xs text-gray-500">Match score</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function SummarizeCVUI({ apiKeys }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);
  const [cvs, setCvs] = useState<any[]>([]);
  const [selectedCV, setSelectedCV] = useState("");

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setCvs(data || []);
    } catch (err) {
      console.error('Error fetching CVs:', err);
    }
  };

  const handleSummarize = async () => {
    if (!selectedCV) {
      alert('Vui lòng chọn CV');
      return;
    }

    setLoading(true);
    try {
      const cv = cvs.find(c => c.id === selectedCV);
      if (!cv) throw new Error('CV not found');

      const prompt = `Bạn là AI chuyên phân tích CV.

Thông tin CV:
- Tên: ${cv.full_name}
- Email: ${cv.email}
- Phone: ${cv.phone_number}
- Trường: ${cv.university || 'N/A'}
- Học vấn: ${cv.education || 'N/A'}
- Kinh nghiệm: ${cv.experience || 'N/A'}
- Kỹ năng: ${cv.skills || 'N/A'}

Nhiệm vụ: Tóm tắt CV này thành 3-5 bullet points ngắn gọn, súc tích, highlight điểm mạnh.

Trả về JSON format:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"]
}`;

      const aiResponse = await callOpenRouterAPI(prompt, apiKeys.openrouter!);

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSummary(parsed.summary || []);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (err: any) {
      console.error('Error summarizing CV:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Tóm tắt CV</h2>
      <p className="text-sm text-gray-600 mb-4">
        Chọn CV từ database để AI tóm tắt thành bullet points.
      </p>

      <div className="space-y-3">
        <select 
          value={selectedCV}
          onChange={(e) => setSelectedCV(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Chọn CV...</option>
          {cvs.map(cv => (
            <option key={cv.id} value={cv.id}>
              {cv.full_name} - {cv.university || 'N/A'} - {new Date(cv.created_at).toLocaleDateString('vi-VN')}
            </option>
          ))}
        </select>

        <button 
          onClick={handleSummarize}
          disabled={loading || !selectedCV}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Đang tóm tắt..." : "Tóm tắt"}
        </button>

        {summary.length > 0 && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <div className="text-sm text-gray-500 mb-2">Tóm tắt:</div>
            <ul className="list-disc pl-5 space-y-1">
              {summary.map((s, i) => (
                <li key={i} className="text-sm">{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function InterviewAnalysisUI({ apiKeys }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [transcript, setTranscript] = useState("");

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      alert('Vui lòng nhập transcript phỏng vấn');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Bạn là AI chuyên phân tích phỏng vấn.

Transcript phỏng vấn:
${transcript}

Nhiệm vụ: Phân tích transcript này và đánh giá:
1. Confidence level (1-10)
2. Sentiment (Positive/Neutral/Negative)
3. Key phrases quan trọng
4. Overall impression

Trả về JSON format:
{
  "confidence": 7,
  "sentiment": "Positive",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "impression": "Tổng quan đánh giá ngắn gọn"
}`;

      const aiResponse = await callOpenRouterAPI(prompt, apiKeys.openrouter!);

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (err: any) {
      console.error('Error analyzing interview:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Phân tích phỏng vấn</h2>
      <p className="text-sm text-gray-600 mb-4">
        Nhập transcript phỏng vấn — AI phân tích tone, confidence, sentiment.
      </p>

      <div className="space-y-3">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="w-full border rounded p-3 h-40"
          placeholder="Paste transcript cuộc phỏng vấn tại đây..."
        />

        <div className="mt-2">
          <button 
            onClick={handleAnalyze}
            disabled={loading || !transcript.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Đang phân tích..." : "Phân tích"}
          </button>
        </div>

        {analysis && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-3">Báo cáo phân tích:</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm text-gray-600">Confidence Level:</span>
                <span className="font-bold text-blue-600">{analysis.confidence}/10</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm text-gray-600">Sentiment:</span>
                <span className={`font-medium ${
                  analysis.sentiment.toLowerCase().includes('positive') ? 'text-green-600' :
                  analysis.sentiment.toLowerCase().includes('negative') ? 'text-red-600' :
                  'text-yellow-600'
                }`}>{analysis.sentiment}</span>
              </div>
              <div className="p-2 bg-white rounded">
                <span className="text-sm text-gray-600">Key Phrases:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.keywords?.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              {analysis.impression && (
                <div className="p-2 bg-white rounded">
                  <span className="text-sm text-gray-600">Overall Impression:</span>
                  <p className="text-sm mt-1">{analysis.impression}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatbotUI({ apiKeys }: TabUIProps) {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: "bot", content: "Xin chào Admin! Tôi có thể giúp bạn:\n• Tóm tắt CV tốt nhất\n• Liệt kê CV tiềm năng\n• Gửi email template\n• Phân tích dữ liệu tuyển dụng\n\nHãy cho tôi biết bạn cần gì!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCVData = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_candidates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching CV data:', err);
      return [];
    }
  };

  const fetchJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_jobs')
        .select('*')
        .eq('status', 'Đã đăng')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching jobs:', err);
      return [];
    }
  };

  const analyzeIntent = (message: string) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('tóm tắt') || lowerMsg.includes('cv tốt') || lowerMsg.includes('ứng viên tốt')) {
      return 'summarize_best_cv';
    }
    if (lowerMsg.includes('liệt kê') || lowerMsg.includes('danh sách') || lowerMsg.includes('cv tiềm năng')) {
      return 'list_potential_cv';
    }
    if (lowerMsg.includes('gửi email') || lowerMsg.includes('email template') || lowerMsg.includes('template')) {
      return 'send_email';
    }
    if (lowerMsg.includes('thống kê') || lowerMsg.includes('phân tích') || lowerMsg.includes('báo cáo')) {
      return 'analytics';
    }
    
    return 'general';
  };

  const handleAction = async (intent: string, userMessage: string) => {
    switch (intent) {
      case 'summarize_best_cv': {
        const cvData = await fetchCVData();
        if (cvData.length === 0) {
          return "⚠️ Hiện chưa có CV nào trong hệ thống.";
        }
        
        const topCVs = cvData.slice(0, 5);
        const cvSummary = topCVs.map((cv: any, idx: number) => 
          `${idx + 1}. **${cv.full_name || 'N/A'}**
   - Trường: ${cv.university || 'N/A'}
   - Email: ${cv.email || 'N/A'}
   - Phone: ${cv.phone_number || 'N/A'}
   - Trạng thái: ${cv.status || 'pending'}
   - Ngày nộp: ${new Date(cv.created_at).toLocaleDateString('vi-VN')}`
        ).join('\n\n');
        
        return `📄 **Top 5 CV Mới Nhất:**\n\n${cvSummary}`;
      }

      case 'list_potential_cv': {
        const cvData = await fetchCVData();
        if (cvData.length === 0) {
          return "⚠️ Hiện chưa có CV nào trong hệ thống.";
        }
        
        const potentialCVs = cvData.filter((cv: any) => 
          cv.status === 'Đang xem xét' || cv.status === 'Đã phỏng vấn' || cv.status === 'Chấp nhận'
        );
        
        if (potentialCVs.length === 0) {
          return "📋 Hiện chưa có CV tiềm năng nào đang được xem xét.";
        }
        
        const cvList = potentialCVs.slice(0, 10).map((cv: any, idx: number) => 
          `${idx + 1}. **${cv.full_name || 'N/A'}** - ${cv.university || 'N/A'}
   📧 ${cv.email || 'N/A'} | 📱 ${cv.phone_number || 'N/A'}
   Status: ${cv.status} | Ngày: ${new Date(cv.created_at).toLocaleDateString('vi-VN')}`
        ).join('\n\n');
        
        return `🎯 **Danh sách ${potentialCVs.length} CV Tiềm Năng:**\n\n${cvList}`;
      }

      case 'send_email': {
        const templates = {
          interview: `Chủ đề: Mời phỏng vấn vị trí [VỊ TRÍ]

Kính gửi [TÊN ỨNG VIÊN],

Chúng tôi đã xem xét hồ sơ của bạn và rất ấn tượng với kinh nghiệm của bạn. Chúng tôi muốn mời bạn tham gia buổi phỏng vấn cho vị trí [VỊ TRÍ].

📅 Thời gian: [NGÀY GIỜ]
📍 Địa điểm: [ĐỊA ĐIỂM]
👥 Hình thức: [ONLINE/OFFLINE]

Vui lòng xác nhận tham gia qua email này.

Trân trọng,
[TÊN CÔNG TY]`,

          reject: `Chủ đề: Thông báo kết quả ứng tuyển

Kính gửi [TÊN ỨNG VIÊN],

Cảm ơn bạn đã quan tâm và ứng tuyển vị trí [VỊ TRÍ] tại công ty chúng tôi.

Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn chưa phù hợp với yêu cầu hiện tại. 

Chúng tôi sẽ lưu giữ thông tin của bạn cho các cơ hội trong tương lai.

Chúc bạn thành công!

Trân trọng,
[TÊN CÔNG TY]`,

          offer: `Chủ đề: Thư mời làm việc - Vị trí [VỊ TRÍ]

Kính gửi [TÊN ỨNG VIÊN],

Chúc mừng! Chúng tôi rất vui mừng thông báo rằng bạn đã được chọn cho vị trí [VỊ TRÍ].

💰 Mức lương: [LƯƠNG]
📅 Ngày bắt đầu: [NGÀY]
📋 Quyền lợi: [QUYỀN LỢI]

Vui lòng xác nhận chấp nhận offer trong vòng 3 ngày làm việc.

Chúng tôi rất mong được làm việc cùng bạn!

Trân trọng,
[TÊN CÔNG TY]`
        };

        return `✉️ **Email Templates:**

**1. Mời phỏng vấn:**
${templates.interview}

---

**2. Từ chối ứng viên:**
${templates.reject}

---

**3. Thư mời làm việc:**
${templates.offer}

Bạn muốn gửi template nào? Tôi có thể giúp tùy chỉnh!`;
      }

      case 'analytics': {
        const cvData = await fetchCVData();
        const jobData = await fetchJobPostings();
        
        if (cvData.length === 0) {
          return "⚠️ Hiện chưa có dữ liệu để phân tích.";
        }

        const totalCVs = cvData.length;
        const statusCounts: any = {};
        cvData.forEach((cv: any) => {
          statusCounts[cv.status] = (statusCounts[cv.status] || 0) + 1;
        });

        const stats = Object.entries(statusCounts)
          .map(([status, count]) => `  • ${status}: ${count}`)
          .join('\n');

        return `📊 **Thống Kê Tuyển Dụng:**

📄 Tổng số CV: ${totalCVs}
💼 Số vị trí đang tuyển: ${jobData.length}

**Phân loại CV:**
${stats}

**Tỷ lệ chuyển đổi:**
• CV mới: ${Math.round((statusCounts['Đã nộp'] || 0) / totalCVs * 100)}%
• Đang xem xét: ${Math.round((statusCounts['Đang xem xét'] || 0) / totalCVs * 100)}%
• Đã phỏng vấn: ${Math.round((statusCounts['Đã phỏng vấn'] || 0) / totalCVs * 100)}%`;
      }

      default:
        return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);
    setError("");

    try {
      const intent = analyzeIntent(currentInput);
      const actionResponse = await handleAction(intent, currentInput);
      
      if (actionResponse) {
        const botMsg = { role: "bot", content: actionResponse };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const prompt = `Bạn là AI Assistant hỗ trợ Admin quản lý tuyển dụng.

Lịch sử:
${messages.map(m => `${m.role === 'user' ? 'Admin' : 'AI'}: ${m.content}`).join('\n')}

Admin: ${currentInput}

Trả lời chuyên nghiệp, hữu ích bằng tiếng Việt:`;

        const botResponse = await callOpenRouterAPI(prompt, apiKeys.openrouter!);
        const botMsg = { role: "bot", content: botResponse };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.error('OpenRouter API error:', err);
      setError(err.message || 'Có lỗi xảy ra');
      
      const errorMsg = { 
        role: "bot", 
        content: `⚠️ Lỗi OpenRouter: ${err.message}. Vui lòng kiểm tra API key.` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">AI — Admin Assistant</h2>
        <span className="text-xs px-2 py-1 rounded bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
          OpenRouter AI
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        AI Assistant hỗ trợ quản lý CV, phân tích ứng viên và gửi email tự động.
      </p>

      <div className="border rounded p-3 bg-white">
        <div className="h-96 overflow-auto p-3 bg-gray-50 rounded mb-3">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}>
              <span className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] whitespace-pre-wrap ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : msg.content.startsWith("⚠️")
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-white text-gray-800 border border-gray-200"
              }`}>
                {msg.content}
              </span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="animate-pulse">●</div>
              <div className="animate-pulse">●</div>
              <div className="animate-pulse">●</div>
              <span className="text-xs">(OpenRouter)</span>
            </div>
          )}
        </div>
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => setInput("Tóm tắt 5 CV tốt nhất")}
            className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            📄 Tóm tắt CV tốt
          </button>
          <button
            onClick={() => setInput("Liệt kê CV tiềm năng")}
            className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
          >
            🎯 CV tiềm năng
          </button>
          <button
            onClick={() => setInput("Gửi email template")}
            className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
          >
            ✉️ Email template
          </button>
          <button
            onClick={() => setInput("Thống kê tuyển dụng")}
            className="text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded hover:bg-orange-100"
          >
            📊 Thống kê
          </button>
        </div>

        <div className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && handleSend()}
            className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Hỏi AI về CV, ứng viên, hoặc yêu cầu gửi email..." 
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Đang xử lý..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecruitPredictUI({ apiKeys }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [selectedCV, setSelectedCV] = useState("");

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setCvs(data || []);
    } catch (err) {
      console.error('Error fetching CVs:', err);
    }
  };

  const handlePredict = async () => {
    if (!selectedCV) {
      alert('Vui lòng chọn ứng viên');
      return;
    }

    setLoading(true);
    try {
      const cv = cvs.find(c => c.id === selectedCV);
      if (!cv) throw new Error('CV not found');

      const prompt = `Bạn là AI chuyên dự đoán tuyển dụng.

Thông tin ứng viên:
- Tên: ${cv.full_name}
- Email: ${cv.email}
- Trường: ${cv.university || 'N/A'}
- Học vấn: ${cv.education || 'N/A'}
- Kinh nghiệm: ${cv.experience || 'N/A'}
- Kỹ năng: ${cv.skills || 'N/A'}
- Trạng thái: ${cv.status}

Nhiệm vụ: Dự đoán xác suất tuyển dụng thành công (0-100%) dựa trên profile và phân tích chi tiết.

Trả về JSON format:
{
  "probability": 75,
  "reason": "Lý do chi tiết đánh giá",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "recommendation": "Khuyến nghị tuyển dụng"
}`;

      const aiResponse = await callOpenRouterAPI(prompt, apiKeys.openrouter!);

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setPrediction(parsed);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (err: any) {
      console.error('Error predicting:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Dự đoán tuyển dụng</h2>
      <p className="text-sm text-gray-600 mb-4">
        Dự đoán xác suất tuyển thành công dựa trên profile ứng viên.
      </p>

      <div className="space-y-3">
        <div className="flex gap-2">
          <select 
            value={selectedCV}
            onChange={(e) => setSelectedCV(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          >
            <option value="">Chọn ứng viên...</option>
            {cvs.map(cv => (
              <option key={cv.id} value={cv.id}>
                {cv.full_name} - {cv.university || 'N/A'}
              </option>
            ))}
          </select>
          <button 
            onClick={handlePredict}
            disabled={loading || !selectedCV}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Đang dự đoán..." : "Chạy dự đoán"}
          </button>
        </div>

        {prediction && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-3">Kết quả dự đoán:</div>
            
            <div className="p-3 bg-white rounded shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Xác suất tuyển dụng thành công:</span>
                <strong className={`text-2xl ${
                  prediction.probability >= 70 ? "text-green-600" : 
                  prediction.probability >= 50 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {prediction.probability}%
                </strong>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    prediction.probability >= 70 ? "bg-green-500" : 
                    prediction.probability >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${prediction.probability}%` }}
                />
              </div>
            </div>

            {prediction.reason && (
              <div className="p-3 bg-white rounded shadow-sm mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Phân tích:</div>
                <p className="text-sm text-gray-600">{prediction.reason}</p>
              </div>
            )}

            {prediction.strengths && prediction.strengths.length > 0 && (
              <div className="p-3 bg-white rounded shadow-sm mb-3">
                <div className="text-sm font-medium text-green-700 mb-2">✓ Điểm mạnh:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {prediction.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {prediction.weaknesses && prediction.weaknesses.length > 0 && (
              <div className="p-3 bg-white rounded shadow-sm mb-3">
                <div className="text-sm font-medium text-red-700 mb-2">⚠ Điểm cần cải thiện:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {prediction.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {prediction.recommendation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm font-medium text-blue-800 mb-1">💡 Khuyến nghị:</div>
                <p className="text-sm text-blue-700">{prediction.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for OpenRouter API calls
async function callOpenRouterAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CV Recruitment System'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Bạn là AI Assistant chuyên nghiệp hỗ trợ tuyển dụng. Trả lời chính xác, ngắn gọn bằng tiếng Việt.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  throw new Error('Invalid OpenRouter response format');
}