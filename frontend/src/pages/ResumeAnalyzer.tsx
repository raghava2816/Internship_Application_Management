import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Briefcase, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  FilePlus2, 
  Layers, 
  ArrowRight,
  ClipboardCheck,
  Send,
  Linkedin,
  FileCheck
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { useAppData } from '../context/AppDataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Input, Label, Select, Textarea } from '../components/ui/Input';
import { CircularProgress, Progress } from '../components/ui/Progress';
import axios from 'axios';

export const ResumeAnalyzer: React.FC = () => {
  const { 
    resumes, 
    activeResume, 
    uploadResume, 
    setActiveResume, 
    deleteResume, 
    toggleImprovementCheck,
    loading 
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'audit' | 'versions' | 'rewriter' | 'cover_letter' | 'linkedin'>('audit');
  
  // File Uploader and copy-paste states
  const [file, setFile] = useState<File | null>(null);
  const [targetJD, setTargetJD] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Checklist filtration states
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [checklistStatusFilter, setChecklistStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Rewriter states
  const [rewriteSection, setRewriteSection] = useState('Experience');
  const [rewriteStyle, setRewriteStyle] = useState('STAR');
  const [rewriteText, setRewriteText] = useState('');
  const [rewrittenOutput, setRewrittenOutput] = useState('');
  const [rewriting, setRewriting] = useState(false);

  // Cover Letter states
  const [clCompany, setClCompany] = useState('');
  const [clRole, setClRole] = useState('');
  const [clDescription, setClDescription] = useState('');
  const [clOutput, setClOutput] = useState('');
  const [generatingCL, setGeneratingCL] = useState(false);

  // LinkedIn states
  const [liType, setLiType] = useState('connection');
  const [liCompany, setLiCompany] = useState('');
  const [liRole, setLiRole] = useState('');
  const [liRecruiter, setLiRecruiter] = useState('');
  const [liOutput, setLiOutput] = useState('');
  const [generatingLI, setGeneratingLI] = useState(false);

  // Formatted data for Radar Chart
  const radarData = useMemo(() => {
    if (!activeResume?.atsReport) return [];
    const report = activeResume.atsReport;
    return [
      { subject: 'Keywords', value: report.keywordScore },
      { subject: 'Formatting', value: report.formattingScore },
      { subject: 'Grammar', value: report.grammarScore },
      { subject: 'Experience', value: report.experienceScore },
      { subject: 'Projects', value: report.projectsScore },
      { subject: 'Skills', value: report.skillsScore },
      { subject: 'Impact', value: report.impactScore }
    ];
  }, [activeResume]);

  const filteredImprovements = useMemo(() => {
    if (!activeResume?.atsReport?.improvements) return [];
    return activeResume.atsReport.improvements.filter(item => {
      const matchPriority = checklistFilter === 'all' || item.priority === checklistFilter;
      const matchStatus = checklistStatusFilter === 'all' ||
        (checklistStatusFilter === 'pending' && !item.done) ||
        (checklistStatusFilter === 'completed' && item.done);
      return matchPriority && matchStatus;
    });
  }, [activeResume, checklistFilter, checklistStatusFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'docx' || ext === 'txt') {
        setFile(droppedFile);
      } else {
        alert('Unsupported file type. Please upload PDF, DOCX, or TXT.');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (uploadMode === 'paste') {
        if (!pastedText.trim()) {
          setUploading(false);
          return;
        }
        await uploadResume('Pasted_Resume.txt', pastedText, targetJD);
        setPastedText('');
      } else {
        if (!file) {
          setUploading(false);
          return;
        }
        
        let textContent = '';
        if (file.name.endsWith('.txt')) {
          textContent = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve(event.target?.result as string || '');
            };
            reader.readAsText(file);
          });
        } else {
          // Simulate reading text from pdf/docx for portfolio demo using file name keywords
          const lowerName = file.name.toLowerCase();
          if (lowerName.includes('product') || lowerName.includes('pm')) {
            textContent = `NAME: Applicant Profile (PM)\nSkills: Agile Project Management, Product Roadmaps, Stakeholder Alignment, User Research, JIRA, SQL\nExperience: Associate Product Manager. Led scrum ceremonies, defined user stories for payment flow enhancements.\nTarget: ${targetJD}`;
          } else if (lowerName.includes('design') || lowerName.includes('ux') || lowerName.includes('ui')) {
            textContent = `NAME: Applicant Profile (Designer)\nSkills: Figma, UI/UX Design, Wireframing, Prototyping, Component Systems, Responsive Layouts\nExperience: UI Designer Intern. Built Figma component kits, conducted A/B testing on onboarding flows.\nTarget: ${targetJD}`;
          } else {
            textContent = `NAME: Applicant Profile (Developer)\nSkills: React, TypeScript, Node.js, Express, MongoDB, Git, HTML, CSS\nExperience: Software Engineer Intern. Built frontend interfaces in React and state-management context patterns. Maintained Express API endpoints.\nTarget: ${targetJD}`;
          }
        }

        await uploadResume(file.name, textContent, targetJD, file);
        setFile(null);
      }
      setTargetJD('');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleRewrite = async () => {
    if (!rewriteText) return;
    setRewriting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/ai/rewrite-resume', {
        section: rewriteSection,
        text: rewriteText,
        style: rewriteStyle
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setRewrittenOutput(res.data.data.rewrittenText);
      }
    } catch {
      // Fallback response builder
      setTimeout(() => {
        setRewrittenOutput(`[Enhanced Bullet using ${rewriteStyle} Formula]:\n• Engineered and structured a fully modular state management system using React 19 and custom Tailwind, accelerating web load speeds by 38% and optimizing bundle delivery dimensions.\n• Refined Mongoose database structures to support composite index routing, decreasing API latency by 24% and avoiding thread locks.`);
        setRewriting(false);
      }, 1000);
    } finally {
      setRewriting(false);
    }
  };

  const handleGenerateCL = async () => {
    if (!clCompany || !clRole) return;
    setGeneratingCL(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/ai/cover-letter', {
        resumeId: activeResume?._id,
        company: clCompany,
        role: clRole,
        description: clDescription
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setClOutput(res.data.coverLetter);
      }
    } catch {
      setTimeout(() => {
        setClOutput(`Dear Hiring Manager at ${clCompany},\n\nI am writing to express my eager interest in the ${clRole} opening at your company. Having developed multiple responsive React client dashboards and integrated complex Node.js API endpoints, my technical background fits neatly into your team's development priorities.\n\nAt my past internships, I led bundle size optimization efforts, reducing load times by 30%. I look forward to bringing this commitment to product speed and modular layouts to ${clCompany}.\n\nSincerely,\n[Your Name]`);
        setGeneratingCL(false);
      }, 1200);
    } finally {
      setGeneratingCL(false);
    }
  };

  const handleGenerateLI = async () => {
    if (!liCompany) return;
    setGeneratingLI(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/ai/linkedin-templates', {
        type: liType,
        company: liCompany,
        role: liRole,
        recruiter: liRecruiter
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setLiOutput(res.data.message);
      }
    } catch {
      setTimeout(() => {
        let txt = '';
        if (liType === 'connection') {
          txt = `Hi ${liRecruiter || 'Recruiter'}, I noticed you coordinate engineering hires at ${liCompany}. I specialized in MERN stack development and wanted to connect to track your technical highlights!`;
        } else if (liType === 'referral') {
          txt = `Hi [Contact], I noticed you work at ${liCompany} as a software developer. I'm preparing to apply for the ${liRole || 'Engineering Intern'} opening and was wondering what you enjoy most about the culture? I'd appreciate it if you'd be open to sharing my resume. Thanks!`;
        } else {
          txt = `Hi ${liRecruiter || 'Hiring Manager'},\n\nI recently applied for the ${liRole || 'developer'} role at ${liCompany}. With 2 years of React/TypeScript experience, I would love to discuss how I can contribute to your core dashboard releases. I have attached my portfolio details for reference.\n\nBest,\n[Your Name]`;
        }
        setLiOutput(txt);
        setGeneratingLI(false);
      }, 1000);
    } finally {
      setGeneratingLI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Resume Hub</h1>
        <p className="text-muted-foreground text-sm">Upload resumes, review ATS parsing compliance, perform STAR rewrites, and prepare custom cover letters.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border dark:border-white/5 gap-6">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'audit' ? 'border-primary text-foreground font-bold' : 'border-transparent text-slate-400 hover:text-foreground'}`}
        >
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            <span>ATS Report</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'versions' ? 'border-primary text-foreground font-bold' : 'border-transparent text-slate-400 hover:text-foreground'}`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>Version Control</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('rewriter')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'rewriter' ? 'border-primary text-foreground font-bold' : 'border-transparent text-slate-400 hover:text-foreground'}`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>STAR Rewriter</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('cover_letter')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'cover_letter' ? 'border-primary text-foreground font-bold' : 'border-transparent text-slate-400 hover:text-foreground'}`}
        >
          <div className="flex items-center gap-1.5">
            <FileCheck className="h-4 w-4" />
            <span>Cover Letter</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('linkedin')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'linkedin' ? 'border-primary text-foreground font-bold' : 'border-transparent text-slate-400 hover:text-foreground'}`}
        >
          <div className="flex items-center gap-1.5">
            <Linkedin className="h-4 w-4" />
            <span>LinkedIn Assist</span>
          </div>
        </button>
      </div>

      {/* Audit tab */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: score radial & upload section */}
          <div className="space-y-6 lg:col-span-1">
            {/* ATS Score Card */}
            {activeResume?.atsReport ? (
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Overall Compatibility</CardTitle>
                  <CardDescription>Computed ATS and Grammar score.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                  <CircularProgress value={activeResume.atsReport.score} />
                  <div>
                    <h4 className="font-bold text-sm">{activeResume.fileName}</h4>
                    <span className="text-xs text-primary font-semibold">Active Version: {activeResume.version}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6 text-center border-dashed border-2 border-border flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No resumes uploaded. Seed the application by uploading a file below.</p>
              </Card>
            )}

            {/* Uploader Box */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Uploader & ATS Analysis</CardTitle>
                <CardDescription>Select upload mode to feed the resume parser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-secondary/50 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all ${uploadMode === 'file' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('paste')}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-all ${uploadMode === 'paste' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Copy & Paste Text
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  {uploadMode === 'file' ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('resume-file')?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                        ${isDragging ? 'border-primary bg-primary/5 scale-[0.98]' : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 dark:border-white/5'}
                      `}
                    >
                      <Upload className={`h-8 w-8 mb-2 transition-transform duration-200 ${isDragging ? 'text-primary scale-110' : 'text-slate-400'}`} />
                      <input
                        type="file"
                        id="resume-file"
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                      />
                      <span className="text-xs font-bold text-foreground">
                        {file ? file.name : "Drag & drop your resume file here"}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        or <span className="text-primary underline font-medium">browse local files</span>
                      </span>
                      <span className="text-[9px] text-slate-500 mt-2">
                        Accepts PDF, DOCX, TXT (Max 5MB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="paste-resume-text">Paste Raw Resume Text</Label>
                      <Textarea
                        id="paste-resume-text"
                        value={pastedText}
                        onChange={e => setPastedText(e.target.value)}
                        placeholder="Paste your skills, experience summaries, and project descriptions..."
                        className="h-32 text-xs font-sans"
                      />
                    </div>
                  )}

                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="target-jd">Target Job Description (Optional)</Label>
                    <Textarea
                      id="target-jd"
                      value={targetJD}
                      onChange={e => setTargetJD(e.target.value)}
                      placeholder="Paste target job requirements to compute exact compatibility matches..."
                      className="h-20 text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary font-bold text-xs"
                    loading={uploading}
                    disabled={uploadMode === 'file' ? !file : !pastedText.trim()}
                  >
                    Submit to AI Parser
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right/Mid panel: Radar metrics & reports */}
          <div className="lg:col-span-2 space-y-6">
            {activeResume?.atsReport ? (
              <>
                {/* Radar map & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Radar */}
                  <Card className="flex flex-col items-center justify-center p-4">
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground self-start mb-2">Metrics Radar</span>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#475569" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                          <Radar name="Applicant" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Summary evaluation */}
                  <Card className="flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">AI Evaluation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs leading-relaxed font-medium">{activeResume.atsReport.summary}</p>
                      
                      <div className="space-y-2 border-t border-border pt-4 dark:border-white/5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Recruiter Review:</span>
                        <p className="text-xs italic text-slate-500">{activeResume.atsReport.recruiterPerspective}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">ATS compliance:</span>
                        <p className="text-xs text-slate-500">{activeResume.atsReport.atsCompatibility}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Checklist, Missing Keywords, Strengths/Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths & Weaknesses */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <CheckCircle className="h-4.5 w-4.5 text-accent-success" />
                          <span>Candidate Strengths</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {activeResume.atsReport.strengths.map((str, idx) => (
                            <li key={idx} className="text-xs flex items-start gap-2 font-semibold">
                              <span className="text-accent-success font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <AlertTriangle className="h-4.5 w-4.5 text-accent-danger" />
                          <span>Weaknesses & Red Flags</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {activeResume.atsReport.weaknesses.map((wk, idx) => (
                            <li key={idx} className="text-xs flex items-start gap-2 font-medium">
                              <span className="text-accent-danger font-bold">•</span>
                              <span>{wk}</span>
                            </li>
                          ))}
                        </ul>

                        {activeResume.atsReport.redFlags.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 space-y-1">
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Red flags detected:</span>
                            <ul className="space-y-1">
                              {activeResume.atsReport.redFlags.map((rf, idx) => (
                                <li key={idx} className="text-xs text-red-400 font-semibold">{rf}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions Checklists & Missing Keywords */}
                  <div className="space-y-6">
                    {/* Action checklists */}
                    <Card className="shadow-lg border border-border/40 dark:border-white/5">
                      <CardHeader className="pb-3 border-b border-border/20 dark:border-white/5 mb-3">
                        <div className="flex flex-col gap-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                            <ClipboardCheck className="h-4.5 w-4.5 text-primary" />
                            <span>ATS Optimization Checklist</span>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <select
                              value={checklistFilter}
                              onChange={e => setChecklistFilter(e.target.value as any)}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="all">All Priorities</option>
                              <option value="High">High Priority</option>
                              <option value="Medium">Medium Priority</option>
                              <option value="Low">Low Priority</option>
                            </select>
                            <select
                              value={checklistStatusFilter}
                              onChange={e => setChecklistStatusFilter(e.target.value as any)}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="all">All Status</option>
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1">
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {filteredImprovements.length > 0 ? (
                            filteredImprovements.map((item, idx) => (
                              <div 
                                key={idx} 
                                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer
                                  ${item.done ? 'bg-secondary/10 border-border/20 hover:bg-secondary/20' : 'bg-secondary/30 border-border/40 hover:bg-secondary/40'}
                                  dark:border-white/5
                                `}
                                onClick={() => toggleImprovementCheck(activeResume._id, item.action)}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={item.done}
                                  onChange={() => {}} // Handled by outer container click
                                  className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold leading-relaxed break-words ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {item.action}
                                  </p>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1.5 inline-block
                                    ${item.priority === 'High' ? 'bg-red-500/10 text-red-500' : item.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}
                                  `}>
                                    {item.priority} priority
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-xs text-muted-foreground">
                              No items match the active filters.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Missing Keywords */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <TrendingUp className="h-4.5 w-4.5 text-primary" />
                          <span>Missing Skills Keywords</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {activeResume.atsReport.missingKeywords.map((kw, idx) => (
                            <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border dark:border-white/5 font-semibold">
                              + {kw}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                Please upload or select a resume version first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Versions control Tab */}
      {activeTab === 'versions' && (
        <Card>
          <CardHeader>
            <CardTitle>Resume Versions Logs</CardTitle>
            <CardDescription>Compare scores, verify parsing files, and update active document indicators.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumes.map(res => (
                <div 
                  key={res._id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border transition-all duration-200
                    ${res.isActive ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card-light dark:bg-card-dark hover:border-slate-400 dark:border-white/5'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-secondary rounded-xl text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <span>{res.fileName}</span>
                        <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-bold">
                          {res.version}
                        </span>
                      </h4>
                      <p className="text-xs text-muted-foreground">Uploaded: {new Date(res.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">ATS Score</span>
                      <span className="font-bold text-lg text-primary">{res.atsReport?.score || 0}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!res.isActive && (
                        <Button variant="outline" size="sm" onClick={() => setActiveResume(res._id)}>
                          Make Active
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if(confirm('Delete this version?')) deleteResume(res._id); }}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {resumes.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-8">No uploaded resumes yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STAR Rewriter Tab */}
      {activeTab === 'rewriter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>STAR Bullet Enhancer</CardTitle>
              <CardDescription>Describe your experience and choose a strategy to generate impact metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label>Resume Section</Label>
                  <Select 
                    value={rewriteSection}
                    onChange={e => setRewriteSection(e.target.value)}
                    options={[
                      { value: 'Experience', label: 'Work Experience' },
                      { value: 'Projects', label: 'Projects' },
                      { value: 'Achievements', label: 'Achievements & Leadership' }
                    ]}
                  />
                </div>
                <div className="flex flex-col">
                  <Label>Enhancement Style</Label>
                  <Select 
                    value={rewriteStyle}
                    onChange={e => setRewriteStyle(e.target.value)}
                    options={[
                      { value: 'STAR', label: 'STAR Method (Metrics + Actions)' },
                      { value: 'XYZ', label: 'Google XYZ Formula' },
                      { value: 'ActionVerbs', label: 'Action Verbs Intensive' }
                    ]}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <Label>Original Experience Description</Label>
                <Textarea 
                  value={rewriteText}
                  onChange={e => setRewriteText(e.target.value)}
                  placeholder="e.g. I worked on checkout screens and made the backend faster using database queries."
                  className="h-44"
                />
              </div>

              <Button onClick={handleRewrite} className="w-full gradient-primary" loading={rewriting} disabled={!rewriteText}>
                Enhance Experience text
              </Button>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Optimized Results</span>
              </CardTitle>
              <CardDescription>Drop these items directly into your resume document.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="h-64 p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto text-xs leading-relaxed font-semibold dark:border-white/5">
                {rewrittenOutput ? (
                  <p className="whitespace-pre-wrap">{rewrittenOutput}</p>
                ) : (
                  <p className="text-muted-foreground italic text-center pt-20">Click enhance to build optimized bullet points.</p>
                )}
              </div>

              {rewrittenOutput && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 self-end"
                  onClick={() => { navigator.clipboard.writeText(rewrittenOutput); alert('Copied!'); }}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Copy Output
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cover Letter Tab */}
      {activeTab === 'cover_letter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>AI Cover Letter Generator</CardTitle>
              <CardDescription>Provide target company metrics to design personalized, ATS-optimized cover letters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label>Company Name *</Label>
                  <Input value={clCompany} onChange={e => setClCompany(e.target.value)} placeholder="e.g. Stripe" />
                </div>
                <div className="flex flex-col">
                  <Label>Target Role *</Label>
                  <Input value={clRole} onChange={e => setClRole(e.target.value)} placeholder="e.g. Solutions Engineer" />
                </div>
              </div>

              <div className="flex flex-col">
                <Label>Job details (Paste descriptions)</Label>
                <Textarea 
                  value={clDescription}
                  onChange={e => setClDescription(e.target.value)}
                  placeholder="Paste details to match descriptions semantics..."
                  className="h-44"
                />
              </div>

              <Button onClick={handleGenerateCL} className="w-full gradient-primary" loading={generatingCL} disabled={!clCompany || !clRole}>
                Generate Cover Letter
              </Button>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Personalized Draft</CardTitle>
              <CardDescription>Fully editable cover letter layout.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <Textarea 
                value={clOutput}
                onChange={e => setClOutput(e.target.value)}
                className="h-72 text-xs leading-relaxed"
                placeholder="Cover letter draft will appear here..."
              />

              {clOutput && (
                <div className="flex items-center gap-2 mt-4 self-end">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(clOutput); alert('Copied!'); }}>
                    Copy Text
                  </Button>
                  <Button variant="outline" size="sm" className="gradient-primary text-white border-0" onClick={() => window.print()}>
                    Print / Export PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* LinkedIn assist tab */}
      {activeTab === 'linkedin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Outreach Templates</CardTitle>
              <CardDescription>Select messaging categories and get personalized recruiter letters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col">
                <Label>Outreach Category</Label>
                <Select 
                  value={liType}
                  onChange={e => setLiType(e.target.value)}
                  options={[
                    { value: 'connection', label: 'Connection Invite Request (Under 300 chars)' },
                    { value: 'cold_message', label: 'Cold Reach Recruiter Message' },
                    { value: 'referral', label: 'Referral Request Letter' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label>Company Name *</Label>
                  <Input value={liCompany} onChange={e => setLiCompany(e.target.value)} placeholder="e.g. Google" />
                </div>
                <div className="flex flex-col">
                  <Label>Role Name</Label>
                  <Input value={liRole} onChange={e => setLiRole(e.target.value)} placeholder="e.g. SDE Intern" />
                </div>
              </div>

              <div className="flex flex-col">
                <Label>Recruiter / Contact Name (Optional)</Label>
                <Input value={liRecruiter} onChange={e => setLiRecruiter(e.target.value)} placeholder="e.g. David Miller" />
              </div>

              <Button onClick={handleGenerateLI} className="w-full gradient-primary" loading={generatingLI} disabled={!liCompany}>
                Build message Layout
              </Button>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                <Linkedin className="h-5 w-5 text-primary" />
                <span>Message Layout</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <Textarea 
                value={liOutput}
                onChange={e => setLiOutput(e.target.value)}
                className="h-64 text-xs leading-relaxed"
                placeholder="LinkedIn template message will appear here..."
              />

              {liOutput && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 self-end"
                  onClick={() => { navigator.clipboard.writeText(liOutput); alert('Copied!'); }}
                >
                  Copy Message
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default ResumeAnalyzer;
