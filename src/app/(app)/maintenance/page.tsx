// src/app/(app)/maintenance/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlusCircle, ClipboardList, Search, Calendar, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { maintenanceService } from '@/services';
import type { MaintenanceTask } from '@/lib/types';

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'upcoming'>('all');

  useEffect(() => {
    loadMaintenanceTasks();
  }, [filter]);

  const loadMaintenanceTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      switch (filter) {
        case 'pending':
          response = await maintenanceService.getAll({ status: 'pending' });
          break;
        case 'overdue':
          response = await maintenanceService.getOverdue();
          break;
        case 'upcoming':
          response = await maintenanceService.getUpcoming(7);
          break;
        default:
          response = await maintenanceService.getAll();
      }
      
      setTasks(response.data as MaintenanceTask[] || []);
    } catch (err) {
      console.error('Error loading maintenance tasks:', err);
      setError('Failed to load maintenance tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.assignedTo && task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Calendar className="h-4 w-4 text-blue-500" />;
      default: return <ClipboardList className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Maintenance Schedules" 
          icon={ClipboardList}
          description="View, create, and manage maintenance tasks for all equipment."
        />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading maintenance tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Maintenance Schedules" 
        icon={ClipboardList}
        description="View, create, and manage maintenance tasks for all equipment."
        actions={
          <Button asChild>
            <Link href="/maintenance/new" className="inline-flex items-center justify-center gap-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Task
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
            placeholder="Search tasks or assignees..."
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
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            Overdue
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Maintenance Tasks
            <Badge variant="secondary" className="ml-2">
              {filteredTasks.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {filter === 'all' ? 'All maintenance tasks' : 
             filter === 'overdue' ? 'Overdue maintenance tasks requiring immediate attention' :
             filter === 'upcoming' ? 'Tasks due in the next 7 days' :
             'Pending maintenance tasks'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div key={task.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="text-lg font-semibold text-primary">{task.description}</h3>
                        <Badge className={getStatusColor(task.status)} variant="secondary">
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {task.nextDueDate ? `Due: ${new Date(task.nextDueDate).toLocaleDateString()}` : 'No due date set'}
                          </span>
                        </div>
                        {task.assignedTo && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Assigned to: {task.assignedTo}</span>
                          </div>
                        )}
                        {task.lastPerformedDate && (
                          <div className="flex items-center gap-2">
                            <span>Last performed: {new Date(task.lastPerformedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/maintenance/${task.id}`} className="inline-flex items-center justify-center gap-2">
                        View Details
                      </Link>
                    </Button>
                    {task.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => {
                        // Add functionality to mark as in progress
                        console.log('Mark as in progress:', task.id);
                      }}>
                        Start Task
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2">
                {searchQuery ? 'No tasks match your search.' : 'No maintenance tasks found.'}
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/maintenance/new" className="inline-flex items-center justify-center gap-2">
                    Create Your First Task
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
