'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Permission, PermissionFormData } from '@/lib/types';

export default function PermissionsTable() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    slug: '',
  });

  // Fetch permissions on load
  useEffect(() => {
    fetchPermissions();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from name if user is editing the name field
    if (name === 'name' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setFormData({ ...formData, name: value, slug });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Fetch all permissions
  const fetchPermissions = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Add a new permission
  const addPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('permissions')
        .insert([
          { name: formData.name, slug: formData.slug }
        ]);
      
      if (error) throw error;
      
      toast.success('Permission added successfully');
      setFormData({ name: '', slug: '' });
      fetchPermissions();
    } catch (error: any) {
      console.error('Error adding permission:', error);
      toast.error(error.message || 'Failed to add permission');
    }
  };

  // Delete a permission
  const deletePermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;
    
    try {
      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error: any) {
      console.error('Error deleting permission:', error);
      toast.error(error.message || 'Failed to delete permission');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Permission</h2>
        <form onSubmit={addPermission} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Permission Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Manage Users"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g. manage-users"
                value={formData.slug}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Add Permission
          </Button>
        </form>
      </div>

      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Permissions</h2>
        {loading ? (
          <div className="text-center py-4">Loading permissions...</div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No permissions found. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Slug</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.id} className="border-b">
                    <td className="px-4 py-2">{permission.name}</td>
                    <td className="px-4 py-2">
                      <code className="bg-muted px-1 py-0.5 rounded text-sm">
                        {permission.slug}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePermission(permission.id)}
                      >
                        Delete
                      </Button>
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