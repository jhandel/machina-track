// src/app/(app)/metrology/new/page.tsx
'use client';

import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Ruler, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { METROLOGY_STATUSES, MOCK_LOCATIONS, MOCK_MANUFACTURERS, MOCK_TOOL_TYPES_METROLOGY } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MetrologyService } from '@/services/metrology-service';
import { useState } from 'react';

export default function NewMetrologyToolPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const metrologyService = new MetrologyService();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      
      // Calculate next calibration date if last calibration date is provided
      const lastCalibrationDate = formData.get('lastCalibrationDate') as string;
      const calibrationIntervalDays = parseInt(formData.get('calibrationIntervalDays') as string);
      let nextCalibrationDate: string | undefined;
      
      if (lastCalibrationDate && calibrationIntervalDays) {
        const lastDate = new Date(lastCalibrationDate);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + calibrationIntervalDays);
        nextCalibrationDate = nextDate.toISOString().split('T')[0];
      }

      const data = {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        serialNumber: formData.get('serialNumber') as string,
        manufacturer: formData.get('manufacturer') as string || undefined,
        calibrationIntervalDays: calibrationIntervalDays,
        lastCalibrationDate: lastCalibrationDate || undefined,
        nextCalibrationDate: nextCalibrationDate,
        location: formData.get('location') as string || undefined,
        status: (formData.get('status') as string || 'calibrated') as 'calibrated' | 'due_calibration' | 'out_of_service' | 'awaiting_calibration',
        imageUrl: formData.get('imageUrl') as string || undefined,
        notes: formData.get('notes') as string || undefined,
        calibrationLogIds: []
      };

      await metrologyService.create(data);

      toast({
        title: "Success",
        description: "The metrology tool has been registered.",
      });
      
      router.push('/metrology');
    } catch (error) {
      console.error('Error creating metrology tool:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register metrology tool. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Add New Metrology Tool" 
        icon={Ruler}
        description="Register a new precision measurement tool."
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tool Details</CardTitle>
            <CardDescription>Fill in the information for the new metrology tool.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name</Label>
              <Input id="name" name="name" placeholder="e.g., Digital Caliper #2" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tool Type</Label>
               <Select name="type" required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select tool type" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TOOL_TYPES_METROLOGY.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" name="serialNumber" placeholder="e.g., DCAL-079" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer (Optional)</Label>
              <Select name="manufacturer">
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calibrationIntervalDays">Calibration Interval (Days)</Label>
              <Input id="calibrationIntervalDays" name="calibrationIntervalDays" type="number" placeholder="e.g., 365 for yearly" required min="1" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="lastCalibrationDate">Last Calibration Date (Optional)</Label>
              <Input id="lastCalibrationDate" name="lastCalibrationDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Select name="location">
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="calibrated" required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {METROLOGY_STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" placeholder="https://placehold.co/600x400.png" defaultValue="https://placehold.co/400x400.png"/>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Enter any relevant notes about this tool..." />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/metrology">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Metrology Tool'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
