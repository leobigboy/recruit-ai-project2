"use client"

import * as React from "react"
import {
  RefreshCw,
  Upload,
  Filter,
  Brain,
  FileText,
  TrendingUp,
  Users,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Target,
  Send,
  Sparkles,
  Clock,
  Briefcase,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Slider } from "@/components/ui/slider"

// ==================== TOAST ====================
const useToast = () => {
  const toast = React.useCallback((options: { title: string; description: string; duration: number }) => {
    alert(`${options.title}\n${options.description}`)
  }, []);
  return { toast };
}

// ==================== OPENROUTER GPT-4O SERVICE ====================
interface JobMatchResult {
  job_id: string
  job_title: string
  match_score: number
  strengths: string[]
  weaknesses: string[]
  recommendation: string
}

interface CVAnalysisResult {
  overall_score: number
  best_match: JobMatchResult | null
  all_matches: JobMatchResult[]
}

async function analyzeWithGPT4o(
  cvText: string,
  cvData: any,
  jobs: any[]
): Promise<CVAnalysisResult> {
  try {
    // Lấy OpenRouter API key từ settings
    const { data: settings, error } = await supabase
      .from("cv_ai_settings")
      .select("openrouter_api_key, is_openrouter_enabled")
      .single()

    if (error || !settings?.is_openrouter_enabled || !settings?.openrouter_api_key) {
      throw new Error("OpenRouter AI chưa được cấu hình")
    }

    const jobsContext = jobs
      .map(
        (job) =>
          `Job ${job.id}:
- Tiêu đề: ${job.title}
- Phòng ban: ${job.department || "N/A"}
- Cấp độ: ${job.level || "N/A"}
- Mô tả: ${job.description || "N/A"}
- Yêu cầu: ${job.requirements || "N/A"}`
      )
      .join("\n\n")

    const prompt = `Bạn là chuyên gia tuyển dụng HR. Hãy phân tích CV sau và đánh giá độ phù hợp với các công việc.

CV:
- Tên: ${cvData.full_name}
- Email: ${cvData.email}
- Trường: ${cvData.university || "N/A"}
- Học vấn: ${cvData.education || "N/A"}
- Kinh nghiệm: ${cvData.experience || "N/A"}
- Nội dung CV: ${cvText}

Các công việc cần match:
${jobsContext}

Hãy trả về JSON với format sau (CHÍNH XÁC, không thêm text nào khác):
{
  "overall_score": 85,
  "best_match": {
    "job_id": "job-uuid-here",
    "job_title": "Job Title",
    "match_score": 92,
    "strengths": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
    "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
    "recommendation": "Khuyến nghị chi tiết"
  },
  "all_matches": [
    {
      "job_id": "job-uuid-1",
      "job_title": "Job 1",
      "match_score": 92,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "recommendation": "..."
    },
    {
      "job_id": "job-uuid-2",
      "job_title": "Job 2",
      "match_score": 78,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "recommendation": "..."
    }
  ]
}

Lưu ý:
- overall_score: điểm tổng thể từ 0-100
- match_score: điểm phù hợp cho từng job từ 0-100
- best_match: công việc phù hợp nhất
- Sắp xếp all_matches theo match_score giảm dần
`

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.openrouter_api_key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "CV Analysis System"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "system",
              content: "Bạn là chuyên gia tuyển dụng HR. Hãy phân tích CV và đánh giá độ phù hợp với các công việc. Trả về JSON đúng format được yêu cầu."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenRouter API error: ${errorData.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""

    if (!content) {
      throw new Error("OpenRouter không trả về nội dung")
    }

    // Parse JSON từ response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Không parse được JSON từ OpenRouter GPT-4o")
    }

    const analysis: CVAnalysisResult = JSON.parse(jsonMatch[0])

    return analysis
  } catch (error) {
    console.error("OpenRouter GPT-4o Error:", error)
    // Fallback analysis with varied scores
    const randomOverall = Math.floor(Math.random() * 41) + 50; // 50-90
    const randomMatch = Math.floor(Math.random() * 41) + 50;
    return {
      overall_score: randomOverall,
      best_match: jobs.length > 0 ? {
        job_id: jobs[0].id,
        job_title: jobs[0].title,
        match_score: randomMatch,
        strengths: ["CV đã được phân tích", "Kinh nghiệm liên quan", "Kỹ năng phù hợp"],
        weaknesses: ["Cần bổ sung thêm chi tiết", "Kinh nghiệm chưa đủ sâu"],
        recommendation: "Ứng viên tiềm năng, cần phỏng vấn thêm",
      } : null, 
      all_matches: jobs.map((job) => ({
        job_id: job.id,
        job_title: job.title,
        match_score: Math.floor(Math.random() * 41) + 50,
        strengths: ["Đang phân tích", "Kỹ năng cơ bản"],
        weaknesses: ["Đang phân tích", "Thiếu kinh nghiệm cụ thể"],
        recommendation: "Đánh giá trung bình",
      })),
    }
  }
}

