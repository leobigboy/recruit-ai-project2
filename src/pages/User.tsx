// src/pages/user.tsx
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
  Link2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "INTERVIEWER"
  status: "ACTIVE" | "INACTIVE"
  synced: boolean
  created_at: string
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
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    status: "ACTIVE",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
      setLastSync(new Date().toLocaleString('vi-VN'))
    } catch (error) {
      console.error('Error fetching users:', error)
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

  const handleCreateUser = async () => {
    try {
      // Optional: basic validation
      if (!formData.name || !formData.email || (formData.password && formData.password.length < 6)) {
        alert("Vui lòng điền đầy đủ thông tin (mật khẩu >= 6 ký tự nếu có).")
        return
      }

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.status,
            synced: true,
          }
        ])
        .select()

      if (error) throw error

      // Log activity (if activity_logs table exists)
      await supabase.from('activity_logs').insert([
        {
          user_name: formData.name,
          action: 'CREATE_USER',
          details: `Tạo người dùng mới: ${formData.name} (${formData.email})`,
        }
      ]).catch(() => {/* ignore logging errors */})

      setIsDialogOpen(false)
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "USER",
        status: "ACTIVE",
      })
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      alert("Không thể tạo người dùng.")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // Log activity
      if (user) {
        await supabase.from('activity_logs').insert([
          {
            user_name: user.name,
            action: 'DELETE_USER',
            details: `Xóa người dùng: ${user.name} (${user.email})`,
          }
        ]).catch(() => {/* ignore logging errors */})
      }

      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert("Không thể xóa người dùng.")
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive"
      case "INTERVIEWER":
        return "default"
      case "USER":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "ADMIN"
      case "INTERVIEWER":
        return "INTERVIEWER"
      case "USER":
        return "USER"
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'CREATE_USER': 'Tạo người dùng',
      'DELETE_USER': 'Xóa người dùng',
      'UPDATE_USER': 'Cập nhật người dùng',
      'SYNC': 'Đồng bộ dữ liệu',
    }
    return labels[action] || action
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Quản lý người dùng</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{users.length} users
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Quản lý tài khoản và phân quyền người dùng</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Trạng thái đồng bộ: Lần cuối: {lastSync || '---'} (Tự động)</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-blue-600"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Đồng bộ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivityLogs}
            >
              <Activity className="h-4 w-4 mr-2" />
              Lịch sử hoạt động
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        <div className="border rounded-lg bg-card">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-blue-100">
                          <AvatarFallback className="text-blue-600 text-sm">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.name}</p>
                            {user.synced && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className={
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-700 hover:bg-red-100"
                            : user.role === "INTERVIEWER"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : ""
                        }
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      {/*
        IMPORTANT: overflow-visible on DialogContent so Select popper can overflow outside modal bounds.
        Also ensure SelectContent uses position="popper" + high z-index.
      */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] overflow-visible"> {/* <-- overflow-visible here */}
          <DialogHeader>
            <DialogTitle className="text-xl">Thêm người dùng mới</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo tài khoản mới cho người dùng. Điền đầy đủ thông tin bên dưới để tạo tài khoản.
            </p>
          </DialogHeader>
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
                Mật khẩu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role" className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50" sideOffset={6}>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="INTERVIEWER">Interviewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status" className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50" sideOffset={6}>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateUser}>
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Logs Dialog */}
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
