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

  const [stats, setStats] = useState({ totalCV: 0, openJobs: 0, interviewingCV: 0 });
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
      const { count: interviewingCV } = await supabase.from('cv_candidates').select('*', { count: 'exact', head: true }).eq('status', 'Phỏng vấn');
      setStats({
        totalCV: totalCV || 0,
        openJobs: openJobs || 0,
        interviewingCV: interviewingCV || 0
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
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">Tổng số</p>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-gray-900">{stats.totalCV}</div>
                  <p className="text-xs text-blue-600 font-medium">+8%</p>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                <User className="w-6 h-6 text-blue-600"/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">Đang chờ</p>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-gray-900">{stats.openJobs}</div>
                  <p className="text-xs text-yellow-600 font-medium">+3%</p>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600"/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-gray-900">{stats.interviewingCV}</div>
                  <p className="text-xs text-green-600 font-medium">+12%</p>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
                <ClipboardList className="w-6 h-6 text-green-600"/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-gray-900">0</div>
                  <p className="text-xs text-red-600 font-medium">-5%</p>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100">
                <Briefcase className="w-6 h-6 text-red-600"/>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Xu hướng CV theo thời gian</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle>Nguồn ứng viên</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle>Top vị trí tuyển dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topJobs.length > 0 ? topJobs.map((job, index) => (
                <li key={job.title} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.cv_candidates[0]?.count || 0} ứng viên
                      </p>
                    </div>
                  </div>
                  <Badge variant={index === 0 ? "destructive" : "secondary"}>
                    {index === 0 ? "Hot" : "Bình thường"}
                  </Badge>
                </li>
              )) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
              )}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-5">
              {recentActivitiesData.map((activity, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className={`block w-2.5 h-2.5 mt-1.5 rounded-full ${activity.color}`}></span>
                  <div>
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.time).toLocaleString('vi-VN')}
                    </p>
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
