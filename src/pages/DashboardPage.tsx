// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Briefcase, ClipboardList, Clock, Database } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Đảm bảo đường dẫn này chính xác

// Định nghĩa kiểu dữ liệu cho các thẻ thống kê để code chặt chẽ hơn
interface StatCard {
  title: string;
  value: string;
  icon: React.ElementType;
  change: string;
  changeColor: string;
}

export function DashboardPage() {
  // State để lưu trữ dữ liệu cho các thẻ, với giá trị mặc định
  const [statCards, setStatCards] = useState<StatCard[]>([
    {
      title: "Tổng CV",
      value: "0",
      icon: User,
      change: "+0% so với tháng trước",
      changeColor: "text-green-600"
    },
    {
      title: "Vị trí đang tuyển",
      value: "0",
      icon: Briefcase,
      change: "+0 so với tháng trước",
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

  // Hook useEffect để lấy dữ liệu từ Supabase khi component được render
  useEffect(() => {
    async function fetchDashboardData() {
      // 1. Lấy tổng số CV
      const { count: totalCandidates } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

      // 2. Lấy số vị trí đang tuyển
      const { count: openJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Đã đăng');
      
      // 3. Lấy số CV đang phỏng vấn
      const { count: interviewingCandidates } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Phỏng vấn');

      // Cập nhật state với dữ liệu mới
      setStatCards(prevCards => prevCards.map(card => {
        if (card.title === "Tổng CV") {
          return { ...card, value: totalCandidates?.toString() || '0' };
        }
        if (card.title === "Vị trí đang tuyển") {
          return { ...card, value: openJobs?.toString() || '0' };
        }
        if (card.title === "CV phỏng vấn") {
          return { ...card, value: interviewingCandidates?.toString() || '0' };
        }
        // Phần tính toán tăng trưởng và thời gian tuyển trung bình sẽ phức tạp hơn
        // và sẽ được thêm vào trong các bước sau.
        return card;
      }));
    }

    fetchDashboardData();
  }, []); // [] đảm bảo hook chỉ chạy 1 lần

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                    <p className={`text-xs font-medium ${stat.changeColor}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartCards.map((title, index) => (
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