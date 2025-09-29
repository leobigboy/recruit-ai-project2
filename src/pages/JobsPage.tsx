// src/pages/JobsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, FileText, CheckCircle, Users, Eye, Edit, Trash2, Share2, Copy } from 'lucide-react'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Đã đăng":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{status}</Badge>
    case "Nháp":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    case "Đã đóng":
      return <Badge className="bg-red-100 text-red-800 border-red-200">{status}</Badge>
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
  cv_candidates: { count: number }[];
}

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(0); // <-- State mới để lưu tổng ứng viên
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getJobsData() {
      setLoading(true);
      
      // Lấy danh sách jobs và đếm số ứng viên cho từng job
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

      // Lấy tổng số ứng viên của tất cả các jobs
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
    getJobsData();
  }, []);

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(job => job.status === 'Đã đăng').length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mô tả công việc</h1>
          <p className="text-sm text-muted-foreground">Quản lý và tạo mô tả công việc</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tạo JD mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tổng JDs</CardTitle><FileText className="h-5 w-5 text-blue-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{totalJobs}</div><p className="text-xs text-muted-foreground">+0 so với tháng trước</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">JDs đang mở</CardTitle><CheckCircle className="h-5 w-5 text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{openJobs}</div><p className="text-xs text-muted-foreground">+0%</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tổng ứng viên</CardTitle><Users className="h-5 w-5 text-purple-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{totalCandidatesCount}</div><p className="text-xs text-muted-foreground">Sẽ cập nhật sau</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lượt xem</CardTitle><Eye className="h-5 w-5 text-orange-500"/></CardHeader><CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-muted-foreground">Sẽ cập nhật sau</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách JD ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Tìm kiếm theo tiêu đề, phòng ban, vị trí..." className="pl-10" />
            </div>
            <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem></SelectContent></Select>
            <Select><SelectTrigger className="w-[180px]"><SelectValue placeholder="Tất cả phòng ban" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả phòng ban</SelectItem></SelectContent></Select>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ứng viên</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-24">Đang tải dữ liệu...</TableCell></TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-muted-foreground">{job.level} • {job.job_type || 'Full-time'}</div>
                      </TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>{job.location || 'Remote'}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{job.cv_candidates[0]?.count || 0}</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>{new Date(job.created_at).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /><span>Xem chi tiết</span></DropdownMenuItem>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /><span>Chỉnh sửa</span></DropdownMenuItem>
                            <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /><span>Sao chép</span></DropdownMenuItem>
                            <DropdownMenuItem><Share2 className="mr-2 h-4 w-4" /><span>Chia sẻ</span></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /><span>Xóa</span></DropdownMenuItem>
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
    </div>
  )
}