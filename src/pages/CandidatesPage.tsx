"use client"
import { useState, useEffect } from "react"
import { Search, Plus, Eye, Edit, Trash2, Users, UserCheck, TrendingUp, Filter, Bot, Download, ListChecks, TriangleAlert, FileText, Brain, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { saveCandidateSkills, getCandidateSkills, type Skill } from "@/utils/skillsHelper"
import { SkillsInput } from "@/components/ui/skills-input"
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
import { parseCV, validateCVFile, type ParsedCV } from "@/utils/cvParser"

const getStatusBadge = (status: string) => {
  if (status === "Mới") return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">new</Badge>
  if (status === "Sàng lọc") return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">screening</Badge>
  if (status === "Phỏng vấn") return <Badge variant="outline" className="text-purple-600 border-purple-600 bg-purple-50">interview</Badge>
  if (status === "Chấp nhận") return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">accepted</Badge>
  if (status === "Từ chối") return <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">rejected</Badge>
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
  address?: string;
  university?: string;
  experience?: string;
  education?: string;
  cv_url?: string;
  cv_file_name?: string;
  cv_parsed_data?: any;
  cv_jobs: {
    title: string;
    level: string;
  } | null;
  cv_candidate_skills?: {
    cv_skills: {
      id: string;
      name: string;
      category?: string;
    }
  }[];
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
  
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Candidate | null>(null);
  const [viewCVCandidate, setViewCVCandidate] = useState<Candidate | null>(null);
  const [analyzeCVCandidate, setAnalyzeCVCandidate] = useState<Candidate | null>(null);
  
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isLoadingCV, setIsLoadingCV] = useState(false);
  const [isLoadingAnalyze, setIsLoadingAnalyze] = useState(false);
  
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
    skills: [] as string[]
  });

  useEffect(() => {
    fetchCandidates();
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

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cv_candidates')
      .select(`
        *,
        cv_jobs ( title, level ),
        cv_candidate_skills ( 
          cv_skills ( id, name, category )
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setCandidates(data as Candidate[]);
    }
    if (error) {
      console.error('Error fetching candidates:', error);
    }
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string | string[]) => {
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
      skills: []
    });
    setCurrentTab('basic');
    setSelectedFile(null);
    setParsedData(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const validation = validateCVFile(file);
  if (!validation.valid) {
    alert(validation.error);
    event.target.value = '';
    return;
  }

  setSelectedFile(file);

  try {
    setIsUploading(true);
    
    console.log('=== BẮT ĐẦU PARSE CV ===');
    const parsed = await parseCV(file);
    console.log('=== KẾT QUẢ PARSE ===', parsed);
    
    setParsedData(parsed);

    // ✅ Đếm số trường được điền
    let filledCount = 0;
    const foundInfo = [];

    // Điền Họ và tên
    if (parsed.fullName) {
      console.log('✅ Điền Họ và tên:', parsed.fullName);
      handleInputChange('full_name', parsed.fullName);
      foundInfo.push(`👤 Họ tên: ${parsed.fullName}`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy Họ và tên');
    }

    // Điền Email
    if (parsed.email) {
      console.log('✅ Điền Email:', parsed.email);
      handleInputChange('email', parsed.email);
      foundInfo.push(`📧 Email: ${parsed.email}`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy Email');
    }

    // Điền Số điện thoại
    if (parsed.phone) {
      console.log('✅ Điền SĐT:', parsed.phone);
      handleInputChange('phone_number', parsed.phone);
      foundInfo.push(`📱 SĐT: ${parsed.phone}`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy SĐT');
    }

    // Điền Địa chỉ
    if (parsed.address) {
      console.log('✅ Điền Địa chỉ:', parsed.address);
      handleInputChange('address', parsed.address);
      foundInfo.push(`📍 Địa chỉ: ${parsed.address}`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy Địa chỉ');
    }

    // Điền Trường học
    if (parsed.university) {
      console.log('✅ Điền Trường học:', parsed.university);
      handleInputChange('university', parsed.university);
      foundInfo.push(`🎓 Trường: ${parsed.university}`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy Trường học');
    }

    // Điền Học vấn
    if (parsed.education) {
      console.log('✅ Điền Học vấn:', parsed.education);
      handleInputChange('education', parsed.education);
      foundInfo.push(`📚 Học vấn: ${parsed.education}`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy Học vấn');
    }

    // Điền Kinh nghiệm
    if (parsed.experience) {
      console.log('✅ Điền Kinh nghiệm:', parsed.experience.substring(0, 100));
      handleInputChange('experience', parsed.experience);
      const expPreview = parsed.experience.length > 50 
        ? parsed.experience.substring(0, 50) + '...' 
        : parsed.experience;
      foundInfo.push(`💼 Kinh nghiệm: ${expPreview}`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy Kinh nghiệm');
    }

    // Điền Kỹ năng
    if (parsed.skills && parsed.skills.length > 0) {
      console.log('✅ Điền Skills:', parsed.skills);
      handleInputChange('skills', parsed.skills);
      foundInfo.push(`🛠️ Kỹ năng: ${parsed.skills.length} kỹ năng (${parsed.skills.slice(0, 5).join(', ')}${parsed.skills.length > 5 ? '...' : ''})`);
      filledCount++;
    } else {
      console.log('❌ Không tìm thấy Skills');
    }

    console.log('=== TỔNG KẾT ===');
    console.log(`Đã điền: ${filledCount}/8 trường`);

    // Hiển thị thông báo
    const message = filledCount > 0
      ? `✅ Đã phân tích CV thành công!\n\n` +
        `Tự động điền ${filledCount}/8 trường:\n${foundInfo.join('\n')}\n\n` +
        `${filledCount < 8 ? '⚠️ Vui lòng bổ sung các trường còn thiếu.' : '✓ Tất cả thông tin đã được điền!'}`
      : `⚠️ Không thể trích xuất thông tin từ CV.\n\n` +
        `Vui lòng nhập thủ công hoặc thử file CV khác.`;

    alert(message);

    // Tự động chuyển về tab "Thông tin cơ bản"
    if (filledCount > 0) {
      setTimeout(() => {
        setCurrentTab('basic');
      }, 300);
    }

  } catch (error: any) {
    console.error('❌ Lỗi parse CV:', error);
    alert('⚠ Không thể phân tích CV:\n' + (error.message || 'Lỗi không xác định'));
  } finally {
    setIsUploading(false);
  }
};

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData(null);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      if (!formData.full_name || !formData.email || !formData.job_id) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, Vị trí ứng tuyển)');
        return;
      }

      let cvUrl = null;
      let cvFileName = null;
      let parsedCV = null;

      if (selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cv-files')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('cv-files').getPublicUrl(fileName);
        cvUrl = publicUrlData.publicUrl;
        cvFileName = selectedFile.name;
        parsedCV = parsedData;
      }

      const { data, error } = await supabase
        .from('cv_candidates')
        .insert({
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
          cv_parsed_data: parsedCV,
        })
        .select()
        .single();

      if (error) throw error;

      await saveCandidateSkills(data.id, formData.skills);

      const { data: fullData } = await supabase
        .from('cv_candidates')
        .select(`
          *,
          cv_jobs ( title, level ),
          cv_candidate_skills ( 
            cv_skills ( id, name, category )
          )
        `)
        .eq('id', data.id)
        .single();

      if (fullData) {
        setCandidates(prev => [fullData as Candidate, ...prev]);
        setIsDialogOpen(false);
        resetForm();
        alert('✓ Thêm ứng viên thành công!');
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể thêm ứng viên'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCandidate = async () => {
    if (!editCandidate) return;
    setIsSaving(true);
    try {
      // Update candidate (without skills column)
      const { data, error } = await supabase
        .from('cv_candidates')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
          experience: formData.experience || null,
          education: formData.education || null,
          university: formData.university || null,
          status: formData.status,
          source: formData.source || null,
        })
        .eq('id', editCandidate.id)
        .select(`
          *,
          cv_jobs ( title, level )
        `);

      if (error) throw error;

      // Update skills in junction table
      await saveCandidateSkills(editCandidate.id, formData.skills);

      // Fetch complete updated data with skills
      const { data: completeData } = await supabase
        .from('cv_candidates')
        .select(`
          *,
          cv_jobs ( title, level ),
          cv_candidate_skills ( 
            cv_skills ( id, name, category )
          )
        `)
        .eq('id', editCandidate.id)
        .single();

      if (completeData) {
        setCandidates(prev =>
          prev.map(c => (c.id === editCandidate.id ? completeData as Candidate : c))
        );
        setEditCandidate(null);
        resetForm();
        alert('✓ Cập nhật thông tin thành công!');
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setViewCandidate(candidate);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    const skills = candidate.cv_candidate_skills?.map(item => item.cv_skills.name) || [];
    setFormData({
      full_name: candidate.full_name || '',
      email: candidate.email || '',
      phone_number: candidate.phone_number || '',
      job_id: '', // Không cập nhật job_id trong edit
      address: candidate.address || '',
      experience: candidate.experience || '',
      education: candidate.education || '',
      university: candidate.university || '',
      status: candidate.status || 'Mới',
      source: candidate.source || '',
      skills,
    });
    setEditCandidate(candidate);
  };

  const handleViewCV = async (candidate: Candidate) => {
    setIsLoadingCV(true);
    try {
      const { data, error } = await supabase
        .from('cv_candidates')
        .select('id, full_name, cv_url, cv_file_name, created_at')
        .eq('id', candidate.id)
        .single();

      if (error) {
        console.error('Error fetching CV info:', error);
        alert('Không thể tải thông tin CV');
        return;
      }

      if (data) {
        if (!data.cv_url) {
          alert('Ứng viên chưa có CV');
          return;
        }
        setViewCVCandidate(data as Candidate);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Có lỗi xảy ra');
    } finally {
      setIsLoadingCV(false);
    }
  };

  const handleAnalyzeCV = async (candidate: Candidate) => {
    setIsLoadingAnalyze(true);
    try {
      const { data, error } = await supabase
        .from('cv_candidates')
        .select('id, full_name, cv_url, cv_parsed_data, status')
        .eq('id', candidate.id)
        .single();

      if (error) {
        console.error('Error fetching CV analysis:', error);
        alert('Không thể tải dữ liệu phân tích CV');
        return;
      }

      if (data) {
        if (!data.cv_parsed_data && !data.cv_url) {
          alert('Ứng viên chưa có CV để phân tích');
          return;
        }
        setAnalyzeCVCandidate(data as Candidate);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Có lỗi xảy ra');
    } finally {
      setIsLoadingAnalyze(false);
    }
  };

  const handleDeleteCandidate = (candidate: Candidate) => {
    setDeleteCandidate(candidate);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    try {
      if (deleteCandidate.cv_url) {
        const fileName = deleteCandidate.cv_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('cv-files').remove([fileName]);
        }
      }

      // Delete cascade will handle cv_candidate_skills automatically
      const { error } = await supabase
        .from('cv_candidates')
        .delete()
        .eq('id', deleteCandidate.id);

      if (error) throw error;

      setCandidates(prev => prev.filter(c => c.id !== deleteCandidate.id));
      setDeleteCandidate(null);
      alert('✓ Đã xóa ứng viên thành công!');
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + (err.message || 'Không xác định'));
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
          <Button variant="outline" onClick={fetchCandidates}>Làm mới</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm ứng viên
          </Button>
        </div>
      </div>

      {/* Dialog Thêm ứng viên */}
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

                {/* SỬA: Thay Textarea bằng SkillsInput */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kỹ năng</label>
                  <SkillsInput
                    value={formData.skills}
                    onChange={(skills) => handleInputChange('skills', skills)}
                    placeholder="Nhập kỹ năng và nhấn Enter (VD: JavaScript, React...)"
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

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" className="px-6" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" className="px-6" onClick={() => { setIsDialogOpen(false); resetForm(); }} disabled={isSaving}>
              Hủy
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <>Đang lưu...</> : <><Plus className="mr-2 h-4 w-4" />Thêm ứng viên</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Xem thông tin ứng viên */}
      <Dialog open={!!viewCandidate || isLoadingView} onOpenChange={() => setViewCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin ứng viên</DialogTitle>
          </DialogHeader>
          {isLoadingView ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Đang tải thông tin...</p>
            </div>
          ) : viewCandidate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-2xl">
                    {viewCandidate.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{viewCandidate.full_name}</h3>
                  <p className="text-sm text-gray-500">{viewCandidate.cv_jobs?.title || 'N/A'}</p>
                  {getStatusBadge(viewCandidate.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-gray-900">{viewCandidate.email}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Số điện thoại</label><p className="text-gray-900">{viewCandidate.phone_number || 'N/A'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Địa chỉ</label><p className="text-gray-900">{viewCandidate.address || 'N/A'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Trường học</label><p className="text-gray-900">{viewCandidate.university || 'N/A'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Cấp độ</label><p className="text-gray-900">{viewCandidate.cv_jobs?.level || 'N/A'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Nguồn</label><p className="text-gray-900">{viewCandidate.source || 'N/A'}</p></div>
              </div>

              <div><label className="text-sm font-medium text-gray-500">Kinh nghiệm</label><p className="text-gray-900 mt-1">{viewCandidate.experience || 'Chưa có thông tin'}</p></div>
              <div><label className="text-sm font-medium text-gray-500">Học vấn</label><p className="text-gray-900 mt-1">{viewCandidate.education || 'Chưa có thông tin'}</p></div>
              
              {/* SỬA: Hiển thị skills từ junction table */}
              <div>
                <label className="text-sm font-medium text-gray-500">Kỹ năng</label>
                <div className="mt-1">
                  {viewCandidate?.cv_candidate_skills && viewCandidate.cv_candidate_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewCandidate.cv_candidate_skills.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {item.cv_skills.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900">Chưa có thông tin</p>
                  )}
                </div>
              </div>

              <div><label className="text-sm font-medium text-gray-500">Ngày ứng tuyển</label><p className="text-gray-900">{new Date(viewCandidate.created_at).toLocaleDateString('vi-VN')}</p></div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Dialog Chỉnh sửa ứng viên */}
      <Dialog open={!!editCandidate || isLoadingEdit} onOpenChange={() => { setEditCandidate(null); resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin ứng viên</DialogTitle>
          </DialogHeader>
          {isLoadingEdit ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Đang tải thông tin...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label><Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label><Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label><Input value={formData.phone_number} onChange={(e) => handleInputChange('phone_number', e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label><Input value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} /></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Trường học</label><Input value={formData.university} onChange={(e) => handleInputChange('university', e.target.value)} /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Kinh nghiệm</label><Textarea className="min-h-[80px] resize-none" value={formData.experience} onChange={(e) => handleInputChange('experience', e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Học vấn</label><Textarea className="min-h-[80px] resize-none" value={formData.education} onChange={(e) => handleInputChange('education', e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="Mới">Mới</SelectItem>
                      <SelectItem value="Sàng lọc">Sàng lọc</SelectItem>
                      <SelectItem value="Phỏng vấn">Phỏng vấn</SelectItem>
                      <SelectItem value="Chấp nhận">Chấp nhận</SelectItem>
                      <SelectItem value="Từ chối">Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nguồn</label>
                  <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white z-50">
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

              {/* SỬA: Thay Textarea bằng SkillsInput */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kỹ năng</label>
                <SkillsInput
                  value={formData.skills}
                  onChange={(skills) => handleInputChange('skills', skills)}
                  placeholder="Nhập kỹ năng và nhấn Enter"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => { setEditCandidate(null); resetForm(); }}>Hủy</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUpdateCandidate} disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Cập nhật'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Xem CV */}
      <Dialog open={!!viewCVCandidate || isLoadingCV} onOpenChange={() => setViewCVCandidate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>CV - {viewCVCandidate?.full_name}</DialogTitle>
          </DialogHeader>
          {isLoadingCV ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Đang tải CV...</p>
            </div>
          ) : viewCVCandidate?.cv_url ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{viewCVCandidate.cv_file_name}</p>
                  <p className="text-sm text-gray-500">Ngày upload: {new Date(viewCVCandidate.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
                <a href={viewCVCandidate.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Tải xuống
                </a>
              </div>
              <iframe src={viewCVCandidate.cv_url} className="w-full h-[600px] border rounded-lg" title="CV Preview" />
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Ứng viên chưa upload CV</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Phân tích CV */}
      <Dialog open={!!analyzeCVCandidate || isLoadingAnalyze} onOpenChange={() => setAnalyzeCVCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phân tích CV - {analyzeCVCandidate?.full_name}</DialogTitle>
          </DialogHeader>
          {isLoadingAnalyze ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Đang tải dữ liệu phân tích...</p>
            </div>
          ) : analyzeCVCandidate?.cv_parsed_data ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Thông tin trích xuất từ CV</h4>
                <div className="space-y-2 text-sm">
                  {analyzeCVCandidate.cv_parsed_data.email && <div><span className="font-medium">Email:</span> {analyzeCVCandidate.cv_parsed_data.email}</div>}
                  {analyzeCVCandidate.cv_parsed_data.phone && <div><span className="font-medium">Số điện thoại:</span> {analyzeCVCandidate.cv_parsed_data.phone}</div>}
                  {analyzeCVCandidate.cv_parsed_data.university && <div><span className="font-medium">Trường học:</span> {analyzeCVCandidate.cv_parsed_data.university}</div>}
                  
                  {/* SỬA: Hiển thị skills từ parsed data */}
                  {analyzeCVCandidate.cv_parsed_data.skills && analyzeCVCandidate.cv_parsed_data.skills.length > 0 && (
                    <div>
                      <span className="font-medium">Kỹ năng phát hiện từ CV:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {analyzeCVCandidate.cv_parsed_data.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-white">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* THÊM: Hiển thị skills đã lưu trong DB */}
              {analyzeCVCandidate.cv_candidate_skills && analyzeCVCandidate.cv_candidate_skills.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Kỹ năng đã lưu trong hệ thống</h4>
                  <div className="flex flex-wrap gap-2">
                    {analyzeCVCandidate.cv_candidate_skills.map((item: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-white text-green-700 border-green-200">
                        {item.cv_skills.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Đánh giá tổng quan</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Độ hoàn thiện thông tin: {analyzeCVCandidate.cv_parsed_data.email && analyzeCVCandidate.cv_parsed_data.phone ? 'Tốt' : 'Cần bổ sung'}</p>
                  <p>• Số kỹ năng phát hiện: {analyzeCVCandidate.cv_parsed_data.skills?.length || 0}</p>
                  <p>• Số kỹ năng đã lưu: {analyzeCVCandidate.cv_candidate_skills?.length || 0}</p>
                  <p>• Trạng thái hiện tại: {analyzeCVCandidate.status}</p>
                </div>
              </div>

              {analyzeCVCandidate.cv_parsed_data.fullText && (
                <div className="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                  <h4 className="font-semibold mb-2">Nội dung CV (preview)</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{analyzeCVCandidate.cv_parsed_data.fullText.substring(0, 500)}...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Chưa có dữ liệu phân tích CV</p>
              <p className="text-sm text-gray-400">CV của ứng viên chưa được parse hoặc chưa upload</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog Xóa ứng viên */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa ứng viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ứng viên <strong>{deleteCandidate?.full_name}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Thống kê Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng ứng viên</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full"><Users className="h-4 w-4 text-blue-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.length}</div>
            <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang phỏng vấn</CardTitle>
            <div className="bg-purple-100 p-2 rounded-full"><UserCheck className="h-4 w-4 text-purple-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter(c => c.status === 'Phỏng vấn').length}</div>
            <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã qua sàng lọc</CardTitle>
            <div className="bg-green-100 p-2 rounded-full"><Filter className="h-4 w-4 text-green-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter(c => c.status === 'Sàng lọc').length}</div>
            <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
            <div className="bg-red-100 p-2 rounded-full"><TrendingUp className="h-4 w-4 text-red-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidates.length > 0 ? Math.round((candidates.filter(c => c.status === 'Chấp nhận').length / candidates.length) * 100) : 0}%
            </div>
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

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm kiếm theo tên, email hoặc vị trí..." className="pl-10" />
            </div>
            <Select><SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger><SelectContent></SelectContent></Select>
            <Select><SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả vị trí" /></SelectTrigger><SelectContent></SelectContent></Select>
            <Select><SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả cấp độ" /></SelectTrigger><SelectContent></SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      {/* Table danh sách ứng viên */}
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
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Đang tải dữ liệu...</TableCell></TableRow>
            ) : candidates.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><p className="font-medium">Chưa có ứng viên nào</p><p className="text-sm text-muted-foreground">Hãy bắt đầu bằng cách thêm ứng viên đầu tiên!</p></TableCell></TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10"><AvatarFallback>{candidate.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium">{candidate.full_name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.email || candidate.phone_number}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{candidate.cv_jobs?.title || 'N/A'}</div>
                    {/* SỬA: Hiển thị số lượng skills thay vì kinh nghiệm */}
                    <div className="text-sm text-muted-foreground">
                      {candidate.cv_candidate_skills && candidate.cv_candidate_skills.length > 0 
                        ? `${candidate.cv_candidate_skills.length} kỹ năng` 
                        : 'Chưa có kỹ năng'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                  <TableCell>{candidate.cv_jobs?.level || 'N/A'}</TableCell>
                  <TableCell>
                    <div>{new Date(candidate.created_at).toLocaleDateString('vi-VN')}</div>
                    <div className="text-sm text-muted-foreground">Nguồn: {candidate.source}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Xem thông tin ứng viên" onClick={() => handleViewCandidate(candidate)} disabled={isLoadingView}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50" title="Chỉnh sửa" onClick={() => handleEditCandidate(candidate)} disabled={isLoadingEdit}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Xem CV" onClick={() => handleViewCV(candidate)} disabled={isLoadingCV}><FileText className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50" title="Phân tích CV" onClick={() => handleAnalyzeCV(candidate)} disabled={isLoadingAnalyze}><Brain className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Xóa" onClick={() => handleDeleteCandidate(candidate)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Actions */}
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