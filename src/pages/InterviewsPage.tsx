// src/pages/InterviewsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Clock, CheckCircle, XCircle, MoreHorizontal, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Định nghĩa kiểu dữ liệu cho một 'interview' từ database
interface Interview {
  id: string;
  interview_date: string;
  interviewer: string;
  round: string;
  format: string;
  status: string;
  candidates: {
    full_name: string;
    jobs: {
      title: string;
    } | null;
  } | null;
}

export function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  useEffect(() => {
    async function getInterviews() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_interviews')
        .select(`
          *,
          candidates (
            full_name,
            jobs ( title )
          )
        `)
        .order('interview_date', { ascending: false });

      if (data) {
        setInterviews(data as Interview[]);
      }
      if (error) {
        console.error('Error fetching interviews:', error);
      }
      setLoading(false);
    }
    getInterviews();
  }, []);

  // Tính toán thống kê
  const totalInterviews = interviews.length;
  const pendingInterviews = interviews.filter(i => i.status === 'Đang chờ' || i.status === 'pending').length;
  const completedInterviews = interviews.filter(i => i.status === 'Hoàn thành' || i.status === 'completed').length;
  const cancelledInterviews = interviews.filter(i => i.status === 'Đã hủy' || i.status === 'cancelled').length;

  // Lọc dữ liệu
  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = 
      interview.candidates?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.candidates?.jobs?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || interview.candidates?.jobs?.title === positionFilter;

    return matchesSearch && matchesStatus && matchesPosition;
  });

  // Format trạng thái badge
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hoàn thành':
      case 'completed':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'đang chờ':
      case 'pending':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
      case 'đã hủy':
      case 'cancelled':
        return 'bg-red-100 text-red-700 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Lịch phỏng vấn
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý và theo dõi lịch phỏng vấn</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tạo lịch phỏng vấn
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tổng số */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Tổng số</p>
                <div className="text-3xl font-bold">{totalInterviews}</div>
                <p className="text-xs text-blue-600 font-medium">+8%</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Đang chờ */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Đang chờ</p>
                <div className="text-3xl font-bold">{pendingInterviews}</div>
                <p className="text-xs text-orange-600 font-medium">+3%</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Hoàn thành */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <div className="text-3xl font-bold">{completedInterviews}</div>
                <p className="text-xs text-green-600 font-medium">+12%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Đã hủy */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                <div className="text-3xl font-bold">{cancelledInterviews}</div>
                <p className="text-xs text-red-600 font-medium">-5%</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm theo tên ứng viên, vị trí..." 
            className="pl-10 bg-white" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Tất cả vị trí" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vị trí</SelectItem>
            {Array.from(new Set(interviews.map(i => i.candidates?.jobs?.title).filter(Boolean))).map(position => (
              <SelectItem key={position} value={position as string}>{position}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Đang chờ">Đang chờ</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="Đã hủy">Đã hủy</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Danh sách lịch phỏng vấn</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredInterviews.length} / {totalInterviews}
          </div>
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
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-64">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInterviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-64">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-base font-medium text-gray-900">
                        {searchTerm || statusFilter !== 'all' || positionFilter !== 'all' 
                          ? 'Không tìm thấy kết quả phù hợp' 
                          : 'Chưa có lịch phỏng vấn nào'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm || statusFilter !== 'all' || positionFilter !== 'all'
                          ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                          : 'Bắt đầu bằng cách tạo lịch phỏng vấn mới'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInterviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">
                      {interview.candidates?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {interview.candidates?.jobs?.title || 'N/A'}
                    </TableCell>
                    <TableCell>{interview.round}</TableCell>
                    <TableCell>
                      {new Date(interview.interview_date).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{interview.interviewer}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(interview.status)}>
                        {interview.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                          <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Hủy lịch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
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