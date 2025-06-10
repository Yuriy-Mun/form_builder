'use client'

import { useState, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Shield, Ban, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUsers, useUpdateUser, type User, type UseUsersParams } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useApi'
import { useToast } from '@/hooks/use-toast'
import { CreateUserDialog } from '@/components/admin/users/CreateUserDialog'
import { EditUserDialog } from '@/components/admin/users/EditUserDialog'
import { DeleteUserDialog } from '@/components/admin/users/DeleteUserDialog'
import { UserPermissionsDialog } from '@/components/admin/users/UserPermissionsDialog'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { SetPageTitle, UseHeaderComponent } from '@/lib/page-context'

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Debounce поиска для уменьшения количества запросов
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)

  // Параметры для хука useUsers
  const usersParams: UseUsersParams = {
    page: currentPage,
    limit: 10,
    search: debouncedSearchTerm,
    role: selectedRole || undefined
  }

  const { users, pagination, loading, error, refetch } = useUsers(usersParams)
  const { data: rolesData } = useRoles()
  const roles = rolesData?.roles || []
  const { updateUser } = useUpdateUser()
  const { toast } = useToast()

  // Обработчики для поиска и фильтрации
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Сбрасываем на первую страницу при поиске
  }, [])

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    setCurrentPage(1) // Сбрасываем на первую страницу при смене фильтра
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleViewPermissions = (user: User) => {
    setSelectedUser(user)
    setPermissionsDialogOpen(true)
  }

  const handleBanUser = async (user: User) => {
    try {
      const banUntil = user.banned_until ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      await updateUser(user.id, { banned_until: banUntil })
      toast({
        title: user.banned_until ? 'Пользователь разблокирован' : 'Пользователь заблокирован',
        description: user.banned_until 
          ? `Пользователь ${user.email} был разблокирован.`
          : `Пользователь ${user.email} был заблокирован на 30 дней.`,
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось изменить статус пользователя',
        variant: 'destructive',
      })
    }
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const getRoleBadgeVariant = (roleCode: string) => {
    switch (roleCode) {
      case 'admin':
        return 'destructive'
      case 'editor':
        return 'default'
      case 'viewer':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Загрузка пользователей...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Ошибка загрузки пользователей: {error}</p>
              <Button onClick={refetch} className="mt-4">
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
    <SetPageTitle title="Users" description="Manage system users" />
    <UseHeaderComponent id="add-user-button">
      <Button onClick={() => setCreateDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Добавить пользователя
      </Button>
    </UseHeaderComponent>
    <div className="py-6 space-y-6">

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На странице</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Страница</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagination?.page || 1} из {pagination?.totalPages || 1}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ролей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="">Все роли</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <CardHeader>
          <CardTitle>Пользователи ({pagination?.total || 0})</CardTitle>
          <CardDescription>
            Список всех пользователей системы с их ролями и статусом
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Последний вход</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.email}</div>
                        {user.user_metadata?.full_name && (
                          <div className="text-sm text-muted-foreground">
                            {user.user_metadata.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.roles.code)}>
                      {user.roles.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned_until ? (
                      <Badge variant="destructive">Заблокирован</Badge>
                    ) : user.email_confirmed_at ? (
                      <Badge variant="default">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Не подтвержден</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(user.last_sign_in_at), {
                          addSuffix: true,
                          locale: ru
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Никогда</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                        locale: ru
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewPermissions(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Разрешения
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBanUser(user)}>
                          <Ban className="mr-2 h-4 w-4" />
                          {user.banned_until ? 'Разблокировать' : 'Заблокировать'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Пагинация */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Показано {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} пользователей
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Предыдущая
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Следующая
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалоги */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            user={selectedUser}
            onSuccess={refetch}
          />
          <DeleteUserDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            user={selectedUser}
            onSuccess={refetch}
          />
          <UserPermissionsDialog
            open={permissionsDialogOpen}
            onOpenChange={setPermissionsDialogOpen}
            user={selectedUser}
          />
        </>
      )}
    </div>
    </>
  )
} 