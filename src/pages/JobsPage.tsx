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
import { useTranslation } from 'react-i18next'

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
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hàm để lấy status badge với đa ngôn ngữ
  const getStatusBadge = (status: string) => {
    let translatedStatus = status;
    let badgeClass = "bg-gray-100 text-gray-800 border-gray-200";

    if (status === "Đã đăng" || status === "Published") {
      translatedStatus = t('jobs.status.published');
      badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
    } else if (status === "Nháp" || status === "Draft") {
      translatedStatus = t('jobs.status.draft');
      badgeClass = "bg-gray-100 text-gray-800 border-gray-200";
    } else if (status === "Đã đóng" || status === "Closed") {
      translatedStatus = t('jobs.status.closed');
      badgeClass = "bg-red-100 text-red-800 border-red-200";
    }

    return <Badge className={badgeClass}>{translatedStatus}</Badge>;
  };

  // Hàm để dịch job type
  const translateJobType = (jobType?: string) => {
    if (!jobType) return t('jobs.jobTypes.fulltime');
    
    const lowerType = jobType.toLowerCase();
    if (lowerType.includes('full')) return t('jobs.jobTypes.fulltime');
    if (lowerType.includes('part')) return t('jobs.jobTypes.parttime');
    if (lowerType.includes('contract') || lowerType.includes('hợp đồng')) return t('jobs.jobTypes.contract');
    if (lowerType.includes('remote')) return t('jobs.jobTypes.remote');
    
    return jobType;
  };

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
  const openJobs = jobs.filter(job => job.status === 'Đã đăng' || job.status === 'Published').length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('jobs.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('jobs.subtitle')}</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t('jobs.createNew')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jobs.stats.totalJDs')}</CardTitle>
            <FileText className="h-5 w-5 text-blue-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">+0 {t('jobs.stats.comparedToLastMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jobs.stats.openJDs')}</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openJobs}</div>
            <p className="text-xs text-muted-foreground">+0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jobs.stats.totalCandidates')}</CardTitle>
            <Users className="h-5 w-5 text-purple-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidatesCount}</div>
            <p className="text-xs text-muted-foreground">{t('jobs.stats.willUpdateLater')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jobs.stats.views')}</CardTitle>
            <Eye className="h-5 w-5 text-orange-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t('jobs.stats.willUpdateLater')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('jobs.list.title')} ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder={t('jobs.list.searchPlaceholder')} className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('jobs.list.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('jobs.list.allStatus')}</SelectItem>
                <SelectItem value="published">{t('jobs.status.published')}</SelectItem>
                <SelectItem value="draft">{t('jobs.status.draft')}</SelectItem>
                <SelectItem value="closed">{t('jobs.status.closed')}</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('jobs.list.allDepartments')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('jobs.list.allDepartments')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('jobs.table.position')}</TableHead>
                  <TableHead>{t('jobs.table.department')}</TableHead>
                  <TableHead>{t('jobs.table.location')}</TableHead>
                  <TableHead>{t('jobs.table.status')}</TableHead>
                  <TableHead>{t('jobs.table.candidates')}</TableHead>
                  <TableHead>{t('jobs.table.views')}</TableHead>
                  <TableHead>{t('jobs.table.createdDate')}</TableHead>
                  <TableHead className="text-right">{t('jobs.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      {t('jobs.list.loading')}
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                      {t('dashboard.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.level} • {translateJobType(job.job_type)}
                        </div>
                      </TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>{job.location || t('jobs.jobTypes.remote')}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{job.cv_candidates[0]?.count || 0}</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>
                        {new Date(job.created_at).toLocaleDateString(
                          i18n.language === 'vi' ? 'vi-VN' : 'en-US'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('jobs.actions.title')}</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>{t('jobs.actions.viewDetails')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>{t('jobs.actions.edit')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>{t('jobs.actions.copy')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              <span>{t('jobs.actions.share')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{t('jobs.actions.delete')}</span>
                            </DropdownMenuItem>
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