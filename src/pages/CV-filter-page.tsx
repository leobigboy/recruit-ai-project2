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
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

// ==================== TOAST ====================
const useToast = () => ({
  toast: (options: { title: string; description: string; duration: number }) => {
    alert(`${options.title}\n${options.description}`)
  },
})

// ==================== UI COMPONENTS (FIXED) ====================
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

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${className}`}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", ...props }, ref) => (
    <label ref={ref} className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`} {...props} />
  ),
)
Label.displayName = "Label"

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

// ==================== DROPDOWN (FIXED) ====================
interface DropdownMenuProps {
  children: React.ReactNode
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      {React.Children.map(children, (child: any) => {
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, { onClick: () => setOpen(!open) })
        }
        if (child.type === DropdownMenuContent) {
          return open ? React.cloneElement(child, { setOpen }) : null
        }
        return child
      })}
    </>
  )
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  onClick?: () => void
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild = false, onClick, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick,
        ref,
        ...props,
      })
    }

    return (
      <button ref={ref} onClick={onClick} {...props}>
        {children}
      </button>
    )
  },
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: string
  setOpen?: (open: boolean) => void
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className = "", align, setOpen, ...props }, ref) => (
    <div
      ref={ref}
      className={`absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ${className}`}
      {...props}
    />
  ),
)
DropdownMenuContent.displayName = "DropdownMenuContent"

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 ${className}`}
      {...props}
    />
  ),
)
DropdownMenuItem.displayName = "DropdownMenuItem"

// ==================== DIALOG (FIXED) ====================
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

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        ...props,
      })
    }

    return (
      <button ref={ref} {...props}>
        {children}
      </button>
    )
  },
)
DialogTrigger.displayName = "DialogTrigger"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`relative rounded-xl border border-gray-200 bg-white shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`}
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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = "", ...props }, ref) => (
  <textarea
    className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all ${className}`}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

// ==================== TYPES ====================
interface CVData {
  id: string
  name: string
  position: string
  experience: string
  skills: string[]
  score: number
  status: string
  match_percentage: number
  file_name: string
  file_type: string
  email: string
  phone?: string
  address?: string
  education?: string
  university?: string
  full_text?: string
  ai_analysis?: {
    strengths: string[]
    weaknesses: string[]
    recommendation: string
  }
  created_at?: string
}

type SortOption = "score-desc" | "score-asc" | "match-desc" | "match-asc"

