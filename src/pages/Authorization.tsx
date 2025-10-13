// src/pages/Authorization.tsx
"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Building2,
  Briefcase,
  Mail,
  Bell,
  List,
  Users,
  Shield,
  Settings,
  LayoutDashboard,
  FileText,
  UserCheck,
  Calendar,
  Star,
  MailOpen,
  ChevronLeft,
  Edit,
  RefreshCw,
  X,
} from "lucide-react"

type Permission = "view" | "create" | "edit" | "delete"

type RolePermissions = {
  [key: string]: {
    [key in Permission]: boolean
  }
}

type Role = {
  id: string
  name: string
  description: string
  color: string
  icon: any
  userCount: number
  permissions: RolePermissions
}

const modules = [
  { id: "dashboard", name: "Bảng điều khiển", icon: LayoutDashboard },
  { id: "job", name: "Mô tả công việc", icon: FileText },
  { id: "candidate", name: "Ứng viên", icon: Users },
  { id: "interview", name: "Lịch phỏng vấn", icon: Calendar },
  { id: "evaluation", name: "Đánh giá phỏng vấn", icon: Star },
  { id: "email", name: "Quản lý email", icon: MailOpen },
  { id: "settings", name: "Cài đặt hệ thống", icon: Settings },
]

const initialRoles: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Quản trị viên hệ thống",
    color: "#7c3aed",
    icon: Shield,
    userCount: 2,
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      job: { view: true, create: true, edit: true, delete: true },
      candidate: { view: true, create: true, edit: true, delete: true },
      interview: { view: true, create: true, edit: true, delete: true },
      evaluation: { view: true, create: true, edit: true, delete: true },
      email: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: "hr",
    name: "HR",
    description: "Nhân viên nhân sự",
    color: "#3b82f6",
    icon: UserCheck,
    userCount: 5,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      job: { view: true, create: true, edit: true, delete: true },
      candidate: { view: true, create: true, edit: true, delete: true },
      interview: { view: true, create: true, edit: true, delete: true },
      evaluation: { view: true, create: true, edit: true, delete: true },
      email: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: "interviewer",
    name: "Interviewer",
    description: "Người phỏng vấn",
    color: "#10b981",
    icon: Users,
    userCount: 8,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      job: { view: true, create: false, edit: false, delete: false },
      candidate: { view: true, create: false, edit: false, delete: false },
      interview: { view: true, create: false, edit: false, delete: false },
      evaluation: { view: true, create: true, edit: true, delete: false },
      email: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: "user",
    name: "User",
    description: "Người dùng cơ bản",
    color: "#6b7280",
    icon: Users,
    userCount: 12,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      job: { view: false, create: false, edit: false, delete: false },
      candidate: { view: false, create: false, edit: false, delete: false },
      interview: { view: false, create: false, edit: false, delete: false },
      evaluation: { view: false, create: false, edit: false, delete: false },
      email: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
  },
]

interface AuthorizationProps {
  children?: React.ReactNode
}

/**
 * Authorization component:
 * - If `children` prop is provided, render children (acts as a wrapper).
 * - Otherwise render the full Authorization page UI (standalone page).
 */
