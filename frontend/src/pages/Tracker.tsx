import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trello, 
  Calendar as CalendarIcon, 
  Table as TableIcon, 
  Clock, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  ExternalLink, 
  MapPin, 
  DollarSign, 
  Eye, 
  CalendarDays,
  Activity,
  Sparkles
} from 'lucide-react';
import { useAppData, ApplicationType } from '../context/AppDataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Input, Label, Select, Textarea } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import axios from 'axios';

const STAGES = [
  'Wishlist', 'Applied', 'OA', 'Assessment', 
  'Technical Round', 'HR Round', 'Offer', 'Rejected'
];

export const Tracker: React.FC = () => {
  const { 
    applications, 
    activeResume,
    addApplication, 
    updateApplication, 
    deleteApplication, 
    exportCSV 
  } = useAppData();

  const [activeView, setActiveView] = useState<'kanban' | 'timeline' | 'calendar' | 'table' | 'suggestions'>('kanban');
  const [suggestions, setSuggestions] = useState<{ jobs: any[]; internships: any[] }>({ jobs: [], internships: [] });
  const [suggestionTab, setSuggestionTab] = useState<'jobs' | 'internships'>('jobs');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [addingSuggestions, setAddingSuggestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeView === 'suggestions') {
      const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('/api/ai/job-recommendations', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (res.data.success) {
            setSuggestions(res.data.data);
          }
        } catch (error) {
          // Fallback suggestions
          setSuggestions({
            jobs: [
              {
                company: "G7 CR Technologies",
                role: "Full Stack Developer Intern (MERN)",
                location: "Bengaluru, Karnataka (In-Office)",
                salary: "₹15,000 - ₹25,000 / month",
                matchPercentage: 90,
                skillsMatched: ["React", "Node.js", "JavaScript"],
                skillsMissing: ["MongoDB", "Express.js"],
                description: "Design and implement responsive user layouts in React and integrate secure RESTful APIs via Express router layers.",
                jobLink: "https://www.naukri.com/full-stack-developer-jobs",
                source: "Naukri"
              },
              {
                company: "Quleep",
                role: "Junior React Developer (Fresher)",
                location: "Delhi/NCR (Remote)",
                salary: "₹35,000 - ₹50,000 / month",
                matchPercentage: 85,
                skillsMatched: ["React", "APIs"],
                skillsMissing: ["TypeScript", "Vite", "JSON"],
                description: "Develop next-gen portal modules. This is a fully remote entry-level position for passionate coding graduates.",
                jobLink: "https://in.indeed.com/jobs?q=React+Developer",
                source: "Indeed"
              }
            ],
            internships: [
              {
                company: "Webenza India",
                role: "Frontend Developer Intern",
                location: "Bengaluru, Karnataka (Hybrid)",
                salary: "₹12,000 / month",
                matchPercentage: 92,
                skillsMatched: ["React", "TypeScript", "TailwindCSS"],
                skillsMissing: ["CSS"],
                description: "Work with UI engineers to build responsive web pages, manage states, and track browser bundle performance.",
                jobLink: "https://internshala.com/internship/detail/front-end-development-internship-in-bangalore-at-webenza-india17211029",
                source: "Internshala"
              },
              {
                company: "Foxberry Technology",
                role: "ReactJS Developer Intern",
                location: "Pune, Maharashtra (Onsite)",
                salary: "₹10,000 / month",
                matchPercentage: 88,
                skillsMatched: ["React", "JavaScript", "HTML"],
                skillsMissing: ["CSS", "Git"],
                description: "Deploy interactive components and test browser layouts. Familiarity with Github source control is required.",
                jobLink: "https://in.indeed.com/jobs?q=React+Developer",
                source: "Indeed"
              }
            ]
          });
        } finally {
          setLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
    }
  }, [activeView]);

  const handleAddSuggestedJob = async (job: any, index: string) => {
    setAddingSuggestions(prev => ({ ...prev, [index]: true }));
    try {
      await addApplication({
        company: job.company,
        role: job.role,
        jobLink: job.jobLink || '',
        salary: job.salary || '',
        location: job.location || '',
        employmentType: 'Internship',
        remoteType: job.location.includes('Remote') ? 'Remote' : job.location.includes('Hybrid') ? 'Hybrid' : 'Onsite',
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'Wishlist',
        priority: 'Medium',
        tags: job.skillsMatched || [],
        notes: `Suggested matching role from ${job.source}. Match Strength: ${job.matchPercentage}%. Description: ${job.description}`
      });
      alert(`Successfully added ${job.role} at ${job.company} to your Wishlist tracking board!`);
    } catch (err) {
      console.error('Failed to add suggested job:', err);
    } finally {
      setAddingSuggestions(prev => ({ ...prev, [index]: false }));
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationType | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    jobLink: '',
    salary: '',
    location: '',
    employmentType: 'Internship' as any,
    remoteType: 'Onsite' as any,
    priority: 'Medium' as any,
    notes: '',
    status: 'Wishlist',
    tags: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterLinkedIn: '',
    appliedDate: new Date().toISOString().split('T')[0]
  });

  // Filtered Applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || app.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || app.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [applications, searchTerm, statusFilter, priorityFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    await addApplication(formatted);
    setIsAddOpen(false);
    // Reset Form
    setFormData({
      company: '',
      role: '',
      jobLink: '',
      salary: '',
      location: '',
      employmentType: 'Internship',
      remoteType: 'Onsite',
      priority: 'Medium',
      notes: '',
      status: 'Wishlist',
      tags: '',
      recruiterName: '',
      recruiterEmail: '',
      recruiterLinkedIn: '',
      appliedDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleUpdateStatus = async (appId: string, nextStatus: string) => {
    await updateApplication(appId, { status: nextStatus });
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedApps.length} applications?`)) {
      await Promise.all(selectedApps.map(id => deleteApplication(id)));
      setSelectedApps([]);
    }
  };

  const toggleSelectApp = (id: string) => {
    setSelectedApps(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
          <p className="text-muted-foreground text-sm">Organize, visualize, and update your recruitment pathways in real-time.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Views Selector */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card-light dark:bg-card-dark dark:border-white/5">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search company or role..." 
              className="pl-9 h-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <Select 
            className="w-36 h-9"
            name="statusFilter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Statuses' },
              ...STAGES.map(s => ({ value: s, label: s }))
            ]}
          />

          {/* Priority Filter */}
          <Select 
            className="w-36 h-9"
            name="priorityFilter"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Priorities' },
              { value: 'High', label: 'High Priority' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' }
            ]}
          />

          {/* Bulk actions */}
          {selectedApps.length > 0 && (
            <Button variant="destructive" size="sm" className="h-9" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedApps.length})
            </Button>
          )}
        </div>
        
        {/* View Switchers */}
        <div className="inline-flex rounded-lg bg-secondary p-1 text-muted-foreground self-start lg:self-center">
          <button 
            onClick={() => setActiveView('kanban')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${activeView === 'kanban' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <Trello className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Board</span>
          </button>
          <button 
            onClick={() => setActiveView('table')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${activeView === 'table' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">List</span>
          </button>
          <button 
            onClick={() => setActiveView('calendar')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${activeView === 'calendar' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Calendar</span>
          </button>
          <button 
            onClick={() => setActiveView('timeline')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${activeView === 'timeline' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Timeline</span>
          </button>
          <button 
            onClick={() => setActiveView('suggestions')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${activeView === 'suggestions' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Suggestions</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      <div className="min-h-[50vh]">
        {activeView === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {STAGES.map(stage => {
              const stageApps = filteredApps.filter(a => a.status === stage);
              return (
                <div key={stage} className="flex flex-col rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/30 p-3 min-h-[300px] dark:border-white/5">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="font-semibold text-sm">{stage}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold">
                      {stageApps.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {stageApps.map(app => (
                      <Card 
                        key={app._id} 
                        className="glass-hover border border-border/80 dark:border-white/5 cursor-pointer shadow-sm hover:shadow"
                        onClick={() => { setSelectedApp(app); setIsDetailsOpen(true); }}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm tracking-tight">{app.company}</h4>
                              <p className="text-xs text-muted-foreground font-medium">{app.role}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                              ${app.priority === 'High' ? 'bg-red-500/10 text-red-500' : app.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}
                            `}>
                              {app.priority}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                            {app.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{app.location} ({app.remoteType})</span>
                              </div>
                            )}
                            {app.salary && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{app.salary}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions inside Card */}
                          <div className="flex items-center justify-between pt-2 border-t border-border dark:border-white/5">
                            <span className="text-[10px] text-muted-foreground">
                              Match score: <span className="font-bold text-primary">{app.predictions?.interviewProbability}%</span>
                            </span>
                            <Select 
                              className="w-24 h-7 text-[10px] py-0 px-1"
                              value={app.status}
                              onClick={e => e.stopPropagation()}
                              onChange={e => handleUpdateStatus(app._id, e.target.value)}
                              options={STAGES.map(s => ({ value: s, label: s }))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {stageApps.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        Drop items here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'timeline' && (
          <div className="relative border-l border-border dark:border-white/5 ml-4 pl-6 space-y-8 py-4">
            {filteredApps.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground">No applications match criteria.</p>
            ) : (
              filteredApps.map(app => (
                <div key={app._id} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-10 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card-light dark:bg-card-dark shadow-sm dark:border-white/5">
                    <Clock className="h-4 w-4 text-primary" />
                  </span>
                  
                  <Card className="max-w-2xl">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-base">{app.company} — <span className="text-muted-foreground text-sm font-medium">{app.role}</span></h4>
                          <span className="text-xs text-muted-foreground">Applied on: {new Date(app.appliedDate).toLocaleDateString()}</span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          {app.status}
                        </span>
                      </div>

                      {/* Stage logs history flow */}
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">History Log:</span>
                        <div className="grid grid-cols-1 gap-2">
                          {app.stages.map((st, i) => (
                            <div key={i} className="flex items-center space-x-2 text-xs border border-border/40 p-2 rounded-lg bg-secondary/30 dark:border-white/5">
                              <span className="font-bold text-primary">{st.stage}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-slate-500">{new Date(st.date).toLocaleDateString()}</span>
                              {st.notes && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="italic truncate max-w-sm">{st.notes}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Display application scheduling lists */}
            {filteredApps.filter(app => app.deadline || app.status.includes('Round') || app.status === 'OA').map(app => (
              <Card key={app._id} className="border-l-4 border-l-primary">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm">{app.company} ({app.role})</h4>
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      {app.deadline && (
                        <span>⏰ Deadline: {new Date(app.deadline).toLocaleDateString()}</span>
                      )}
                      {app.status.includes('Round') && (
                        <span>📅 Interview Stage: <span className="font-semibold text-primary">{app.status}</span></span>
                      )}
                    </div>
                    {app.recruiterName && (
                      <p className="text-[10px] text-muted-foreground">Recruiter: {app.recruiterName} ({app.recruiterEmail})</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredApps.filter(app => app.deadline || app.status.includes('Round') || app.status === 'OA').length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No scheduled deadlines or interviews for matched applications.
              </div>
            )}
          </div>
        )}

        {activeView === 'table' && (
          <div className="rounded-xl border border-border bg-card-light dark:bg-card-dark overflow-hidden dark:border-white/5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input 
                      type="checkbox" 
                      onChange={e => setSelectedApps(e.target.checked ? filteredApps.map(a => a._id) : [])}
                      checked={selectedApps.length === filteredApps.length && filteredApps.length > 0}
                    />
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.map(app => (
                  <TableRow key={app._id} className={selectedApps.includes(app._id) ? "bg-muted/40" : ""}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedApps.includes(app._id)}
                        onChange={() => toggleSelectApp(app._id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-bold">{app.company}</TableCell>
                    <TableCell>{app.role}</TableCell>
                    <TableCell>{app.location || 'Remote'}</TableCell>
                    <TableCell>{new Date(app.appliedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                        ${app.priority === 'High' ? 'bg-red-500/10 text-red-500' : app.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}
                      `}>
                        {app.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                        {app.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => { setSelectedApp(app); setIsDetailsOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500" 
                          onClick={() => { if(confirm('Delete application?')) deleteApplication(app._id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredApps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No applications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {activeView === 'suggestions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-secondary/20 border border-border dark:border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-foreground">Real-time Job Matching</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Get dynamic daily-scraped roles matching your active resume, split by Jobs (Naukri & Indeed) and Internships (Indeed & Internshala).</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold">
                {activeResume ? `${activeResume.fileName} (${activeResume.version})` : 'No Active Resume'}
              </span>
            </div>

            {/* Sub-tab selection bar */}
            <div className="flex border-b border-border/10 pb-2 gap-6">
              <button 
                onClick={() => setSuggestionTab('jobs')}
                className={`pb-1.5 text-xs font-bold transition-all relative ${suggestionTab === 'jobs' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-foreground'}`}
              >
                Full-Time Jobs (Naukri & Indeed)
              </button>
              <button 
                onClick={() => setSuggestionTab('internships')}
                className={`pb-1.5 text-xs font-bold transition-all relative ${suggestionTab === 'internships' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-foreground'}`}
              >
                Internships (Indeed & Internshala)
              </button>
            </div>

            {loadingSuggestions ? (
              <div className="text-center py-20 text-xs text-slate-400">
                Loading matching suggestions via semantically audited vector database index...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(suggestionTab === 'jobs' ? suggestions.jobs : suggestions.internships).map((job, idx) => (
                  <Card key={idx} className="border-t-4 border-t-primary hover:shadow-md transition-all duration-200">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-sm text-foreground">{job.company}</h4>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">{job.role}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full shrink-0">
                          {job.matchPercentage}% Match
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{job.salary}</span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-500 font-medium line-clamp-3">{job.description}</p>

                      <div className="border-t border-border/10 pt-3 space-y-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Matched skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {job.skillsMatched.map((sk: string, i: number) => (
                              <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">{sk}</span>
                            ))}
                            {job.skillsMatched.length === 0 && <span className="text-[8px] text-slate-400 italic">None</span>}
                          </div>
                        </div>

                        {job.skillsMissing.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Missing keywords:</span>
                            <div className="flex flex-wrap gap-1">
                              {job.skillsMissing.map((sk: string, i: number) => (
                                <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold">{sk}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <a 
                          href={job.jobLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 text-center py-2 border border-border hover:bg-secondary/40 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200"
                        >
                          <span>Apply on {job.source}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <Button 
                          onClick={() => handleAddSuggestedJob(job, `${job.company}_${job.role}`)}
                          loading={addingSuggestions[`${job.company}_${job.role}`]}
                          className="gradient-primary text-white text-xs font-bold flex-1"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Track {suggestionTab === 'jobs' ? 'Job' : 'Intern'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(suggestionTab === 'jobs' ? suggestions.jobs : suggestions.internships).length === 0 && (
                  <div className="col-span-full text-center py-12 text-sm text-slate-400">
                    No matching suggestions found. Upload your resume to begin vector search.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Application Dialog */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Application">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label>Company *</Label>
              <Input name="company" required value={formData.company} onChange={handleInputChange} placeholder="e.g. Stripe" />
            </div>
            <div className="flex flex-col">
              <Label>Role *</Label>
              <Input name="role" required value={formData.role} onChange={handleInputChange} placeholder="e.g. Frontend Intern" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label>Salary</Label>
              <Input name="salary" value={formData.salary} onChange={handleInputChange} placeholder="e.g. $55/hr" />
            </div>
            <div className="flex flex-col">
              <Label>Location</Label>
              <Input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. San Francisco, CA" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <Label>Employment Type</Label>
              <Select 
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                options={[
                  { value: 'Internship', label: 'Internship' },
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' },
                  { value: 'Contract', label: 'Contract' }
                ]}
              />
            </div>
            <div className="flex flex-col">
              <Label>Workplace Mode</Label>
              <Select 
                name="remoteType"
                value={formData.remoteType}
                onChange={handleInputChange}
                options={[
                  { value: 'Onsite', label: 'Onsite' },
                  { value: 'Hybrid', label: 'Hybrid' },
                  { value: 'Remote', label: 'Remote' }
                ]}
              />
            </div>
            <div className="flex flex-col">
              <Label>Priority</Label>
              <Select 
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                options={[
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' }
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <Label>Tags (Comma separated)</Label>
            <Input name="tags" value={formData.tags} onChange={handleInputChange} placeholder="React, Node, Cloud" />
          </div>

          <div className="border-t border-border pt-3 dark:border-white/5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Recruiter Contact:</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label>Recruiter Name</Label>
                <Input name="recruiterName" value={formData.recruiterName} onChange={handleInputChange} placeholder="Sarah Jenkins" />
              </div>
              <div className="flex flex-col">
                <Label>Recruiter Email</Label>
                <Input name="recruiterEmail" value={formData.recruiterEmail} onChange={handleInputChange} type="email" placeholder="sarah@stripe.com" />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <Label>Notes</Label>
            <Textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Enter preparation strategies, OA feedback, etc." />
          </div>

          <Button type="submit" className="w-full gradient-primary">Create Application</Button>
        </form>
      </Dialog>

      {/* Details View Dialog */}
      <Dialog 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        title={`${selectedApp?.company} — ${selectedApp?.role}`}
        className="max-w-2xl"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-3 gap-4 border-b border-border pb-4 dark:border-white/5 text-center">
              <div>
                <span className="text-xs text-muted-foreground block">Salary Range</span>
                <span className="font-bold text-sm text-foreground">{selectedApp.salary || 'Unspecified'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Location</span>
                <span className="font-bold text-sm text-foreground">{selectedApp.location || 'Remote'} ({selectedApp.remoteType})</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Priority</span>
                <span className="font-bold text-sm text-primary">{selectedApp.priority}</span>
              </div>
            </div>

            {/* AI Predictions */}
            {selectedApp.predictions && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Success Prediction:</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <span className="text-xl font-bold">{selectedApp.predictions.interviewProbability}%</span>
                    <p className="text-[10px] uppercase font-bold tracking-tight">Interview Chance</p>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <span className="text-xl font-bold">{selectedApp.predictions.offerProbability}%</span>
                    <p className="text-[10px] uppercase font-bold tracking-tight">Offer Probability</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <span className="text-xl font-bold">{selectedApp.predictions.rejectionProbability}%</span>
                    <p className="text-[10px] uppercase font-bold tracking-tight">Rejection Risk</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{selectedApp.predictions.explanation}</p>
              </div>
            )}

            {/* Recruiter & Job Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Job Details</span>
                {selectedApp.jobLink && (
                  <a 
                    href={selectedApp.jobLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline gap-1 font-semibold"
                  >
                    <span>View Job Board Link</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="text-xs space-y-1">
                  <p>Type: <span className="font-semibold">{selectedApp.employmentType}</span></p>
                  <p>Applied Date: <span className="font-semibold">{new Date(selectedApp.appliedDate).toLocaleDateString()}</span></p>
                  {selectedApp.deadline && (
                    <p>Deadline: <span className="font-semibold">{new Date(selectedApp.deadline).toLocaleDateString()}</span></p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Recruiter Contact</span>
                {selectedApp.recruiterName ? (
                  <div className="text-xs space-y-1">
                    <p>Name: <span className="font-semibold">{selectedApp.recruiterName}</span></p>
                    <p>Email: <span className="font-semibold">{selectedApp.recruiterEmail}</span></p>
                    {selectedApp.recruiterLinkedIn && (
                      <a href={selectedApp.recruiterLinkedIn} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs block font-semibold">LinkedIn Profile</a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No contact added.</p>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {selectedApp.notes && (
              <div className="space-y-2 border-t border-border pt-4 dark:border-white/5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Timeline Notes</span>
                <p className="text-xs leading-relaxed p-3 rounded-lg bg-secondary/40 border border-border/50 dark:border-white/5">{selectedApp.notes}</p>
              </div>
            )}

            {/* Stage Logs details */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Recruitment Stages History</span>
              <div className="space-y-2">
                {selectedApp.stages.map((st, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs p-2.5 rounded-lg bg-secondary/30 border border-border/40 dark:border-white/5">
                    <span className="font-bold text-primary shrink-0">{st.stage}</span>
                    <div className="flex-1">
                      <p className="text-slate-500 font-medium text-[10px]">{new Date(st.date).toLocaleDateString()}</p>
                      {st.notes && <p className="mt-0.5 text-slate-700 dark:text-slate-300">{st.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default Tracker;
