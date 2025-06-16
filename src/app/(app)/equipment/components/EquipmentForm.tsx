// src/components/equipment/EquipmentForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EQUIPMENT_STATUSES, MOCK_LOCATIONS } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { EquipmentService } from '@/services/equipment-service';
import type { Equipment } from '@/lib/types';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface EquipmentFormProps {
  mode: 'create' | 'edit';
  equipmentId?: string;
  initialData?: Equipment;
  onCancel?: () => void;
  onSuccess?: (equipment: Equipment) => void;
}

interface FormData {
  name: string;
  model: string;
  serialNumber: string;
  location: string;
  status: 'operational' | 'maintenance' | 'decommissioned';
  purchaseDate?: string;
  imageUrl?: string;
  notes?: string;
}

export function EquipmentForm({ mode, equipmentId, initialData, onCancel, onSuccess }: EquipmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    model: initialData?.model || '',
    serialNumber: initialData?.serialNumber || '',
    location: initialData?.location || '',
    status: initialData?.status || 'operational',
    purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
    imageUrl: initialData?.imageUrl || 'https://placehold.co/600x400.png',
    notes: initialData?.notes || ''
  });

  const equipmentService = new EquipmentService();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let result: Equipment;
      
      if (mode === 'create') {
        result = await equipmentService.create({
          name: formData.name,
          model: formData.model,
          serialNumber: formData.serialNumber,
          location: formData.location,
          status: formData.status,
          purchaseDate: formData.purchaseDate || undefined,
          imageUrl: formData.imageUrl || undefined,
          notes: formData.notes || undefined
        });

        toast({
          title: "Success",
          description: "The equipment has been successfully registered.",
        });
      } else {
        if (!equipmentId) throw new Error('Equipment ID is required for editing');
        
        result = await equipmentService.update(equipmentId, {
          name: formData.name,
          model: formData.model,
          serialNumber: formData.serialNumber,
          location: formData.location,
          status: formData.status,
          purchaseDate: formData.purchaseDate || undefined,
          imageUrl: formData.imageUrl || undefined,
          notes: formData.notes || undefined
        });

        toast({
          title: "Success",
          description: "The equipment has been successfully updated.",
        });
      }

      setIsDirty(false);
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push('/equipment');
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} equipment:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode === 'create' ? 'register' : 'update'} equipment. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigation = (href: string) => {
    if (isDirty) {
      setPendingNavigation(href);
      setShowUnsavedDialog(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        router.push(href);
      }
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      if (onCancel && pendingNavigation === '/equipment') {
        onCancel();
      } else {
        router.push(pendingNavigation);
      }
    }
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Equipment Details</CardTitle>
            <CardDescription>
              {mode === 'create' 
                ? 'Fill in the information for the new equipment.' 
                : 'Update the equipment information below.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., CNC Mill XM-500" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input 
                id="model" 
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g., XM-500" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input 
                id="serialNumber" 
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                placeholder="e.g., CNCX500-001" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select 
                value={formData.location} 
                onValueChange={(value) => handleInputChange('location', value)}
                required
              >
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
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value as 'operational' | 'maintenance' | 'decommissioned')}
              >
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
              <Input 
                id="purchaseDate" 
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input 
                id="imageUrl" 
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://placehold.co/600x400.png" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any relevant notes..." 
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleNavigation('/equipment')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> 
              {isSubmitting 
                ? (mode === 'create' ? 'Saving...' : 'Updating...') 
                : (mode === 'create' ? 'Save Equipment' : 'Update Equipment')
              }
            </Button>
          </CardFooter>
        </Card>
      </form>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? All unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
