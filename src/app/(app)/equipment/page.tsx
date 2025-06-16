// src/app/(app)/equipment/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Factory, Edit, Trash2, Search, Filter, AlertTriangle } from 'lucide-react';
import type { Equipment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { equipmentService } from '@/services';

export default function EquipmentPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await equipmentService.getAll();
        setEquipmentList(response.data as Equipment[] || []);
      } catch (err) {
        console.error('Failed to fetch equipment:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const filteredEquipment = equipmentList.filter(eq => 
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: Equipment['status']) => {
    switch (status) {
      case 'operational': return 'default'; // Default is often green or blue in themes
      case 'maintenance': return 'secondary'; // Check theme for 'secondary' style
      case 'decommissioned': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Handle loading state
  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Equipment Management" 
          icon={Factory}
          description="Track and manage all your workshop machinery."
        />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div>
        <PageHeader 
          title="Equipment Management" 
          icon={Factory}
          description="Track and manage all your workshop machinery."
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading equipment: {error}</span>
            </div>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Equipment Management" 
        icon={Factory}
        description="Track and manage all your workshop machinery."
        actions={
          <Button asChild>
            <Link href="/equipment/new" className="inline-flex items-center justify-center gap-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Equipment
            </Link>
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input 
            placeholder="Search by name, model, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            icon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
          {/* Add more filters here (e.g., status, location) using Select components */}
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
        </CardContent>
      </Card>

      {filteredEquipment.length === 0 && !searchTerm && (
         <Card className="text-center py-12">
            <CardHeader>
                <Factory className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle>No Equipment Added Yet</CardTitle>
                <CardDescription>Get started by adding your first piece of equipment.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild size="lg">
                    <Link href="/equipment/new" className="inline-flex items-center justify-center gap-2">
                        <PlusCircle className="mr-2 h-5 w-5" /> Add Equipment
                    </Link>
                </Button>
            </CardContent>
        </Card>
      )}
      
      {filteredEquipment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment List</CardTitle>
            <CardDescription>Overview of all registered machinery.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="hidden md:table-cell">Serial No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image 
                        src={eq.imageUrl || "https://placehold.co/64x64.png"} 
                        alt={eq.name} 
                        width={64} 
                        height={64} 
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint="machine equipment"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/equipment/${eq.id}`} className="hover:underline text-primary">
                        {eq.name}
                      </Link>
                    </TableCell>
                    <TableCell>{eq.model}</TableCell>
                    <TableCell className="hidden md:table-cell">{eq.serialNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(eq.status)} className="capitalize">{eq.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{eq.location}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild><Link href={`/equipment/${eq.id}`}>View Details</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/equipment/${eq.id}/edit`}>Edit</Link></DropdownMenuItem>
                          <DropdownMenuItem>Schedule Maintenance</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {filteredEquipment.length === 0 && searchTerm && (
        <Card className="text-center py-12">
            <CardHeader>
                <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle>No Equipment Found</CardTitle>
                <CardDescription>Your search for "{searchTerm}" did not match any equipment.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
            </CardContent>
        </Card>
      )}

      {/* TODO: Add/Edit Equipment Modal */}
    </div>
  );
}
