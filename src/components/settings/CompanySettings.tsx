// src/components/settings/CompanySettings.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Building2, Globe, Languages, Palette, RefreshCw, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'

interface CompanySettingsProps {
  profile: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

// Hàm chuyển đổi hex sang HSL
const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// Áp dụng màu sắc vào @theme variables của Tailwind v4
const applyThemeColors = (buttonColor: string, menuColor: string) => {
  const root = document.documentElement;
  
  const buttonHSL = hexToHSL(buttonColor);
  const menuHSL = hexToHSL(menuColor);
  
  // ============ PRIMARY COLOR (Buttons, Active states, Links) ============
  root.style.setProperty('--primary', `${buttonHSL.h} ${buttonHSL.s}% ${buttonHSL.l}%`);
  
  // Màu text trên nền primary
  const primaryForeground = buttonHSL.l > 50 ? '0 0% 10%' : '0 0% 98%';
  root.style.setProperty('--primary-foreground', primaryForeground);
  
  // ============ SECONDARY COLOR (Cards, Hover states) ============
  root.style.setProperty('--secondary', `${menuHSL.h} ${menuHSL.s}% ${menuHSL.l}%`);
  
  const secondaryForeground = menuHSL.l > 50 ? '222.2 47.4% 11.2%' : '0 0% 98%';
  root.style.setProperty('--secondary-foreground', secondaryForeground);
  
  // ============ ACCENT COLOR (Sidebar, Highlights) ============
  // Accent sẽ dùng màu primary nhưng nhạt hơn cho sidebar
  const accentL = Math.min(buttonHSL.l + 45, 95);
  root.style.setProperty('--accent', `${buttonHSL.h} ${Math.max(buttonHSL.s - 20, 30)}% ${accentL}%`);
  root.style.setProperty('--accent-foreground', `${buttonHSL.h} ${buttonHSL.s}% ${buttonHSL.l}%`);
  
  // ============ MUTED COLOR (Backgrounds, Subtle elements) ============
  root.style.setProperty('--muted', `${menuHSL.h} ${Math.max(menuHSL.s - 10, 0)}% ${Math.min(menuHSL.l + 2, 98)}%`);
  const mutedForeground = menuHSL.l > 70 ? '215.4 16.3% 46.9%' : '0 0% 60%';
  root.style.setProperty('--muted-foreground', mutedForeground);
  
  // ============ RING COLOR (Focus outlines) ============
  root.style.setProperty('--ring', `${buttonHSL.h} ${buttonHSL.s}% ${buttonHSL.l}%`);
  
  // ============ BORDER COLOR ============
  const borderL = Math.min(menuHSL.l + 10, 95);
  root.style.setProperty('--border', `${menuHSL.h} ${Math.max(menuHSL.s - 20, 15)}% ${borderL}%`);
  
  // ============ CUSTOM CSS VARIABLES cho Sidebar và UI Components ============
  // Sidebar background
  root.style.setProperty('--sidebar-bg', buttonColor);
  root.style.setProperty('--sidebar-text', primaryForeground === '0 0% 10%' ? '#000000' : '#FFFFFF');
  root.style.setProperty('--sidebar-active', `${buttonHSL.h} ${Math.min(buttonHSL.s + 10, 100)}% ${Math.min(buttonHSL.l + 10, 90)}%`);
  root.style.setProperty('--sidebar-hover', `${buttonHSL.h} ${buttonHSL.s}% ${Math.min(buttonHSL.l + 5, 85)}%`);
  
  // Card highlights
  root.style.setProperty('--card-highlight', menuColor);
  root.style.setProperty('--card-border', `hsl(${menuHSL.h} ${Math.max(menuHSL.s - 15, 0)}% ${Math.max(menuHSL.l - 10, 80)}%)`);
};

// Lưu và load từ localStorage
const saveColors = (buttonColor: string, menuColor: string) => {
  localStorage.setItem('theme-button-color', buttonColor);
  localStorage.setItem('theme-menu-color', menuColor);
};

const loadColors = () => {
  return {
    buttonColor: localStorage.getItem('theme-button-color') || '#222831',
    menuColor: localStorage.getItem('theme-menu-color') || '#e8f4fa'
  };
};

export function CompanySettings({ profile, handleInputChange }: CompanySettingsProps) {
  const { t, i18n } = useTranslation();
  const savedColors = loadColors();
  const [buttonColor, setButtonColor] = useState(savedColors.buttonColor);
  const [menuColor, setMenuColor] = useState(savedColors.menuColor);
  const [isApplied, setIsApplied] = useState(false);

  // Áp dụng màu đã lưu khi component mount
  useEffect(() => {
    applyThemeColors(buttonColor, menuColor);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // Xử lý áp dụng màu sắc
  const handleApplyColors = () => {
    applyThemeColors(buttonColor, menuColor);
    saveColors(buttonColor, menuColor);
    setIsApplied(true);
    
    setTimeout(() => setIsApplied(false), 2500);
  };

  // Reset về màu mặc định
  const handleResetColors = () => {
    const defaultButtonColor = '#222831';
    const defaultMenuColor = '#e8f4fa';
    
    setButtonColor(defaultButtonColor);
    setMenuColor(defaultMenuColor);
    applyThemeColors(defaultButtonColor, defaultMenuColor);
    saveColors(defaultButtonColor, defaultMenuColor);
  };

  // Preset màu sắc chuyên nghiệp
  const colorPresets = [
    { name: 'Default', button: '#222831', menu: '#e8f4fa' },
    { name: 'Blue', button: '#2563eb', menu: '#dbeafe' },
    { name: 'Green', button: '#16a34a', menu: '#dcfce7' },
    { name: 'Purple', button: '#9333ea', menu: '#f3e8ff' },
    { name: 'Orange', button: '#ea580c', menu: '#ffedd5' },
    { name: 'Pink', button: '#db2777', menu: '#fce7f3' },
    { name: 'Indigo', button: '#4f46e5', menu: '#e0e7ff' },
    { name: 'Teal', button: '#0d9488', menu: '#ccfbf1' },
    { name: 'Red', button: '#dc2626', menu: '#fee2e2' },
    { name: 'Slate', button: '#475569', menu: '#f1f5f9' },
    { name: 'Emerald', button: '#059669', menu: '#d1fae5' },
    { name: 'Amber', button: '#d97706', menu: '#fef3c7' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
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
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle>{t('settings.colors.title')}</CardTitle>
              </div>
              <CardDescription className="mt-2">
                {t('settings.colors.description')}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetColors}
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
            >
              <RefreshCw className="w-4 h-4" />
              {i18n.language === 'vi' ? 'Đặt lại' : 'Reset'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Color Pickers */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                {t('settings.colors.button')}
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Input 
                    type="color" 
                    value={buttonColor} 
                    onChange={(e) => setButtonColor(e.target.value)} 
                    className="h-14 w-14 p-1 cursor-pointer border-2 border-gray-300 hover:border-primary transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Palette className="w-3 h-3 text-primary" />
                  </div>
                </div>
                <Input 
                  value={buttonColor.toUpperCase()} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-F]{0,6}$/i.test(val) || val === '') {
                      setButtonColor(val);
                    }
                  }}
                  placeholder="#2563EB"
                  className="font-mono text-sm uppercase font-semibold"
                  maxLength={7}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {i18n.language === 'vi' 
                  ? '🎯 Màu cho nút bấm và các thành phần chính' 
                  : '🎯 Color for buttons and primary elements'}
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                {t('settings.colors.menu')}
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Input 
                    type="color" 
                    value={menuColor} 
                    onChange={(e) => setMenuColor(e.target.value)} 
                    className="h-14 w-14 p-1 cursor-pointer border-2 border-gray-300 hover:border-primary transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Palette className="w-3 h-3 text-secondary-foreground" />
                  </div>
                </div>
                <Input 
                  value={menuColor.toUpperCase()} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-F]{0,6}$/i.test(val) || val === '') {
                      setMenuColor(val);
                    }
                  }}
                  placeholder="#E0F2FE"
                  className="font-mono text-sm uppercase font-semibold"
                  maxLength={7}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {i18n.language === 'vi' 
                  ? '🎨 Màu cho nền menu, card và các khu vực phụ' 
                  : '🎨 Color for menu, card backgrounds and secondary areas'}
              </p>
            </div>
          </div>

          {/* Preset Colors */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              {i18n.language === 'vi' ? 'Bảng màu có sẵn' : 'Color Presets'}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {colorPresets.map((preset) => {
                const isActive = buttonColor.toLowerCase() === preset.button.toLowerCase() && 
                                menuColor.toLowerCase() === preset.menu.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setButtonColor(preset.button);
                      setMenuColor(preset.menu);
                    }}
                    className={`group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-105 ${
                      isActive ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex gap-1.5">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: preset.button }}
                      />
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: preset.menu }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-primary font-semibold' : ''}`}>
                      {preset.name}
                    </span>
                    {isActive && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg animate-slide-in">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              👁️ {t('settings.colors.preview')}
              {isApplied && (
                <span className="text-xs text-green-600 font-normal flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full animate-slide-in">
                  <Check className="w-3 h-3" />
                  {i18n.language === 'vi' ? 'Đã áp dụng!' : 'Applied!'}
                </span>
              )}
            </Label>
            
            <Card className="bg-gradient-to-br from-muted/30 via-muted/50 to-muted/30 border-2 border-dashed">
              <CardContent className="p-6 space-y-5">
                {/* Button previews */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {i18n.language === 'vi' ? 'Các kiểu nút:' : 'Button variants:'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-primary text-primary-foreground hover:opacity-90">
                      Primary Button
                    </Button>
                    <Button variant="secondary" className="bg-secondary text-secondary-foreground">
                      Secondary Button
                    </Button>
                    <Button variant="outline">
                      Outline Button
                    </Button>
                    <Button variant="ghost">
                      Ghost Button
                    </Button>
                  </div>
                </div>
                
                {/* Demo cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div 
                    className="p-4 rounded-lg border-2 transition-all shadow-sm"
                    style={{ 
                      backgroundColor: buttonColor,
                      borderColor: buttonColor
                    }}
                  >
                    <p 
                      className="text-sm font-medium"
                      style={{ color: hexToHSL(buttonColor).l > 50 ? '#000' : '#fff' }}
                    >
                      ✨ Primary Card
                    </p>
                  </div>
                  <div 
                    className="p-4 rounded-lg border-2 transition-all shadow-sm"
                    style={{ 
                      backgroundColor: menuColor,
                      borderColor: menuColor
                    }}
                  >
                    <p 
                      className="text-sm font-medium"
                      style={{ color: hexToHSL(menuColor).l > 50 ? '#000' : '#fff' }}
                    >
                      🎨 Secondary Card
                    </p>
                  </div>
                </div>

                {/* Color info */}
                <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-dashed">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: buttonColor }}></div>
                    <span className="font-mono">{buttonColor.toUpperCase()}</span>
                    <span className="text-muted-foreground">
                      (HSL: {hexToHSL(buttonColor).h}° {hexToHSL(buttonColor).s}% {hexToHSL(buttonColor).l}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: menuColor }}></div>
                    <span className="font-mono">{menuColor.toUpperCase()}</span>
                    <span className="text-muted-foreground">
                      (HSL: {hexToHSL(menuColor).h}° {hexToHSL(menuColor).s}% {hexToHSL(menuColor).l}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Apply Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">
                💡 {i18n.language === 'vi' ? 'Lưu ý:' : 'Note:'}
              </p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>
                  {i18n.language === 'vi' 
                    ? 'Chọn màu hoặc chọn từ bảng màu có sẵn' 
                    : 'Pick colors or choose from presets'}
                </li>
                <li>
                  {i18n.language === 'vi' 
                    ? 'Nhấn nút "Áp dụng" để lưu thay đổi' 
                    : 'Click "Apply" button to save changes'}
                </li>
              </ul>
            </div>
            <Button
              onClick={handleApplyColors}
              size="lg"
              className="flex items-center gap-2 min-w-[200px] justify-center bg-primary hover:opacity-90"
              disabled={isApplied}
            >
              {isApplied ? (
                <>
                  <Check className="w-5 h-5" />
                  {i18n.language === 'vi' ? 'Đã áp dụng!' : 'Applied!'}
                </>
              ) : (
                <>
                  <Palette className="w-5 h-5" />
                  {i18n.language === 'vi' ? 'Áp dụng màu sắc' : 'Apply Colors'}
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="font-semibold text-blue-900 flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              {i18n.language === 'vi' ? 'Cách sử dụng chức năng màu sắc:' : 'How to use color customization:'}
            </p>
            <ol className="space-y-1.5 ml-6 list-decimal text-blue-800 leading-relaxed">
              <li>
                {i18n.language === 'vi' 
                  ? 'Chọn màu bằng cách nhấn vào ô màu hoặc nhập mã HEX trực tiếp' 
                  : 'Pick colors by clicking the color box or entering HEX code directly'}
              </li>
              <li>
                {i18n.language === 'vi' 
                  ? 'Hoặc chọn nhanh từ 12 bộ màu có sẵn phía trên' 
                  : 'Or quickly select from 12 preset color schemes above'}
              </li>
              <li>
                {i18n.language === 'vi' 
                  ? 'Xem trước giao diện trong phần Preview' 
                  : 'Preview the interface in the Preview section'}
              </li>
              <li>
                {i18n.language === 'vi' 
                  ? 'Nhấn "Áp dụng màu sắc" để lưu và áp dụng cho toàn bộ hệ thống' 
                  : 'Click "Apply Colors" to save and apply to the entire system'}
              </li>
              <li>
                {i18n.language === 'vi' 
                  ? 'Màu sắc sẽ được lưu tự động và áp dụng khi bạn quay lại' 
                  : 'Colors will be automatically saved and applied when you return'}
              </li>
              <li className="text-blue-600 font-medium">
                {i18n.language === 'vi' 
                  ? '🔄 Dùng nút "Đặt lại" để khôi phục màu mặc định' 
                  : '🔄 Use "Reset" button to restore default colors'}
              </li>
            </ol>
            
            <div className="pt-2 border-t border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">
                🎨 {i18n.language === 'vi' ? 'Màu sắc sẽ được áp dụng cho:' : 'Colors will be applied to:'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-blue-700">
                <div className="flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{i18n.language === 'vi' ? 'Sidebar menu' : 'Sidebar menu'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{i18n.language === 'vi' ? 'Tất cả buttons' : 'All buttons'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{i18n.language === 'vi' ? 'Cards & containers' : 'Cards & containers'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{i18n.language === 'vi' ? 'Links & icons' : 'Links & icons'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{i18n.language === 'vi' ? 'Charts & graphs' : 'Charts & graphs'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{i18n.language === 'vi' ? 'Badges & labels' : 'Badges & labels'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}