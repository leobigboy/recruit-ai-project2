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
  AlertCircle
} from "lucide-react";

/**
 * AIToolsPage - Trang chứa 5 tools AI với quản lý API key
 * User phải nhập API key trước khi sử dụng các chức năng AI
 */

const tabs = [
  { id: "match", label: "Gợi ý ứng viên", icon: Bot },
  { id: "summarize", label: "Tóm tắt CV", icon: FileText },
  { id: "analysis", label: "Phân tích phỏng vấn", icon: MessageSquare },
  { id: "chatbot", label: "Chatbot ứng viên", icon: MessageCircle },
  { id: "predict", label: "Dự đoán tuyển dụng", icon: TrendingUp },
];

export default function AIToolsPage() {
  const [active, setActive] = useState<string>("match");
  const [apiKey, setApiKey] = useState<string>("");
  const [tempKey, setTempKey] = useState<string>("");
  const [showKey, setShowKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load API key từ localStorage khi component mount
  useEffect(() => {
    const savedKey = localStorage.getItem("ai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setTempKey(savedKey);
    }
  }, []);

  // Kiểm tra xem có API key không
  const hasApiKey = apiKey.length > 0;

  // Hàm lưu API key
  const handleSaveApiKey = () => {
    if (tempKey.trim()) {
      setSaveStatus("saving");
      
      // Simulate API call
      setTimeout(() => {
        setApiKey(tempKey);
        localStorage.setItem("ai_api_key", tempKey);
        setSaveStatus("saved");
        
        setTimeout(() => {
          setShowApiKeyModal(false);
          setSaveStatus("idle");
        }, 1500);
      }, 500);
    }
  };

  // Hàm xóa API key
  const handleRemoveApiKey = () => {
    setApiKey("");
    setTempKey("");
    localStorage.removeItem("ai_api_key");
    setShowApiKeyModal(false);
  };

  // Masked API key display
  const getMaskedKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "••••••••";
    return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header với nút API Key */}
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

      {/* Warning nếu chưa có API key */}
      {!hasApiKey && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">Chưa cấu hình API Key</p>
            <p className="text-xs text-amber-700 mt-1">
              Vui lòng nhập API Key để sử dụng các chức năng AI. 
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

      {/* Tabs */}
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

      {/* Content area */}
      <div className="mt-4">
        {hasApiKey ? (
          <>
            {active === "match" && <CandidateMatchUI apiKey={apiKey} />}
            {active === "summarize" && <SummarizeCVUI apiKey={apiKey} />}
            {active === "analysis" && <InterviewAnalysisUI apiKey={apiKey} />}
            {active === "chatbot" && <ChatbotUI apiKey={apiKey} />}
            {active === "predict" && <RecruitPredictUI apiKey={apiKey} />}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Vui lòng cấu hình API Key để sử dụng chức năng AI</p>
          </div>
        )}
      </div>

      {/* Modal API Key */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Cấu hình API Key
            </h2>

            {/* Input API Key */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  API Key sẽ được lưu cục bộ trên trình duyệt của bạn
                </p>
              </div>

              {/* Current key info */}
              {apiKey && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Key hiện tại:</p>
                  <p className="font-mono text-sm">{getMaskedKey(apiKey)}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveApiKey}
                  disabled={!tempKey.trim() || saveStatus === "saving"}
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
                
                {apiKey && (
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
                    setTempKey(apiKey);
                    setSaveStatus("idle");
                  }}
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
              </div>
            </div>

            {/* Help text */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Lưu ý:</strong> Bạn cần có tài khoản Google và API key hợp lệ cho Gemini. 
                Có thể đăng ký tại{" "}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  aistudio.google.com
                </a>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                ⚠️ <strong>CORS Issue:</strong> Nếu gặp lỗi CORS khi gọi API, bạn cần chạy qua backend server hoặc sử dụng proxy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------ Tab UIs với API Key prop ------------------ */

interface TabUIProps {
  apiKey: string;
}

function CandidateMatchUI({ apiKey }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleRunMatch = async () => {
    setLoading(true);
    // Simulate API call với apiKey
    setTimeout(() => {
      setResults([
        { name: "Nguyễn A", score: 92, skills: "Frontend" },
        { name: "Trần B", score: 86, skills: "React/TS" },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Gợi ý ứng viên</h2>
      <p className="text-sm text-gray-600 mb-4">
        Chọn 1 job hoặc paste Job Description để AI trả về top ứng viên phù hợp.
      </p>

      <div className="space-y-3">
        <select className="w-full border rounded px-3 py-2">
          <option>Chọn job (ví dụ: Frontend)</option>
          <option>Backend</option>
          <option>Product Manager</option>
        </select>

        <textarea 
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
            <div className="text-sm text-gray-500">Kết quả:</div>
            <ul className="mt-2 space-y-2">
              {results.map((r, i) => (
                <li key={i} className="p-2 bg-white rounded shadow-sm">
                  {r.name} — Score: {r.score} — match kỹ năng {r.skills}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function SummarizeCVUI({ apiKey }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);

  const handleSummarize = async () => {
    setLoading(true);
    // Simulate API call với apiKey
    setTimeout(() => {
      setSummary([
        "Frontend engineer — 4 năm kinh nghiệm React/TypeScript.",
        "Tham gia dự án X với tối ưu performance, cải thiện 30% speed.",
        "Kỹ năng: React, Redux, Testing, CI/CD.",
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Tóm tắt CV</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload CV (PDF/Doc) hoặc paste nội dung — AI sẽ tóm tắt thành bullet.
      </p>

      <div className="flex gap-3 items-center">
        <input type="file" accept=".pdf,.doc,.docx,.txt" className="text-sm" />
        <button 
          onClick={handleSummarize}
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Đang tóm tắt..." : "Tóm tắt"}
        </button>
      </div>

      {summary.length > 0 && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <div className="text-sm text-gray-500">Tóm tắt:</div>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InterviewAnalysisUI({ apiKey }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    // Simulate API call với apiKey
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

function ChatbotUI({ apiKey }: TabUIProps) {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: "bot", content: "Xin chào! Tôi có thể giúp gì cho bạn về vị trí tuyển dụng?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      // Gọi backend server để proxy đến Gemini API
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Bạn là trợ lý AI hỗ trợ tuyển dụng. Trả lời ngắn gọn, thân thiện và hữu ích về các vấn đề liên quan đến tuyển dụng, công việc và quy trình phỏng vấn.'
            },
            ...messages.map(m => ({
              role: m.role === 'bot' ? 'model' : m.role,
              content: m.content
            })),
            { role: 'user', content: input }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API call failed');
      }

      const data = await response.json();
      const botResponse = data.reply;
      
      const botMsg = { 
        role: "bot", 
        content: botResponse 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error calling backend for Gemini:', err);
      setError(err.message || 'Có lỗi xảy ra khi kết nối với AI');
      
      // Fallback message
      const errorMsg = { 
        role: "bot", 
        content: `⚠️ Không thể kết nối với AI. Lỗi: ${err.message}. Vui lòng kiểm tra API key của bạn.` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Chatbot ứng viên</h2>
      <p className="text-sm text-gray-600 mb-4">
        Chat trực tiếp với bot để trả lời câu hỏi về job / quy trình tuyển dụng.
      </p>

      <div className="border rounded p-3 bg-white">
        <div className="h-64 overflow-auto p-3 bg-gray-50 rounded mb-3">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}>
              <span className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[80%] ${
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
              <div className="animate-pulse animation-delay-200">●</div>
              <div className="animate-pulse animation-delay-400">●</div>
            </div>
          )}
        </div>
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && handleSend()}
            className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Nhập câu hỏi về tuyển dụng..." 
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecruitPredictUI({ apiKey }: TabUIProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    // Simulate API call với apiKey
    setTimeout(() => {
      setPrediction(72);
      setLoading(false);
    }, 1500);
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">AI — Dự đoán tuyển dụng</h2>
      <p className="text-sm text-gray-600 mb-4">
        Dự đoán xác suất tuyển thành công / retention dựa trên dữ liệu lịch sử.
      </p>

      <div className="p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-500">Chọn ứng viên để dự đoán</div>
        <div className="mt-3 flex gap-2">
          <select className="border rounded px-3 py-2">
            <option>Nguyễn Văn A - Frontend Dev</option>
            <option>Trần Thị B - Backend Dev</option>
            <option>Lê Văn C - Product Manager</option>
          </select>
          <button 
            onClick={handlePredict}
            disabled={loading}
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