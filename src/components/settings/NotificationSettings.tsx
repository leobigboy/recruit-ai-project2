import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

// Custom Toggle Button Component
interface ToggleButtonProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ checked, onChange, id }) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${checked ? 'bg-blue-600' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [candidateUpdates, setCandidateUpdates] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Load settings từ localStorage khi component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setEmailNotifications(settings.emailNotifications ?? true);
        setInterviewReminders(settings.interviewReminders ?? true);
        setCandidateUpdates(settings.candidateUpdates ?? false);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  // Auto-save khi có thay đổi
  useEffect(() => {
    const settings = {
      emailNotifications,
      interviewReminders,
      candidateUpdates
    };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    
    // Hiển thị thông báo đã lưu
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [emailNotifications, interviewReminders, candidateUpdates]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Cài đặt Thông báo</CardTitle>
            <CardDescription>Quản lý các thông báo tự động của hệ thống.</CardDescription>
          </div>
          {showSaved && (
            <span className="text-sm text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-md">
              <Check className="h-4 w-4" />
              Đã lưu
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="email-notifications" className="font-medium cursor-pointer">
                Thông báo email
              </Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo chung qua email.</p>
            </div>
            <ToggleButton
              id="email-notifications"
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="interview-reminders" className="font-medium cursor-pointer">
                Nhắc nhở phỏng vấn
              </Label>
              <p className="text-sm text-muted-foreground">Gửi email nhắc nhở trước buổi phỏng vấn.</p>
            </div>
            <ToggleButton
              id="interview-reminders"
              checked={interviewReminders}
              onChange={setInterviewReminders}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="candidate-updates" className="font-medium cursor-pointer">
                Cập nhật ứng viên
              </Label>
              <p className="text-sm text-muted-foreground">Thông báo khi có ứng viên mới nộp hồ sơ.</p>
            </div>
            <ToggleButton
              id="candidate-updates"
              checked={candidateUpdates}
              onChange={setCandidateUpdates}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}