export default function Authorization({ children }: AuthorizationProps) {
  // If used as a wrapper in App.tsx: just render children
  if (children) return <>{children}</>

  // Otherwise render page UI
  const [activeTab, setActiveTab] = useState<"overview" | "roles" | "matrix">("overview")
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEditRole = (role: Role) => {
    setEditingRole({ ...role })
    setIsEditDialogOpen(true)
  }

  const handleSaveRole = () => {
    if (editingRole) {
      setRoles(roles.map((r) => (r.id === editingRole.id ? editingRole : r)))
      setIsEditDialogOpen(false)
      setEditingRole(null)
    }
  }

  const handlePermissionToggle = (roleId: string, moduleId: string, permission: Permission) => {
    setRoles(
      roles.map((role) => {
        if (role.id === roleId) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [moduleId]: {
                ...role.permissions[moduleId],
                [permission]: !role.permissions[moduleId][permission],
              },
            },
          }
        }
        return role
      }),
    )
  }

  const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0)
  const activeModules = modules.length
  const definedRoles = roles.length

  return (
    <div className="w-full bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Phân quyền hệ thống</h1>
          </div>
          <p className="text-gray-600">Quản lý vai trò và quyền truy cập của người dùng</p>
        </div>
        <button className="text-sm text-purple-600 hover:text-purple-700">Chế độ Demo</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "roles" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Quản lý vai trò
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "matrix" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Ma trận phân quyền
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Cài đặt hệ thống</h2>
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <RefreshCw className="w-4 h-4" />
                <span>Làm mới</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">Quản lý cấu hình và tùy chỉnh hệ thống</p>
            <p className="text-xs text-gray-500">Cập nhật lần cuối: 10:15:25 13/10/2025</p>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <List className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-900">
                Module Phân quyền cho phép quản lý vai trò và kiểm soát quyền truy cập vào các chức năng của hệ thống
                HR/Recruitment. (Hiện đang chạy ở chế độ Demo)
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-4 gap-4">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <Card key={role.id} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: role.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{role.userCount}</p>
                </Card>
              )
            })}
          </div>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Thống kê phân quyền</h3>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">{totalUsers}</p>
                <p className="text-sm text-gray-600">Tổng số người dùng</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600 mb-2">{activeModules}</p>
                <p className="text-sm text-gray-600">Modules hệ thống</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-600 mb-2">{definedRoles}</p>
                <p className="text-sm text-gray-600">Vai trò được định nghĩa</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vai trò phổ biến nhất</p>
                <p className="font-semibold text-gray-900">Interviewer</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Module đang hoạt động</p>
                <p className="font-semibold text-gray-900">7 modules</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quản lý vai trò</h2>
            <div className="space-y-4">
              {roles.map((role) => {
                const Icon = role.icon
                const enabledModules = Object.entries(role.permissions).filter(([_, perms]) =>
                  Object.values(perms).some((v) => v),
                )

                return (
                  <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${role.color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: role.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{role.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {enabledModules.slice(0, 4).map(([moduleId]) => {
                              const module = modules.find((m) => m.id === moduleId)
                              return (
                                <Badge key={moduleId} className="bg-blue-600 text-white hover:bg-blue-700">
                                  {module?.name}: Có
                                </Badge>
                              )
                            })}
                            {enabledModules.length > 4 && (
                              <Badge variant="secondary">+{enabledModules.length - 4} modules khác</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{role.userCount} người dùng</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Chỉnh sửa</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Matrix Tab */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ma trận phân quyền</h2>
              <p className="text-sm text-gray-600">Quản lý quyền truy cập chi tiết cho từng vai trò và module</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Lưu thay đổi
            </Button>
          </div>

          <Card className="overflow-hidden border-2 border-gray-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="text-left p-4 font-semibold text-gray-900 min-w-[200px]">Module / Vai trò</th>
                    {roles.map((role) => {
                      const Icon = role.icon
                      return (
                        <th key={role.id} className="text-center p-4 min-w-[220px]">
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${role.color}20` }}
                            >
                              <Icon className="w-6 h-6" style={{ color: role.color }} />
                            </div>
                            <span className="font-semibold text-gray-900">{role.name}</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => {
                    const ModuleIcon = module.icon
                    return (
                      <tr key={module.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <ModuleIcon className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">{module.name}</span>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={role.id} className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {(["view", "create", "edit", "delete"] as Permission[]).map((permission) => (
                                <div key={permission} className="flex flex-col items-center gap-1.5">
                                  <Switch
                                    checked={role.permissions[module.id]?.[permission] || false}
                                    onCheckedChange={() => handlePermissionToggle(role.id, module.id, permission)}
                                    className="data-[state=checked]:bg-blue-600"
                                  />
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {permission === "view"
                                      ? "Xem"
                                      : permission === "create"
                                        ? "Tạo"
                                        : permission === "edit"
                                          ? "Sửa"
                                          : "Xóa"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Chỉnh sửa vai trò</span>
              <button onClick={() => setIsEditDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-gray-600">
                Cập nhật thông tin của vai trò "{editingRole.name}". Các thay đổi sẽ được áp dụng cho tất cả người dùng
                có vai trò này.
              </p>

              <div className="space-y-2">
                <Label htmlFor="role-name">Tên vai trò</Label>
                <Input
                  id="role-name"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-description">Mô tả</Label>
                <Input
                  id="role-description"
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-color">Màu sắc</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200"
                    style={{ backgroundColor: editingRole.color }}
                  />
                  <Input
                    id="role-color"
                    value={editingRole.color}
                    onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                    className="flex-1 bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveRole} className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}