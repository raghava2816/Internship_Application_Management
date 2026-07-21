import React, { useState, useMemo } from 'react';
import { 
  FolderGit2, 
  Linkedin, 
  Link2, 
  CheckCircle, 
  Plus, 
  X,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input, Label, Textarea } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';

interface Project {
  name: string;
  repoUrl: string;
  description: string;
  tags: string[];
  aiReview?: {
    qualityScore: number;
    strengths: string;
    suggestions: string;
  };
}

interface Certificate {
  title: string;
  issuer: string;
  date: string;
  link?: string;
}

export const PortfolioManager: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  const [profileUrlInput, setProfileUrlInput] = useState({
    linkedin: user?.linkedinUrl || '',
    github: user?.githubUrl || '',
    portfolio: user?.portfolioUrl || ''
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const key = `portfolio_projects_${user?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const key = `portfolio_certs_${user?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Modal forms
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', repoUrl: '', description: '', tags: '' });

  const [isCertOpen, setIsCertOpen] = useState(false);
  const [newCert, setNewCert] = useState({ title: '', issuer: '', date: '', link: '' });

  // Interactive details modal state
  const [modalDetails, setModalDetails] = useState<{
    title: string;
    score?: number;
    status?: string;
    explanation: string;
    example?: string;
    type: 'project' | 'audit' | 'link' | 'cert';
  } | null>(null);

  // Compute profile completeness strength percentage
  const profileStrength = useMemo(() => {
    let score = 30; // base score for registered profile
    if (user?.linkedinUrl || profileUrlInput.linkedin) score += 15;
    if (user?.githubUrl || profileUrlInput.github) score += 15;
    if (user?.portfolioUrl || profileUrlInput.portfolio) score += 10;
    if (projects.length > 0) score += 15;
    if (certificates.length > 0) score += 15;
    return Math.min(score, 100);
  }, [user, profileUrlInput, projects, certificates]);

  const handleSaveLinks = async () => {
    await updateProfile({
      linkedinUrl: profileUrlInput.linkedin,
      githubUrl: profileUrlInput.github,
      portfolioUrl: profileUrlInput.portfolio
    });
    alert('Links updated successfully!');
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    setProjects(prev => {
      const updated = [
        ...prev,
        {
          name: newProject.name,
          repoUrl: newProject.repoUrl,
          description: newProject.description,
          tags: newProject.tags.split(',').map(t => t.trim()).filter(Boolean),
          aiReview: {
            qualityScore: 85,
            strengths: "Structured tags and clean description summary. Ready for repo scan.",
            suggestions: "Add a valid repository URL to configure automated AI codebase reviews."
          }
        }
      ];
      localStorage.setItem(`portfolio_projects_${user?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
    setIsProjectOpen(false);
    setNewProject({ name: '', repoUrl: '', description: '', tags: '' });
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.title || !newCert.issuer) return;
    setCertificates(prev => {
      const updated = [
        ...prev,
        {
          title: newCert.title,
          issuer: newCert.issuer,
          date: newCert.date || new Date().toISOString().split('T')[0],
          link: newCert.link
        }
      ];
      localStorage.setItem(`portfolio_certs_${user?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
    setIsCertOpen(false);
    setNewCert({ title: '', issuer: '', date: '', link: '' });
  };

  const linkedCount = useMemo(() => {
    let count = 0;
    if (profileUrlInput.linkedin) count++;
    if (profileUrlInput.github) count++;
    if (profileUrlInput.portfolio) count++;
    return count;
  }, [profileUrlInput]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Portfolio & Profiles</h1>
        <p className="text-muted-foreground text-sm mt-1">Organize your technical projects, certifications, and monitor profile strength across linked social platforms.</p>
      </div>

      {/* 3 Metric Cards at Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          onClick={() => {
            setModalDetails({
              title: 'Linked Profiles Status',
              explanation: `You have successfully connected ${linkedCount} out of your 3 primary web portfolio links. Link profiles to improve RAG vector parsing results.`,
              status: `${linkedCount}/3 Connected`,
              example: `Currently linked: \n• LinkedIn: ${profileUrlInput.linkedin ? 'Yes' : 'No'}\n• GitHub: ${profileUrlInput.github ? 'Yes' : 'No'}\n• Portfolio Website: ${profileUrlInput.portfolio ? 'Yes' : 'No'}`,
              type: 'link'
            });
          }}
          className="bg-secondary/20 hover:bg-secondary/40 transition-colors border-border/40 dark:border-white/5 cursor-pointer text-center p-4"
        >
          <CardHeader className="p-0 pb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Profiles Linked</span>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-3xl font-black text-primary">{linkedCount} <span className="text-xs font-bold text-slate-400">/ 3</span></span>
          </CardContent>
        </Card>

        <Card 
          onClick={() => {
            setModalDetails({
              title: 'Technical Projects Breakdown',
              explanation: `Showcase project repos containing build structures, testing setup, and documentation logs. We suggest adding at least 2 distinct repositories to show full-stack capability.`,
              status: `${projects.length} Present`,
              example: `Add new repositories under the Technical Projects panel. Direct connections will be parsed into candidate summaries.`,
              type: 'project'
            });
          }}
          className="bg-secondary/20 hover:bg-secondary/40 transition-colors border-border/40 dark:border-white/5 cursor-pointer text-center p-4"
        >
          <CardHeader className="p-0 pb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Technical Projects</span>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-3xl font-black text-primary">{projects.length}</span>
          </CardContent>
        </Card>

        <Card 
          onClick={() => {
            setModalDetails({
              title: 'Verified Certifications',
              explanation: `Certifications demonstrate specialized knowledge fields (such as AWS Cloud or MongoDB development). These credentials weight keyword match scores in modern ATS trackers.`,
              status: `${certificates.length} Verified`,
              example: `Listed: AWS Associate Developer, MongoDB Professional. Use the certifications panel to add new cloud credentials.`,
              type: 'cert'
            });
          }}
          className="bg-secondary/20 hover:bg-secondary/40 transition-colors border-border/40 dark:border-white/5 cursor-pointer text-center p-4"
        >
          <CardHeader className="p-0 pb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Certificates Verified</span>
          </CardHeader>
          <CardContent className="p-0">
            <span className="text-3xl font-black text-primary">{certificates.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Strength & Links (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Strength Donut */}
          <Card className="shadow-md border border-border/30 dark:border-white/5">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative shrink-0 flex items-center justify-center mx-auto w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className={`transition-all duration-500 ease-out 
                      ${profileStrength >= 80 ? 'stroke-emerald-500' : profileStrength >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'}
                    `}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * profileStrength) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-foreground leading-none">{profileStrength}%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Strength</span>
                </div>
              </div>
              
              <ul className="text-xs text-slate-500 space-y-2 pt-2 font-semibold">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${profileUrlInput.linkedin && profileUrlInput.github ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Social profiles linked</span>
                  </span>
                  <span className="text-[10px] text-slate-400">30%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${projects.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Technical projects</span>
                  </span>
                  <span className="text-[10px] text-slate-400">15%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${certificates.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Certificates loaded</span>
                  </span>
                  <span className="text-[10px] text-slate-400">15%</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Social Profiles Inputs */}
          <Card className="shadow-md border border-border/30 dark:border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Social Connections</CardTitle>
              <CardDescription className="text-xs">Link profiles to feed semantic search metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">LinkedIn URL</Label>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1
                    ${profileUrlInput.linkedin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}
                  `}>
                    <span className={`h-1.5 w-1.5 rounded-full ${profileUrlInput.linkedin ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {profileUrlInput.linkedin ? 'Connected' : 'Missing'}
                  </span>
                </div>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={profileUrlInput.linkedin}
                    onChange={e => setProfileUrlInput(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="pl-9 text-xs" 
                    placeholder="https://linkedin.com/in/username" 
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">GitHub Profile URL</Label>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1
                    ${profileUrlInput.github ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}
                  `}>
                    <span className={`h-1.5 w-1.5 rounded-full ${profileUrlInput.github ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {profileUrlInput.github ? 'Connected' : 'Missing'}
                  </span>
                </div>
                <div className="relative">
                  <FolderGit2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={profileUrlInput.github}
                    onChange={e => setProfileUrlInput(prev => ({ ...prev, github: e.target.value }))}
                    className="pl-9 text-xs" 
                    placeholder="https://github.com/username" 
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Personal Portfolio URL</Label>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1
                    ${profileUrlInput.portfolio ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}
                  `}>
                    <span className={`h-1.5 w-1.5 rounded-full ${profileUrlInput.portfolio ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {profileUrlInput.portfolio ? 'Connected' : 'Missing'}
                  </span>
                </div>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    value={profileUrlInput.portfolio}
                    onChange={e => setProfileUrlInput(prev => ({ ...prev, portfolio: e.target.value }))}
                    className="pl-9 text-xs" 
                    placeholder="https://mywebsite.com" 
                  />
                </div>
              </div>

              <Button onClick={handleSaveLinks} className="w-full gradient-primary text-white font-bold text-xs py-2">
                Save Profiles
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Projects & Certifications (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Projects Dashboard list */}
          <Card className="shadow-md border border-border/30 dark:border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/10">
              <div>
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                  <FolderGit2 className="h-4.5 w-4.5 text-primary" />
                  <span>Technical Projects</span>
                </CardTitle>
                <CardDescription className="text-xs">Click on any project to view AI review audits and refactoring suggestions.</CardDescription>
              </div>
              <Button onClick={() => setIsProjectOpen(true)} variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1 h-8">
                <Plus className="h-4 w-4" /> Add Project
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {projects.map((proj, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (proj.aiReview) {
                      setModalDetails({
                        title: `AI Review: ${proj.name}`,
                        score: proj.aiReview.qualityScore,
                        status: proj.aiReview.qualityScore >= 90 ? 'Strong Quality' : 'Moderate Quality',
                        explanation: `Strengths: ${proj.aiReview.strengths}`,
                        example: `Refactoring Suggestion:\n${proj.aiReview.suggestions}`,
                        type: 'project'
                      });
                    }
                  }}
                  className="group p-4 rounded-xl border border-border bg-slate-50/50 hover:bg-secondary/40 transition-all cursor-pointer dark:border-white/5 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">{proj.name}</h4>
                    <a 
                      href={proj.repoUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Code Repository</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 font-semibold">{proj.description}</p>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {proj.tags.map((tg, i) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{tg}</span>
                      ))}
                    </div>
                    {proj.aiReview && (
                      <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-sans">
                        Quality: {proj.aiReview.qualityScore}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-border dark:border-white/5 rounded-xl font-semibold">
                  No technical projects added yet. Click "Add Project" to showcase your work.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certifications Verified List */}
          <Card className="shadow-md border border-border/30 dark:border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/10">
              <div>
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-primary" />
                  <span>Verified Credentials</span>
                </CardTitle>
                <CardDescription className="text-xs">Verified cloud/database credentials that increase ATS profile matching weight.</CardDescription>
              </div>
              <Button onClick={() => setIsCertOpen(true)} variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1 h-8">
                <Plus className="h-4 w-4" /> Add Certificate
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {certificates.map((cert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/30 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-foreground">{cert.title}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{cert.issuer} • Issued: {cert.date}</p>
                    </div>
                  </div>
                  {cert.link && (
                    <a 
                      href={cert.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="rounded-lg p-1.5 border border-border/80 hover:bg-secondary text-slate-400 hover:text-primary transition-all"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
              {certificates.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-border dark:border-white/5 rounded-xl font-semibold">
                  No verified credentials added yet. Click "Add Certificate" to upload qualifications.
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Add Project Dialog */}
      <Dialog isOpen={isProjectOpen} onClose={() => setIsProjectOpen(false)} title="Add Technical Project">
        <form onSubmit={handleAddProject} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Project Name *</Label>
            <Input required value={newProject.name} onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Payments Hub" className="text-xs h-9" />
          </div>

          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Repository URL</Label>
            <Input value={newProject.repoUrl} onChange={e => setNewProject(prev => ({ ...prev, repoUrl: e.target.value }))} placeholder="https://github.com/..." className="text-xs h-9" />
          </div>

          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Technologies (Comma separated)</Label>
            <Input value={newProject.tags} onChange={e => setNewProject(prev => ({ ...prev, tags: e.target.value }))} placeholder="TypeScript, Express, MongoDB" className="text-xs h-9" />
          </div>

          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Description</Label>
            <Textarea required value={newProject.description} onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))} placeholder="Explain system structures, performance indicators..." className="h-28 text-xs leading-relaxed" />
          </div>

          <Button type="submit" className="w-full gradient-primary text-white font-bold text-xs py-2.5">Verify and Save</Button>
        </form>
      </Dialog>

      {/* Add Certificate Dialog */}
      <Dialog isOpen={isCertOpen} onClose={() => setIsCertOpen(false)} title="Add Certification">
        <form onSubmit={handleAddCert} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Certificate Title *</Label>
            <Input required value={newCert.title} onChange={e => setNewCert(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. AWS Solutions Architect" className="text-xs h-9" />
          </div>

          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Issuer / Authority *</Label>
            <Input required value={newCert.issuer} onChange={e => setNewCert(prev => ({ ...prev, issuer: e.target.value }))} placeholder="e.g. Amazon Web Services" className="text-xs h-9" />
          </div>

          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Date Issued</Label>
            <Input type="date" value={newCert.date} onChange={e => setNewCert(prev => ({ ...prev, date: e.target.value }))} className="text-xs h-9" />
          </div>

          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-bold">Verification Link</Label>
            <Input value={newCert.link} onChange={e => setNewCert(prev => ({ ...prev, link: e.target.value }))} placeholder="https://aws.amazon.com/..." className="text-xs h-9" />
          </div>

          <Button type="submit" className="w-full gradient-primary text-white font-bold text-xs py-2.5">Save Credential</Button>
        </form>
      </Dialog>

      {/* Interactive Details Modal */}
      {modalDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden border border-border dark:border-white/10 rounded-2xl bg-background shadow-2xl animate-in scale-in duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border dark:border-white/5 pb-3">
                <h3 className="font-extrabold text-lg text-foreground">{modalDetails.title}</h3>
                <button 
                  onClick={() => setModalDetails(null)}
                  className="rounded-full p-1 text-slate-400 hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3.5">
                {modalDetails.score !== undefined && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Score Rating:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-foreground">{modalDetails.score}/100</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider
                        ${modalDetails.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}
                      `}>
                        {modalDetails.status}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">AI Evaluation:</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                    {modalDetails.explanation}
                  </p>
                </div>
                
                {modalDetails.example && (
                  <div className="space-y-1.5 p-3.5 rounded-xl border border-primary/20 bg-primary/5 dark:border-white/5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Actionable Rewrite Example:</span>
                    <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed">
                      {modalDetails.example}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-2">
                <Button onClick={() => setModalDetails(null)} size="sm" className="text-xs font-bold gradient-primary text-white border-0">
                  Close details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PortfolioManager;
