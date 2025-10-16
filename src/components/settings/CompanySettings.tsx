// src/components/settings/CompanySettings.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Building2, Globe, Languages } from "lucide-react"
import { useState } from "react"
import { useTranslation } from 'react-i18next'

interface CompanySettingsProps {
  profile: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function CompanySettings({ profile, handleInputChange }: CompanySettingsProps) {
  const { t, i18n } = useTranslation();
  const [buttonColor, setButtonColor] = useState("#2563eb");
  const [menuColor, setMenuColor] = useState("#e0f2fe");

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Lưu vào localStorage
    localStorage.setItem('language', lng);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Thông tin công ty */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle>{t('settings.company.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.company.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_name">
              {t('settings.company.name')} <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="company_name" 
              value={profile.company_name || ''} 
              onChange={handleInputChange}
              placeholder={t('settings.company.name')}
              className="font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">
              <Globe className="w-4 h-4 inline mr-1" />
              {t('settings.company.website')}
            </Label>
            <Input 
              id="website" 
              type="url" 
              value={profile.website || ''} 
              onChange={handleInputChange}
              placeholder="https://yourcompany.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ngôn ngữ hệ thống */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary" />
            <CardTitle>{t('settings.language.title')}</CardTitle>
          </div>
          <CardDescription>{t('settings.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full md:w-1/2">
            <Select 
              value={i18n.language} 
              onValueChange={changeLanguage}
            >
              <SelectTrigger id="language" className="bg-white">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{i18n.language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
                    <span>{i18n.language === 'vi' ? t('settings.language.vietnamese') : t('settings.language.english')}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="vi" className="cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🇻🇳</span>
                    <span>Tiếng Việt</span>
                  </div>
                </SelectItem>
                <SelectItem value="en" className="cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🇬🇧</span>
                    <span>English</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {i18n.language === 'vi' 
                ? '🇻🇳 Ngôn ngữ hiện tại: Tiếng Việt' 
                : '🇬🇧 Current language: English'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo công ty */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.logo.title')}</CardTitle>
          <CardDescription>{t('settings.logo.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <Button variant="outline" className="mt-4">{t('settings.logo.change')}</Button>
            <p className="text-xs text-muted-foreground mt-2">{t('settings.logo.format')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Mô tả công ty */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.company.description_label')}</CardTitle>
          <CardDescription>{t('settings.company.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            id="company_description" 
            value={profile.company_description || ''} 
            onChange={handleInputChange} 
            className="min-h-[100px]" 
            placeholder={t('settings.company.description_placeholder')}
          />
        </CardContent>
      </Card>

      {/* Địa chỉ và liên hệ */}
      <Card>
        <CardHeader>
          <CardTitle>
            {i18n.language === 'vi' ? 'Địa chỉ và liên hệ' : 'Address and Contact'}
          </CardTitle>
          <CardDescription>
            {i18n.language === 'vi' 
              ? 'Thông tin liên hệ và địa chỉ văn phòng' 
              : 'Contact information and office address'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_address">{t('settings.company.address')}</Label>
            <Input 
              id="company_address" 
              value={profile.company_address || ''} 
              onChange={handleInputChange} 
              placeholder={i18n.language === 'vi' 
                ? 'Số nhà, đường, phường, quận, thành phố' 
                : 'Street, district, city'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">{t('settings.company.email')}</Label>
            <Input 
              id="contact_email" 
              type="email" 
              value={profile.contact_email || ''} 
              onChange={handleInputChange}
              placeholder="contact@company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Màu sắc giao diện */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.colors.title')}</CardTitle>
          <CardDescription>{t('settings.colors.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('settings.colors.button')}</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="color" 
                  value={buttonColor} 
                  onChange={(e) => setButtonColor(e.target.value)} 
                  className="h-10 w-12 p-1 cursor-pointer"
                />
                <Input 
                  value={buttonColor} 
                  onChange={(e) => setButtonColor(e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.colors.menu')}</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="color" 
                  value={menuColor} 
                  onChange={(e) => setMenuColor(e.target.value)} 
                  className="h-10 w-12 p-1 cursor-pointer"
                />
                <Input 
                  value={menuColor} 
                  onChange={(e) => setMenuColor(e.target.value)}
                  placeholder="#e0f2fe"
                />
              </div>
            </div>
          </div>
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('settings.colors.preview')}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button style={{backgroundColor: buttonColor}}>{t('settings.colors.primaryButton')}</Button>
              <Button style={{backgroundColor: menuColor}} variant="outline">{t('settings.colors.menuBackground')}</Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}