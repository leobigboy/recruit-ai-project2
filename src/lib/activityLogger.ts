// src/lib/activityLogger.ts
import { supabase } from '@/lib/supabaseClient';

export const logActivity = async (action: string, details?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User';
    
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: userName,
      action,
      details,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Predefined activity types
export const ActivityTypes = {
  // CV Activities
  CV_SUBMITTED: 'Nộp CV',
  CV_UPDATED: 'Cập nhật CV',
  CV_DELETED: 'Xóa CV',
  CV_STATUS_CHANGED: 'Thay đổi trạng thái CV',
  
  // Job Activities
  JOB_CREATED: 'Tạo công việc',
  JOB_UPDATED: 'Cập nhật công việc',
  JOB_DELETED: 'Xóa công việc',
  JOB_PUBLISHED: 'Đăng công việc',
  
  // Interview Activities
  INTERVIEW_SCHEDULED: 'Lên lịch phỏng vấn',
  INTERVIEW_UPDATED: 'Cập nhật lịch phỏng vấn',
  INTERVIEW_CANCELLED: 'Hủy lịch phỏng vấn',
  INTERVIEW_COMPLETED: 'Hoàn thành phỏng vấn',
  
  // Review Activities
  REVIEW_CREATED: 'Tạo đánh giá phỏng vấn',
  REVIEW_UPDATED: 'Cập nhật đánh giá',
  
  // Email Activities
  EMAIL_SENT: 'Gửi email',
  EMAIL_TEMPLATE_CREATED: 'Tạo mẫu email',
};