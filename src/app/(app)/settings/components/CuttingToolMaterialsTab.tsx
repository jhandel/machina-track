'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { SettingsService } from '@/services';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CuttingToolMaterial } from '@/lib/database/interfaces';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

type MaterialForm = z.infer<typeof materialSchema>;

export function CuttingToolMaterialsTab() {
  const [materials, setMaterials] = useState<CuttingToolMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CuttingToolMaterial | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
    },
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getCuttingToolMaterials();
      setMaterials(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch cutting tool materials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleCreate = () => {
    setEditingMaterial(null);
    form.reset({ name: '' });
    setDialogOpen(true);
  };

  const handleEdit = (material: CuttingToolMaterial) => {
    setEditingMaterial(material);
    form.reset({ name: material.name });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: MaterialForm) => {
    try {
      setSubmitting(true);
      if (editingMaterial) {
        await SettingsService.updateCuttingToolMaterial(editingMaterial.id, data);
        toast({
          title: 'Success',
          description: 'Cutting tool material updated successfully',
        });
      } else {
        await SettingsService.createCuttingToolMaterial(data);
        toast({
          title: 'Success',
          description: 'Cutting tool material created successfully',
        });
      }
      setDialogOpen(false);
      fetchMaterials();
    } catch (error) {
      toast({
        title: 'Error',
        description: editingMaterial ? 'Failed to update cutting tool material' : 'Failed to create cutting tool material',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (material: CuttingToolMaterial) => {
    if (!confirm(`Are you sure you want to delete "${material.name}"?`)) {
      return;
    }

    try {
      await SettingsService.deleteCuttingToolMaterial(material.id);
      toast({
        title: 'Success',
        description: 'Cutting tool material deleted successfully',
      });
      fetchMaterials();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete cutting tool material',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Cutting Tool Materials ({materials.length})</h3>
          <p className="text-sm text-muted-foreground">
            Manage materials that cutting tools are made from
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  No cutting tool materials found. Add your first material to get started.
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    {new Date(material.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Cutting Tool Material' : 'Add Cutting Tool Material'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial 
                ? 'Update the cutting tool material information.'
                : 'Add a new cutting tool material to your system.'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingMaterial ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
