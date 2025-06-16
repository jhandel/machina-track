'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Ruler, Package, Wrench } from 'lucide-react';
import { LocationsTab } from './components/LocationsTab';
import { ManufacturersTab } from './components/ManufacturersTab';
import { MetrologyToolTypesTab } from './components/MetrologyToolTypesTab';
import { ConsumableMaterialsTab } from './components/ConsumableMaterialsTab';
import { ConsumableTypesTab } from './components/ConsumableTypesTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('locations');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="Manage locations, manufacturers, and tool configurations for your machine shop."
      />

      <div className="grid gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="manufacturers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Manufacturers
            </TabsTrigger>
            <TabsTrigger value="metrology-types" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Metrology Types
            </TabsTrigger>
            <TabsTrigger value="consumable-materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Consumable Materials
            </TabsTrigger>
            <TabsTrigger value="consumable-types" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Consumable Types
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Locations
                </CardTitle>
                <CardDescription>
                  Manage the physical locations in your facility where equipment and tools are stored.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manufacturers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Manufacturers
                </CardTitle>
                <CardDescription>
                  Manage the manufacturers of your equipment and tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManufacturersTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrology-types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Metrology Tool Types
                </CardTitle>
                <CardDescription>
                  Define the types of metrology tools used in your quality control processes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetrologyToolTypesTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consumable-materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Consumable Materials
                </CardTitle>
                <CardDescription>
                  Manage the materials that your consumables are made from.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsumableMaterialsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consumable-types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Consumable Types
                </CardTitle>
                <CardDescription>
                  Define the types of consumables used in your machining operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsumableTypesTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
