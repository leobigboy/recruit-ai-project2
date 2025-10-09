// src/pages/DashboardPage.tsx

"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, ClipboardList, Clock, RefreshCw, Database } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Dữ liệu mẫu
const recentActivitiesData = [
    { text: 'Ứng viên Nguyễn Văn Anh đã nộp CV...', time: '2025-09-22T10:00:00.000Z', color: 'bg-blue-500' },
];

export function DashboardPage() {
  interface SourceData {
    source: string;
    count: number;
  }

  interface TrendData {
    month: string;
    count: number;
  }

  interface StatsData {
    totalCV: number;
    openJobs: number;
    interviewingCV: number;
    interviewingChange: number;
  }

  const [stats, setStats] = useState<StatsData>({ 
    totalCV: 0, 
    openJobs: 0, 
    interviewingCV: 0,
    interviewingChange: 0 
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Lấy dữ liệu cho các thẻ thống kê
      const { count: totalCV } = await supabase.from('cv_candidates').select('*', { count: 'exact', head: true });
      const { count: openJobs } = await supabase.from('cv_jobs').select('*', { count: 'exact', head: true }).eq('status', 'Đã đăng');
      
      // Lấy thống kê lịch phỏng vấn
      const { data: interviewStats, error: interviewError } = await supabase.rpc('get_interview_stats');
      if (interviewError) console.error("Error fetching interview stats:", interviewError);
      
      const interviewData = interviewStats?.[0] || { 
        total_interviews: 0, 
        this_month_count: 0, 
        last_month_count: 0, 
        percentage_change: 0 
      };
      
      setStats({ 
        totalCV: totalCV || 0, 
        openJobs: openJobs || 0, 
        interviewingCV: Number(interviewData.total_interviews) || 0,
        interviewingChange: Number(interviewData.percentage_change) || 0
      });

      // Gọi các hàm PostgreSQL đã tạo
      const { data: trend, error: trendError } = await supabase.rpc('get_monthly_cv_trend');
      if (trendError) console.error("Error fetching trend:", trendError);
      if (trend) setTrendData(trend as TrendData[]);
      
      const { data: sources, error: sourcesError } = await supabase.rpc('get_candidate_sources');
      if (sourcesError) console.error("Error fetching sources:", sourcesError);
      if (sources && sources.length > 0) {
        setSourceData(sources as SourceData[]);
      } else {
        // Dữ liệu mẫu nếu chưa có nguồn
        setSourceData([
          { source: 'Website', count: 0 },
          { source: 'LinkedIn', count: 0 },
          { source: 'Facebook', count: 0 }
        ]);
      }

      // Lấy top vị trí tuyển dụng
      const { data: jobs, error: jobsError } = await supabase
        .from('cv_jobs')
        .select('title, cv_candidates(count)')
        .order('count', { foreignTable: 'cv_candidates', ascending: false })
        .limit(4);
      
      if (jobsError) console.error("Error fetching top jobs:", jobsError);
      if (jobs) setTopJobs(jobs);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">
            Số lượng: <span className="font-bold">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4">
        Dashboard hiện đang hiển thị dữ liệu thực từ hệ thống của bạn.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tổng CV</CardTitle><User className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalCV}</div><p className="text-xs text-muted-foreground">+0% so với tháng trước</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Vị trí đang tuyển</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.openJobs}</div><p className="text-xs text-muted-foreground">+0 so với tháng trước</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">CV phỏng vấn</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.interviewingCV}</div><p className="text-xs text-muted-foreground">
          {stats.interviewingChange > 0 ? (
            <span className="text-green-600">+{stats.interviewingChange}%</span>
          ) : stats.interviewingChange < 0 ? (
            <span className="text-red-600">{stats.interviewingChange}%</span>
          ) : (
            <span>0%</span>
          )} so với tháng trước
        </p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Thời gian tuyển TB</CardTitle><Clock className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">N/A</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle>Xu hướng CV theo thời gian</CardTitle></CardHeader>
          <CardContent className="h-[350px] p-4">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData as any[]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '0.5rem' }} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name="Số CV" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Database className="w-16 h-16 mb-2" />
                <p>Chưa có dữ liệu</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle>Nguồn ứng viên</CardTitle></CardHeader>
          <CardContent className="h-[350px]">
            {sourceData.length > 0 && sourceData.some(item => item.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={sourceData as any[]} 
                    dataKey="count" 
                    nameKey="source" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    fill="#8884d8" 
                    label={(entry: any) => {
                      const total = sourceData.reduce((sum, item) => sum + item.count, 0);
                      const percent = total > 0 ? (entry.count / total * 100).toFixed(0) : '0';
                      return `${entry.source}: ${percent}%`;
                    }}
                    labelLine={true}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value: any, entry: any) => `${value} (${entry.payload.count})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database className="w-16 h-16 mb-2" />
                <p>Chưa có dữ liệu nguồn ứng viên</p>
                <p className="text-xs mt-2">Thêm cột "source" vào cv_candidates</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
            <CardHeader><CardTitle>Top vị trí tuyển dụng</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {topJobs.length > 0 ? topJobs.map((job, index) => (
                        <li key={job.title} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-600">{index + 1}</span>
                                <div>
                                    <p className="font-semibold">{job.title}</p>
                                    <p className="text-sm text-muted-foreground">{job.cv_candidates[0]?.count || 0} ứng viên</p>
                                </div>
                            </div>
                            <Badge variant={index === 0 ? "destructive" : "secondary"}>{index === 0 ? "Hot" : "Bình thường"}</Badge>
                        </li>
                    )) : <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}
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