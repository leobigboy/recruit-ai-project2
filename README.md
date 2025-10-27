Recruit AI - Hệ thống Quản lý CV
Đây là dự án frontend cho hệ thống quản lý tuyển dụng và CV, được xây dựng với React, TypeScript và kết nối với backend Supabase.

Công nghệ sử dụng
Framework: Vite + React + TypeScript

Thư viện UI: Tailwind CSS + shadcn/ui

Biểu đồ: Recharts

Backend & Database: Supabase

Icons: Lucide React

Cài đặt và Chạy dự án
Để chạy dự án này, bạn cần làm theo các bước sau.

1. Lấy mã nguồn
Clone repository này về máy của bạn:

Bash

git clone [URL_REPOSITORY_CUA_BAN]
2. Môi trường phát triển (Khuyến khích dùng Codespaces)
Cách dễ dàng và nhanh nhất để bắt đầu là sử dụng GitHub Codespaces để tránh các vấn đề cài đặt trên máy cá nhân.

Truy cập repository trên GitHub.

Nhấn vào nút màu xanh lá < > Code.

Chuyển sang tab "Codespaces".

Nhấn "Create codespace on main" để khởi tạo môi trường.

3. Cấu hình kết nối Supabase (Quan trọng)
Dự án cần kết nối đến Supabase để lấy dữ liệu. Các khóa API này là bí mật và sẽ không được lưu trên Git.

Trong thư mục gốc của dự án, hãy tạo một file mới tên là .env.local.

Copy và dán nội dung sau vào file .env.local vừa tạo:

Đoạn mã

VITE_SUPABASE_URL="DÁN_URL_DỰ_ÁN_SUPABASE_CỦA_BẠN_VÀO_ĐÂY"
VITE_SUPABASE_ANON_KEY="DÁN_ANON_KEY_DỰ_ÁN_SUPABASE_CỦA_BẠN_VÀO_ĐÂY"
Lấy Keys: Bạn có thể tìm thấy URL và ANON_KEY trong dashboard Supabase tại Project Settings -> API.

Quan trọng: File .env.local đã được thêm vào .gitignore để đảm bảo các khóa bí mật của bạn không bị đưa lên GitHub.

4. Cập nhật file supabaseClient.ts
Để sử dụng các biến môi trường vừa tạo, hãy đảm bảo file src/lib/supabaseClient.ts có nội dung sau:

TypeScript

// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
5. Cài đặt các gói phụ thuộc
Mở terminal trong Codespaces (hoặc trên máy local) và chạy lệnh sau:

Bash

npm install
6. Chạy dự án
Sau khi cài đặt thành công, chạy lệnh sau để khởi động server phát triển:

Bash

npm run dev




account Admin: 
account HR : Baohr@example.com', '110804'
account Interviewer: 
account User: 


-- tạo HR
SELECT public.create_user_with_name('baohr@example.com','110804','HR Account');

-- tạo Interviewer
SELECT public.create_user_with_name('baointerviewer@example.com','110804','Interviewer Account');

-- tạo User
SELECT public.create_user_with_name('baouser@example.com','110804','Basic User');