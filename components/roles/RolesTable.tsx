'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Role, RoleFormData } from '@/lib/types';

export default function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    code: '',
    active: true,
  });

  const supabase = getSupabaseClient()

  // Fetch roles on load
  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate code from name if user is editing the name field
    if (name === 'name' && !formData.code) {
      const code = value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setFormData({ ...formData, name: value, code });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle checkbox change for active status
  const handleActiveChange = (checked: boolean) => {
    setFormData({ ...formData, active: checked });
  };

  // Fetch all roles
  const fetchRoles = async () => {
    setLoading(true);
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

  // Add a new role
  const addRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('roles')
        .insert([
          { 
            name: formData.name, 
            code: formData.code,
            active: formData.active
          }
        ]);
      
      if (error) throw error;
      
      toast.success('Role added successfully');
      setFormData({ name: '', code: '', active: true });
      fetchRoles();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast.error(error.message || 'Failed to add role');
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ active: !currentActive })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Role ${currentActive ? 'deactivated' : 'activated'} successfully`);
      fetchRoles();
    } catch (error: any) {
      console.error('Error toggling role status:', error);
      toast.error(error.message || 'Failed to update role');
    }
  };

  // Delete a role
  const deleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.message || 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Role</h2>
        <form onSubmit={addRole} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Content Editor"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Role Code</Label>
              <Input
                id="code"
                name="code"
                placeholder="e.g. editor"
                value={formData.code}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="active" 
              checked={formData.active}
              onCheckedChange={handleActiveChange}
            />
            <Label htmlFor="active">Active</Label>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Add Role
          </Button>
        </form>
      </div>

      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Roles</h2>
        {loading ? (
          <div className="text-center py-4">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No roles found. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b">
                    <td className="px-4 py-2">{role.name}</td>
                    <td className="px-4 py-2">
                      <code className="bg-muted px-1 py-0.5 rounded text-sm">
                        {role.code}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span 
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          role.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {role.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(role.id, role.active)}
                        >
                          {role.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRole(role.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 