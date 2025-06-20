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
import type { MetrologyToolType } from "@/lib/database/interfaces";

const toolTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
});

type ToolTypeForm = z.infer<typeof toolTypeSchema>;

export function MetrologyToolTypesTab() {
  const [toolTypes, setToolTypes] = useState<MetrologyToolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingToolType, setEditingToolType] =
    useState<MetrologyToolType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ToolTypeForm>({
    resolver: zodResolver(toolTypeSchema),
    defaultValues: {
      name: "",
    },
  });

  const fetchToolTypes = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getMetrologyToolTypes();
      setToolTypes(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch metrology tool types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToolTypes();
  }, []);

  const handleCreate = () => {
    setEditingToolType(null);
    form.reset({ name: "" });
    setDialogOpen(true);
  };

  const handleEdit = (toolType: MetrologyToolType) => {
    setEditingToolType(toolType);
    form.reset({ name: toolType.name });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: ToolTypeForm) => {
    try {
      setSubmitting(true);
      if (editingToolType) {
        await SettingsService.updateMetrologyToolType(editingToolType.id, data);
        toast({
          title: "Success",
          description: "Metrology tool type updated successfully",
        });
      } else {
        await SettingsService.createMetrologyToolType(data);
        toast({
          title: "Success",
          description: "Metrology tool type created successfully",
        });
      }
      setDialogOpen(false);
      fetchToolTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: editingToolType
          ? "Failed to update metrology tool type"
          : "Failed to create metrology tool type",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (toolType: MetrologyToolType) => {
    if (!confirm(`Are you sure you want to delete "${toolType.name}"?`)) {
      return;
    }

    try {
      await SettingsService.deleteMetrologyToolType(toolType.id);
      toast({
        title: "Success",
        description: "Metrology tool type deleted successfully",
      });
      fetchToolTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete metrology tool type",
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
            Metrology Tool Types ({toolTypes.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage types of metrology tools used for quality control
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tool Type
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
            {toolTypes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 text-muted-foreground"
                >
                  No metrology tool types found. Add your first tool type to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              toolTypes.map((toolType) => (
                <TableRow key={toolType.id}>
                  <TableCell className="font-medium">{toolType.name}</TableCell>
                  <TableCell>
                    {new Date(toolType.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(toolType)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(toolType)}
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
              {editingToolType
                ? "Edit Metrology Tool Type"
                : "Add Metrology Tool Type"}
            </DialogTitle>
            <DialogDescription>
              {editingToolType
                ? "Update the metrology tool type information."
                : "Add a new metrology tool type to your system."}
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
                      <Input placeholder="Enter tool type name" {...field} />
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
              {editingToolType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
