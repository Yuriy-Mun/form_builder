'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { Permission, PermissionFormData } from '@/lib/types';

interface PermissionsCRUDProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export default function PermissionsCRUD({ isDialogOpen, setIsDialogOpen }: PermissionsCRUDProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    slug: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Fetch permissions on load
  useEffect(() => {
    fetchPermissions();
  }, []);

  // Reset form data when dialog opens for adding new permission
  useEffect(() => {
    if (isDialogOpen && !editMode) {
      resetForm();
    }
  }, [isDialogOpen, editMode]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from name if user is editing the name field and we're not in edit mode
    if (name === 'name' && !editMode) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setFormData({ ...formData, name: value, slug });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditMode(false);
    setCurrentId(null);
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
      resetForm();
      fetchPermissions();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding permission:', error);
      toast.error(error.message || 'Failed to add permission');
    }
  };

  // Update a permission
  const updatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !currentId) {
      toast.error('Name and slug are required');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('permissions')
        .update({ name: formData.name, slug: formData.slug })
        .eq('id', currentId);
      
      if (error) throw error;
      
      toast.success('Permission updated successfully');
      resetForm();
      fetchPermissions();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error(error.message || 'Failed to update permission');
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

  // Set up edit mode
  const handleEdit = (permission: Permission) => {
    setFormData({
      name: permission.name,
      slug: permission.slug,
    });
    setCurrentId(permission.id);
    setEditMode(true);
    setIsDialogOpen(true);
  };

  // Handle dialog open
  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Permissions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Loading permissions...
                </TableCell>
              </TableRow>
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No permissions found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      {permission.slug}
                    </code>
                  </TableCell>
                  <TableCell>{new Date(permission.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(permission.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(permission)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePermission(permission.id)}
                      >
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

      {/* Add/Edit Permission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Permission' : 'Add New Permission'}
            </DialogTitle>
            <DialogDescription>
              {editMode 
                ? 'Update the permission details below.'
                : 'Fill in the details below to create a new permission.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editMode ? updatePermission : addPermission} className="space-y-4">
            <div className="space-y-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editMode ? 'Update Permission' : 'Add Permission'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 