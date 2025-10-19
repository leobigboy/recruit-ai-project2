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
import { useTranslation } from 'react-i18next'

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
  const { t, i18n } = useTranslation();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm dịch status
  const translateStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Mới': 'new',
      'Sàng lọc': 'screening',
      'Phỏng vấn': 'interviewing',
      'Đã offer': 'offered',
      'Đã tuyển': 'hired',
      'Từ chối': 'rejected'
    };
    
    const key = statusMap[status] || status.toLowerCase();
    return t(`candidates.status.${key}`, { defaultValue: status });
  };

  // Hàm lấy status badge
  const getStatusBadge = (status: string) => {
    const translatedStatus = translateStatus(status);
    
    if (status === "Mới") {
      return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">{translatedStatus}</Badge>;
    }
    if (status === "Sàng lọc") {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">{translatedStatus}</Badge>;
    }
    if (status === "Phỏng vấn") {
      return <Badge variant="outline" className="text-purple-600 border-purple-600 bg-purple-50">{translatedStatus}</Badge>;
    }
    return <Badge variant="secondary">{translatedStatus}</Badge>;
  };

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
          <h1 className="text-2xl font-bold">{t('candidates.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('candidates.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">{t('candidates.refresh')}</Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('candidates.addCandidate')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('candidates.stats.totalCandidates')}</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.length}</div>
            <p className="text-xs text-muted-foreground">
              +0% {t('candidates.stats.comparedToLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('candidates.stats.interviewing')}</CardTitle>
            <div className="bg-purple-100 p-2 rounded-full">
              <UserCheck className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% {t('candidates.stats.comparedToLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('candidates.stats.screened')}</CardTitle>
            <div className="bg-green-100 p-2 rounded-full">
              <Filter className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% {t('candidates.stats.comparedToLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('candidates.stats.successRate')}</CardTitle>
            <div className="bg-red-100 p-2 rounded-full">
              <TrendingUp className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              +0% {t('candidates.stats.comparedToLastMonth')}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground gap-4 bg-white p-4 rounded-lg border">
        <span>
          {t('candidates.info.showing')} {candidates.length} {t('candidates.info.of')} {candidates.length} {t('candidates.info.candidates')}
        </span>
        <span>•</span>
        <span>
          {t('candidates.info.lastUpdate')} {new Date().toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
        </span>
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          {t('candidates.info.synced')}
        </span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t('candidates.search.placeholder')} className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder={t('candidates.search.allStatus')} />
              </SelectTrigger>
              <SelectContent></SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder={t('candidates.search.allPositions')} />
              </SelectTrigger>
              <SelectContent></SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder={t('candidates.search.allLevels')} />
              </SelectTrigger>
              <SelectContent></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('candidates.table.candidate')}</TableHead>
              <TableHead>{t('candidates.table.position')}</TableHead>
              <TableHead>{t('candidates.table.status')}</TableHead>
              <TableHead>{t('candidates.table.level')}</TableHead>
              <TableHead>{t('candidates.table.appliedDate')}</TableHead>
              <TableHead>{t('candidates.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t('candidates.table.loading')}
                </TableCell>
              </TableRow>
            ) : candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="font-medium">{t('candidates.table.noData')}</p>
                  <p className="text-sm text-muted-foreground">{t('candidates.table.noDataDesc')}</p>
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
                        <div className="text-sm text-muted-foreground">
                          {candidate.email || candidate.phone_number}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{candidate.cv_jobs?.title || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('candidates.table.noExperience')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                  <TableCell>{candidate.cv_jobs?.level || 'N/A'}</TableCell>
                  <TableCell>
                    <div>
                      {new Date(candidate.created_at).toLocaleDateString(
                        i18n.language === 'vi' ? 'vi-VN' : 'en-US'
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('candidates.table.source')} {candidate.source}
                    </div>
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
        <h3 className="text-lg font-semibold mb-4">{t('candidates.quickActions.title')}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{t('candidates.quickActions.aiAnalysis')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('candidates.quickActions.aiAnalysisDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">{t('candidates.quickActions.export')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('candidates.quickActions.exportDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <ListChecks className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">{t('candidates.quickActions.bulkActions')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('candidates.quickActions.bulkActionsDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <TriangleAlert className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold">{t('candidates.quickActions.reports')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('candidates.quickActions.reportsDesc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}