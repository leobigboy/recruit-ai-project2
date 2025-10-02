// src/components/settings/CompanySettings.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { useState } from "react"


// Giả sử bạn sẽ truyền props `profile` và `handleInputChange` từ component cha (SettingsPage)
interface CompanySettingsProps {
  profile: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  // Thêm các props khác nếu cần, ví dụ cho việc chọn màu
}

export function CompanySettings({ profile, handleInputChange }: CompanySettingsProps) {
  const [buttonColor, setButtonColor] = useState("#2563eb");
  const [menuColor, setMenuColor] = useState("#e0f2fe");

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin công ty</CardTitle>
          <CardDescription>Cập nhật thông tin cơ bản về công ty của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_name">Tên công ty</Label>
            <Input 
              id="company_name" 
              value={profile.company_name || 'Recruit AI'} 
              onChange={handleInputChange} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              type="url" 
              value={profile.website || 'https://company.com'} 
              onChange={handleInputChange} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ngôn ngữ hệ thống</CardTitle>
          <CardDescription>Chọn ngôn ngữ hiển thị cho toàn bộ hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full md:w-1/2">
            <Select defaultValue="vi">
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">🇻🇳 vi, Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Logo công ty</CardTitle>
            <CardDescription>Tải lên logo để hiển thị trên hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <Button variant="outline" className="mt-4">Thay đổi logo</Button>
            <p className="text-xs text-muted-foreground mt-2">Định dạng file: JPG, PNG, GIF, SVG. Kích thước tối đa: 2MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Mô tả công ty</CardTitle>
            <CardDescription>Giới thiệu về công ty và văn hóa làm việc.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            id="company_description" 
            value={profile.company_description || 'Hệ thống quản lý tuyển dụng thông minh với tích hợp AI'} 
            onChange={handleInputChange} 
            className="min-h-[100px]" 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Địa chỉ</CardTitle>
            <CardDescription>Thông tin liên hệ và địa chỉ văn phòng.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_address">Địa chỉ</Label>
            <Input 
              id="company_address" 
              value={profile.company_address || ''} 
              onChange={handleInputChange} 
              placeholder="Nhập địa chỉ công ty"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email liên hệ</Label>
            <Input 
              id="contact_email" 
              type="email" 
              value={profile.contact_email || 'contact@company.com'} 
              onChange={handleInputChange} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Màu sắc giao diện</CardTitle>
            <CardDescription>Màu sắc sẽ được áp dụng cho toàn bộ giao diện.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                  <Label>Màu button</Label>
                  <div className="flex items-center gap-2">
                      <Input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="h-10 w-12 p-1"/>
                      <Input value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Màu menu</Label>
                  <div className="flex items-center gap-2">
                      <Input type="color" value={menuColor} onChange={(e) => setMenuColor(e.target.value)} className="h-10 w-12 p-1"/>
                      <Input value={menuColor} onChange={(e) => setMenuColor(e.target.value)} />
                  </div>
              </div>
          </div>
          <Card className="bg-muted/50">
              <CardHeader><CardTitle className="text-sm font-medium">Xem trước màu sắc</CardTitle></CardHeader>
              <CardContent className="flex gap-4">
                  <Button style={{backgroundColor: buttonColor}}>Màu button chính</Button>
                  <Button style={{backgroundColor: menuColor}} variant="outline">Màu nền menu</Button>
              </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}