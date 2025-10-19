// src/pages/ReviewsPage.tsx
"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RefreshCw, FileText, Star, TrendingUp, MoreHorizontal } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useTranslation } from 'react-i18next'

// Helper Component để hiển thị sao
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`h-4 w-4 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
        />
      ))}
    </div>
  )
}

interface Review {
  id: string;
  rating: number;
  outcome: string;
  cv_interviews: {
    id: string;
    round: string;
    interviewer: string;
    interview_date: string;
    cv_candidates: {
      full_name: string;
      cv_jobs: {
        title: string;
      } | null;
    } | null;
  } | null;
}

export function ReviewsPage() {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalReviews: 0, 
    averageRating: 0, 
    recommendationRate: 0 
  });

  // Hàm để fetch reviews
  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cv_interview_reviews')
      .select(`
        *,
        cv_interviews (
          *,
          cv_candidates (
            full_name,
            cv_jobs ( title )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as Review[]);
      const total = data.length;
      const sumOfRatings = data.reduce((sum, review) => sum + review.rating, 0);
      const recommendedCount = data.filter(review => 
        review.outcome === 'Vòng tiếp theo' || review.outcome === 'Next Round'
      ).length;
      
      setStats({
        totalReviews: total,
        averageRating: total > 0 ? sumOfRatings / total : 0,
        recommendationRate: total > 0 ? (recommendedCount / total) * 100 : 0,
      });
    }
    if (error) console.error('Error fetching reviews:', error);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('reviews.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reviews.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={fetchReviews}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('reviews.refresh')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('reviews.stats.totalReviews')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('reviews.stats.averageRating')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.averageRating.toFixed(1)} 
              <StarRating rating={stats.averageRating} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('reviews.stats.recommendationRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recommendationRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('reviews.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reviews.table.candidate')}</TableHead>
                <TableHead>{t('reviews.table.position')}</TableHead>
                <TableHead>{t('reviews.table.round')}</TableHead>
                <TableHead>{t('reviews.table.interviewer')}</TableHead>
                <TableHead>{t('reviews.table.interviewDate')}</TableHead>
                <TableHead>{t('reviews.table.rating')}</TableHead>
                <TableHead>{t('reviews.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {t('reviews.list.loading')}
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {t('reviews.list.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.cv_interviews?.cv_candidates?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {review.cv_interviews?.cv_candidates?.cv_jobs?.title || 'N/A'}
                    </TableCell>
                    <TableCell>{review.cv_interviews?.round || 'N/A'}</TableCell>
                    <TableCell>{review.cv_interviews?.interviewer || 'N/A'}</TableCell>
                    <TableCell>
                      {review.cv_interviews 
                        ? new Date(review.cv_interviews.interview_date).toLocaleDateString(
                            i18n.language === 'vi' ? 'vi-VN' : 'en-US'
                          ) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StarRating rating={review.rating} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t('reviews.actions.viewDetails')}</DropdownMenuItem>
                          <DropdownMenuItem>{t('reviews.actions.edit')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            {t('reviews.actions.delete')}
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