// src/pages/DashboardPage.tsx

"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, ClipboardList, Clock, RefreshCw, Database, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const { t } = useTranslation();

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

  interface ActivityData {
    id: string;
    user_name: string;
    action: string;
    details: string | null;
    created_at: string;
  }

  interface TopJobData {
    id: string;
    title: string;
    candidate_count: number;
    status: string;
  }

  const [stats, setStats] = useState<StatsData>({ 
    totalCV: 0, 
    openJobs: 0, 
    interviewingCV: 0,
    interviewingChange: 0 
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [topJobs, setTopJobs] = useState<TopJobData[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityData[]>([]);
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
        setSourceData([
          { source: 'Website', count: 0 },
          { source: 'LinkedIn', count: 0 },
          { source: 'Facebook', count: 0 }
        ]);
      }

      // Lấy top vị trí tuyển dụng theo số ứng viên
      const { data: jobs, error: jobsError } = await supabase
        .from('cv_jobs')
        .select(`
          id,
          title,
          status,
          cv_candidates(count)
        `);
      
      if (jobsError) {
        console.error("Error fetching top jobs:", jobsError);
      } else if (jobs) {
        const jobsWithCount = jobs.map(job => ({
          id: job.id,
          title: job.title,
          status: job.status,
          candidate_count: job.cv_candidates?.[0]?.count || 0
        }));

        const sortedJobs = jobsWithCount.sort((a, b) => b.candidate_count - a.candidate_count);
        setTopJobs(sortedJobs.slice(0, 6));
      }

      // Lấy hoạt động gần đây
      const { data: activities, error: activitiesError } = await supabase.rpc('get_recent_activities', { limit_count: 6 });
      if (activitiesError) console.error("Error fetching activities:", activitiesError);
      if (activities) setRecentActivities(activities as ActivityData[]);
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

  const getActivityColor = (action: string) => {
    if (action.includes('Nộp CV') || action.includes('CV')) return 'bg-blue-500';
    if (action.includes('Tạo') || action.includes('công việc')) return 'bg-green-500';
    if (action.includes('Phỏng vấn') || action.includes('phỏng vấn')) return 'bg-purple-500';
    if (action.includes('Đánh giá')) return 'bg-orange-500';
    if (action.includes('Cập nhật')) return 'bg-yellow-500';
    if (action.includes('Email') || action.includes('email')) return 'bg-pink-500';
    return 'bg-gray-500';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">
            {t('common.quantity')}: <span className="font-bold">{data.value}</span>
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
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('dashboard.systemOverview')}</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('dashboard.refresh')}
        </Button>
      </div>

      <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4">
        {t('dashboard.realTimeData')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalCV')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCV}</div>
            <p className="text-xs text-muted-foreground">+0% {t('dashboard.stats.comparedToLastMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.openJobs')}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openJobs}</div>
            <p className="text-xs text-muted-foreground">+0 {t('dashboard.stats.comparedToLastMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.interviewingCV')}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewingCV}</div>
            <p className="text-xs text-muted-foreground">
              {stats.interviewingChange > 0 ? (
                <span className="text-green-600">+{stats.interviewingChange}%</span>
              ) : stats.interviewingChange < 0 ? (
                <span className="text-red-600">{stats.interviewingChange}%</span>
              ) : (
                <span>0%</span>
              )} {t('dashboard.stats.comparedToLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.avgTime')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle>{t('dashboard.charts.cvTrend')}</CardTitle></CardHeader>
          <CardContent className="h-[350px] p-4">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData as any[]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '0.5rem' }} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name={t('dashboard.charts.cvCount')} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database className="w-16 h-16 mb-2" />
                <p>{t('dashboard.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle>{t('dashboard.charts.candidateSources')}</CardTitle></CardHeader>
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
                    {sourceData.map((_, index) => (
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
                <p>{t('dashboard.noDataSources')}</p>
                <p className="text-xs mt-2">{t('dashboard.addSourceColumn')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              {t('dashboard.charts.topJobs')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topJobs.length > 0 ? (
              <ul className="space-y-3">
                {topJobs.map((job, index) => (
                  <li 
                    key={job.id} 
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span 
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${
                          index < 3 
                            ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" title={job.title}>
                          {job.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.candidate_count} {t('dashboard.topJobs.candidates')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={index < 3 ? "destructive" : "secondary"}
                      className={index < 3 ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0" : ""}
                    >
                      {index < 3 ? (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {t('dashboard.topJobs.hot')}
                        </span>
                      ) : (
                        t('dashboard.topJobs.normal')
                      )}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Database className="w-12 h-12 mb-2" />
                <p className="text-sm">{t('dashboard.noJobsData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle>{t('dashboard.charts.recentActivities')}</CardTitle></CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span className={`block w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${getActivityColor(activity.action)}`}></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.action}
                        {activity.details && (
                          <span className="text-gray-500"> • {activity.details}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.created_at).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Database className="w-12 h-12 mb-2" />
                <p className="text-sm">{t('dashboard.noActivities')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}