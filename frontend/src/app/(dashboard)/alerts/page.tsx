'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, Bell, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function AlertsPage() {
  // Mock alerts data
  const mockAlerts: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Configure and manage alerts for your programs
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Alert
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockAlerts.filter(a => a.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notification Channels</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Email, Slack, Discord
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>
            Manage your alert configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mockAlerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.name}</TableCell>
                    <TableCell>{alert.programName}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {alert.condition}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {alert.notificationChannels.includes('EMAIL') && (
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        )}
                        {alert.notificationChannels.includes('SLACK') && (
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        )}
                        {alert.notificationChannels.includes('DISCORD') && (
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={alert.isActive ? 'success' : 'secondary'}>
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {alert.lastTriggered ? formatRelativeTime(alert.lastTriggered) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No alerts configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert to get notified about important events
              </p>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Alert Types</CardTitle>
          <CardDescription>
            Configure alerts based on these conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Transaction Count</h4>
              <p className="text-sm text-muted-foreground">
                Trigger when transaction count exceeds a threshold within a time period
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Error Rate</h4>
              <p className="text-sm text-muted-foreground">
                Trigger when error rate exceeds a percentage threshold
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Compute Units</h4>
              <p className="text-sm text-muted-foreground">
                Trigger when compute units exceed a threshold
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Custom Condition</h4>
              <p className="text-sm text-muted-foreground">
                Create custom alert conditions based on your needs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