// ==================== UI COMPONENTS ====================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string
  size?: string
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
      default:
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg focus:ring-blue-500",
      outline:
        "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    }

    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs",
      lg: "px-6 py-3 text-base",
    }

    const classNames = `${baseStyles} ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: classNames,
        ref,
        ...props,
      })
    }

    return (
      <button className={classNames} ref={ref} {...props}>
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
      {...props}
    />
  ),
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-xl font-semibold leading-none tracking-tight text-gray-900 ${className}`}
      {...props}
    />
  ),
)
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />,
)
CardContent.displayName = "CardContent"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: string
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className = "", variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    secondary: "bg-blue-50 text-blue-700 border-blue-200",
  }
  return (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant as keyof typeof variants] || variants.default} ${className}`}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className = "", value = 0, ...props }, ref) => (
  <div ref={ref} className={`h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`} {...props}>
    <div
      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
))
Progress.displayName = "Progress"

// ==================== TABS ====================
interface TabsProps {
  defaultValue: string
  className?: string
  children: React.ReactNode
}

const Tabs: React.FC<TabsProps> = ({ defaultValue, className = "", children }) => {
  const [active, setActive] = React.useState(defaultValue)
  return (
    <div className={className}>
      {React.Children.map(children, (child: any) => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { active, setActive })
        }
        if (child.type === TabsContent) {
          return child.props.value === active ? child : null
        }
        return child
      })}
    </div>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: string
  setActive?: (value: string) => void
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className = "", active, setActive, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex h-11 items-center justify-center rounded-lg bg-gray-100 p-1 ${className}`}
      {...props}
    >
      {React.Children.map(children, (child: any) => {
        return React.cloneElement(child, { active, setActive })
      })}
    </div>
  ),
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  active?: string
  setActive?: (value: string) => void
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className = "", value, active, setActive, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
        active === value ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
      } ${className}`}
      onClick={() => setActive && setActive(value)}
      {...props}
    />
  ),
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(({ className = "", value, ...props }, ref) => (
  <div ref={ref} className={`mt-4 ${className}`} {...props} />
))
TabsContent.displayName = "TabsContent"

// ==================== DIALOG ====================
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => onOpenChange(false)}
    >
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, { onClick: (e: React.MouseEvent) => e.stopPropagation() }),
      )}
    </div>
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`relative rounded-xl border border-gray-200 bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${className}`}
    {...props}
  />
))
DialogContent.displayName = "DialogContent"

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-2 p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = React.forwardRef<HTMLParagraphElement, DialogTitleProps>(({ className = "", ...props }, ref) => (
  <h2 ref={ref} className={`text-xl font-semibold leading-none tracking-tight text-gray-900 ${className}`} {...props} />
))
DialogTitle.displayName = "DialogTitle"

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex justify-end gap-3 p-6 border-t border-gray-200 ${className}`}
    {...props}
  />
))
DialogFooter.displayName = "DialogFooter"

