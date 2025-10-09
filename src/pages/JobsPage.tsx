// src/pages/JobsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, FileText, CheckCircle, Users, Eye, Edit, Trash2, Share2, Copy, Sparkles, PenTool, X } from 'lucide-react'
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
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Đã đăng":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-700 border-0">{status}</Badge>
    case "Bản nhập":
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
  cv_candidates: { count: number }[];
}

export function JobsPage() {
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
    status: 'Bản nhập',
    description: '',
    requirements: '',
    benefits: '',
    posted_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    // Validation cho cả 2 tab
    if (!formData.title || !formData.department) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc: Tiêu đề vị trí và Phòng ban');
      return;
    }

    // Validation riêng cho Manual tab
    if (activeTab === 'manual') {
      if (!formData.description || !formData.requirements || !formData.benefits) {
        alert('Vui lòng điền đầy đủ: Mô tả công việc, Yêu cầu công việc và Quyền lợi');
        return;
      }
    }

    setIsSubmitting(true);

    // Chuẩn bị data để insert
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
      alert('Tạo JD thành công!');
      setIsDialogOpen(false);
      // Reset form
      setFormData({
        title: '',
        department: '',
        location: '',
        work_location: '',
        level: 'Mid-level',
        job_type: 'Full-time',
        status: 'Bản nhập',
        description: '',
        requirements: '',
        benefits: '',
        posted_date: new Date().toISOString().split('T')[0]
      });
      fetchJobs(); // Refresh danh sách
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
      status: 'Bản nhập',
      description: '',
      requirements: '',
      benefits: '',
      posted_date: new Date().toISOString().split('T')[0]
    });
  };

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(job => job.status === 'Đã đăng').length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mô tả công việc</h1>
          <p className="text-sm text-gray-500">Quản lý và tạo mô tả công việc</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo JD mới
        </Button>
      </div>

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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Danh sách JD ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Tìm kiếm theo tiêu đề, phòng ban, vị trí..." 
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>
            <Select>
              <SelectTrigger className="w-[180px] border-gray-300">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="min-w-[180px] bg-white z-50 shadow-lg border border-gray-200" align="start" sideOffset={4}>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Đã đăng">Đã xuất bản</SelectItem>
                <SelectItem value="Bản nhập">Bản nhập</SelectItem>
                <SelectItem value="Đã đóng">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px] border-gray-300">
                <SelectValue placeholder="Tất cả phòng ban" />
              </SelectTrigger>
              <SelectContent className="min-w-[180px] bg-white z-50 shadow-lg border border-gray-200" align="start" sideOffset={4}>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="design">Design</SelectItem>
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
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-gray-500">
                      Chưa có JD nào. Hãy tạo JD đầu tiên!
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.level} • {job.job_type || 'Full-time'}</div>
                      </TableCell>
                      <TableCell className="text-gray-700">{job.department}</TableCell>
                      <TableCell className="text-gray-700">{job.work_location || job.location || 'Remote'}</TableCell>
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
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Xem chi tiết</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Sao chép</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Share2 className="mr-2 h-4 w-4 text-gray-600" />
                              <span>Chia sẻ</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Sparkles className="mr-2 h-4 w-4 text-purple-600" />
                              <span>Tạo câu hỏi AI</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
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

          <div className="mt-6 space-y-4">
            {activeTab === 'ai' ? (
              <>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cấp độ</label>
                    <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn cấp độ" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng ban</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại công ty</label>
                    <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn loại công ty" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Startup">Startup</SelectItem>
                        <SelectItem value="Product Company">Product Company</SelectItem>
                        <SelectItem value="Outsourcing">Outsourcing</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngôn ngữ</label>
                    <Select defaultValue="vietnamese">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tiếng Việt" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Từ khóa kỹ năng</label>
                  <Input
                    placeholder="VD: React, Node.js, PostgreSQL (phân cách bằng dấu phẩy)"
                    className="w-full"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                  />
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Đang tạo...' : 'Tạo gợi ý với AI'}
                  </Button>
                </div>
              </>
            ) : (
              <>
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
                        <SelectValue placeholder="Bản nhập" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Bản nhập">Bản nhập</SelectItem>
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
    </div>
  )
}

export default JobsPage