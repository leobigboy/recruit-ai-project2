// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Briefcase, ClipboardList, Clock, Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface StatCard {
  title: string;
  value: string;
  icon: React.ElementType;
  change: string;
  changeColor: string;
}

export function DashboardPage() {
  const [statCards, setStatCards] = useState<StatCard[]>([
    {
      title: "Tổng CV",
      value: "0",
      icon: User,
      change: "+0% vs tháng trước",
      changeColor: "text-green-600"
    },
    {
      title: "Vị trí đang tuyển",
      value: "0",
      icon: Briefcase,
      change: "+0 vs tháng trước",
      changeColor: "text-green-600"
    },
    {
      title: "CV phỏng vấn",
      value: "0",
      icon: ClipboardList,
      change: "+0% so với tháng trước",
      changeColor: "text-green-600"
    },
    {
      title: "Thời gian tuyển TB",
      value: "N/A",
      icon: Clock,
      change: "",
      changeColor: "text-gray-600"
    }
  ]);

  const chartCards = [
    "Xu hướng CV theo thời gian",
    "Nguồn ứng viên",
    "Top vị trí tuyển dụng",
    "Hoạt động gần đây"
  ];

  useEffect(() => {
    async function fetchDashboardData() {
      const { count: totalCandidates } = await supabase
        .from('cv_candidates')
        .select('*', { count: 'exact', head: true });

      const { count: openJobs } = await supabase
        .from('cv_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Đã đăng');
      
      const { count: interviewingCandidates } = await supabase
        .from('cv_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Phỏng vấn');

      setStatCards(prevCards => prevCards.map(card => {
        if (card.title === "Tổng CV") return { ...card, value: totalCandidates?.toString() || '0' };
        if (card.title === "Vị trí đang tuyển") return { ...card, value: openJobs?.toString() || '0' };
        if (card.title === "CV phỏng vấn") return { ...card, value: interviewingCandidates?.toString() || '0' };
        return card;
      }));
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      
      {/* PHẦN HEADER ĐƯỢC BỔ SUNG */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <div className="text-sm">
            <p className="font-semibold text-right">Công ty</p>
            <p className="text-muted-foreground">Recruit AI</p>
          </div>
        </div>
      </div>

      {/* Thanh thông báo */}
      <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4">
        Dashboard hiện đang hiển thị dữ liệu thực từ hệ thống của bạn.
      </div>

      {/* Các thẻ thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          const iconColorClass = index === 0 ? "text-blue-600 bg-blue-100" :
                                 index === 1 ? "text-green-600 bg-green-100" :
                                 index === 2 ? "text-orange-600 bg-orange-100" :
                                               "text-purple-600 bg-purple-100";
          return (
            <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className={`text-xs mt-2 font-medium ${stat.changeColor}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconColorClass}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartCards.slice(0, 2).map((title, index) => (
          <Card key={index} className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Database className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-sm font-medium">Chưa có dữ liệu</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}