// src/pages/DashboardPage.tsx
"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ResponsiveContainer } from 'recharts';

// Dữ liệu mẫu
const topJobsData = [
    { rank: 1, title: 'Frontend Developer', candidates: 12, status: 'Hot' },
    { rank: 2, title: 'Backend Developer', candidates: 8, status: 'Bình thường' },
    { rank: 3, title: 'Full Stack Developer', candidates: 6, status: 'Bình thường' },
    { rank: 4, title: 'UI/UX Designer', candidates: 4, status: 'Bình thường' },
];
const recentActivitiesData = [
    { text: 'Ứng viên Nguyễn Văn Anh đã nộp CV...', time: '2025-09-22T10:00:00.000Z', color: 'bg-blue-500' },
];

export function DashboardPage() {
  const [stats, setStats] = useState({ totalCV: 0, openJobs: 0, interviewingCV: 0 });
  // Dữ liệu cho các biểu đồ và danh sách sẽ được kết nối sau
  // const [trendData, setTrendData] = useState([]);
  // const [sourceData, setSourceData] = useState([]);
  // const [topJobs, setTopJobs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      // Lấy dữ liệu cho các thẻ thống kê
      const { count: totalCV } = await supabase.from('cv_candidates').select('*', { count: 'exact', head: true });
      const { count: openJobs } = await supabase.from('cv_jobs').select('*', { count: 'exact', head: true }).eq('status', 'Đã đăng');
      const { count: interviewingCV } = await supabase.from('cv_candidates').select('*', { count: 'exact', head: true }).eq('status', 'Phỏng vấn');
      setStats({ 
        totalCV: totalCV || 0, 
        openJobs: openJobs || 0, 
        interviewingCV: interviewingCV || 0 
      });

      // CÁC LỆNH GỌI HÀM SẼ ĐƯỢC KÍCH HOẠT SAU
      // const { data: trend } = await supabase.rpc('get_monthly_cv_trend');
      // if (trend) setTrendData(trend);
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống</p>
        </div>
        <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Làm mới</Button>
      </div>

      {/* Các thẻ thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Tổng CV</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalCV}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Vị trí đang tuyển</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.openJobs}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">CV phỏng vấn</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.interviewingCV}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Thời gian tuyển TB</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">N/A</div></CardContent></Card>
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle>Xu hướng CV theo thời gian</CardTitle></CardHeader>
          <CardContent className="h-[350px]">
            <div className="flex items-center justify-center h-full text-muted-foreground"><Database className="w-8 h-8 mr-2"/>Chưa có dữ liệu</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle>Nguồn ứng viên</CardTitle></CardHeader>
          <CardContent className="h-[350px]">
             <div className="flex items-center justify-center h-full text-muted-foreground"><Database className="w-8 h-8 mr-2"/>Chưa có dữ liệu</div>
          </CardContent>
        </Card>
      </div>

      {/* Top vị trí và Hoạt động gần đây (dữ liệu mẫu) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
            <CardHeader><CardTitle>Top vị trí tuyển dụng</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {topJobsData.map((job) => (
                        <li key={job.rank} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-600">{job.rank}</span>
                                <div>
                                    <p className="font-semibold">{job.title}</p>
                                    <p className="text-sm text-muted-foreground">{job.candidates} ứng viên</p>
                                </div>
                            </div>
                            <Badge variant={job.status === 'Hot' ? "destructive" : "secondary"}>{job.status}</Badge>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
             <CardHeader><CardTitle>Hoạt động gần đây</CardTitle></CardHeader>
             <CardContent>
                <ul className="space-y-5">
                    {recentActivitiesData.map((activity, index) => (
                        <li key={index} className="flex items-start gap-4">
                            <span className={`block w-2.5 h-2.5 mt-1.5 rounded-full ${activity.color}`}></span>
                            <div>
                                <p className="text-sm">{activity.text}</p>
                                <p className="text-xs text-muted-foreground">{new Date(activity.time).toLocaleString('vi-VN')}</p>
                            </div>
                        </li>
                    ))}
                </ul>
             </CardContent>
        </Card>
      </div>
    </div>
  );
}