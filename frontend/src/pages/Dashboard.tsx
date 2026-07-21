import React from 'react';
import { 
  Trello, 
  FileText, 
  TrendingUp, 
  Award, 
  CalendarDays,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useAppData } from '../context/AppDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { applications, activeResume } = useAppData();
  const navigate = useNavigate();

  // Metrics computation
  const totalApps = applications.length;
  
  const resumeScore = activeResume?.atsReport?.score || 72;

  const interviewRate = React.useMemo(() => {
    if (totalApps === 0) return 0;
    const progressionStages = ['OA', 'Assessment', 'Technical Round', 'HR Round', 'Offer', 'Accepted'];
    const progressedCount = applications.filter(a => progressionStages.includes(a.status)).length;
    return Math.round((progressedCount / totalApps) * 100);
  }, [applications, totalApps]);

  const offerRate = React.useMemo(() => {
    if (totalApps === 0) return 0;
    const offerCount = applications.filter(a => a.status === 'Offer' || a.status === 'Accepted').length;
    return Math.round((offerCount / totalApps) * 100);
  }, [applications, totalApps]);

  // Chart data: Status distribution
  const statusChartData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      count: counts[key]
    }));
  }, [applications]);

  // Dynamic applications percentage change vs last month
  const lastMonthAppsText = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthCount = applications.filter(a => {
      if (!a.appliedDate) return false;
      const d = new Date(a.appliedDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const lastMonthCount = applications.filter(a => {
      if (!a.appliedDate) return false;
      const d = new Date(a.appliedDate);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    if (lastMonthCount === 0) {
      return currentMonthCount > 0 ? `+${currentMonthCount} added this month` : 'No new entries';
    }
    const percent = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
    return percent >= 0 ? `+${percent}% vs last month` : `${percent}% vs last month`;
  }, [applications]);

  // Chart data: Monthly applications velocity (Calculated dynamically)
  const monthlyData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { name: string; applications: number }[] = [];
    const now = new Date();
    
    // Generate the last 6 months chronologically
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        name: months[d.getMonth()],
        applications: 0
      });
    }

    // Accumulate application count
    applications.forEach(app => {
      if (!app.appliedDate) return;
      const appDate = new Date(app.appliedDate);
      if (isNaN(appDate.getTime())) return;
      
      const monthName = months[appDate.getMonth()];
      const match = result.find(r => r.name === monthName);
      if (match) {
        match.applications++;
      }
    });

    // Transform to cumulative total to show submission velocity growth trend
    let cumulative = 0;
    return result.map(item => {
      cumulative += item.applications;
      return {
        name: item.name,
        applications: cumulative
      };
    });
  }, [applications]);

  const COLORS = ['#10B981', '#6EE7B7', '#22D3EE', '#059669', '#34D399', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment Dashboard</h1>
          <p className="text-muted-foreground text-sm">Trace your submission pipelines, ATS resume audits, and prepare next actions.</p>
        </div>
        <Button onClick={() => navigate('/tracker')} className="gradient-primary">
          Manage Applications
          <ArrowUpRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>

      {/* Metrics Grid Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass shadow-sm border-white/10 dark:border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Applications</span>
              <span className="text-3xl font-extrabold block mt-1">{totalApps}</span>
              <span className="text-xs text-accent-success font-semibold flex items-center gap-0.5 mt-1">
                {lastMonthAppsText}
              </span>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Trello className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border-white/10 dark:border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active ATS Score</span>
              <span className="text-3xl font-extrabold block mt-1">{resumeScore}%</span>
              <span className="text-xs text-primary font-semibold flex items-center gap-0.5 mt-1">
                Active: {activeResume ? activeResume.version : 'None'}
              </span>
            </div>
            <div className="p-3 bg-accent/10 text-accent rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border-white/10 dark:border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progression Rate</span>
              <span className="text-3xl font-extrabold block mt-1">{interviewRate}%</span>
              <span className="text-xs text-muted-foreground font-medium block mt-1">
                Ratio of progressed stages
              </span>
            </div>
            <div className="p-3 bg-secondary/20 text-primary rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border-white/10 dark:border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Offer success Rate</span>
              <span className="text-3xl font-extrabold block mt-1">{offerRate}%</span>
              <span className="text-xs text-accent-success font-semibold flex items-center gap-0.5 mt-1">
                {applications.filter(a => a.status === 'Offer' || a.status === 'Accepted').length} offers secured
              </span>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications Velocity Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Submission Velocity</CardTitle>
            <CardDescription>Monthly applications count timeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Area type="monotone" dataKey="applications" stroke="#10b981" fillOpacity={1} fill="url(#colorApps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Distribution stages ratio */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold">Pipeline Ratios</CardTitle>
            <CardDescription>Applications count by status category.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {totalApps > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-10">No applications logs recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Panel: Upcoming action deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-4.5 w-4.5 text-primary" />
            <span>Upcoming Action Timelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {applications.filter(a => a.status === 'OA' || a.status.includes('Round')).map(app => (
              <div key={app._id} className="flex items-center justify-between p-3 border border-border bg-slate-50/50 dark:bg-slate-900/30 rounded-xl dark:border-white/5">
                <div>
                  <h4 className="font-bold text-xs">{app.company}</h4>
                  <p className="text-[10px] text-muted-foreground">{app.role} • Status: <strong className="text-primary">{app.status}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5" onClick={() => navigate('/tracker')}>
                    <span>Review details</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
            {applications.filter(a => a.status === 'OA' || a.status.includes('Round')).length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-4">No pending actions or scheduled assessments.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Dashboard;
