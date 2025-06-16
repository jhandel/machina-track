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
import type { ConsumableMaterial } from '@/lib/database/interfaces';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

type MaterialForm = z.infer<typeof materialSchema>;

export function ConsumableMaterialsTab() {
  const [materials, setMaterials] = useState<ConsumableMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ConsumableMaterial | null>(null);
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
      const data = await SettingsService.getConsumableMaterials();
      setMaterials(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch consumable materials',
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

  const handleEdit = (material: ConsumableMaterial) => {
    setEditingMaterial(material);
    form.reset({ name: material.name });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: MaterialForm) => {
    try {
      setSubmitting(true);
      if (editingMaterial) {
        await SettingsService.updateConsumableMaterial(editingMaterial.id, data);
        toast({
          title: 'Success',
          description: 'Consumable material updated successfully',
        });
      } else {
        await SettingsService.createConsumableMaterial(data);
        toast({
          title: 'Success',
          description: 'Consumable material created successfully',
        });
      }
      setDialogOpen(false);
      fetchMaterials();
    } catch (error) {
      toast({
        title: 'Error',
        description: editingMaterial ? 'Failed to update consumable material' : 'Failed to create consumable material',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (material: ConsumableMaterial) => {
    if (!confirm(`Are you sure you want to delete "${material.name}"?`)) {
      return;
    }

    try {
      await SettingsService.deleteConsumableMaterial(material.id);
      toast({
        title: 'Success',
        description: 'Consumable material deleted successfully',
      });
      fetchMaterials();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete consumable material',
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
          <h3 className="text-lg font-medium">Consumable Materials ({materials.length})</h3>
          <p className="text-sm text-muted-foreground">
            Manage materials that consumables are made from
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
                  No consumable materials found. Add your first material to get started.
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
              {editingMaterial ? 'Edit Consumable Material' : 'Add Consumable Material'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial 
                ? 'Update the consumable material information.'
                : 'Add a new consumable material to your system.'
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
