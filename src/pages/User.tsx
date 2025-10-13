// src/pages/User.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabaseClient"
import {
  Users,
  Plus,
  RefreshCw,
  Activity,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle
} from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  role: string
  status: "ACTIVE" | "INACTIVE"
  synced: boolean
  created_at: string
  auth_user_id?: string
}

type Role = {
  roles: number
  name: string
}

type ActivityLog = {
  id: string
  user_id?: string
  user_name?: string
  action: string
  details?: string
  created_at: string
}

export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [lastSync, setLastSync] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    status: "ACTIVE",
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      console.log('📄 Fetching roles from cv_roles...')
      const { data, error } = await supabase
        .from('cv_roles')
        .select('*')
        .order('roles', { ascending: true })

      console.log('📊 Roles response:', { data, error })

      if (error) {
        console.error('❌ Error fetching roles:', error)
        if (error.message.includes('policy')) {
          setError('Không có quyền đọc danh sách vai trò. Vui lòng kiểm tra RLS policies trong Supabase.')
        }
        throw error
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No roles found in cv_roles table')
        setError('Không tìm thấy vai trò nào trong hệ thống. Vui lòng thêm vai trò vào bảng cv_roles.')
        setRoles([])
        return
      }

      console.log('✅ Successfully fetched roles:', data)
      setRoles(data)

      if (data && data.length > 0) {
        const defaultRole = data.find(r => r.name.toLowerCase() === 'user')
        const defaultRoleId = defaultRole ? defaultRole.roles.toString() : data[0].roles.toString()
        console.log('🎯 Setting default role:', defaultRoleId)
        setFormData(prev => ({ ...prev, role_id: defaultRoleId }))
      }
    } catch (error: any) {
      console.error('❌ Error in fetchRoles:', error)
      setRoles([])
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔥 Fetching users from cv_profiles...')
      const { data: usersData, error: usersError } = await supabase
        .from('cv_profiles')
        .select(`
          *,
          cv_user_roles (
            role_id,
            cv_roles (
              name
            )
          )
        `)

      console.log('📊 Users response:', { data: usersData, error: usersError })

      if (usersError) {
        console.error('❌ Error fetching users:', usersError)
        throw usersError
      }

      if (!usersData || usersData.length === 0) {
        console.warn('⚠️ No users found')
        setUsers([])
        setLastSync(new Date().toLocaleString('vi-VN'))
        return
      }

      const formattedUsers = (usersData || []).map((user: any) => {
        const userRole = user.cv_user_roles?.[0]
        const roleName = userRole?.cv_roles?.name || user.role || 'USER'

        return {
          id: user.id,
          name: user.full_name || user.name || 'Không có tên',
          email: user.email || 'Không có email',
          role: roleName.toUpperCase(),
          status: (user.status || 'active').toUpperCase(),
          synced: user.synced !== undefined ? user.synced : true,
          created_at: user.created_at || new Date().toISOString(),
          auth_user_id: user.auth_user_id || user.id
        }
      })

      formattedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log('✅ Successfully formatted users:', formattedUsers)
      setUsers(formattedUsers)
      setLastSync(new Date().toLocaleString('vi-VN'))
    } catch (error: any) {
      console.error('❌ Error in fetchUsers:', error)
      setError(`Không thể tải danh sách người dùng: ${error.message || 'Lỗi không xác định'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      await fetchUsers()
      setTimeout(() => setSyncing(false), 500)
    } catch (error) {
      console.error('Error syncing:', error)
      setSyncing(false)
    }
  }

  const fetchActivityLogs = async () => {
    try {
      setActivityLoading(true)
      setIsActivityDialogOpen(true)

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.log('Activity logs table not found or error:', error)
        setActivities([])
      } else {
        setActivities(data || [])
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      setActivities([])
    } finally {
      setActivityLoading(false)
    }
  }

  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const logActivity = async (userId: string, userName: string, action: string, details: string) => {
    try {
      await supabase.from('activity_logs').insert([
        {
          user_id: userId,
          user_name: userName,
          action: action,
          details: details,
        }
      ])
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  const handleCreateUser = async () => {
    try {
      setCreating(true)
      setError(null)

      // Validation
      if (!formData.name.trim()) {
        setError("Vui lòng nhập họ tên.")
        setCreating(false)
        return
      }
      if (!formData.email.trim()) {
        setError("Vui lòng nhập email.")
        setCreating(false)
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError("Email không hợp lệ.")
        setCreating(false)
        return
      }
      
      if (!formData.role_id) {
        setError("Vui lòng chọn vai trò.")
        setCreating(false)
        return
      }

      const password = formData.password.trim() || generatePassword()
      if (password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.")
        setCreating(false)
        return
      }

      console.log('🚀 Calling RPC function "create_cv_user"...', {
        p_email: formData.email.trim(),
        p_full_name: formData.name.trim(),
        p_role_id: parseInt(formData.role_id),
        p_status: formData.status.toLowerCase(),
      })

      const { data, error: rpcError } = await supabase.rpc('create_cv_user', {
        p_email: formData.email.trim(),
        p_password: password,
        p_full_name: formData.name.trim(),
        p_role_id: parseInt(formData.role_id),
        p_status: formData.status.toLowerCase(),
      })

      if (rpcError) {
        console.error('❌ RPC error:', rpcError)
        
        // Xử lý các loại lỗi cụ thể
        if (rpcError.message.includes('Email đã tồn tại')) {
          setError("Email này đã tồn tại trong hệ thống.")
        } else if (rpcError.message.includes('gen_salt')) {
          setError("Lỗi mã hóa mật khẩu. Vui lòng kiểm tra extension pgcrypto trong Supabase.")
        } else if (rpcError.code === '23502') {
          setError("Lỗi dữ liệu không được để trống. Vui lòng kiểm tra form.")
        } else if (rpcError.code === '42883') {
          setError("Lỗi function không tồn tại. Vui lòng kiểm tra SQL function trong Supabase.")
        } else {
          setError(`Lỗi tạo người dùng: ${rpcError.message}`)
        }
        setCreating(false)
        return
      }

      console.log('✅ User created successfully with ID:', data)

      // Log activity
      await logActivity(
        data,
        formData.name.trim(),
        'CREATE_USER',
        `Tạo người dùng mới: ${formData.name.trim()} (${formData.email.trim()}) - Vai trò: ${roles.find(r => r.roles.toString() === formData.role_id)?.name}`
      )

      console.log('🎉 User creation completed successfully!')

      // Show success dialog with credentials
      setCreatedCredentials({
        email: formData.email.trim(),
        password: password,
        name: formData.name.trim()
      })
      setIsSuccessDialogOpen(true)
      setIsDialogOpen(false)

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role_id: roles.find(r => r.name.toLowerCase() === 'user')?.roles.toString() || roles[0]?.roles.toString() || "",
        status: "ACTIVE",
      })
      
      // Refresh users list
      await fetchUsers()

    } catch (error: any) {
      console.error('❌ Unexpected error creating user:', error)
      setError(`Lỗi không xác định: ${error.message || JSON.stringify(error)}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)

    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${user?.name}"?\n\nLưu ý: Thao tác này không thể hoàn tác.`)) {
      return
    }

    try {
      // Xóa user roles trước
      await supabase
        .from('cv_user_roles')
        .delete()
        .eq('user_id', userId)

      // Xóa profile
      const { error: deleteError } = await supabase
        .from('cv_profiles')
        .delete()
        .eq('id', userId)

      if (deleteError) throw deleteError

      // Thử xóa auth user (cần service role)
      if (user?.auth_user_id) {
        try {
          await supabase.auth.admin.deleteUser(user.auth_user_id)
        } catch (authDeleteError) {
          console.log('Could not delete auth user (requires service role):', authDeleteError)
        }
      }

      // Log activity
      if (user) {
        await logActivity(
          userId,
          user.name,
          'DELETE_USER',
          `Xóa người dùng: ${user.name} (${user.email})`
        )
      }

      await fetchUsers()
      alert("Đã xóa người dùng thành công!")
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Không thể xóa người dùng: ${error.message || 'Lỗi không xác định'}`)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      case "INTERVIEWER":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "HR":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      case "USER":
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'CREATE_USER': 'Tạo người dùng',
      'DELETE_USER': 'Xóa người dùng',
    }
    return labels[action] || action
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Thêm người dùng
          </Button>
          <Button variant="outline" onClick={fetchActivityLogs}>
            <Activity className="h-4 w-4 mr-2" /> Hoạt động
          </Button>
        </div>
      </div>

      {lastSync && (
        <p className="text-sm text-muted-foreground mb-4">
          Lần đồng bộ cuối: {lastSync}
        </p>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 mb-4">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Không có người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle className="text-xl">Thêm người dùng mới</DialogTitle>
            <p id="dialog-description" className="text-sm text-muted-foreground mt-1">
              Tạo tài khoản mới cho người dùng. Hệ thống sẽ tự động tạo mật khẩu nếu bạn không nhập.
            </p>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Họ tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nhập họ tên"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập địa chỉ email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Mật khẩu <span className="text-muted-foreground text-xs">(Tùy chọn - Tự động tạo nếu để trống)</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Để trống để tạo tự động"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-muted/50 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.role_id} 
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger id="role" className="w-full bg-white">
                  <SelectValue placeholder="Chọn vai trò">
                    {formData.role_id && roles.length > 0
                      ? roles.find(r => r.roles.toString() === formData.role_id)?.name || "Chọn vai trò"
                      : "Chọn vai trò"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  className="bg-white border shadow-md max-h-[200px] overflow-auto"
                  style={{ zIndex: 99999 }}
                >
                  {roles.map((role) => (
                    <SelectItem 
                      key={role.roles} 
                      value={role.roles.toString()}
                      className="cursor-pointer hover:bg-accent"
                    >
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roles.length > 0 ? `${roles.length} vai trò khả dụng` : 'Đang tải vai trò...'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="w-full bg-white">
                  <SelectValue>
                    {formData.status === "ACTIVE" ? "Active" : "Inactive"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  className="bg-white border shadow-md"
                  style={{ zIndex: 99999 }}
                >
                  <SelectItem value="ACTIVE" className="cursor-pointer">Active</SelectItem>
                  <SelectItem value="INACTIVE" className="cursor-pointer">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={creating}>
              Hủy
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateUser} disabled={creating}>
              {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-xl">Tạo tài khoản thành công!</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Tài khoản đã được tạo. Vui lòng lưu thông tin đăng nhập và gửi cho người dùng.
            </p>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-3">Thông tin đăng nhập:</p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-blue-700">Họ tên</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={createdCredentials.name}
                        readOnly
                        className="bg-white border-blue-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-blue-700">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={createdCredentials.email}
                        readOnly
                        className="bg-white border-blue-200"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                        className="flex-shrink-0"
                      >
                        {copiedField === 'email' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-blue-700">Mật khẩu</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={createdCredentials.password}
                        readOnly
                        type={showPassword ? "text" : "password"}
                        className="bg-white border-blue-200 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex-shrink-0"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(createdCredentials.password, 'password')}
                        className="flex-shrink-0"
                      >
                        {copiedField === 'password' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Lưu ý: Thông tin này chỉ hiển thị một lần. Vui lòng sao chép và gửi cho người dùng ngay.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 w-full" 
              onClick={() => {
                setIsSuccessDialogOpen(false)
                setCreatedCredentials(null)
                setShowPassword(false)
              }}
            >
              Đã lưu thông tin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-foreground" />
              <div>
                <h3 className="text-xl">Lịch sử hoạt động</h3>
                <p className="text-sm text-muted-foreground mt-1">Theo dõi các hoạt động quản lý người dùng gần đây</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsActivityDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {activityLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Đang tải...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-base text-foreground font-medium">Chưa có hoạt động nào</p>
                <p className="text-sm text-muted-foreground mt-1">Các hoạt động quản lý người dùng sẽ được hiển thị ở đây</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{activity.user_name || 'Hệ thống'}</p>
                        <Badge variant="secondary" className="text-xs">{getActionLabel(activity.action)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{activity.details}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}