// src/pages/CandidatesPage.tsx
"use client"
import { useState, useEffect } from "react"
import { Search, Plus, Eye, Edit, Trash2, Users, UserCheck, TrendingUp, Filter, Bot, Download, ListChecks, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabaseClient"

const getStatusBadge = (status: string) => {
  if (status === "Mới") return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">new</Badge>
  if (status === "Sàng lọc") return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">screening</Badge>
  // Thêm các trạng thái khác nếu cần
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

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">Quản lý ứng viên</h1>
            <p className="text-sm text-muted-foreground">Quản lý và theo dõi tất cả ứng viên</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">Làm mới</Button>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm ứng viên
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tổng ứng viên</CardTitle><div className="bg-blue-100 p-2 rounded-full"><Users className="h-4 w-4 text-blue-600" /></div></CardHeader><CardContent><div className="text-2xl font-bold">{candidates.length}</div><p className="text-xs text-muted-foreground">+0% so với tháng trước</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Đang phỏng vấn</CardTitle><div className="bg-purple-100 p-2 rounded-full"><UserCheck className="h-4 w-4 text-purple-600" /></div></CardHeader><CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-muted-foreground">+0% so với tháng trước</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Đã qua sàng lọc</CardTitle><div className="bg-green-100 p-2 rounded-full"><Filter className="h-4 w-4 text-green-600" /></div></CardHeader><CardContent><div className="text-2xl font-bold">0</div><p className="text-xs text-muted-foreground">+0% so với tháng trước</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle><div className="bg-red-100 p-2 rounded-full"><TrendingUp className="h-4 w-4 text-red-600" /></div></CardHeader><CardContent><div className="text-2xl font-bold">0%</div><p className="text-xs text-muted-foreground">+0% so với tháng trước</p></CardContent></Card>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground gap-4 bg-white p-4 rounded-lg border">
        <span>Hiển thị {candidates.length} / {candidates.length} ứng viên</span>
        <span>•</span>
        <span>Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}</span>
        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div>Đã đồng bộ</span>
      </div>

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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-800">
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
            <Card className="hover:border-primary/50 transition-colors cursor-pointer"><CardContent className="pt-6 flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-full"><Bot className="h-6 w-6 text-blue-600" /></div><div><p className="font-semibold">AI Analysis</p><p className="text-sm text-muted-foreground">Phân tích tất cả CV</p></div></CardContent></Card>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer"><CardContent className="pt-6 flex items-center gap-4"><div className="bg-green-100 p-3 rounded-full"><Download className="h-6 w-6 text-green-600" /></div><div><p className="font-semibold">Xuất dữ liệu</p><p className="text-sm text-muted-foreground">Tải xuống Excel</p></div></CardContent></Card>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer"><CardContent className="pt-6 flex items-center gap-4"><div className="bg-purple-100 p-3 rounded-full"><ListChecks className="h-6 w-6 text-purple-600" /></div><div><p className="font-semibold">Hành động hàng loạt</p><p className="text-sm text-muted-foreground">Cập nhật nhiều ứng viên</p></div></CardContent></Card>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer"><CardContent className="pt-6 flex items-center gap-4"><div className="bg-orange-100 p-3 rounded-full"><TriangleAlert className="h-6 w-6 text-orange-600" /></div><div><p className="font-semibold">Báo cáo</p><p className="text-sm text-muted-foreground">Thông kê chi tiết</p></div></CardContent></Card>
        </div>
      </div>
    </div>
  )
}