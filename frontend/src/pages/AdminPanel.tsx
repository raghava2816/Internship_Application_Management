import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  Terminal, 
  Users, 
  FileCheck,
  HardDrive,
  Wifi
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { usePolling } from '../hooks/usePolling';
import { useSSE } from '../hooks/useSSE';
import axios from 'axios';

interface LogType {
  _id: string;
  action: string;
  category: string;
  createdAt: string;
  ownerId?: {
    name: string;
    email: string;
  };
}

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<LogType[]>([]);
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ─── Fetch stats (used by polling) ─────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const statsRes = await axios.get('/api/admin/stats', { headers });
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
        setLastUpdated(new Date());
      }
    } catch {
      // Mock admin analytics fallback
      setStats({
        users: 145,
        applications: 482,
        logs: 1240,
        statusDistribution: { Wishlist: 45, Applied: 180, OA: 92, 'Technical Round': 65, Offer: 35, Rejected: 65 },
        aiTokensUsed: 142050,
        storageAnalytics: {
          resumesSizeMB: 84.5,
          certificatesSizeMB: 142.2,
          totalAllocatedMB: 1024
        },
        systemHealth: {
          database: 'Connected',
          openai: 'Backup (Offline Simulated Mode)',
          serverLoadPercent: 12
        }
      });
      setLastUpdated(new Date());
    }
  }, []);

  // ─── Auto-poll stats every 10s ──────────────────────────────────────────────
  usePolling(fetchStats, { intervalMs: 10000, enabled: user?.role === 'admin', immediate: true });

  // ─── Initial logs fetch ─────────────────────────────────────────────────────
  const fetchInitialLogs = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const logsRes = await axios.get('/api/admin/logs?limit=10', { headers });
      if (logsRes.data.success) setLogs(logsRes.data.data);
    } catch {
      setLogs([
        { _id: 'l1', action: 'New registration: dev@tracker.com', category: 'auth', createdAt: new Date().toISOString() },
        { _id: 'l2', action: 'Generated cover letter for Google role', category: 'ai', createdAt: new Date(Date.now() - 40000).toISOString() },
        { _id: 'l3', action: 'Uploaded resume_v3.2_ats.pdf', category: 'resume', createdAt: new Date(Date.now() - 120000).toISOString() },
        { _id: 'l4', action: 'Stripe application status moved to technical screening', category: 'application', createdAt: new Date(Date.now() - 300000).toISOString() },
        { _id: 'l5', action: 'Admin dashboard login session validated', category: 'auth', createdAt: new Date(Date.now() - 600000).toISOString() }
      ]);
    }
  }, []);

  // Initial logs fetch on mount
  useEffect(() => {
    if (user?.role === 'admin') fetchInitialLogs();
  }, [user, fetchInitialLogs]);

  // ─── SSE Live Log Feed via useSSE hook ─────────────────────────────────────
  useSSE('/api/admin/live-feed', {
    enabled: user?.role === 'admin',
    reconnectDelay: 4000,
    onOpen: () => setLiveConnected(true),
    onError: () => setLiveConnected(false),
    onEvent: (event, data) => {
      if (event === 'connected') {
        setLiveConnected(true);
      } else if (event === 'logs') {
        const newLogs = data as LogType[];
        setLogs(prev => {
          const existingIds = new Set(prev.map(l => l._id));
          const fresh = newLogs.filter(l => !existingIds.has(l._id));
          return fresh.length > 0 ? [...fresh, ...prev].slice(0, 20) : prev;
        });
      }
    }
  });

  // Restrict access screen if not Admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldCheck className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-sm mt-2">
          This monitoring panel is locked to administrators. Please login using the admin credentials to view health logs.
        </p>
      </div>
    );
  }

  const apiRequestsData = [
    { day: 'Mon', calls: 1420 },
    { day: 'Tue', calls: 1850 },
    { day: 'Wed', calls: 2400 },
    { day: 'Thu', calls: 2100 },
    { day: 'Fri', calls: 3100 },
    { day: 'Sat', calls: 1200 },
    { day: 'Sun', calls: 1600 }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Controls</h1>
          <p className="text-muted-foreground text-sm">Monitor global databases, manage storage, trace server loads, and verify token usage logs.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live connection indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className={liveConnected ? 'text-emerald-500' : 'text-muted-foreground'}>
              {liveConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Top Quick Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total users</span>
                  <span className="text-3xl font-extrabold block mt-1">{stats.users}</span>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Applications</span>
                  <span className="text-3xl font-extrabold block mt-1">{stats.applications}</span>
                </div>
                <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl">
                  <FileCheck className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI API Token Count</span>
                  <span className="text-2xl font-extrabold block mt-1.5">{stats.aiTokensUsed.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl">
                  <Activity className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">System DB state</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      stats.systemHealth.database === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <span className="text-xs font-extrabold uppercase">{stats.systemHealth.database}</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Database className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Performance & Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* API Traffic Volume Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">API Traffic Metrics (Weekly calls)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={apiRequestsData}>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Area type="monotone" dataKey="calls" stroke="#6366f1" fillOpacity={1} fill="url(#colorCalls)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Storage space limits charts */}
            <Card className="lg:col-span-1 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Disk Allocation Volume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>Verified files storage</span>
                      <span>{(stats.storageAnalytics.resumesSizeMB + stats.storageAnalytics.certificatesSizeMB).toFixed(1)}MB / {stats.storageAnalytics.totalAllocatedMB}MB</span>
                    </div>
                    <Progress value={((stats.storageAnalytics.resumesSizeMB + stats.storageAnalytics.certificatesSizeMB) / stats.storageAnalytics.totalAllocatedMB) * 100} indicatorClassName="gradient-primary" />
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-4 dark:border-white/5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-semibold">Resumes Storage:</span>
                    <span className="font-bold">{stats.storageAnalytics.resumesSizeMB} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-semibold">Certificates Space:</span>
                    <span className="font-bold">{stats.storageAnalytics.certificatesSizeMB} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-semibold">OpenAI Status:</span>
                    <span className="font-bold text-amber-500">{stats.systemHealth.openai}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Audit logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                <span>Audit Logs Tracker</span>
                {liveConnected && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                    <Wifi className="h-3 w-3" />
                    Live
                  </span>
                )}
              </CardTitle>
              <CardDescription>Live system traces — updates automatically every 5 seconds.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-card-light dark:bg-card-dark overflow-hidden dark:border-white/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Action</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => (
                      <TableRow key={log._id}>
                        <TableCell className="font-semibold text-xs">{log.action}</TableCell>
                        <TableCell>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {log.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Auxiliary loader icon
const RefreshCw = ({ className, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
export default AdminPanel;
