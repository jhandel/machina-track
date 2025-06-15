'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, AlertTriangle, Bell, CheckCircle, Clock, Package, Wrench, Activity } from 'lucide-react';
import Link from 'next/link';
import { dashboardService, type DashboardData } from '@/services';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getDashboardData(10);
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <PageHeader
          title="Dashboard"
          description="Welcome to MachinaTrack - Your production management overview"
          icon={LayoutDashboard}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <PageHeader
          title="Dashboard"
          description="Welcome to MachinaTrack - Your production management overview"
          icon={LayoutDashboard}
        />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading dashboard: {error}</span>
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

  if (!dashboardData) {
    return null;
  }

  const { summary, recentActivity, equipmentStatusCounts, maintenanceStatusCounts } = dashboardData;

  const summaryCards = [
    { 
      title: 'Upcoming Maintenance', 
      value: summary?.upcomingMaintenanceCount || 0, 
      icon: Clock, 
      link: '/maintenance', 
      description: 'Tasks due in next 7 days', 
      color: 'text-blue-500' 
    },
    { 
      title: 'Low Inventory Alerts', 
      value: summary?.lowInventoryCount || 0, 
      icon: AlertTriangle, 
      link: '/inventory', 
      description: 'Tools below minimum stock', 
      color: 'text-yellow-500' 
    },
    { 
      title: 'Overdue Calibrations', 
      value: summary?.overdueCalibrationsCount || 0, 
      icon: Bell, 
      link: '/metrology', 
      description: 'Tools needing calibration', 
      color: 'text-red-500' 
    },
    { 
      title: 'Active Equipment', 
      value: equipmentStatusCounts?.operational || 0, 
      icon: CheckCircle, 
      link: '/equipment', 
      description: 'Currently operational machines', 
      color: 'text-green-500' 
    },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'calibration':
        return <Bell className="h-4 w-4" />;
      case 'equipment':
        return <Package className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to MachinaTrack - Your production management overview"
        icon={LayoutDashboard}
      />
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground pt-1">{item.description}</p>
              <Button variant="link" asChild className="px-0 pt-2 text-sm">
                <Link href={item.link}>View Details →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {/* Equipment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Equipment Status</span>
            </CardTitle>
            <CardDescription>Current status of all equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(equipmentStatusCounts || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusBadgeColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>Maintenance Status</span>
            </CardTitle>
            <CardDescription>Current maintenance task status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(maintenanceStatusCounts || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusBadgeColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates across your system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-500">{activity.details}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {activity.status && (
                      <Badge className={getStatusBadgeColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No recent activity to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
