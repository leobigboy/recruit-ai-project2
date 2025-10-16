// src/pages/CandidatesPage.tsx
import { useState, useEffect } from "react";
import { 
  Search as SearchIcon, 
  Plus as PlusIcon, 
  Download as DownloadIcon, 
  ListChecks as ListChecksIcon, 
  TriangleAlert as TriangleAlertIcon, 
  Bot as BotIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabaseClient";
import { getCandidateSkills } from "@/utils/skillsHelper";
import { CandidateList } from "@/components/candidates/CandidateList";
import { CandidateFormDialog, type CandidateFormData } from "@/components/candidates/CandidateFormDialog";
import { CVAnalysisDialog } from "@/components/candidates/CVAnalysisDialog";
import { useCandidates, type Candidate } from "@/hooks/useCandidates";
import type { ParsedCV } from "@/utils/advancedCVParser";

interface Job {
  id: string;
  title: string;
  level: string;
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  change?: string;
}

function StatsCard({ title, value, icon, iconBg, change = "+0% so với tháng trước" }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${iconBg} p-2 rounded-full`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}

export function CandidatesPage() {
  const {
    candidates,
    loading,
    fetchCandidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidateById
  } = useCandidates();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<CandidateFormData>>();
  const [deleteDialogCandidate, setDeleteDialogCandidate] = useState<Candidate | null>(null);
  const [analyzeCandidate, setAnalyzeCandidate] = useState<Candidate | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    async function loadJobs() {
      const { data } = await supabase
        .from('cv_jobs')
        .select('id, title, level')
        .order('title');
      if (data) setJobs(data);
    }
    loadJobs();
  }, []);

  const stats = {
    total: candidates.length,
    interviewing: candidates.filter(c => c.status === 'Phỏng vấn').length,
    screening: candidates.filter(c => c.status === 'Sàng lọc').length,
    successRate: candidates.length > 0 
      ? Math.round((candidates.filter(c => c.status === 'Chấp nhận').length / candidates.length) * 100)
      : 0
  };

  const handleCreateCandidate = () => {
    setFormMode('create');
    setFormInitialData(undefined);
    setEditingCandidate(null);
    setIsFormDialogOpen(true);
  };

  const handleEditCandidate = async (candidate: Candidate) => {
    setIsLoadingAction(true);
    try {
      const completeCandidate = await getCandidateById(candidate.id);
      if (!completeCandidate) {
        alert('Không thể tải thông tin ứng viên');
        return;
      }

      let jobId = '';
      if (completeCandidate.cv_jobs) {
        const job = jobs.find(j => j.title === completeCandidate.cv_jobs?.title);
        jobId = job?.id || '';
      }

      const skills = await getCandidateSkills(candidate.id);
      const skillNames = skills.map(s => s.name);

      setEditingCandidate(completeCandidate);
      setFormInitialData({
        full_name: completeCandidate.full_name,
        email: completeCandidate.email,
        phone_number: completeCandidate.phone_number || '',
        job_id: jobId,
        address: completeCandidate.address || '',
        experience: completeCandidate.experience || '',
        education: completeCandidate.education || '',
        university: completeCandidate.university || '',
        status: completeCandidate.status,
        source: completeCandidate.source || '',
        skills: skillNames
      });
      setFormMode('edit');
      setIsFormDialogOpen(true);
    } catch (err) {
      console.error('Error:', err);
      alert('Có lỗi xảy ra');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleViewCV = (candidate: Candidate) => {
    if (!candidate.cv_url) {
      alert('Ứng viên chưa có CV');
      return;
    }
    window.open(candidate.cv_url, '_blank');
  };

  const handleAnalyzeCV = async (candidate: Candidate) => {
    setIsLoadingAction(true);
    try {
      const completeCandidate = await getCandidateById(candidate.id);
      if (!completeCandidate) {
        alert('Không thể tải dữ liệu phân tích CV');
        return;
      }
      if (!completeCandidate.cv_parsed_data && !completeCandidate.cv_url) {
        alert('Ứng viên chưa có CV để phân tích');
        return;
      }
      setAnalyzeCandidate(completeCandidate);
    } catch (err) {
      console.error('Error:', err);
      alert('Có lỗi xảy ra');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteCandidate = (candidate: Candidate) => {
    setDeleteDialogCandidate(candidate);
  };

  const confirmDelete = async () => {
    if (!deleteDialogCandidate) return;
    const result = await deleteCandidate(deleteDialogCandidate.id, deleteDialogCandidate.cv_url);
    if (result.success) {
      setDeleteDialogCandidate(null);
      alert('✓ Đã xóa ứng viên thành công!');
    } else {
      alert('Lỗi khi xóa: ' + (result.error || 'Không xác định'));
    }
  };

  const handleFormSubmit = async (formData: CandidateFormData, cvFile?: File, parsedData?: ParsedCV) => {
    if (formMode === 'create') {
      const result = await addCandidate(formData, cvFile, parsedData);
      if (!result.success) throw new Error(result.error || 'Không thể thêm ứng viên');
    } else if (editingCandidate) {
      const result = await updateCandidate(editingCandidate.id, formData);
      if (!result.success) throw new Error(result.error || 'Không thể cập nhật ứng viên');
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
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={handleCreateCandidate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Thêm ứng viên
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Tổng ứng viên" value={stats.total} icon={<PlusIcon className="h-4 w-4 text-blue-600" />} iconBg="bg-blue-100" />
        <StatsCard title="Đang phỏng vấn" value={stats.interviewing} icon={<ListChecksIcon className="h-4 w-4 text-purple-600" />} iconBg="bg-purple-100" />
        <StatsCard title="Đã qua sàng lọc" value={stats.screening} icon={<DownloadIcon className="h-4 w-4 text-green-600" />} iconBg="bg-green-100" />
        <StatsCard title="Tỷ lệ thành công" value={stats.successRate} icon={<TriangleAlertIcon className="h-4 w-4 text-red-600" />} iconBg="bg-red-100" change={`${stats.successRate}% ứng viên được chấp nhận`} />
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
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm kiếm theo tên, email hoặc vị trí..." className="pl-10" />
            </div>
            <Select><SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger><SelectContent></SelectContent></Select>
            <Select><SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả vị trí" /></SelectTrigger><SelectContent></SelectContent></Select>
            <Select><SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả cấp độ" /></SelectTrigger><SelectContent></SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      <CandidateList
        candidates={candidates}
        loading={loading}
        onView={(candidate) => alert(`Ứng viên: ${candidate.full_name}\nEmail: ${candidate.email}\nVị trí: ${candidate.cv_jobs?.title || 'N/A'}\nTrạng thái: ${candidate.status}`)}
        onEdit={handleEditCandidate}
        onViewCV={handleViewCV}
        onAnalyzeCV={handleAnalyzeCV}
        onDelete={handleDeleteCandidate}
      />

      <div>
        <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full"><BotIcon className="h-6 w-6 text-blue-600" /></div>
              <div><p className="font-semibold">AI Analysis</p><p className="text-sm text-muted-foreground">Phân tích tất cả CV</p></div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full"><DownloadIcon className="h-6 w-6 text-green-600" /></div>
              <div><p className="font-semibold">Xuất dữ liệu</p><p className="text-sm text-muted-foreground">Tải xuống Excel</p></div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full"><ListChecksIcon className="h-6 w-6 text-purple-600" /></div>
              <div><p className="font-semibold">Hành động hàng loạt</p><p className="text-sm text-muted-foreground">Cập nhật nhiều ứng viên</p></div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full"><TriangleAlertIcon className="h-6 w-6 text-orange-600" /></div>
              <div><p className="font-semibold">Báo cáo</p><p className="text-sm text-muted-foreground">Thống kê chi tiết</p></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CandidateFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSubmit={handleFormSubmit}
        jobs={jobs}
        initialData={formInitialData}
        mode={formMode}
      />

      <CVAnalysisDialog candidate={analyzeCandidate} isLoading={isLoadingAction} onClose={() => setAnalyzeCandidate(null)} />

      <AlertDialog open={!!deleteDialogCandidate} onOpenChange={() => setDeleteDialogCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa ứng viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ứng viên <strong>{deleteDialogCandidate?.full_name}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}