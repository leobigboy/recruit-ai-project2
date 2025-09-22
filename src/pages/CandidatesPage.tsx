// src/pages/CandidatesPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Eye, Edit, Trash2, Users, UserCheck, TrendingUp, Filter } from 'lucide-react'
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabaseClient"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Mới":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{status}</Badge>
    case "Sàng lọc":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">{status}</Badge>
    case "Phỏng vấn":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{status}</Badge>
    case "Đề nghị":
       return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">{status}</Badge>
    case "Đã tuyển":
      return <Badge className="bg-green-100 text-green-800 border-green-200">{status}</Badge>
    case "Từ chối":
      return <Badge className="bg-red-100 text-red-800 border-red-200">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

interface Candidate {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  status: string;
  source: string;
  jobs: {
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
        .from('candidates')
        .select(`*, jobs ( title, level )`)
        .order('created_at', { ascending: false });

      if (data) {
        setCandidates(data);
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm ứng viên
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng ứng viên</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{candidates.length}</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang phỏng vấn</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã qua sàng lọc</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">+0% so với tháng trước</p>
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input placeholder="Tìm kiếm ứng viên..." className="pl-10" />
             </div>
             <Select>
               <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
               <SelectContent>{/* Các item trạng thái */}</SelectContent>
             </Select>
             <Select>
               <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả vị trí" /></SelectTrigger>
               <SelectContent>{/* Các item vị trí */}</SelectContent>
             </Select>
             <Select>
               <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Tất cả cấp độ" /></SelectTrigger>
               <SelectContent>{/* Các item cấp độ */}</SelectContent>
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
                <TableCell colSpan={6} className="h-24 text-center">Đang tải dữ liệu...</TableCell>
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
                        <AvatarFallback>
                          {candidate.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{candidate.full_name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{candidate.jobs?.title || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                  <TableCell>{candidate.jobs?.level || 'N/A'}</TableCell>
                  <TableCell>
                      <div>{new Date(candidate.created_at).toLocaleDateString('vi-VN')}</div>
                      <div className="text-sm text-muted-foreground">{candidate.source}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}