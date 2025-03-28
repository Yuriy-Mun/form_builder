export interface Permission {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionFormData {
  name: string;
  slug: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleFormData {
  name: string;
  code: string;
  active: boolean;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
  updated_at: string;
  
  // Связанные данные (могут быть null при обычном запросе)
  roles?: Role;
  permissions?: Permission;
}

export interface RolePermissionFormData {
  role_id: string;
  permission_id: string;
}

export interface User {
  id: string;
  email: string;
  role_id: string;
  created_at: string;
  updated_at: string;
  
  // Связанные данные
  roles?: Role;
}

export interface UserFormData {
  email: string;
  password: string;
  role_id: string;
} 