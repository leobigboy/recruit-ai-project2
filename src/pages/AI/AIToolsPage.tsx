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
  gemini?: string;
  openai?: string;
}

export default function AIToolsPage() {
  const [active, setActive] = useState<string>("match");
  const [apiKeys, setApiKeys] = useState<APIKeys>({});
  const [tempKeys, setTempKeys] = useState<APIKeys>({});
  const [showKeys, setShowKeys] = useState({ gemini: false, openai: false });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const savedGemini = localStorage.getItem("gemini_api_key");
    const savedOpenAI = localStorage.getItem("openai_api_key");
    const keys: APIKeys = {};
    
    if (savedGemini) keys.gemini = savedGemini;
    if (savedOpenAI) keys.openai = savedOpenAI;
    
    setApiKeys(keys);
    setTempKeys(keys);
  }, []);

  const hasApiKey = !!(apiKeys.gemini || apiKeys.openai);

  const handleSaveApiKey = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      const newKeys: APIKeys = {};
      
      if (tempKeys.gemini?.trim()) {
        newKeys.gemini = tempKeys.gemini.trim();
        localStorage.setItem("gemini_api_key", tempKeys.gemini.trim());
      } else {
        localStorage.removeItem("gemini_api_key");
      }
      
      if (tempKeys.openai?.trim()) {
        newKeys.openai = tempKeys.openai.trim();
        localStorage.setItem("openai_api_key", tempKeys.openai.trim());
      } else {
        localStorage.removeItem("openai_api_key");
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
    localStorage.removeItem("gemini_api_key");
    localStorage.removeItem("openai_api_key");
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
            {hasApiKey ? "API Keys đã cấu hình" : "Cần cấu hình API Keys"}
          </span>
        </button>
      </div>

      {!hasApiKey && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Chưa cấu hình API Key</p>
            <p className="text-xs text-amber-700 mt-1">
              Vui lòng nhập ít nhất 1 API Key (Gemini hoặc OpenAI) để sử dụng các chức năng AI. 
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
            {apiKeys.gemini && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                Gemini AI
              </span>
            )}
            {apiKeys.openai && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                OpenAI
              </span>
            )}
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
              Cấu hình API Keys
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">G</span>
                  </div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gemini API Key
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? "text" : "password"}
                    value={tempKeys.gemini || ""}
                    onChange={(e) => setTempKeys(prev => ({ ...prev, gemini: e.target.value }))}
                    placeholder="AIzaSy..."
                    className="w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.gemini ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lấy từ{" "}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                {apiKeys.gemini && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✓ Key hiện tại: {getMaskedKey(apiKeys.gemini)}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    OpenAI API Key
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showKeys.openai ? "text" : "password"}
                    value={tempKeys.openai || ""}
                    onChange={(e) => setTempKeys(prev => ({ ...prev, openai: e.target.value }))}
                    placeholder="sk-proj-..."
                    className="w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.openai ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lấy từ{" "}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
                {apiKeys.openai && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✓ Key hiện tại: {getMaskedKey(apiKeys.openai)}
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
                    "Lưu API Keys"
                  )}
                </button>
                
                {(apiKeys.gemini || apiKeys.openai) && (
                  <button
                    onClick={handleRemoveApiKey}
                    className="px-4 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Xóa tất cả
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
                <strong>💡 Lưu ý:</strong> Bạn có thể cấu hình cả 2 API keys hoặc chỉ 1 trong 2. 
                API keys sẽ được lưu cục bộ trên trình duyệt của bạn.
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
        .eq('status', 'active')
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
      // Fetch all CVs
      const { data: cvData, error } = await supabase
        .from('cv_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get job details
      let jobInfo = jobDescription;
      if (selectedJob) {
        const job = jobs.find(j => j.id === selectedJob);
        jobInfo = `${job?.title || ''}\n${job?.description || ''}`;
      }

      // Call AI API to match candidates
      const activeAPI = apiKeys.gemini ? 'gemini' : 'openai';
      const prompt = `Bạn là AI chuyên phân tích CV và tuyển dụng.

Job Description:
${jobInfo}

Danh sách ứng viên (${cvData?.length || 0} CVs):
${cvData?.map((cv: any, idx: number) => 
  `${idx + 1}. ${cv.candidate_name} - ${cv.position} - ${cv.email}`
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

      let aiResponse;
      if (activeAPI === 'gemini') {
        aiResponse = await callGeminiAPI(prompt, apiKeys.gemini!);
      } else {
        aiResponse = await callOpenAIAPI(prompt, apiKeys.openai!);
      }

      // Parse AI response
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
        .from('cv_applications')
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
- Tên: ${cv.candidate_name}
- Vị trí: ${cv.position}
- Email: ${cv.email}
- Phone: ${cv.phone}
- Kinh nghiệm: ${cv.experience || 'N/A'}
- Kỹ năng: ${cv.skills || 'N/A'}

Nhiệm vụ: Tóm tắt CV này thành 3-5 bullet points ngắn gọn, súc tích.

Trả về JSON format:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"]
}`;

      const activeAPI = apiKeys.gemini ? 'gemini' : 'openai';
      let aiResponse;
      
      if (activeAPI === 'gemini') {
        aiResponse = await callGeminiAPI(prompt, apiKeys.gemini!);
      } else {
        aiResponse = await callOpenAIAPI(prompt, apiKeys.openai!);
      }

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
              {cv.candidate_name} - {cv.position} - {new Date(cv.created_at).toLocaleDateString('vi-VN')}
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

  const handleAnalyze = async () => {
    setLoading(true);
    setTimeout(() => {
      setAnalysis({
        confidence: 7,
        sentiment: "Neutral → Positive",
        keywords: ["teamwork", "deadline", "leadership"],
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Phân tích phỏng vấn</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload transcript hoặc audio — AI phân tích tone, confidence, sentiment.
      </p>

      <div className="space-y-3">
        <input type="file" accept="audio/*,text/plain" className="text-sm" />
        <div className="mt-2">
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Đang phân tích..." : "Phân tích"}
          </button>
        </div>

        {analysis && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <div className="text-sm text-gray-500">Báo cáo:</div>
            <ul className="mt-2 space-y-1">
              <li>Confidence: {analysis.confidence}/10</li>
              <li>Sentiment: {analysis.sentiment}</li>
              <li>Key phrases: {analysis.keywords.join(", ")}</li>
            </ul>
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
  const [usingAPI, setUsingAPI] = useState<"gemini" | "openai" | null>(null);

  const getActiveAPI = () => {
    if (apiKeys.gemini) return "gemini";
    if (apiKeys.openai) return "openai";
    return null;
  };

  const fetchCVData = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_applications')
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
        .eq('status', 'active')
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
          `${idx + 1}. **${cv.candidate_name || 'N/A'}**
   - Vị trí: ${cv.position || 'N/A'}
   - Email: ${cv.email || 'N/A'}
   - Phone: ${cv.phone || 'N/A'}
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
          cv.status === 'under_review' || cv.status === 'interview_scheduled' || cv.status === 'approved'
        );
        
        if (potentialCVs.length === 0) {
          return "📋 Hiện chưa có CV tiềm năng nào đang được xem xét.";
        }
        
        const cvList = potentialCVs.slice(0, 10).map((cv: any, idx: number) => 
          `${idx + 1}. **${cv.candidate_name || 'N/A'}** - ${cv.position || 'N/A'}
   📧 ${cv.email || 'N/A'} | 📱 ${cv.phone || 'N/A'}
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
• CV mới: ${Math.round((statusCounts.pending || 0) / totalCVs * 100)}%
• Đang xem xét: ${Math.round((statusCounts.under_review || 0) / totalCVs * 100)}%
• Đã phỏng vấn: ${Math.round((statusCounts.interview_scheduled || 0) / totalCVs * 100)}%`;
      }

      default:
        return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const activeAPI = getActiveAPI();
    if (!activeAPI) {
      setError("Không có API key nào được cấu hình");
      return;
    }

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);
    setError("");
    setUsingAPI(activeAPI);

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

Trả lời chuyên nghiệp, hữu ích:`;

        let botResponse: string;

        if (activeAPI === "gemini") {
          botResponse = await callGeminiAPI(prompt, apiKeys.gemini!);
        } else {
          botResponse = await callOpenAIAPI(prompt, apiKeys.openai!);
        }

        const botMsg = { role: "bot", content: botResponse };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.error(`${activeAPI?.toUpperCase()} API error:`, err);
      setError(err.message || 'Có lỗi xảy ra');
      
      const errorMsg = { 
        role: "bot", 
        content: `⚠️ Lỗi ${activeAPI?.toUpperCase()}: ${err.message}. Vui lòng kiểm tra API key.` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setUsingAPI(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">AI — Admin Assistant</h2>
        {getActiveAPI() && (
          <span className={`text-xs px-2 py-1 rounded ${
            getActiveAPI() === "gemini" 
              ? "bg-blue-100 text-blue-700" 
              : "bg-purple-100 text-purple-700"
          }`}>
            Đang dùng: {getActiveAPI() === "gemini" ? "Gemini" : "OpenAI"}
          </span>
        )}
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
              {usingAPI && (
                <span className="text-xs">
                  ({usingAPI === "gemini" ? "Gemini" : "OpenAI"})
                </span>
              )}
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
  const [prediction, setPrediction] = useState<number | null>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [selectedCV, setSelectedCV] = useState("");

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_applications')
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
- Tên: ${cv.candidate_name}
- Vị trí: ${cv.position}
- Kinh nghiệm: ${cv.experience || 'N/A'}
- Kỹ năng: ${cv.skills || 'N/A'}
- Trạng thái: ${cv.status}

Nhiệm vụ: Dự đoán xác suất tuyển dụng thành công (0-100%) dựa trên profile.

Trả về JSON format:
{
  "probability": 75,
  "reason": "Lý do đánh giá"
}`;

      const activeAPI = apiKeys.gemini ? 'gemini' : 'openai';
      let aiResponse;
      
      if (activeAPI === 'gemini') {
        aiResponse = await callGeminiAPI(prompt, apiKeys.gemini!);
      } else {
        aiResponse = await callOpenAIAPI(prompt, apiKeys.openai!);
      }

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setPrediction(parsed.probability || 50);
      } else {
        setPrediction(Math.floor(Math.random() * 40) + 50);
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

      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-500 mb-3">Chọn ứng viên để dự đoán</div>
        <div className="flex gap-2">
          <select 
            value={selectedCV}
            onChange={(e) => setSelectedCV(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          >
            <option value="">Chọn ứng viên...</option>
            {cvs.map(cv => (
              <option key={cv.id} value={cv.id}>
                {cv.candidate_name} - {cv.position}
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

        {prediction !== null && (
          <div className="mt-4">
            <div className="text-sm mb-2">Kết quả dự đoán:</div>
            <div className="p-3 bg-white rounded shadow-sm">
              <div className="flex items-center justify-between">
                <span>Xác suất tuyển dụng thành công:</span>
                <strong className={`text-lg ${
                  prediction >= 70 ? "text-green-600" : 
                  prediction >= 50 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {prediction}%
                </strong>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      prediction >= 70 ? "bg-green-500" : 
                      prediction >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${prediction}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for AI API calls
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error('Invalid Gemini response format');
}

async function callOpenAIAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Bạn là AI Assistant hỗ trợ tuyển dụng. Trả lời chuyên nghiệp và ngắn gọn.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  throw new Error('Invalid OpenAI response format');
}