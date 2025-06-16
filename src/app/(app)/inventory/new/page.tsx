// src/app/(app)/inventory/new/page.tsx
'use client';

import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Package, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_LOCATIONS, MOCK_TOOL_TYPES_CUTTING, MOCK_MATERIALS_CUTTING } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ConsumableService } from '@/services/consumable-service';
import { useState } from 'react';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const consumableService = new ConsumableService();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        material: formData.get('material') as string || undefined,
        size: formData.get('size') as string || undefined,
        quantity: parseInt(formData.get('quantity') as string),
        minQuantity: parseInt(formData.get('minQuantity') as string),
        location: formData.get('location') as string,
        toolLifeHours: formData.get('toolLifeHours') ? parseInt(formData.get('toolLifeHours') as string) : undefined,
        supplier: formData.get('supplier') as string || undefined,
        imageUrl: formData.get('imageUrl') as string || undefined,
        notes: formData.get('notes') as string || undefined
      };

      await consumableService.create(data);

      toast({
        title: "Success",
        description: "The Consumables has been added to inventory.",
      });
      
      router.push('/inventory');
    } catch (error) {
      console.error('Error creating Consumables:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add Consumables. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Add New Consumables" 
        icon={Package}
        description="Add a new tool or bit to your inventory."
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tool Details</CardTitle>
            <CardDescription>Fill in the information for the new Consumables.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name</Label>
              <Input id="name" name="name" placeholder="e.g., 1/4 End Mill" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tool Type</Label>
              <Select name="type" required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select tool type" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TOOL_TYPES_CUTTING.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Select name="material">
                <SelectTrigger id="material">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MATERIALS_CUTTING.map(mat => <SelectItem key={mat} value={mat}>{mat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size (Optional)</Label>
              <Input id="size" name="size" placeholder="e.g., 1/4 inch or 6mm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" placeholder="e.g., 10" required min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum Quantity</Label>
              <Input id="minQuantity" name="minQuantity" type="number" placeholder="e.g., 5" required min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
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
              <Label htmlFor="toolLifeHours">Expected Tool Life (Hours, Optional)</Label>
              <Input id="toolLifeHours" name="toolLifeHours" type="number" placeholder="e.g., 100" min="0" />
            </div>
             <div className="space-y-2 md:col-span-2">
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input id="supplier" name="supplier" placeholder="e.g., ToolVendor Inc." />
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
              <Link href="/inventory">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> 
              {isSubmitting ? 'Adding...' : 'Add Tool to Inventory'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
