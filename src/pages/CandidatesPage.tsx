// src/pages/CandidatesPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Eye, Edit, Trash2, Users, UserCheck, TrendingUp, Filter, Bot, Download, ListChecks, TriangleAlert, FileText, Brain, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import { parseCV, validateCVFile, type ParsedCV } from "@/utils/cvParser"

const getStatusBadge = (status: string) => {
  if (status === "Mới") return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">new</Badge>
  if (status === "Sàng lọc") return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">screening</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

interface Candidate {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone_number?: string;
  status: string;
  source: string;
  cv_jobs: {
    title: string;
    level: string;
  } | null;
}

interface Job {
  id: string;
  title: string;
  level: string;
}

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'basic' | 'cv'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCV | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    job_id: '',
    address: '',
    experience: '',
    education: '',
    university: '',
    status: 'Mới',
    source: '',
    skills: ''
  });

  useEffect(() => {
    async function getCandidates() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_candidates')
        .select(`*, cv_jobs ( title, level )`)
        .order('created_at', { ascending: false });

      if (data) {
        setCandidates(data as Candidate[]);
      }
      if (error) {
        console.error('Error fetching candidates:', error);
      }
      setLoading(false);
    }
    getCandidates();
  }, []);

  useEffect(() => {
    async function getJobs() {
      const { data, error } = await supabase
        .from('cv_jobs')
        .select('id, title, level')
        .order('title');

      if (data) {
        setJobs(data);
      }
      if (error) {
        console.error('Error fetching jobs:', error);
      }
    }
    getJobs();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone_number: '',
      job_id: '',
      address: '',
      experience: '',
      education: '',
      university: '',
      status: 'Mới',
      source: '',
      skills: ''
    });
    setCurrentTab('basic');
    setSelectedFile(null);
    setParsedData(null);
  };

  // Hàm xử lý khi chọn file
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validation = validateCVFile(file);
    if (!validation.valid) {
      alert(validation.error);
      event.target.value = ''; // Reset input
      return;
    }
    
    setSelectedFile(file);
    
    // Auto parse CV
    try {
      setIsUploading(true);
      const parsed = await parseCV(file);
      setParsedData(parsed);
      
      // Auto fill form nếu tìm thấy thông tin
      if (parsed.email && !formData.email) {
        handleInputChange('email', parsed.email);
      }
      if (parsed.phone && !formData.phone_number) {
        handleInputChange('phone_number', parsed.phone);
      }
      if (parsed.university && !formData.university) {
        handleInputChange('university', parsed.university);
      }
      if (parsed.skills && parsed.skills.length > 0) {
        handleInputChange('skills', parsed.skills.join(', '));
      }
      
      alert('✓ Đã phân tích CV thành công!\nThông tin đã được tự động điền.');
    } catch (error: any) {
      console.error('Error parsing CV:', error);
      alert('⚠ Không thể phân tích CV: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm xóa file đã chọn
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData(null);
    const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async () => {
    
    // Validate required fields
    if (!formData.full_name || !formData.email || !formData.job_id) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    setIsSaving(true);

    try {
      let cvUrl = null;
      let cvFileName = null;
      
      // Upload CV file nếu có
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomStr}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cv-files')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw new Error('Lỗi upload CV: ' + uploadError.message);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('cv-files')
          .getPublicUrl(fileName);
        
        cvUrl = urlData.publicUrl;
        cvFileName = selectedFile.name;
      }
      
      // Insert vào database
      const { data, error } = await supabase
        .from('cv_candidates')
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            phone_number: formData.phone_number || null,
            job_id: formData.job_id,
            address: formData.address || null,
            experience: formData.experience || null,
            education: formData.education || null,
            university: formData.university || null,
            status: formData.status,
            source: formData.source || null,
            cv_url: cvUrl,
            cv_file_name: cvFileName,
            cv_parsed_data: parsedData
          }
        ])
        .select(`*, cv_jobs ( title, level )`);

      if (error) {
        console.error('Error adding candidate:', error);
        alert('Có lỗi khi thêm ứng viên: ' + error.message);
      } else if (data) {
        setCandidates(prev => [data[0] as Candidate, ...prev]);
        resetForm();
        setIsDialogOpen(false);
        alert('✓ Thêm ứng viên thành công!');
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      alert('Lỗi: ' + (err.message || 'Không xác định'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">Quản lý ứng viên</h1>
            <p className="text-sm text-muted-foreground">Quản lý và theo dõi tất cả ứng viên</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">Làm mới</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={() => setIsDialogOpen(true)}
            >
                <Plus className="mr-2 h-4 w-4" />
                Thêm ứng viên
            </Button>
        </div>
      </div>

      {/* Add Candidate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">Thêm ứng viên mới</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Nhập thông tin ứng viên mới và tải lên CV nếu có. Các trường có dấu (*) là bắt buộc.
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                currentTab === 'basic'
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setCurrentTab('basic')}
            >
              Thông tin cơ bản
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                currentTab === 'cv'
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setCurrentTab('cv')}
            >
              CV & Tài liệu
            </button>
          </div>

          {/* Form Content */}
          <div className="mt-6 space-y-4">
            {currentTab === 'basic' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Nhập họ tên đầy đủ"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                    <Input
                      placeholder="0123456789"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Vị trí ứng tuyển <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.job_id}
                      onValueChange={(value) => handleInputChange('job_id', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn vị trí" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title} - {job.level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
                  <Input
                    placeholder="Nhập địa chỉ"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trường học</label>
                  <Input
                    placeholder="VD: Đại học Bách Khoa TP.HCM"
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kinh nghiệm</label>
                    <Textarea
                      placeholder="VD: 3 năm làm Frontend Developer tại ABC Company"
                      className="min-h-[80px] resize-none"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Học vấn</label>
                    <Textarea
                      placeholder="VD: Cử nhân CNTT, GPA 3.5/4.0"
                      className="min-h-[80px] resize-none"
                      value={formData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Mới">Mới</SelectItem>
                        <SelectItem value="Sàng lọc">Sàng lọc</SelectItem>
                        <SelectItem value="Phỏng vấn">Phỏng vấn</SelectItem>
                        <SelectItem value="Chấp nhận">Chấp nhận</SelectItem>
                        <SelectItem value="Từ chối">Từ chối</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nguồn ứng tuyển</label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => handleInputChange('source', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn nguồn" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg border border-gray-200">
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="TopCV">TopCV</SelectItem>
                        <SelectItem value="Giới thiệu">Giới thiệu</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kỹ năng</label>
                  <Textarea
                    placeholder="VD: JavaScript, React, Node.js, MongoDB, Docker"
                    className="min-h-[80px] resize-none"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                }`}>
                  <input
                    type="file"
                    id="cv-upload"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-3">
                      <FileText className="h-12 w-12 mx-auto text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-700">
                          ✓ {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <label htmlFor="cv-upload">
                          <Button variant="outline" size="sm" type="button" asChild>
                            <span>Chọn file khác</span>
                          </Button>
                        </label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-700"
                        >
                          Xóa file
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="cv-upload" className="cursor-pointer block">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        {isUploading ? 'Đang phân tích CV...' : 'Kéo thả file CV vào đây hoặc click để chọn'}
                      </p>
                      <Button variant="outline" size="sm" type="button" disabled={isUploading}>
                        {isUploading ? 'Đang xử lý...' : 'Chọn file'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Hỗ trợ: PDF, DOCX, TXT (tối đa 5MB)
                      </p>
                    </label>
                  )}
                </div>
                
                {parsedData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      ✓ Đã phân tích CV thành công
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      {parsedData.email && <p>• Email: {parsedData.email}</p>}
                      {parsedData.phone && <p>• SĐT: {parsedData.phone}</p>}
                      {parsedData.university && <p>• Trường: {parsedData.university}</p>}
                      {parsedData.skills && parsedData.skills.length > 0 && (
                        <p>• Skills: {parsedData.skills.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              className="px-6"
              onClick={resetForm}
            >
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              className="px-6"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>Đang lưu...</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm ứng viên
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng ứng viên</CardTitle>
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{candidates.length}</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang phỏng vấn</CardTitle>
              <div className="bg-purple-100 p-2 rounded-full">
                <UserCheck className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã qua sàng lọc</CardTitle>
              <div className="bg-green-100 p-2 rounded-full">
                <Filter className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
              <div className="bg-red-100 p-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground gap-4 bg-white p-4 rounded-lg border">
        <span>Hiển thị {candidates.length} / {candidates.length} ứng viên</span>
        <span>•</span>
        <span>Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}</span>
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Đã đồng bộ
        </span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input placeholder="Tìm kiếm theo tên, email hoặc vị trí..." className="pl-10" />
             </div>
             <Select>
               <SelectTrigger className="w-full md:w-[160px]">
                 <SelectValue placeholder="Tất cả trạng thái" />
               </SelectTrigger>
               <SelectContent></SelectContent>
             </Select>
             <Select>
               <SelectTrigger className="w-full md:w-[160px]">
                 <SelectValue placeholder="Tất cả vị trí" />
               </SelectTrigger>
               <SelectContent></SelectContent>
             </Select>
             <Select>
               <SelectTrigger className="w-full md:w-[160px]">
                 <SelectValue placeholder="Tất cả cấp độ" />
               </SelectTrigger>
               <SelectContent></SelectContent>
             </Select>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ứng viên</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Cấp độ</TableHead>
              <TableHead>Ngày ứng tuyển</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
            ) : candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <p className="font-medium">Chưa có ứng viên nào</p>
                    <p className="text-sm text-muted-foreground">Hãy bắt đầu bằng cách thêm ứng viên đầu tiên!</p>
                  </TableCell>
                </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{candidate.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{candidate.full_name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.email || candidate.phone_number}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div>{candidate.cv_jobs?.title || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Chưa có kinh nghiệm</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                  <TableCell>{candidate.cv_jobs?.level || 'N/A'}</TableCell>
                  <TableCell>
                      <div>{new Date(candidate.created_at).toLocaleDateString('vi-VN')}</div>
                      <div className="text-sm text-muted-foreground">Nguồn: {candidate.source}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Xem thông tin ứng viên">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50" title="Chỉnh sửa">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Xem CV">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50" title="Phân tích CV">
                        <Brain className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Xóa">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">AI Analysis</p>
                  <p className="text-sm text-muted-foreground">Phân tích tất cả CV</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Xuất dữ liệu</p>
                  <p className="text-sm text-muted-foreground">Tải xuống Excel</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <ListChecks className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Hành động hàng loạt</p>
                  <p className="text-sm text-muted-foreground">Cập nhật nhiều ứng viên</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <TriangleAlert className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Báo cáo</p>
                  <p className="text-sm text-muted-foreground">Thống kê chi tiết</p>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}