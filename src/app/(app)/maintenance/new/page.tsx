// src/app/(app)/maintenance/new/page.tsx
'use client';

import React, { Suspense } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ClipboardList, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAINTENANCE_STATUSES } from '@/lib/constants';
import type { Equipment } from '@/lib/types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceService } from '@/services/maintenance-service';
import { EquipmentService } from '@/services/equipment-service';
import { useState, useEffect } from 'react';

function NewMaintenanceTaskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const preselectedEquipmentId = searchParams.get('equipmentId');
  const maintenanceService = new MaintenanceService();
  const equipmentService = new EquipmentService();

  // Fetch equipment on component mount
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setIsLoadingEquipment(true);
        const response = await equipmentService.getAll();
        if (response.success && response.data) {
          setEquipment(response.data as Equipment[]);
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
        toast({
          title: "Warning",
          description: "Failed to load equipment list. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, []); // Empty dependency array - only run once on mount

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      
      // Calculate next due date if last performed date and frequency are provided
      const lastPerformedDate = formData.get('lastPerformedDate') as string;
      const frequencyDays = formData.get('frequencyDays') ? parseInt(formData.get('frequencyDays') as string) : undefined;
      let nextDueDate: string | undefined;
      
      if (lastPerformedDate && frequencyDays) {
        const lastDate = new Date(lastPerformedDate);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + frequencyDays);
        nextDueDate = nextDate.toISOString().split('T')[0];
      } else if (formData.get('nextDueDate')) {
        nextDueDate = formData.get('nextDueDate') as string;
      }

      const data = {
        equipmentId: formData.get('equipmentId') as string,
        description: formData.get('description') as string,
        frequencyDays: frequencyDays,
        lastPerformedDate: lastPerformedDate || undefined,
        nextDueDate: nextDueDate,
        assignedTo: formData.get('assignedTo') as string || undefined,
        notes: formData.get('notes') as string || undefined,
        status: (formData.get('status') as string || 'pending') as 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped'
      };

      await maintenanceService.create(data);

      toast({
        title: "Success",
        description: "The maintenance task has been scheduled.",
      });
      
      router.push('/maintenance');
    } catch (error) {
      console.error('Error creating maintenance task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create maintenance task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Create New Maintenance Task/Schedule" 
        icon={ClipboardList}
        description="Log a new maintenance activity or set up a recurring schedule."
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Specify the maintenance to be performed.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="equipmentId">Equipment</Label>
              <Select name="equipmentId" defaultValue={preselectedEquipmentId || undefined} required>
                <SelectTrigger id="equipmentId">
                  <SelectValue placeholder={isLoadingEquipment ? "Loading equipment..." : "Select equipment"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEquipment ? (
                    <SelectItem value="-1" disabled>Loading...</SelectItem>
                  ) : equipment.length === 0 ? (
                    <SelectItem value="" disabled>No equipment available</SelectItem>
                  ) : (
                    equipment.map((eq: Equipment) => (
                      <SelectItem key={eq.id} value={eq.id}>{eq.name} ({eq.model})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Task Description</Label>
              <Input id="description" name="description" placeholder="e.g., Lubricate Z-axis, Clean optics" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequencyDays">Frequency (Days, optional for recurring)</Label>
              <Input id="frequencyDays" name="frequencyDays" type="number" placeholder="e.g., 30 for monthly" min="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="pending" required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastPerformedDate">Last Performed Date (Optional)</Label>
              <Input id="lastPerformedDate" name="lastPerformedDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextDueDate">Next Due Date (Optional)</Label>
              <Input id="nextDueDate" name="nextDueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
              <Input id="assignedTo" name="assignedTo" placeholder="e.g., John Doe, Maintenance Team" />
            </div>
             <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes / Instructions</Label>
              <Textarea id="notes" name="notes" placeholder="Enter any specific instructions or notes for this task..." />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/maintenance" className="inline-flex items-center justify-center gap-2">
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function NewMaintenanceTaskPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewMaintenanceTaskPageContent />
    </Suspense>
  );
}
