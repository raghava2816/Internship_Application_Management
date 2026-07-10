import React, { useState } from 'react';
import { 
  FolderGit2, 
  Linkedin, 
  Link2, 
  Award, 
  Sparkles, 
  CheckCircle, 
  Plus, 
  Search, 
  ExternalLink,
  Code2,
  FileBadge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input, Label, Select, Textarea } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { Dialog } from '../components/ui/Dialog';

interface Project {
  name: string;
  repoUrl: string;
  description: string;
  tags: string[];
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

  const [projects, setProjects] = useState<Project[]>([
    {
      name: "Checkout Processing Engine",
      repoUrl: "https://github.com/applicant/checkout-engine",
      description: "A Node.js backend integrating Stripe API webhooks, handling database transactions with MongoDB, and caching configurations on Redis.",
      tags: ["Node.js", "MongoDB", "Stripe", "Redis"]
    },
    {
      name: "Developer Metrics Dashboard",
      repoUrl: "https://github.com/applicant/metrics-dashboard",
      description: "React 19 single-page interface rendering real-time developer statistics, bundle size maps, and charts using Recharts.",
      tags: ["React 19", "Recharts", "TailwindCSS", "Vite"]
    }
  ]);

  const [certificates, setCertifications] = useState<Certificate[]>([
    { title: "AWS Certified Developer - Associate", issuer: "Amazon Web Services", date: "2026-04-10" },
    { title: "MongoDB Professional Developer", issuer: "MongoDB Inc", date: "2025-11-20" }
  ]);

  // Modal forms
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', repoUrl: '', description: '', tags: '' });
  
  // GitHub Auditor states
  const [auditRepo, setAuditRepo] = useState('');
  const [auditOutput, setAuditOutput] = useState<any | null>(null);
  const [auditing, setAuditing] = useState(false);

