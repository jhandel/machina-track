// src/app/(app)/inventory/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlusCircle, Package, Search, MapPin, AlertTriangle, Wrench, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { cuttingToolService } from '@/services';
import type { CuttingTool } from '@/lib/types';

export default function InventoryPage() {
  const [tools, setTools] = useState<CuttingTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_inventory' | 'by_location' | 'by_type'>('all');

  useEffect(() => {
    loadCuttingTools();
  }, [filter]);

  const loadCuttingTools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedTools: CuttingTool[] = [];
      
      switch (filter) {
        case 'low_inventory':
          fetchedTools = await cuttingToolService.getLowInventory();
          break;
        default:
          fetchedTools = await cuttingToolService.getAll();
      }
      
      setTools(fetchedTools);
    } catch (err) {
      console.error('Error loading cutting tools:', err);
      setError('Failed to load cutting tool inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tool.material && tool.material.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLowInventory = (tool: CuttingTool) => {
    return tool.quantity <= tool.minQuantity;
  };

  const getQuantityColor = (tool: CuttingTool) => {
    if (tool.quantity <= tool.minQuantity) return 'text-red-600';
    if (tool.quantity <= tool.minQuantity * 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getToolLifeColor = (tool: CuttingTool) => {
    if (!tool.toolLifeHours || !tool.remainingToolLifeHours) return 'text-gray-600';
    const percentage = (tool.remainingToolLifeHours / tool.toolLifeHours) * 100;
    if (percentage <= 20) return 'text-red-600';
    if (percentage <= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Cutting Tool Inventory" 
          icon={Package}
          description="Manage stock levels, types, and locations of cutting tools and bits."
        />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Cutting Tool Inventory" 
        icon={Package}
        description="Manage stock levels, types, and locations of cutting tools and bits."
        actions={
          <Button asChild>
            <Link href="/inventory/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Tool
            </Link>
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools by name, type, location, or material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Tools
          </Button>
          <Button
            variant={filter === 'low_inventory' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('low_inventory')}
            className="flex items-center gap-1"
          >
            <TrendingDown className="h-4 w-4" />
            Low Stock
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tool Inventory
            <Badge variant="secondary" className="ml-2">
              {filteredTools.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {filter === 'all' ? 'Complete cutting tool inventory' : 
             'Tools with low inventory levels requiring restocking'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTools.length > 0 ? (
            <div className="space-y-4">
              {filteredTools.map(tool => (
                <div key={tool.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="h-4 w-4" />
                        <h3 className="text-lg font-semibold text-primary">{tool.name}</h3>
                        {isLowInventory(tool) && (
                          <Badge variant="destructive" className="ml-2">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span><strong>Type:</strong> {tool.type}</span>
                          {tool.material && <span><strong>Material:</strong> {tool.material}</span>}
                          {tool.size && <span><strong>Size:</strong> {tool.size}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span><strong>Location:</strong> {tool.location}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-bold ${getQuantityColor(tool)}`}>
                            Stock: {tool.quantity} pcs
                          </span>
                          <span className="text-muted-foreground">
                            (Min: {tool.minQuantity})
                          </span>
                        </div>
                        {tool.toolLifeHours && tool.remainingToolLifeHours && (
                          <div className={`text-sm ${getToolLifeColor(tool)}`}>
                            <strong>Tool Life:</strong> {tool.remainingToolLifeHours} / {tool.toolLifeHours} hrs remaining
                          </div>
                        )}
                        {tool.lastUsedDate && (
                          <div className="text-sm">
                            <strong>Last Used:</strong> {new Date(tool.lastUsedDate).toLocaleDateString()}
                          </div>
                        )}
                        {tool.supplier && (
                          <div className="text-sm">
                            <strong>Supplier:</strong> {tool.supplier}
                          </div>
                        )}
                        {tool.costPerUnit && (
                          <div className="text-sm">
                            <strong>Cost per Unit:</strong> ${tool.costPerUnit.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/inventory/${tool.id}`}>View Details</Link>
                    </Button>
                    {isLowInventory(tool) && (
                      <Button variant="outline" size="sm" onClick={() => {
                        // Add functionality to reorder
                        console.log('Reorder tool:', tool.id);
                      }}>
                        Reorder
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => {
                      // Add functionality to adjust quantity
                      console.log('Adjust quantity for:', tool.id);
                    }}>
                      Adjust Stock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2">
                {searchQuery ? 'No tools match your search.' : 'No cutting tools in inventory.'}
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/inventory/new">Add Your First Tool</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
