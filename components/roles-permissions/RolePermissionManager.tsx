'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Permission, Role, RolePermission } from '@/lib/types';

export default function RolePermissionManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    } else {
      setRolePermissions([]);
    }
  }, [selectedRoleId]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles_permissions')
        .select(`
          id,
          role_id,
          permission_id,
          permissions:permission_id(id, name, slug)
        `)
        .eq('role_id', roleId);
      
      if (error) throw error;
      setRolePermissions(data || []);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error('Failed to fetch role permissions');
    } finally {
      setLoading(false);
    }
  };

  const assignPermissionToRole = async () => {
    if (!selectedRoleId || !selectedPermissionId) {
      toast.error('Please select both a role and a permission');
      return;
    }

    setAssigning(true);
    try {
      // Проверяем, существует ли уже такая связь
      const { data: existing, error: checkError } = await supabase
        .from('roles_permissions')
        .select('id')
        .eq('role_id', selectedRoleId)
        .eq('permission_id', selectedPermissionId)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existing) {
        toast.info('This permission is already assigned to the selected role');
        setAssigning(false);
        return;
      }
      
      // Добавляем связь
      const { error } = await supabase
        .from('roles_permissions')
        .insert([
          { 
            role_id: selectedRoleId, 
            permission_id: selectedPermissionId
          }
        ]);
      
      if (error) throw error;
      
      toast.success('Permission assigned to role successfully');
      setSelectedPermissionId('');
      
      // Обновляем список разрешений для выбранной роли
      fetchRolePermissions(selectedRoleId);
    } catch (error: any) {
      console.error('Error assigning permission to role:', error);
      toast.error(error.message || 'Failed to assign permission to role');
    } finally {
      setAssigning(false);
    }
  };

  const removePermissionFromRole = async (rolePermissionId: string) => {
    if (!confirm('Are you sure you want to remove this permission from the role?')) return;
    
    try {
      const { error } = await supabase
        .from('roles_permissions')
        .delete()
        .eq('id', rolePermissionId);
      
      if (error) throw error;
      
      toast.success('Permission removed from role successfully');
      
      // Обновляем список разрешений для выбранной роли
      fetchRolePermissions(selectedRoleId);
    } catch (error: any) {
      console.error('Error removing permission from role:', error);
      toast.error(error.message || 'Failed to remove permission from role');
    }
  };

  // Получаем название роли по ID
  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  // Проверяем, доступно ли разрешение для выбранной роли
  const isPermissionAvailable = (permissionId: string) => {
    return !rolePermissions.some(rp => rp.permission_id === permissionId);
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Assign Permissions to Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">Select a Role</Label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
              >
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} ({role.active ? 'Active' : 'Inactive'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRoleId && (
              <div className="space-y-2">
                <Label htmlFor="permission-select">Select a Permission to Assign</Label>
                <Select
                  value={selectedPermissionId}
                  onValueChange={setSelectedPermissionId}
                >
                  <SelectTrigger id="permission-select" className="w-full">
                    <SelectValue placeholder="Select a permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions
                      .filter(permission => isPermissionAvailable(permission.id))
                      .map((permission) => (
                        <SelectItem key={permission.id} value={permission.id}>
                          {permission.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={assignPermissionToRole} 
                  disabled={!selectedRoleId || !selectedPermissionId || assigning}
                  className="w-full mt-2"
                >
                  {assigning ? 'Assigning...' : 'Assign Permission to Role'}
                </Button>
              </div>
            )}
          </div>

          <div>
            {selectedRoleId && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Permissions for {getRoleName(selectedRoleId)}
                </h3>
                {loading ? (
                  <div className="text-center py-4">Loading permissions...</div>
                ) : rolePermissions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No permissions assigned to this role.
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {rolePermissions.map((rp) => (
                      <li key={rp.id} className="flex justify-between items-center bg-muted p-2 rounded">
                        <span>
                          {/* @ts-ignore */}
                          {rp.permissions?.name || 'Unknown Permission'}
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePermissionFromRole(rp.id)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 