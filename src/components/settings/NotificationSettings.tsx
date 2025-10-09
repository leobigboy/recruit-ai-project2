// src/components/settings/NotificationSettings.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [interviewReminders, setInterviewReminders] = useState(true)
  const [candidateUpdates, setCandidateUpdates] = useState(false)

  const handleSave = () => {
    // Logic lưu cài đặt sẽ được thêm vào sau
    alert("Cài đặt đã được lưu (giả lập).");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt Thông báo</CardTitle>
        <CardDescription>Quản lý các thông báo tự động của hệ thống.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email-notifications" className="font-medium">
              Thông báo email
            </Label>
            <p className="text-sm text-muted-foreground">Nhận thông báo chung qua email.</p>
          </div>
          <Switch 
            id="email-notifications" 
            checked={emailNotifications} 
            onCheckedChange={setEmailNotifications}
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 shadow-md ring-1 ring-black ring-opacity-5"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="interview-reminders" className="font-medium">
              Nhắc nhở phỏng vấn
            </Label>
            <p className="text-sm text-muted-foreground">Gửi email nhắc nhở trước buổi phỏng vấn.</p>
          </div>
          <Switch 
            id="interview-reminders" 
            checked={interviewReminders} 
            onCheckedChange={setInterviewReminders}
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 shadow-md ring-1 ring-black ring-opacity-5"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="candidate-updates" className="font-medium">
              Cập nhật ứng viên
            </Label>
            <p className="text-sm text-muted-foreground">Thông báo khi có ứng viên mới nộp hồ sơ.</p>
          </div>
          <Switch 
            id="candidate-updates" 
            checked={candidateUpdates} 
            onCheckedChange={setCandidateUpdates}
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 shadow-md ring-1 ring-black ring-opacity-5"
          />
        </div>
      </CardContent>
    </Card>
  )
}