// ==================== MAIN COMPONENT ====================
export default function CVFilterPage() {
  const { toast } = useToast()

  // State
  const [cvs, setCvs] = React.useState<CVData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [selectedCV, setSelectedCV] = React.useState<CVData | null>(null)
  const [sortBy, setSortBy] = React.useState<SortOption>("score-desc")
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])
  const [showCVDetail, setShowCVDetail] = React.useState(false)
  const [showEmailModal, setShowEmailModal] = React.useState(false)
  const [emailData, setEmailData] = React.useState({
    subject: "",
    message: "",
    interviewDate: "",
    interviewTime: "",
  })
  const [statistics, setStatistics] = React.useState({
    totalCVs: 0,
    avgScore: 0,
    qualifiedCVs: 0,
  })

  // Fetch CVs từ Supabase
  const fetchCVs = React.useCallback(async () => {
    try {
      setIsLoading(true)
      let query = supabase.from("cvs").select("*")

      // Apply sorting
      switch (sortBy) {
        case "score-desc":
          query = query.order("score", { ascending: false })
          break
        case "score-asc":
          query = query.order("score", { ascending: true })
          break
        case "match-desc":
          query = query.order("match_percentage", { ascending: false })
          break
        case "match-asc":
          query = query.order("match_percentage", { ascending: true })
          break
      }

      const { data, error } = await query

      if (error) throw error

      setCvs(data || [])
    } catch (error) {
      console.error("Error fetching CVs:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách CV",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, toast])

  // Fetch statistics
  const fetchStatistics = React.useCallback(async () => {
    try {
      const { data, error } = await supabase.from("cvs").select("score, match_percentage")

      if (error) throw error

      const totalCVs = data?.length || 0
      const avgScore = data?.reduce((sum, cv) => sum + cv.score, 0) / totalCVs || 0
      const qualifiedCVs = data?.filter((cv) => cv.score >= 80).length || 0

      setStatistics({
        totalCVs,
        avgScore: Math.round(avgScore * 10) / 10,
        qualifiedCVs,
      })
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }, [])

  // Load data on mount
  React.useEffect(() => {
    fetchCVs()
  }, [fetchCVs])

  React.useEffect(() => {
    fetchStatistics()
  }, [cvs, fetchStatistics])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files).filter((file) => {
        const supportedFormats = [".pdf", ".doc", ".docx", ".txt", ".rtf"]
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
        return supportedFormats.includes(fileExtension)
      })
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  // Analyze CVs
  const handleAIAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Chưa có file",
        description: "Vui lòng upload CV trước khi phân tích",
        duration: 3000,
      })
      return
    }

    setIsAnalyzing(true)

    try {
      for (const file of uploadedFiles) {
        const formData = new FormData()
        formData.append("file", file)

        // Call backend API
        const response = await fetch("http://localhost:8000/api/parse-cv", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          // Save to Supabase
          const confidence = result.metadata?.confidence || 0.7
          const cvData = {
            name: result.data.name || "Unknown",
            email: result.data.email || "",
            phone: result.data.phone || "",
            address: result.data.address || "",
            position: result.data.position || "N/A",
            experience: result.data.experience || "",
            education: result.data.education || "",
            university: result.data.university || "",
            skills: result.data.skills || [],
            score: Math.round(confidence * 100),
            status: confidence >= 0.9 ? "Rất phù hợp" : confidence >= 0.75 ? "Phù hợp" : "Cần xem xét",
            match_percentage: Math.round(confidence * 100),
            file_name: file.name,
            file_type: file.type,
            full_text: result.data.fullText || "",
            ai_analysis: {
              strengths: ["Parsed from CV successfully"],
              weaknesses: ["Needs manual review"],
              recommendation: "Candidate profile extracted by AI",
            },
          }

          const { error } = await supabase.from("cvs").insert([cvData])

          if (error) throw error
        }
      }

      // Refresh data
      await fetchCVs()
      await fetchStatistics()
      setUploadedFiles([])

      toast({
        title: "Phân tích thành công!",
        description: `Đã phân tích và lưu ${uploadedFiles.length} CV`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error analyzing CVs:", error)
      toast({
        title: "Lỗi phân tích",
        description: "Không thể phân tích CV, vui lòng thử lại",
        duration: 3000,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rất phù hợp":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "Phù hợp":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "Cần xem xét":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Rất phù hợp":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case "Phù hợp":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "Cần xem xét":
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getSortLabel = (sortOption: SortOption) => {
    switch (sortOption) {
      case "score-desc":
        return "Điểm số: Cao → Thấp"
      case "score-asc":
        return "Điểm số: Thấp → Cao"
      case "match-desc":
        return "Độ phù hợp: Cao → Thấp"
      case "match-asc":
        return "Độ phù hợp: Thấp → Cao"
      default:
        return "Sắp xếp"
    }
  }

  const handleInviteInterview = (cv: CVData) => {
    setSelectedCV(cv)
    setEmailData({
      subject: `Mời phỏng vấn vị trí ${cv.position}`,
      message: `Chào ${cv.name},\n\nChúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia phỏng vấn cho vị trí ${cv.position}.\n\nVui lòng xác nhận thời gian phù hợp với bạn.\n\nTrân trọng,\nTeam HR`,
      interviewDate: "",
      interviewTime: "",
    })
    setShowEmailModal(true)
  }

  const handleSendEmail = () => {
    console.log("Sending email:", emailData, "to:", selectedCV?.name)
    setShowEmailModal(false)
    setEmailData({ subject: "", message: "", interviewDate: "", interviewTime: "" })
    toast({
      title: "Email đã được gửi thành công!",
      description: `Đã gửi email mời phỏng vấn tới ${selectedCV?.name}`,
      duration: 3000,
    })
  }

  const handleDownloadCV = (cv: CVData) => {
    const mockContent = `CV của ${cv.name}\nVị trí: ${cv.position}\nKinh nghiệm: ${cv.experience}\nKỹ năng: ${cv.skills.join(", ")}`
    const blob = new Blob([mockContent], { type: cv.file_type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = cv.file_name
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    toast({
      title: "Tải CV thành công!",
      description: `Đã tải xuống ${cv.file_name}`,
      duration: 3000,
    })
  }

  // ==================== RENDER ====================
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
              Lọc và phân tích CV bằng AI thông minh
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => {
              fetchCVs()
              fetchStatistics()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Tổng CV đã lọc</CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{statistics.totalCVs}</div>
              <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Real-time data
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900">Điểm trung bình</CardTitle>
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{statistics.avgScore.toFixed(1)}</div>
              <p className="text-xs text-emerald-700 mt-1">Điểm AI trung bình</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">CV phù hợp</CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{statistics.qualifiedCVs}</div>
              <p className="text-xs text-purple-700 mt-1">Điểm số ≥ 80</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Thời gian xử lý</CardTitle>
              <div className="p-2 bg-amber-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">2.3s</div>
              <p className="text-xs text-amber-700 mt-1">Trung bình mỗi CV</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Upload className="h-5 w-5 text-white" />
              </div>
              Tải lên CV để phân tích
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="cv-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Kéo thả hoặc click để tải CV</p>
                    <p className="text-xs text-gray-500">Hỗ trợ: PDF, DOC, DOCX, TXT, RTF</p>
                  </div>
                  <Input
                    id="cv-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.rtf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </Label>
              </div>
              <Button onClick={handleAIAnalysis} disabled={isAnalyzing} className="gap-2 h-auto py-4 px-6">
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="flex flex-col items-start">
                      <span className="font-semibold">Đang phân tích...</span>
                      <span className="text-xs opacity-90">Vui lòng chờ</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    <span className="flex flex-col items-start">
                      <span className="font-semibold">Phân tích bằng AI</span>
                      <span className="text-xs opacity-90">Nhanh & chính xác</span>
                    </span>
                  </>
                )}
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Đã tải lên ({uploadedFiles.length} file)
                </p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <Badge key={index} variant="secondary" className="gap-1.5 py-1.5 px-3">
                      <FileText className="h-3.5 w-3.5" />
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div>Kết quả phân tích</div>
                  <div className="text-sm font-normal text-gray-500 mt-0.5">{cvs.length} ứng viên được tìm thấy</div>
                </div>
              </CardTitle>

              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Filter className="h-4 w-4" />
                      {getSortLabel(sortBy)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setSortBy("score-desc")}>
                      <ArrowDown className="h-4 w-4 mr-2 text-blue-600" />
                      Điểm số: Cao → Thấp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("score-asc")}>
                      <ArrowUp className="h-4 w-4 mr-2 text-blue-600" />
                      Điểm số: Thấp → Cao
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("match-desc")}>
                      <Target className="h-4 w-4 mr-2 text-emerald-600" />
                      Độ phù hợp: Cao → Thấp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("match-asc")}>
                      <Target className="h-4 w-4 mr-2 text-emerald-600" />
                      Độ phù hợp: Thấp → Cao
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : isAnalyzing ? (
              <div className="space-y-4">
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                      <Brain className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">AI đang phân tích CV...</h3>
                  <p className="text-gray-600 mb-6">Vui lòng chờ trong giây lát</p>
                  <Progress value={65} className="w-full max-w-sm mx-auto h-3" />
                  <p className="text-sm text-gray-500 mt-3">Đang xử lý 65%</p>
                </div>
              </div>
            ) : cvs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có CV nào</h3>
                <p className="text-gray-600">Upload CV để bắt đầu phân tích</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cvs.map((cv) => (
                  <Card
                    key={cv.id}
                    className="border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-all"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{cv.name}</h3>
                            <Badge className={`${getStatusColor(cv.status)} gap-1.5 py-1 px-2.5`}>
                              {getStatusIcon(cv.status)}
                              <span className="font-medium">{cv.status}</span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Vị trí</p>
                              <p className="font-semibold text-gray-900">{cv.position}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Kinh nghiệm</p>
                              <p className="font-semibold text-gray-900">{cv.experience}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Kỹ năng</p>
                            <div className="flex flex-wrap gap-2">
                              {cv.skills && cv.skills.length > 0 ? (
                                cv.skills.map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs py-1 px-3 bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {skill}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">Không có thông tin</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-2 font-medium">Điểm AI</p>
                              <div className="flex items-center gap-3">
                                <Progress value={cv.score} className="flex-1 h-2.5" />
                                <span className="font-bold text-lg text-gray-900 min-w-[60px]">{cv.score}/100</span>
                              </div>
                            </div>
                            <div className="text-center px-4 py-2 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                              <p className="text-xs text-emerald-700 font-medium mb-0.5">Độ phù hợp</p>
                              <p className="font-bold text-xl text-emerald-700">{cv.match_percentage}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCV(cv)
                              setShowCVDetail(true)
                            }}
                            className="w-full justify-start gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadCV(cv)}
                            className="w-full justify-start gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Tải CV
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleInviteInterview(cv)}
                            className="w-full justify-start gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Mời phỏng vấn
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CV Detail Dialog */}
        <Dialog open={showCVDetail} onOpenChange={setShowCVDetail}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div>Phân tích AI chi tiết</div>
                  <div className="text-sm font-normal text-gray-600 mt-0.5">{selectedCV?.name}</div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedCV && (
              <div className="p-6 space-y-6">
                <Tabs defaultValue="analysis" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis">Phân tích</TabsTrigger>
                    <TabsTrigger value="strengths">Điểm mạnh</TabsTrigger>
                    <TabsTrigger value="recommendation">Khuyến nghị</TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-xl border border-emerald-200">
                        <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Điểm mạnh
                        </h4>
                        <ul className="space-y-2">
                          {selectedCV.ai_analysis?.strengths && selectedCV.ai_analysis.strengths.length > 0 ? (
                            selectedCV.ai_analysis.strengths.map((strength, index) => (
                              <li key={index} className="text-sm flex items-start gap-2 text-emerald-800">
                                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-emerald-800">Chưa có thông tin</li>
                          )}
                        </ul>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-xl border border-amber-200">
                        <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Điểm cần cải thiện
                        </h4>
                        <ul className="space-y-2">
                          {selectedCV.ai_analysis?.weaknesses && selectedCV.ai_analysis.weaknesses.length > 0 ? (
                            selectedCV.ai_analysis.weaknesses.map((weakness, index) => (
                              <li key={index} className="text-sm flex items-start gap-2 text-amber-800">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                {weakness}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-amber-800">Chưa có thông tin</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="strengths">
                    <div className="space-y-3">
                      {selectedCV.ai_analysis?.strengths && selectedCV.ai_analysis.strengths.length > 0 ? (
                        selectedCV.ai_analysis.strengths.map((strength, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg"
                          >
                            <p className="text-sm text-emerald-900 font-medium">{strength}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Chưa có thông tin</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendation">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Khuyến nghị của AI
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {selectedCV.ai_analysis?.recommendation || "Chưa có khuyến nghị"}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowCVDetail(false)}>
                    Đóng
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCVDetail(false)
                      handleInviteInterview(selectedCV!)
                    }}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Mời phỏng vấn
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Email Modal */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div>Gửi email mời phỏng vấn</div>
                  <div className="text-sm font-normal text-gray-600 mt-0.5">{selectedCV?.name}</div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interview-date">Ngày phỏng vấn</Label>
                  <Input
                    id="interview-date"
                    type="date"
                    value={emailData.interviewDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmailData((prev) => ({ ...prev, interviewDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="interview-time">Giờ phỏng vấn</Label>
                  <Input
                    id="interview-time"
                    type="time"
                    value={emailData.interviewTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmailData((prev) => ({ ...prev, interviewTime: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email-subject">Tiêu đề email</Label>
                <Input
                  id="email-subject"
                  value={emailData.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmailData((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  placeholder="Nhập tiêu đề email..."
                />
              </div>

              <div>
                <Label htmlFor="email-message">Nội dung email</Label>
                <Textarea
                  id="email-message"
                  value={emailData.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEmailData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Nhập nội dung email..."
                  rows={8}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSendEmail} className="gap-2">
                  <Send className="h-4 w-4" />
                  Gửi email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}