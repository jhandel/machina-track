"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SettingsService } from "@/services";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Manufacturer } from "@/lib/database/interfaces";

const manufacturerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
});

type ManufacturerForm = z.infer<typeof manufacturerSchema>;

export function ManufacturersTab() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] =
    useState<Manufacturer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManufacturerForm>({
    resolver: zodResolver(manufacturerSchema),
    defaultValues: {
      name: "",
    },
  });

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getManufacturers();
      setManufacturers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch manufacturers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleCreate = () => {
    setEditingManufacturer(null);
    form.reset({ name: "" });
    setDialogOpen(true);
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    form.reset({ name: manufacturer.name });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: ManufacturerForm) => {
    try {
      setSubmitting(true);
      if (editingManufacturer) {
        await SettingsService.updateManufacturer(editingManufacturer.id, data);
        toast({
          title: "Success",
          description: "Manufacturer updated successfully",
        });
      } else {
        await SettingsService.createManufacturer(data);
        toast({
          title: "Success",
          description: "Manufacturer created successfully",
        });
      }
      setDialogOpen(false);
      fetchManufacturers();
    } catch (error) {
      toast({
        title: "Error",
        description: editingManufacturer
          ? "Failed to update manufacturer"
          : "Failed to create manufacturer",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (manufacturer: Manufacturer) => {
    if (!confirm(`Are you sure you want to delete "${manufacturer.name}"?`)) {
      return;
    }

    try {
      await SettingsService.deleteManufacturer(manufacturer.id);
      toast({
        title: "Success",
        description: "Manufacturer deleted successfully",
      });
      fetchManufacturers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete manufacturer",
        variant: "destructive",
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
          <h3 className="text-lg font-medium">
            Manufacturers ({manufacturers.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage equipment and tool manufacturers
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Manufacturer
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
            {manufacturers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 text-muted-foreground"
                >
                  No manufacturers found. Add your first manufacturer to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              manufacturers.map((manufacturer) => (
                <TableRow key={manufacturer.id}>
                  <TableCell className="font-medium">
                    {manufacturer.name}
                  </TableCell>
                  <TableCell>
                    {new Date(manufacturer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(manufacturer)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(manufacturer)}
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
              {editingManufacturer ? "Edit Manufacturer" : "Add Manufacturer"}
            </DialogTitle>
            <DialogDescription>
              {editingManufacturer
                ? "Update the manufacturer information."
                : "Add a new manufacturer to your system."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter manufacturer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingManufacturer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
