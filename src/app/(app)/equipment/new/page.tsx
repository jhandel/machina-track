// src/app/(app)/equipment/new/page.tsx
'use client';

import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Factory, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EQUIPMENT_STATUSES, MOCK_LOCATIONS, MOCK_MANUFACTURERS } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { EquipmentService } from '@/services/equipment-service';
import { useState } from 'react';

export default function NewEquipmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const equipmentService = new EquipmentService();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = {
        name: formData.get('name') as string,
        model: formData.get('model') as string,
        serialNumber: formData.get('serialNumber') as string,
        manufacturer: formData.get('manufacturer') as string,
        location: formData.get('location') as string,
        status: (formData.get('status') as string || 'operational') as 'operational' | 'maintenance' | 'decommissioned',
        purchaseDate: formData.get('purchaseDate') as string || undefined,
        imageUrl: formData.get('imageUrl') as string || undefined,
        notes: formData.get('notes') as string || undefined
      };

      await equipmentService.create(data);

      toast({
        title: "Success",
        description: "The equipment has been successfully registered.",
      });
      
      router.push('/equipment'); 
    } catch (error) {
      console.error('Error creating equipment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register equipment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Add New Equipment" 
        icon={Factory}
        description="Register a new piece of machinery in the system."
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Equipment Details</CardTitle>
            <CardDescription>Fill in the information for the new equipment.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name</Label>
              <Input id="name" name="name" placeholder="e.g., CNC Mill XM-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" placeholder="e.g., XM-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" name="serialNumber" placeholder="e.g., CNCX500-001" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Select name="manufacturer" required>
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MANUFACTURERS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
               <Select name="location" required>
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
              <Select name="status" defaultValue="operational">
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" placeholder="https://placehold.co/600x400.png" defaultValue="https://placehold.co/600x400.png" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Enter any relevant notes..." />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/equipment" className="inline-flex items-center justify-center gap-2">
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> 
              {isSubmitting ? 'Saving...' : 'Save Equipment'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
