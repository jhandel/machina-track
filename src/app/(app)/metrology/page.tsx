// src/app/(app)/metrology/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlusCircle, Ruler, Search, Calendar, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { metrologyService } from '@/services';
import type { MetrologyTool } from '@/lib/types';

export default function MetrologyPage() {
  const [tools, setTools] = useState<MetrologyTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'calibrated' | 'due_calibration' | 'overdue' | 'out_of_service'>('all');

  useEffect(() => {
    loadMetrologyTools();
  }, [filter]);

  const loadMetrologyTools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedTools: MetrologyTool[] = [];
      
      switch (filter) {
        case 'calibrated':
          fetchedTools = await metrologyService.getByStatus('calibrated');
          break;
        case 'due_calibration':
          fetchedTools = await metrologyService.getDueCalibration();
          break;
        case 'overdue':
          fetchedTools = await metrologyService.getOverdueCalibration();
          break;
        case 'out_of_service':
          fetchedTools = await metrologyService.getByStatus('out_of_service');
          break;
        default:
          fetchedTools = await metrologyService.getAll();
      }
      
      setTools(fetchedTools);
    } catch (err) {
      console.error('Error loading metrology tools:', err);
      setError('Failed to load metrology tools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tool.serialNumber && tool.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'calibrated': return 'bg-green-100 text-green-800';
      case 'due_calibration': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_calibration': return 'bg-blue-100 text-blue-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'calibrated': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'due_calibration': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'awaiting_calibration': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'out_of_service': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Ruler className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Metrology Tools" 
          icon={Ruler}
          description="Manage calibration and tracking of precision measurement tools."
        />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading metrology tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Metrology Tools" 
        icon={Ruler}
        description="Manage calibration and tracking of precision measurement tools."
        actions={
          <Button asChild>
            <Link href="/metrology/new">
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
            placeholder="Search tools by name, type, or serial number..."
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
            All
          </Button>
          <Button
            variant={filter === 'calibrated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('calibrated')}
          >
            Calibrated
          </Button>
          <Button
            variant={filter === 'due_calibration' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('due_calibration')}
          >
            Due Calibration
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            Overdue
          </Button>
          <Button
            variant={filter === 'out_of_service' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('out_of_service')}
          >
            Out of Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Metrology Tools
            <Badge variant="secondary" className="ml-2">
              {filteredTools.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {filter === 'all' ? 'All metrology tools in the system' : 
             filter === 'calibrated' ? 'Tools with valid calibration' :
             filter === 'due_calibration' || filter === 'overdue' ? 'Tools requiring calibration attention' :
             'Tools currently out of service'}
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
                        {getStatusIcon(tool.status)}
                        <h3 className="text-lg font-semibold text-primary">{tool.name}</h3>
                        <Badge className={getStatusColor(tool.status)} variant="secondary">
                          {tool.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span><strong>Type:</strong> {tool.type}</span>
                          {tool.serialNumber && <span><strong>S/N:</strong> {tool.serialNumber}</span>}
                          {tool.manufacturer && <span><strong>Mfg:</strong> {tool.manufacturer}</span>}
                        </div>
                        {tool.location && (
                          <div><strong>Location:</strong> {tool.location}</div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {tool.nextCalibrationDate ? 
                              `Next calibration: ${new Date(tool.nextCalibrationDate).toLocaleDateString()}` : 
                              'No calibration schedule set'}
                          </span>
                        </div>
                        {tool.lastCalibrationDate && (
                          <div>
                            Last calibrated: {new Date(tool.lastCalibrationDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/metrology/${tool.id}`}>View Details</Link>
                    </Button>
                    {(tool.status === 'due_calibration' || tool.status === 'awaiting_calibration') && (
                      <Button variant="outline" size="sm" onClick={() => {
                        // Add functionality to start calibration
                        console.log('Start calibration for:', tool.id);
                      }}>
                        Calibrate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ruler className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2">
                {searchQuery ? 'No tools match your search.' : 'No metrology tools found.'}
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/metrology/new">Add Your First Tool</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
