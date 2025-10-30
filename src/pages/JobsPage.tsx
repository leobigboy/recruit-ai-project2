"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, FileText, CheckCircle, Users, Eye, Edit, Trash2, Share2, Copy, Sparkles, PenTool, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Đã đăng":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-700 border-0">{status}</Badge>
    case "Bản nháp":
      return <Badge className="bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300">{status}</Badge>
    case "Đã đóng":
      return <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-200">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

interface Job {
  id: string;
  created_at: string;
  title: string;
  department: string;
  status: string;
  level: string;
  job_type?: string;
  location?: string;
  work_location?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  cv_candidates: { count: number }[];
}

// ==================== AI SERVICE FUNCTION ====================
async function generateJobDescriptionAI(data: {
  title: string;
  level: string;
  department: string;
  work_location?: string;
  job_type?: string;
  language: string;
  keywords?: string;
}) {
  try {
    console.log('🎯 Calling backend to generate job description...');
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${API_URL}/api/generate-job-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📥 Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend error:', errorData);
      throw new Error(errorData.detail || `Backend error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Job description generated successfully');

    if (result.success && result.data) {
      return result.data;
    }

    throw new Error('Backend không trả về dữ liệu hợp lệ');

  } catch (error) {
    console.error('❌ Lỗi khi gọi backend:', error);
    throw error;
  }
}

export function JobsPage() {
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('manual');
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    work_location: '',
    level: 'Mid-level',
    job_type: 'Full-time',
    status: 'Bản nháp',
    description: '',
    requirements: '',
    benefits: '',
    posted_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiLanguage, setAiLanguage] = useState('vietnamese');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // States cho các chức năng khác
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAIQuestionsDialogOpen, setIsAIQuestionsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [aiQuestions, setAiQuestions] = useState('');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data: jobsData, error: jobsError } = await supabase
      .from('cv_jobs')
      .select('*, cv_candidates(count)')
      .order('created_at', { ascending: false });
    
    if (jobsData) {
      setJobs(jobsData as Job[]);
    }
    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
    }

    const { count, error: countError } = await supabase
      .from('cv_candidates')
      .select('*', { count: 'exact', head: true });

    if (count !== null) {
      setTotalCandidatesCount(count);
    }
    if (countError) {
      console.error('Error fetching total candidates count:', countError);
    }

    setLoading(false);
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // ==================== AI GENERATE FUNCTION ====================
  const handleAIGenerate = async () => {
    if (!formData.title || !formData.department) {
      alert('❌ Vui lòng điền đầy đủ: Tiêu đề vị trí và Phòng ban');
      return;
    }

    setGeneratingAI(true);

    try {
      const generatedContent = await generateJobDescriptionAI({
        title: formData.title,
        level: formData.level,
        department: formData.department,
        work_location: formData.work_location || 'Remote',
        job_type: formData.job_type || 'Full-time',
        language: aiLanguage,
        keywords: formData.requirements
      });

      setFormData(prev => ({
        ...prev,
        description: generatedContent.description,
        requirements: generatedContent.requirements,
        benefits: generatedContent.benefits
      }));

      setActiveTab('manual');
      
      alert('✅ Đã tạo gợi ý JD với AI thành công! Vui lòng kiểm tra và chỉnh sửa nếu cần.');
    } catch (error: any) {
      console.error('AI Generation error:', error);
      alert(`❌ Lỗi khi tạo JD với AI: ${error.message}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  // ==================== SUBMIT FUNCTION (ĐÃ SỬA - BỎ created_by) ====================
  const handleSubmit = async () => {
    if (!formData.title || !formData.department) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc: Tiêu đề vị trí và Phòng ban');
      return;
    }

    if (activeTab === 'manual') {
      if (!formData.description || !formData.requirements || !formData.benefits) {
        alert('Vui lòng điền đầy đủ: Mô tả công việc, Yêu cầu công việc và Quyền lợi');
        return;
      }
    }

    setIsSubmitting(true);

    // ✅ CHỈ GỬI CÁC FIELD CÓ TRONG DATABASE
    const dataToInsert = {
      title: formData.title,
      department: formData.department,
      location: formData.location || null,
      work_location: formData.work_location || null,
      level: formData.level,
      job_type: formData.job_type,
      status: formData.status,
      description: formData.description || null,
      requirements: formData.requirements || null,
      benefits: formData.benefits || null,
      posted_date: formData.posted_date
    };

    const { data, error } = await supabase
      .from('cv_jobs')
      .insert([dataToInsert])
      .select();

    if (error) {
      console.error('Error creating job:', error);
      alert(`Có lỗi xảy ra khi tạo JD: ${error.message}`);
    } else {
      alert('✅ Tạo JD thành công!');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        department: '',
        location: '',
        work_location: '',
        level: 'Mid-level',
        job_type: 'Full-time',
        status: 'Bản nháp',
        description: '',
        requirements: '',
        benefits: '',
        posted_date: new Date().toISOString().split('T')[0]
      });
      fetchJobs();
    }

    setIsSubmitting(false);
  };

  const handleReset = () => {
    setFormData({
      title: '',
      department: '',
      location: '',
      work_location: '',
      level: 'Mid-level',
      job_type: 'Full-time',
      status: 'Bản nháp',
      description: '',
      requirements: '',
      benefits: '',
      posted_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setEditFormData({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location || '',
      work_location: job.work_location || '',
      level: job.level,
      job_type: job.job_type || 'Full-time',
      status: job.status,
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateJob = async () => {
    if (!editFormData.title || !editFormData.department) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('cv_jobs')
      .update({
        title: editFormData.title,
        department: editFormData.department,
        location: editFormData.location || null,
        work_location: editFormData.work_location || null,
        level: editFormData.level,
        job_type: editFormData.job_type,
        status: editFormData.status,
        description: editFormData.description || null,
        requirements: editFormData.requirements || null,
        benefits: editFormData.benefits || null
      })
      .eq('id', editFormData.id);

    if (error) {
      console.error('Error updating job:', error);
      alert(`❌ Lỗi: ${error.message}`);
    } else {
      alert('✅ Đã cập nhật Job Description thành công!');
      setIsEditDialogOpen(false);
      setEditFormData(null);
      fetchJobs();
    }

    setIsSubmitting(false);
  };

  const handleCopy = async (job: Job) => {
    const dataToInsert = {
      title: `${job.title} (Copy)`,
      department: job.department,
      location: job.location || null,
      work_location: job.work_location || null,
      level: job.level,
      job_type: job.job_type || 'Full-time',
      status: 'Bản nháp',
      description: job.description || null,
      requirements: job.requirements || null,
      benefits: job.benefits || null,
      posted_date: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase
      .from('cv_jobs')
      .insert([dataToInsert]);

    if (error) {
      console.error('Error copying job:', error);
      alert(`❌ Lỗi khi sao chép: ${error.message}`);
    } else {
      alert('✅ Đã sao chép Job Description thành công!');
      fetchJobs();
    }
  };

  const handleShare = (job: Job) => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(jobUrl);
    alert('✅ Đã sao chép link chia sẻ vào clipboard!');
  };

  const handleGenerateAIQuestions = async (job: Job) => {
    setSelectedJob(job);
    setIsAIQuestionsDialogOpen(true);
    setGeneratingQuestions(true);
    setAiQuestions('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockQuestions = `# Câu hỏi phỏng vấn cho vị trí: ${job.title}

## Phần 1: Kiến thức chuyên môn
1. Hãy mô tả kinh nghiệm của bạn với các công nghệ liên quan đến vị trí ${job.title}?
2. Bạn đã từng giải quyết vấn đề kỹ thuật phức tạp nào? Cách tiếp cận của bạn là gì?
3. Trong dự án gần đây nhất, bạn đã đóng góp như thế nào?

## Phần 2: Kỹ năng mềm
4. Bạn xử lý xung đột trong team như thế nào?
5. Hãy chia sẻ về một lần bạn phải làm việc dưới áp lực deadline gấp rút?
6. Bạn cập nhật kiến thức mới trong lĩnh vực ${job.department} như thế nào?

## Phần 3: Tình huống thực tế
7. Nếu có một yêu cầu thay đổi đột xuất từ khách hàng, bạn sẽ xử lý ra sao?
8. Làm thế nào bạn đảm bảo chất lượng công việc của mình?
9. Bạn có kinh nghiệm làm việc với team remote không? Chia sẻ về điều đó?

## Phần 4: Định hướng phát triển
10. Mục tiêu nghề nghiệp của bạn trong 2-3 năm tới là gì?`;

      setAiQuestions(mockQuestions);
    } catch (error) {
      console.error('Error generating AI questions:', error);
      alert('❌ Lỗi khi tạo câu hỏi AI');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleCopyAIQuestions = () => {
    navigator.clipboard.writeText(aiQuestions);
    alert('✅ Đã sao chép câu hỏi vào clipboard!');
  };

  const handleDelete = (job: Job) => {
    setSelectedJob(job);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from('cv_jobs')
      .delete()
      .eq('id', selectedJob.id);

    if (error) {
      console.error('Error deleting job:', error);
      alert(`❌ Lỗi khi xóa: ${error.message}`);
    } else {
      alert('✅ Đã xóa Job Description thành công!');
      setIsDeleteDialogOpen(false);
      setSelectedJob(null);
      fetchJobs();
    }

    setIsDeleting(false);
  };

  const filteredJobs = jobs.filter((job) => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(lowerQuery) ||
      job.department.toLowerCase().includes(lowerQuery) ||
      (job.level || '').toLowerCase().includes(lowerQuery) ||
      (job.job_type || '').toLowerCase().includes(lowerQuery) ||
      (job.work_location || '').toLowerCase().includes(lowerQuery) ||
      (job.location || '').toLowerCase().includes(lowerQuery);

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(job => job.status === 'Đã đăng' || job.status === 'Published').length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mô tả công việc</h1>
          <p className="text-sm text-gray-500">Quản lý và tạo mô tả công việc</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('jobs.createNew')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Tổng JDs</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalJobs}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>+2</span>
                <span className="text-gray-500">so với tháng trước</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">JDs đang mở</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{openJobs}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>+50%</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Tổng ứng viên</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalCandidatesCount}</div>
              <p className="text-xs text-gray-500">+0</p>
            </CardContent>
          </Card>

          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Lượt xem</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-orange-600"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500">+0</p>
            </CardContent>
          </Card>
      </div>

      {/* Jobs Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Danh sách JD ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Tìm kiếm theo tiêu đề, phòng ban, vị trí..." 
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-gray-300">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="min-w-[180px] bg-white z-50 shadow-lg border border-gray-200" align="start" sideOffset={4}>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Đã đăng">Đã xuất bản</SelectItem>
                <SelectItem value="Bản nháp">Bản nháp</SelectItem>
                <SelectItem value="Đã đóng">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px] border-gray-300">
                <SelectValue placeholder="Tất cả phòng ban" />
              </SelectTrigger>
              <SelectContent className="min-w-[180px] bg-white z-50 shadow-lg border border-gray-200" align="start" sideOffset={4}>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg border-gray-200">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-gray-700 font-medium">Vị trí</TableHead>
                  <TableHead className="text-gray-700 font-medium">Phòng ban</TableHead>
                  <TableHead className="text-gray-700 font-medium">Địa điểm</TableHead>
                  <TableHead className="text-gray-700 font-medium">Trạng thái</TableHead>
                  <TableHead className="text-gray-700 font-medium">Ứng viên</TableHead>
                  <TableHead className="text-gray-700 font-medium">Lượt xem</TableHead>
                  <TableHead className="text-gray-700 font-medium">Ngày tạo</TableHead>
                  <TableHead className="text-right text-gray-700 font-medium">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-gray-500">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-gray-500">
                      Chưa có JD nào. Hãy tạo JD đầu tiên!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.level} • {job.job_type || 'Full-time'}</div>
                      </TableCell>
                      <TableCell className="text-gray-700">{job.department}</TableCell>
                      <TableCell className="text-gray-700">{job.work_location || job.location || '-'}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-gray-700">{job.cv_candidates[0]?.count || 0}</TableCell>
                      <TableCell className="text-gray-700">0</TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(job.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="top" className="w-48 bg-white z-50 shadow-lg border border-gray-200">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewDetails(job)}>
                              <Eye className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Xem chi tiết</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(job)}>
                              <Edit className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleCopy(job)}>
                              <Copy className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Sao chép</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleShare(job)}>
                              <Share2 className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Chia sẻ</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleGenerateAIQuestions(job)}>
                              <Sparkles className="mr-2 h-4 w-4 text-purple-600" />
                              <span>Tạo câu hỏi AI</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => handleDelete(job)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Xóa</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ==================== DIALOG TẠO JD MỚI ==================== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">Tạo mô tả công việc mới</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Sử dụng AI để tạo JD hoặc tạo thủ công</p>
              </div>
            </div>
          </DialogHeader>

          {/* Tab Selector */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Manual
            </button>
          </div>

          <div className="space-y-4 mt-4">
            {activeTab === 'ai' ? (
              <>
                {/* AI Tab Content */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Tạo JD tự động với AI</p>
                      <p className="text-xs text-blue-700 mt-1">
                        AI sẽ giúp bạn tạo mô tả công việc chuyên nghiệp dựa trên các thông tin cơ bản
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tiêu đề vị trí <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.title} onValueChange={(value) => handleInputChange('title', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn vị trí" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                        <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                        <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                        <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phòng ban <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cấp độ</label>
                    <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Mid-level" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Intern">Intern</SelectItem>
                        <SelectItem value="Junior">Junior</SelectItem>
                        <SelectItem value="Mid-level">Mid-level</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngôn ngữ JD</label>
                    <Select value={aiLanguage} onValueChange={setAiLanguage}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Kỹ năng cần thiết (tùy chọn)
                  </label>
                  <Textarea
                    placeholder="Ví dụ: React, Node.js, TypeScript, Git..."
                    className="min-h-[80px] resize-none"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Nhập các kỹ năng cần thiết để AI tạo JD phù hợp hơn
                  </p>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleAIGenerate}
                    disabled={generatingAI}
                  >
                    {generatingAI ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang tạo với AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Tạo gợi ý với AI
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Manual Tab Content */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tiêu đề vị trí <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.title} onValueChange={(value) => handleInputChange('title', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn vị trí" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                        <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                        <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                        <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phòng ban <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa điểm</label>
                    <Select value={formData.work_location} onValueChange={(value) => handleInputChange('work_location', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn địa điểm" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Ho Chi Minh City">Ho Chi Minh City</SelectItem>
                        <SelectItem value="Ha Noi">Hà Nội</SelectItem>
                        <SelectItem value="Da Nang">Đà Nẵng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại hình</label>
                    <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Full-time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cấp độ</label>
                    <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Mid-level" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Intern">Intern</SelectItem>
                        <SelectItem value="Junior">Junior</SelectItem>
                        <SelectItem value="Mid-level">Mid-level</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Bản nháp" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Bản nháp">Bản nháp</SelectItem>
                        <SelectItem value="Đã đăng">Đã đăng</SelectItem>
                        <SelectItem value="Đã đóng">Đã đóng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mô tả công việc <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Mô tả chi tiết về công việc, trách nhiệm..."
                    className="min-h-[100px] resize-none"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Yêu cầu công việc <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Yêu cầu về kỹ năng, kinh nghiệm..."
                    className="min-h-[100px] resize-none"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Quyền lợi <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Mô tả về lương thưởng, quyền lợi..."
                    className="min-h-[100px] resize-none"
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                  />
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="px-6"
                    onClick={handleReset}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Đang tạo...' : 'Tạo JD'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Xem chi tiết */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedJob?.title}</DialogTitle>
            <div className="flex gap-2 mt-2">
              {selectedJob && getStatusBadge(selectedJob.status)}
              <Badge variant="outline">{selectedJob?.department}</Badge>
              <Badge variant="outline">{selectedJob?.level}</Badge>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Loại hình</p>
                <p className="font-medium">{selectedJob?.job_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Địa điểm</p>
                <p className="font-medium">{selectedJob?.work_location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày tạo</p>
                <p className="font-medium">
                  {selectedJob && new Date(selectedJob.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ứng viên</p>
                <p className="font-medium">
                  {selectedJob?.cv_candidates && selectedJob.cv_candidates[0] 
                    ? selectedJob.cv_candidates[0].count 
                    : 0}
                </p>
              </div>
            </div>

            {selectedJob?.description && (
              <div>
                <h3 className="font-semibold text-base mb-2">Mô tả công việc</h3>
                <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedJob.description}
                </div>
              </div>
            )}

            {selectedJob?.requirements && (
              <div>
                <h3 className="font-semibold text-base mb-2">Yêu cầu công việc</h3>
                <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedJob.requirements}
                </div>
              </div>
            )}

            {selectedJob?.benefits && (
              <div>
                <h3 className="font-semibold text-base mb-2">Quyền lợi</h3>
                <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedJob.benefits}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Chỉnh sửa */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chỉnh sửa Job Description</DialogTitle>
          </DialogHeader>
          
          {editFormData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tiêu đề vị trí <span className="text-red-500">*</span>
                  </label>
                  <Select value={editFormData.title} onValueChange={(value) => handleEditInputChange('title', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                      <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                      <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                      <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                      <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                      <SelectItem value="Product Manager">Product Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phòng ban <span className="text-red-500">*</span>
                  </label>
                  <Select value={editFormData.department} onValueChange={(value) => handleEditInputChange('department', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa điểm</label>
                  <Select value={editFormData.work_location} onValueChange={(value) => handleEditInputChange('work_location', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Ho Chi Minh City">Ho Chi Minh City</SelectItem>
                      <SelectItem value="Ha Noi">Hà Nội</SelectItem>
                      <SelectItem value="Da Nang">Đà Nẵng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại hình</label>
                  <Select value={editFormData.job_type} onValueChange={(value) => handleEditInputChange('job_type', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cấp độ</label>
                  <Select value={editFormData.level} onValueChange={(value) => handleEditInputChange('level', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                      <SelectItem value="Intern">Intern</SelectItem>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid-level">Mid-level</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                  <Select value={editFormData.status} onValueChange={(value) => handleEditInputChange('status', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                      <SelectItem value="Bản nháp">Bản nháp</SelectItem>
                      <SelectItem value="Đã đăng">Đã đăng</SelectItem>
                      <SelectItem value="Đã đóng">Đã đóng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả công việc</label>
                <Textarea
                  placeholder="Mô tả chi tiết về công việc, trách nhiệm..."
                  className="min-h-[100px] resize-none"
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Yêu cầu công việc</label>
                <Textarea
                  placeholder="Yêu cầu về kỹ năng, kinh nghiệm..."
                  className="min-h-[100px] resize-none"
                  value={editFormData.requirements}
                  onChange={(e) => handleEditInputChange('requirements', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quyền lợi</label>
                <Textarea
                  placeholder="Mô tả về lương thưởng, quyền lợi..."
                  className="min-h-[100px] resize-none"
                  value={editFormData.benefits}
                  onChange={(e) => handleEditInputChange('benefits', e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="px-6"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleUpdateJob}
                  disabled={isSubmitting}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Câu hỏi AI */}
      <Dialog open={isAIQuestionsDialogOpen} onOpenChange={setIsAIQuestionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Câu hỏi phỏng vấn AI cho: {selectedJob?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {generatingQuestions ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600">Đang tạo câu hỏi với AI...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{aiQuestions}</pre>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopyAIQuestions}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Sao chép câu hỏi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAIQuestionsDialogOpen(false)}
                  >
                    Đóng
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Xác nhận xóa */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa Job Description</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa JD <strong>{selectedJob?.title}</strong> không? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default JobsPage