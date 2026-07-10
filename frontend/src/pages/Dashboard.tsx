import React from 'react';
import { 
  Trello, 
  FileText, 
  TrendingUp, 
  Award, 
  CalendarDays,
  Activity,
  ArrowUpRight,
  Target,
  Users
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
  PieChart,
  Pie,
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

  // Chart data: Monthly applications velocity
  const monthlyData = [
    { name: 'Feb', applications: 2 },
    { name: 'Mar', applications: 5 },
    { name: 'Apr', applications: 8 },
    { name: 'May', applications: 12 },
    { name: 'Jun', applications: 15 },
    { name: 'Jul', applications: totalApps }
  ];

  const COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

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
                +12% vs last month
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
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
            <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl">
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
                Ratio of OA / Interviews
              </span>
            </div>
            <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl">
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
                Offer Stage reached
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
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
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Area type="monotone" dataKey="applications" stroke="#6366f1" fillOpacity={1} fill="url(#colorApps)" />
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
                      {statusChartData.map((entry, index) => (
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
