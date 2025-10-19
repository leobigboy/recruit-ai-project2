// src/pages/InterviewsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslation } from 'react-i18next'

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
  const { t, i18n } = useTranslation();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState({ 
    totalThisMonth: 0, 
    growth: 0, 
    pending: 0, 
    completed: 0, 
    cancelled: 0 
  });
  const [loading, setLoading] = useState(true);

  // Hàm dịch status
  const translateStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Đang chờ': 'pending',
      'Đã lên lịch': 'scheduled',
      'Hoàn thành': 'completed',
      'Đã hủy': 'cancelled',
      'Đã đổi lịch': 'rescheduled',
      'Pending': 'pending',
      'Scheduled': 'scheduled',
      'Completed': 'completed',
      'Cancelled': 'cancelled',
      'Rescheduled': 'rescheduled'
    };
    
    const key = statusMap[status] || status.toLowerCase();
    return t(`interviews.status.${key}`, { defaultValue: status });
  };

  // Hàm lấy status badge với màu sắc
  const getStatusBadge = (status: string) => {
    const translatedStatus = translateStatus(status);
    
    if (status === 'Đang chờ' || status === 'Pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{translatedStatus}</Badge>;
    }
    if (status === 'Đã lên lịch' || status === 'Scheduled') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{translatedStatus}</Badge>;
    }
    if (status === 'Hoàn thành' || status === 'Completed') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">{translatedStatus}</Badge>;
    }
    if (status === 'Đã hủy' || status === 'Cancelled') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">{translatedStatus}</Badge>;
    }
    return <Badge variant="secondary">{translatedStatus}</Badge>;
  };

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
          <h1 className="text-2xl font-bold">{t('interviews.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('interviews.subtitle')}</p>
        </div>
        <Button onClick={fetchAllData}>
          <Plus className="w-4 h-4 mr-2" />
          {t('interviews.createInterview')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('interviews.stats.totalThisMonth')}</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThisMonth}</div>
            <p className={`text-xs ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.growth >= 0 ? '+' : ''}{stats.growth}% {t('interviews.stats.comparedToLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('interviews.stats.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('interviews.stats.completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('interviews.stats.cancelled')}</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('interviews.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('interviews.table.candidate')}</TableHead>
                <TableHead>{t('interviews.table.position')}</TableHead>
                <TableHead>{t('interviews.table.round')}</TableHead>
                <TableHead>{t('interviews.table.dateTime')}</TableHead>
                <TableHead>{t('interviews.table.interviewer')}</TableHead>
                <TableHead>{t('interviews.table.status')}</TableHead>
                <TableHead>{t('interviews.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {t('interviews.list.loading')}
                  </TableCell>
                </TableRow>
              ) : interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {t('interviews.list.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">
                      {interview.cv_candidates?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {interview.cv_candidates?.cv_jobs?.title || 'N/A'}
                    </TableCell>
                    <TableCell>{interview.round}</TableCell>
                    <TableCell>
                      {new Date(interview.interview_date).toLocaleString(
                        i18n.language === 'vi' ? 'vi-VN' : 'en-US',
                        {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }
                      )}
                    </TableCell>
                    <TableCell>{interview.interviewer}</TableCell>
                    <TableCell>{getStatusBadge(interview.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t('interviews.actions.viewDetails')}</DropdownMenuItem>
                          <DropdownMenuItem>{t('interviews.actions.edit')}</DropdownMenuItem>
                          <DropdownMenuItem>{t('interviews.actions.reschedule')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            {t('interviews.actions.cancel')}
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