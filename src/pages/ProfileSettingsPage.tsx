// src/pages/ProfileSettingsPage.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, Lock, Upload, Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { useTranslation } from 'react-i18next'

export function ProfileSettingsPage() {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      })
    }
  }, [user])

  const getInitials = () => {
    if (profile.full_name) {
      const names = profile.full_name.split(' ')
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase()
    }
    return user?.email?.[0].toUpperCase() || 'U'
  }

  const handleProfileUpdate = async () => {
    if (!profile.full_name || profile.full_name.trim() === '') {
      alert(t('profile.messages.nameRequired'))
      return
    }

    setLoading(true)
    try {
      const { error } = await updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url
      })

      if (error) {
        alert(t('profile.messages.saveError'))
        console.error(error)
      } else {
        alert(t('profile.messages.saveSuccess'))
      }
    } catch (error) {
      alert(t('profile.messages.saveError'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(t('profile.messages.passwordMismatch'))
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert(t('profile.security.passwordRequirements'))
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        alert(t('profile.messages.passwordChangeError'))
        console.error(error)
      } else {
        alert(t('profile.messages.passwordChangeSuccess'))
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      alert(t('profile.messages.passwordChangeError'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      
      await updateProfile({ avatar_url: publicUrl })
      alert(t('profile.messages.saveSuccess'))
    } catch (error) {
      alert('Error uploading avatar')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle>{t('profile.personalInfo.title')}</CardTitle>
            </div>
            <CardDescription>{t('profile.personalInfo.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                ) : (
                  <AvatarFallback className="text-2xl bg-blue-600 text-white">
                    {getInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('profile.personalInfo.avatar')}</p>
                <div className="flex gap-2">
                  <label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t('profile.personalInfo.uploadAvatar')}
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF. Max 2MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">
                {t('profile.personalInfo.fullName')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder={t('profile.personalInfo.fullNamePlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.personalInfo.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="pl-10 bg-gray-100"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('profile.personalInfo.emailNote')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('profile.personalInfo.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder={t('profile.personalInfo.phonePlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                {t('profile.buttons.cancel')}
              </Button>
              <Button onClick={handleProfileUpdate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('profile.buttons.saving')}
                  </>
                ) : (
                  t('profile.buttons.save')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>{t('profile.security.title')}</CardTitle>
            </div>
            <CardDescription>{t('profile.security.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.security.currentPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('profile.security.newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('profile.security.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('profile.security.passwordRequirements')}
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePasswordChange}
                disabled={loading || !passwordData.newPassword}
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('profile.buttons.saving')}
                  </>
                ) : (
                  t('profile.security.changePassword')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}