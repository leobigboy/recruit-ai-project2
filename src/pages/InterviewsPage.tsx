// src/pages/InterviewsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, MoreHorizontal, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"

// Định nghĩa kiểu dữ liệu
interface Interview {
  id: string;
  interview_date: string;
  interviewer: string;
  round: string;
  status: string;
  format: string;
  cv_candidates: { 
    full_name: string;
    cv_jobs: { 
      title: string;
    } | null;
  } | null;
}

export function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState({ totalThisMonth: 0, growth: 0, pending: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    
    // Lấy danh sách phỏng vấn
    const { data: interviewData, error: interviewError } = await supabase
      .from('cv_interviews')
      .select(`
        *,
        cv_candidates (
          full_name,
          cv_jobs ( title )
        )
      `)
      .order('interview_date', { ascending: false });

    if (interviewData) setInterviews(interviewData as Interview[]);
    if (interviewError) console.error('Error fetching interviews:', interviewError);

    // Lấy dữ liệu thống kê cho thẻ
    const { data: statsData, error: statsError } = await supabase.rpc('get_interview_stats');
    
    if (statsData && statsData.length > 0) {
      const { this_month_count, last_month_count, pending_count, completed_count, cancelled_count } = statsData[0];
      
      let growthPercentage = 0;
      if (last_month_count > 0) {
        growthPercentage = ((this_month_count - last_month_count) / last_month_count) * 100;
      } else if (this_month_count > 0) {
        growthPercentage = 100;
      }

      setStats({
        totalThisMonth: this_month_count,
        growth: Math.round(growthPercentage),
        pending: pending_count,
        completed: completed_count,
        cancelled: cancelled_count
      });
    }
    if (statsError) console.error('Error fetching interview stats:', statsError);

    setLoading(false);
  }

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch phỏng vấn</h1>
          <p className="text-sm text-muted-foreground">Quản lý và theo dõi lịch phỏng vấn</p>
        </div>
        <Button onClick={fetchAllData}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo lịch phỏng vấn
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số (tháng này)</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalThisMonth}</div>
                <p className={`text-xs ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.growth >= 0 ? '+' : ''}{stats.growth}% so với tháng trước
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đã hủy</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.cancelled}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch phỏng vấn</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ứng viên</TableHead>
                <TableHead>Vị trí ứng tuyển</TableHead>
                <TableHead>Vòng phỏng vấn</TableHead>
                <TableHead>Ngày & Giờ</TableHead>
                <TableHead>Người phỏng vấn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Đang tải dữ liệu...</TableCell></TableRow>
              ) : interviews.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Chưa có lịch phỏng vấn nào</TableCell></TableRow>
              ) : (
                interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">{interview.cv_candidates?.full_name || 'N/A'}</TableCell>
                    <TableCell>{interview.cv_candidates?.cv_jobs?.title || 'N/A'}</TableCell>
                    <TableCell>{interview.round}</TableCell>
                    <TableCell>{new Date(interview.interview_date).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>{interview.interviewer}</TableCell>
                    <TableCell><Badge>{interview.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end"><DropdownMenuItem>Xem chi tiết</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}