  // Compute profile completeness strength percentage
  const profileStrength = React.useMemo(() => {
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
    setProjects(prev => [
      ...prev,
      {
        name: newProject.name,
        repoUrl: newProject.repoUrl,
        description: newProject.description,
        tags: newProject.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    ]);
    setIsProjectOpen(false);
    setNewProject({ name: '', repoUrl: '', description: '', tags: '' });
  };

  const handleAuditRepo = () => {
    if (!auditRepo) return;
    setAuditing(true);
    // Simulate GitHub AI Repository Audit
    setTimeout(() => {
      setAuditOutput({
        repoName: auditRepo.split('/').pop() || 'Repository',
        overallScore: 82,
        codeQuality: 8,
        testCoverage: 6,
        documentation: 9,
        reviewSummary: "The repository contains a clean directory layout, consistent file naming, and an informative readme file. However, there are no unit tests files configured (e.g. jest.config.js or test/ folder), and the package.json has outdated minor dependencies.",
        recommendations: [
          "Integrate unit testing configurations (e.g., install Jest/Vitest and write basic tests)",
          "Perform dependency updates using npm-check-updates",
          "Remove commented-out code blocks in src/index.ts to maintain clean commit history"
        ]
      });
      setAuditing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio & Links</h1>
        <p className="text-muted-foreground text-sm">Organize your technical projects, certificates, audit git code quality, and monitor profile strength.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Profile Strength & Links */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Strength */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-3xl font-extrabold tracking-tight">{profileStrength}%</span>
                <span className="text-xs text-muted-foreground font-semibold">Completeness Score</span>
              </div>
              <Progress value={profileStrength} indicatorClassName="gradient-primary" />
              
              <ul className="text-xs text-slate-500 space-y-1 pt-2 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className={`h-4 w-4 ${profileStrength >= 50 ? 'text-accent-success' : 'text-slate-300'}`} />
                  <span>LinkedIn and GitHub linked</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className={`h-4 w-4 ${projects.length > 0 ? 'text-accent-success' : 'text-slate-300'}`} />
                  <span>Technical projects added ({projects.length})</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className={`h-4 w-4 ${certificates.length > 0 ? 'text-accent-success' : 'text-slate-300'}`} />
                  <span>Certifications verified ({certificates.length})</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Social Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Social Links</CardTitle>
              <CardDescription>Link profiles to feed the RAG index.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col">
                <Label>LinkedIn Profile URL</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={profileUrlInput.linkedin}
                    onChange={e => setProfileUrlInput(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="pl-9 text-xs" 
                    placeholder="https://linkedin.com/in/username" 
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <Label>GitHub URL</Label>
                <div className="relative">
                  <FolderGit2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={profileUrlInput.github}
                    onChange={e => setProfileUrlInput(prev => ({ ...prev, github: e.target.value }))}
                    className="pl-9 text-xs" 
                    placeholder="https://github.com/username" 
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <Label>Portfolio Link</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={profileUrlInput.portfolio}
                    onChange={e => setProfileUrlInput(prev => ({ ...prev, portfolio: e.target.value }))}
                    className="pl-9 text-xs" 
                    placeholder="https://mywebsite.com" 
                  />
                </div>
              </div>

              <Button onClick={handleSaveLinks} className="w-full gradient-primary">
                Save Profiles
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Projects, Certifications, and Git Audit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Dashboard list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Technical Projects</CardTitle>
                <CardDescription>Showcase code layouts and API scopes.</CardDescription>
              </div>
              <Button onClick={() => setIsProjectOpen(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/30 space-y-2 dark:border-white/5">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-sm">{proj.name}</h4>
                    <a 
                      href={proj.repoUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Code Repository</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 font-medium">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tags.map((tg, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{tg}</span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Git Code Quality Auditor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                <Code2 className="h-5 w-5 text-primary" />
                <span>AI GitHub Project Reviewer</span>
              </CardTitle>
              <CardDescription>Parse package details, check structure, and get refactoring checks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={auditRepo}
                  onChange={e => setAuditRepo(e.target.value)}
                  placeholder="https://github.com/user/my-repo-name" 
                  className="flex-1 h-10 text-xs" 
                />
                <Button onClick={handleAuditRepo} className="gradient-primary h-10 shrink-0" loading={auditing}>
                  Audit Codebase
                </Button>
              </div>

              {auditOutput && (
                <div className="p-4 rounded-xl border border-border bg-primary/5 space-y-3 dark:border-white/5">
                  <div className="flex items-center justify-between border-b border-border pb-2 dark:border-white/5">
                    <span className="font-bold text-xs">Repository: <span className="text-primary">{auditOutput.repoName}</span></span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-primary/15 text-primary rounded">Score: {auditOutput.overallScore}/100</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold py-1">
                    <div className="p-2 bg-secondary rounded-lg">
                      <span>{auditOutput.codeQuality}/10</span>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Code Quality</p>
                    </div>
                    <div className="p-2 bg-secondary rounded-lg">
                      <span>{auditOutput.testCoverage}/10</span>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Test coverage</p>
                    </div>
                    <div className="p-2 bg-secondary rounded-lg">
                      <span>{auditOutput.documentation}/10</span>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Readme/Docs</p>
                    </div>
                  </div>

                  <div className="text-xs space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">{auditOutput.reviewSummary}</p>
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Refactoring checklist:</span>
                      <ul className="space-y-1">
                        {auditOutput.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-1 text-[11px] font-medium text-slate-500">
                            <span className="text-primary font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Project Dialog */}
      <Dialog isOpen={isProjectOpen} onClose={() => setIsProjectOpen(false)} title="Add Technical Project">
        <form onSubmit={handleAddProject} className="space-y-4">
          <div className="flex flex-col">
            <Label>Project Name *</Label>
            <Input required value={newProject.name} onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Payments Hub" />
          </div>

          <div className="flex flex-col">
            <Label>Repository URL</Label>
            <Input value={newProject.repoUrl} onChange={e => setNewProject(prev => ({ ...prev, repoUrl: e.target.value }))} placeholder="https://github.com/..." />
          </div>

          <div className="flex flex-col">
            <Label>Technologies (Comma separated)</Label>
            <Input value={newProject.tags} onChange={e => setNewProject(prev => ({ ...prev, tags: e.target.value }))} placeholder="TypeScript, Express, MongoDB" />
          </div>

          <div className="flex flex-col">
            <Label>Description</Label>
            <Textarea required value={newProject.description} onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))} placeholder="Explain system structures, performance indicators..." className="h-28" />
          </div>

          <Button type="submit" className="w-full gradient-primary">Verify and Save</Button>
        </form>
      </Dialog>
    </div>
  );
};
export default PortfolioManager;