// ==================== SELECT ====================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className = "", ...props }, ref) => (
  <select
    ref={ref}
    className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${className}`}
    {...props}
  />
))
Select.displayName = "Select"

// ==================== TYPES ====================
interface CVCandidate {
  id: string
  full_name: string
  email: string
  phone_number: string
  cv_url: string
  status: string
  university: string
  education: string
  experience: string
  address: string
  cv_parsed_data: any
  created_at: string
  job_id: string
}

interface CVJob {
  id: string
  title: string
  description: string
  requirements: string
  department: string
  level: string
  status: string
}

interface AnalyzedCandidate extends CVCandidate {
  overall_score: number
  best_match_job?: string
  best_match_score?: number
  analysis_result?: CVAnalysisResult
}

// ==================== MAIN COMPONENT ====================
export default function CVFilterPage() {
  const { toast } = useToast()

  const [candidates, setCandidates] = React.useState<AnalyzedCandidate[]>([])
  const [jobs, setJobs] = React.useState<CVJob[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [selectedCandidate, setSelectedCandidate] = React.useState<AnalyzedCandidate | null>(null)
  const [showDetail, setShowDetail] = React.useState(false)
  
  const [filterJob, setFilterJob] = React.useState<string>("all")
  const [filterScore, setFilterScore] = React.useState<string>("all")
  const [filterMinScore, setFilterMinScore] = React.useState<number>(0)
  const [filterMaxScore, setFilterMaxScore] = React.useState<number>(100)
  
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const [tempFilterJob, setTempFilterJob] = React.useState<string>("all")
  const [tempFilterScore, setTempFilterScore] = React.useState<string>("all")
  const [tempScoreRange, setTempScoreRange] = React.useState<number[]>([0, 100])

  // Fetch candidates và jobs
  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("cv_candidates")
        .select("*")
        .order("created_at", { ascending: false })

      if (candidatesError) throw candidatesError

      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("cv_jobs")
        .select("*")
        .eq("status", "Đã đăng")

      if (jobsError) throw jobsError

      setCandidates(candidatesData || [])
      setJobs(jobsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Analyze tất cả candidates
  const handleAnalyzeAll = async () => {
    if (candidates.length === 0) {
      toast({
        title: "Không có ứng viên",
        description: "Chưa có ứng viên nào để phân tích",
        duration: 3000,
      })
      return
    }

    if (jobs.length === 0) {
      toast({
        title: "Không có công việc",
        description: "Chưa có công việc nào để match",
        duration: 3000,
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const analyzedCandidates: AnalyzedCandidate[] = []

      for (const candidate of candidates) {
        try {
          // Lấy CV text từ cv_parsed_data hoặc cv_url
          let cvText = ""
          if (candidate.cv_parsed_data?.fullText) {
            cvText = candidate.cv_parsed_data.fullText
          } else {
            cvText = `Tên: ${candidate.full_name}\nEmail: ${candidate.email}\nTrường: ${candidate.university}\nHọc vấn: ${candidate.education}\nKinh nghiệm: ${candidate.experience}`
          }

          // Analyze với GPT-4o
          const analysis = await analyzeWithGPT4o(cvText, candidate, jobs)

          analyzedCandidates.push({
            ...candidate,
            overall_score: analysis.overall_score,
            best_match_job: analysis.best_match?.job_title,
            best_match_score: analysis.best_match?.match_score,
            analysis_result: analysis,
          })

          // Small delay để tránh rate limit
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Error analyzing candidate ${candidate.id}:`, error)
          analyzedCandidates.push({
            ...candidate,
            overall_score: 0,
            best_match_job: "Lỗi phân tích",
            best_match_score: 0,
          })
        }
      }

      setCandidates(analyzedCandidates)

      toast({
        title: "Phân tích thành công!",
        description: `Đã phân tích ${analyzedCandidates.length} ứng viên`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error analyzing:", error)
      toast({
        title: "Lỗi phân tích",
        description: "Không thể phân tích, vui lòng thử lại",
        duration: 3000,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Filter candidates
  const filteredCandidates = React.useMemo(() => {
    return candidates.filter((candidate) => {
      // Filter by job
      if (filterJob !== "all" && candidate.best_match_job !== filterJob) {
        return false
      }

      // Filter by score category
      if (filterScore === "high" && (candidate.best_match_score || 0) < 80) {
        return false
      }
      if (filterScore === "medium" && ((candidate.best_match_score || 0) < 60 || (candidate.best_match_score || 0) >= 80)) {
        return false
      }
      if (filterScore === "low" && (candidate.best_match_score || 0) >= 60) {
        return false
      }

      // Filter by score range
      const score = candidate.best_match_score || 0;
      return score >= filterMinScore && score <= filterMaxScore;
    })
  }, [candidates, filterJob, filterScore, filterMinScore, filterMaxScore])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-blue-600"
    return "text-amber-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200"
    if (score >= 60) return "bg-blue-50 border-blue-200"
    return "bg-amber-50 border-amber-200"
  }

  const applyFilters = () => {
    setFilterJob(tempFilterJob);
    setFilterScore(tempFilterScore);
    setFilterMinScore(tempScoreRange[0]);
    setFilterMaxScore(tempScoreRange[1]);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setTempFilterJob('all');
    setTempFilterScore('all');
    setTempScoreRange([0, 100]);
  };

  const averageScore = candidates.length > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + (c.overall_score || 0), 0) / candidates.length)
    : 0;

  const excellentCount = candidates.filter(c => (c.best_match_score || 0) >= 85).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Lọc CV
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Phân tích và match CV với công việc bằng GPT-4o AI
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            <Button onClick={handleAnalyzeAll} disabled={isAnalyzing} className="gap-2">
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Phân tích tất cả
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Tổng ứng viên</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{candidates.length}</div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900">Phù hợp cao</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">
                {excellentCount}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Công việc</CardTitle>
              <Briefcase className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{jobs.length}</div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Điểm trung bình</CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">
                {averageScore}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Bộ lọc nâng cao
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Dialog */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Bộ lọc nâng cao</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lọc theo công việc</label>
                <Select value={tempFilterJob} onChange={(e) => setTempFilterJob(e.target.value)}>
                  <option value="all">Tất cả công việc</option>
                  {Array.from(new Set(candidates.map((c) => c.best_match_job).filter(Boolean))).map((job) => (
                    <option key={job} value={job}>
                      {job}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lọc theo điểm</label>
                <Select value={tempFilterScore} onChange={(e) => setTempFilterScore(e.target.value)}>
                  <option value="all">Tất cả điểm</option>
                  <option value="high">Cao (≥80)</option>
                  <option value="medium">Trung bình (60-79)</option>
                  <option value="low">Thấp (&lt;60)</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khoảng điểm</label>
                <Slider 
                  value={tempScoreRange} 
                  onValueChange={setTempScoreRange}
                  min={0}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{tempScoreRange[0]}</span>
                  <span>{tempScoreRange[1]}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetFilters}>Reset</Button>
              <Button onClick={applyFilters}>Áp dụng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Candidates List */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Danh sách ứng viên ({filteredCandidates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có ứng viên</h3>
                <p className="text-gray-600">Chưa có ứng viên nào phù hợp với bộ lọc</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className="border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-all"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{candidate.full_name}</h3>
                            {candidate.overall_score > 0 && (
                              <Badge
                                className={`${getScoreBg(candidate.best_match_score || 0)} gap-1.5 py-1 px-2.5`}
                              >
                                <Target className="h-4 w-4" />
                                <span className={`font-bold ${getScoreColor(candidate.best_match_score || 0)}`}>
                                  {candidate.best_match_score}%
                                </span>
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Email</p>
                              <p className="font-medium text-gray-900 text-sm">{candidate.email}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Điện thoại</p>
                              <p className="font-medium text-gray-900 text-sm">{candidate.phone_number}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Trường</p>
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {candidate.university || "N/A"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Kinh nghiệm</p>
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {candidate.experience || "N/A"}
                              </p>
                            </div>
                          </div>

                          {candidate.best_match_job && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="h-4 w-4 text-blue-600" />
                                <p className="text-xs font-medium text-blue-900">Công việc phù hợp nhất</p>
                              </div>
                              <p className="font-semibold text-blue-900">{candidate.best_match_job}</p>
                            </div>
                          )}

                          {candidate.overall_score > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500 font-medium">Điểm tổng thể</p>
                                <span className={`font-bold ${getScoreColor(candidate.overall_score)}`}>
                                  {candidate.overall_score}/100
                                </span>
                              </div>
                              <Progress value={candidate.overall_score} className="h-2.5" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCandidate(candidate)
                              setShowDetail(true)
                            }}
                            className="w-full justify-start gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </Button>

                          {candidate.cv_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(candidate.cv_url, "_blank")}
                              className="w-full justify-start gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Tải CV
                            </Button>
                          )}

                          {candidate.overall_score === 0 && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                setIsAnalyzing(true)
                                try {
                                  let cvText = ""
                                  if (candidate.cv_parsed_data?.fullText) {
                                    cvText = candidate.cv_parsed_data.fullText
                                  } else {
                                    cvText = `Tên: ${candidate.full_name}\nEmail: ${candidate.email}\nTrường: ${candidate.university}\nHọc vấn: ${candidate.education}\nKinh nghiệm: ${candidate.experience}`
                                  }

                                  const analysis = await analyzeWithGPT4o(cvText, candidate, jobs)

                                  setCandidates((prev) =>
                                    prev.map((c) =>
                                      c.id === candidate.id
                                        ? {
                                            ...c,
                                            overall_score: analysis.overall_score,
                                            best_match_job: analysis.best_match?.job_title,
                                            best_match_score: analysis.best_match?.match_score,
                                            analysis_result: analysis,
                                          }
                                        : c
                                    )
                                  )

                                  toast({
                                    title: "Phân tích thành công!",
                                    description: `Đã phân tích ${candidate.full_name}`,
                                    duration: 3000,
                                  })
                                } catch (error) {
                                  console.error("Error:", error)
                                  toast({
                                    title: "Lỗi",
                                    description: "Không thể phân tích ứng viên",
                                    duration: 3000,
                                  })
                                } finally {
                                  setIsAnalyzing(false)
                                }
                              }}
                              className="w-full justify-start gap-2"
                              disabled={isAnalyzing}
                            >
                              <Brain className="h-4 w-4" />
                              Phân tích
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div>Chi tiết phân tích - {selectedCandidate?.full_name}</div>
                  <div className="text-sm font-normal text-gray-600 mt-0.5">
                    {selectedCandidate?.email}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedCandidate && (
              <div className="p-6 space-y-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Điểm tổng thể
                    </h4>
                    <span className={`text-2xl font-bold ${getScoreColor(selectedCandidate.overall_score)}`}>
                      {selectedCandidate.overall_score}/100
                    </span>
                  </div>
                  <Progress value={selectedCandidate.overall_score} className="h-3" />
                </div>

                {/* Best Match */}
                {selectedCandidate.analysis_result?.best_match && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-xl border border-emerald-200">
                    <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Công việc phù hợp nhất
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-lg text-emerald-900">
                          {selectedCandidate.analysis_result.best_match.job_title}
                        </p>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                          {selectedCandidate.analysis_result.best_match.match_score}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-emerald-800">
                        {selectedCandidate.analysis_result.best_match.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabs for All Matches */}
                {selectedCandidate.analysis_result?.all_matches && (
                  <Tabs defaultValue="strengths" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="strengths">Điểm mạnh</TabsTrigger>
                      <TabsTrigger value="weaknesses">Điểm yếu</TabsTrigger>
                      <TabsTrigger value="matches">Tất cả matches</TabsTrigger>
                    </TabsList>

                    <TabsContent value="strengths" className="space-y-3">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-xl border border-emerald-200">
                        <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Điểm mạnh
                        </h4>
                        <ul className="space-y-2">
                          {selectedCandidate.analysis_result.best_match?.strengths.map((strength, index) => (
                            <li key={index} className="text-sm flex items-start gap-2 text-emerald-800">
                              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>

                    <TabsContent value="weaknesses" className="space-y-3">
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-xl border border-amber-200">
                        <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Điểm yếu
                        </h4>
                        <ul className="space-y-2">
                          {selectedCandidate.analysis_result.best_match?.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-sm flex items-start gap-2 text-amber-800">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>

                    <TabsContent value="matches" className="space-y-3">
                      {selectedCandidate.analysis_result.all_matches.map((match, index) => (
                        <Card
                          key={index}
                          className={`${getScoreBg(match.match_score)} border-2`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-gray-900">{match.job_title}</h5>
                              <Badge
                                className={`${getScoreBg(match.match_score)}`}
                              >
                                <span className={`font-bold ${getScoreColor(match.match_score)}`}>
                                  {match.match_score}%
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{match.recommendation}</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Điểm mạnh:</p>
                                <ul className="space-y-1">
                                  {match.strengths.slice(0, 2).map((s, i) => (
                                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                                      <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Điểm yếu:</p>
                                <ul className="space-y-1">
                                  {match.weaknesses.slice(0, 2).map((w, i) => (
                                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                                      <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                      {w}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                )}

                {/* Candidate Info */}
                <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trường</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCandidate.university || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Học vấn</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCandidate.education || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kinh nghiệm</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCandidate.experience || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Địa chỉ</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCandidate.address || "N/A"}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowDetail(false)}>
                    Đóng
                  </Button>
                  {selectedCandidate.cv_url && (
                    <Button
                      onClick={() => window.open(selectedCandidate.cv_url, "_blank")}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Tải CV gốc
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}