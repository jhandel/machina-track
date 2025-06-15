// src/app/(app)/equipment/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Factory, Edit, Trash2, CalendarPlus, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Equipment, MaintenanceTask } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EquipmentService } from '@/services/equipment-service';
import { MaintenanceService } from '@/services/maintenance-service';

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const equipmentId = typeof params.id === 'string' ? params.id : '';
  
  const [equipment, setEquipment] = useState<Equipment | undefined>(undefined);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipmentData = async () => {
      if (!equipmentId) {
        setError('No equipment ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const equipmentService = new EquipmentService();
        const fetchedEquipment = await equipmentService.getById(equipmentId);
        
        if (!fetchedEquipment) {
          setError('Equipment not found');
          setEquipment(undefined);
        } else {
          setEquipment(fetchedEquipment);
          // Fetch maintenance tasks for this equipment
          try {
            const maintenanceService = new MaintenanceService();
            const tasksResponse = await maintenanceService.getByEquipmentId(fetchedEquipment.id);
            setMaintenanceTasks(tasksResponse.data as MaintenanceTask[] || []);
          } catch (maintenanceError) {
            console.warn('Could not fetch maintenance tasks:', maintenanceError);
            // Don't fail the whole page if maintenance tasks can't be fetched
            setMaintenanceTasks([]);
          }
        }
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch equipment data');
        setEquipment(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentData();
  }, [equipmentId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Loading..." icon={Factory} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading equipment details...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div>
        <PageHeader title="Equipment Not Found" icon={Factory} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              {error || 'The requested equipment could not be found.'}
            </p>
            <Button asChild>
              <Link href="/equipment" className="inline-flex items-center justify-center gap-2">
                Back to Equipment List
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      const equipmentService = new EquipmentService();
      await equipmentService.delete(equipment.id);
      
      toast({
        title: "Equipment Deleted",
        description: `${equipment.name} has been removed successfully.`,
        variant: "destructive"
      });
      
      router.push('/equipment');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete equipment',
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: Equipment['status']) => {
    switch (status) {
      case 'operational': return 'default';
      case 'maintenance': return 'secondary';
      case 'decommissioned': return 'destructive';
      default: return 'outline';
    }
  };

  const getMaintenanceStatusBadgeVariant = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'overdue': return 'destructive';
      case 'pending': return 'outline';
      case 'skipped': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div>
      <PageHeader 
        title={equipment.name} 
        icon={Factory}
        description={`Details for ${equipment.model} (S/N: ${equipment.serialNumber})`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/equipment/${equipment.id}/edit`}> {/* Placeholder for edit page */}
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the equipment "{equipment.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Model:</strong> {equipment.model}</div>
                <div><strong>Serial Number:</strong> {equipment.serialNumber}</div>
                <div><strong>Location:</strong> {equipment.location}</div>
                <div>
                  <strong>Status:</strong> <Badge variant={getStatusBadgeVariant(equipment.status)} className="capitalize">{equipment.status}</Badge>
                </div>
                {equipment.purchaseDate && <div><strong>Purchase Date:</strong> {new Date(equipment.purchaseDate).toLocaleDateString()}</div>}
              </div>
              {equipment.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-semibold mb-1">Notes:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{equipment.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button>
                <CalendarPlus className="mr-2 h-4 w-4" /> Log New Maintenance
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>Recent maintenance tasks and activities for this equipment.</CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Last Performed</TableHead>
                      <TableHead className="hidden sm:table-cell">Next Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceTasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell>{task.description}</TableCell>
                        <TableCell>
                          <Badge variant={getMaintenanceStatusBadgeVariant(task.status)} className="capitalize">
                            {task.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {task.lastPerformedDate ? new Date(task.lastPerformedDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {task.nextDueDate ? (
                            <span className={new Date(task.nextDueDate) < new Date() && task.status !== 'completed' ? 'text-destructive font-bold' : ''}>
                              {new Date(task.nextDueDate).toLocaleDateString()}
                            </span>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" asChild>
                            <Link href={`/maintenance/${task.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No maintenance tasks found for this equipment.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Image 
                src={equipment.imageUrl || "https://placehold.co/400x400.png"} 
                alt={equipment.name} 
                width={400} 
                height={400} 
                className="rounded-md object-cover aspect-square w-full"
                data-ai-hint="industrial equipment"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link href={`/maintenance/new?equipmentId=${equipment.id}`}>
                  <CalendarPlus className="mr-2 h-4 w-4" /> Log Maintenance
                </Link>
              </Button>
              <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" /> View Usage Analytics
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Related Documents</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="link" asChild className="justify-start px-0">
                <Link href="#">View Manual (PDF)</Link> 
              </Button>
              <Button variant="link" asChild className="justify-start px-0">
                <Link href="#">Parts Catalog (PDF)</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
