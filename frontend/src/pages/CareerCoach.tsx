import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Briefcase, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  ChevronRight,
  User,
  Compass,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import axios from 'axios';

interface Message {
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const CareerCoach: React.FC = () => {
  const { activeResume } = useAppData();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      content: "Hello! I'm your AI Career Coach. I can help you prepare for technical rounds, write custom resume sections, estimate salaries, or review job descriptions. How can I help you navigate your search today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [coachTab, setCoachTab] = useState<'chat' | 'jobs' | 'negotiate'>('chat');
  const [chatId, setChatId] = useState<string | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRecommendations = async () => {
    setLoadingJobs(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/ai/job-recommendations', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setRecommendations(res.data.data);
      }
    } catch {
      // Mock recommendations fallback
      setTimeout(() => {
        setRecommendations([
          {
            company: "Stripe",
            role: "Frontend Engineer (Dashboard)",
            location: "San Francisco, CA (Hybrid)",
            matchPercentage: 92,
            salary: "$140,000 - $185,000",
            skillsMatched: ["React", "TypeScript", "TailwindCSS"],
            description: "Build premium developer dashboards, API logs, and scalable UI elements."
          },
          {
            company: "Linear",
            role: "Full Stack Engineer",
            location: "Remote (Global)",
            matchPercentage: 87,
            salary: "$120,000 - $160,000",
            skillsMatched: ["Node.js", "TypeScript", "React", "MongoDB"],
            description: "Contribute to building fast, keyboard-shortcut-driven project management clients."
          },
          {
            company: "Vercel",
            role: "Solutions Architect",
            location: "New York, NY (Hybrid)",
            matchPercentage: 81,
            salary: "$150,000 - $200,000",
            skillsMatched: ["React", "Next.js", "Vite"],
            description: "Interface with enterprise engineering partners to deploy and optimize client bundles."
          }
        ]);
        setLoadingJobs(false);
      }, 1000);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (coachTab === 'jobs' && recommendations.length === 0) {
      loadRecommendations();
    }
  }, [coachTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setInputText('');
    const userMsg: Message = {
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        messages: [...messages, userMsg].map(m => ({ sender: m.sender, content: m.content })),
        chatId
      };
      
      const res = await axios.post('/api/ai/coach-chat', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.success) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          content: res.data.responseText,
          timestamp: new Date().toISOString()
        }]);
        if (res.data.data?._id) {
          setChatId(res.data.data._id);
        }
      }
    } catch {
      // Offline chatbot fallback logic
      setTimeout(() => {
        const lowerText = text.toLowerCase();
        let response = "I'm analyze your target guidelines. Could you please specify which tech stack fits best?";
        
        if (lowerText.includes('salary') || lowerText.includes('negotiat')) {
          response = "When negotiating salary options, always wait for the company range first. Request an additional 10-15% margin based on local market reports, pointing to specific technical projects and speed contributions you made in previous roles.";
        } else if (lowerText.includes('resume') || lowerText.includes('ats')) {
          response = "To optimize your ATS checks, ensure sections are structured in single-column PDF text. Eliminate graph meters, graphic sliders, and raw images. Highlight keywords like TypeScript, React 19, and Node.js explicitly.";
        } else if (lowerText.includes('interview') || lowerText.includes('prep')) {
          response = "Focus your technical interview study on system designs (rate limiters, DB scaling), core coding structures (DFS, sliding window), and standard STAR behavioral scenario templates.";
        }

        setMessages(prev => [...prev, {
          sender: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        }]);
        setChatLoading(false);
      }, 1000);
    } finally {
      setChatLoading(false);
    }
  };

  const templates = [
    { label: 'Salary Negotiation strategies', query: 'Show me salary negotiation rules and templates.' },
    { label: 'ATS Resume check list rules', query: 'What are the main rules to format resumes for ATS compliance?' },
    { label: 'System Design study roadmap', query: 'Suggest a learning roadmap for scale-out system design rounds.' }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Career Coach</h1>
          <p className="text-muted-foreground text-sm">Consult templates, check matching semantic jobs, and build salary negotiation scripts.</p>
        </div>

        {/* Coach Tabs switch */}
        <div className="inline-flex rounded-lg bg-secondary p-1 text-muted-foreground self-start sm:self-center">
          <button 
            onClick={() => setCoachTab('chat')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${coachTab === 'chat' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat Advisor</span>
          </button>
          <button 
            onClick={() => setCoachTab('jobs')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${coachTab === 'jobs' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Semantic Match Jobs</span>
          </button>
          <button 
            onClick={() => setCoachTab('negotiate')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold ${coachTab === 'negotiate' ? 'bg-card-light dark:bg-card-dark text-foreground shadow-sm' : ''}`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Negotiation Hub</span>
          </button>
        </div>
      </div>

      {coachTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Panel */}
          <Card className="lg:col-span-3 flex flex-col h-[65vh] overflow-hidden">
            <CardHeader className="border-b border-border pb-3 dark:border-white/5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold">Interactive Advisor Session</CardTitle>
              </div>
            </CardHeader>
            
            {/* Messages body */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex gap-3 max-w-[80%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                    ${m.sender === 'user' ? 'gradient-primary text-white' : 'bg-secondary text-primary'}
                  `}>
                    {m.sender === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm border border-border/40 dark:border-white/5
                    ${m.sender === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-card-light dark:bg-card-dark rounded-tl-none'}
                  `}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="h-8 w-8 rounded-full bg-secondary text-primary flex items-center justify-center text-xs font-bold animate-pulse">AI</div>
                  <div className="p-3 bg-secondary rounded-2xl rounded-tl-none text-xs text-muted-foreground animate-pulse font-semibold">
                    Typing feedback summary...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Bar */}
            <div className="p-4 border-t border-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex gap-2">
                <Input 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                  placeholder="Ask the advisor about STAR bullets, salary estimations, interview rounds..."
                  className="flex-1 h-10 text-xs"
                />
                <Button onClick={() => handleSendMessage()} className="gradient-primary h-10 w-10 p-0 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* RAG Context & Templates Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* RAG settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">RAG Search Index</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {activeResume ? (
                  <div className="space-y-2">
                    <p>Current Index Vector source:</p>
                    <div className="p-2.5 rounded-lg border border-border bg-secondary/30 dark:border-white/5">
                      <p className="font-bold truncate">{activeResume.fileName}</p>
                      <span className="text-[10px] text-primary font-bold">Version: {activeResume.version}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No resume loaded. Connect resume to activate contextual analysis.</p>
                )}
              </CardContent>
            </Card>

            {/* Prompt templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Click-to-Ask Prompts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(tpl.query)}
                    className="w-full text-left p-2.5 rounded-lg border border-border bg-card-light dark:bg-card-dark text-[10px] font-bold hover:border-primary dark:border-white/5 transition-all text-slate-600 dark:text-slate-300 flex items-center justify-between"
                  >
                    <span>{tpl.label}</span>
                    <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {coachTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((job, idx) => (
            <Card key={idx} className="border-t-4 border-t-primary hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">{job.company}</h3>
                    <p className="text-xs text-muted-foreground font-semibold">{job.role}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold">
                    {job.matchPercentage}% Match
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{job.salary}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-medium">{job.description}</p>

                <div className="border-t border-border dark:border-white/5 pt-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Matched Skills keywords:</span>
                  <div className="flex flex-wrap gap-1">
                    {job.skillsMatched.map((sk: string, i: number) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{sk}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {loadingJobs && (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
              Loading matching roles via semantic vector db index...
            </div>
          )}
        </div>
      )}

      {coachTab === 'negotiate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Salary Estimator & Script Builders</CardTitle>
              <CardDescription>Determine typical compensation variables for your target parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold">
              <div className="space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="font-bold text-sm text-primary">Industry Benchmark Estimates:</h4>
                <div className="grid grid-cols-2 gap-2 text-center py-2">
                  <div className="p-2 rounded bg-secondary">
                    <span className="font-bold block text-sm">$85,000 - $115,000</span>
                    <p className="text-[9px] text-muted-foreground">Entry-level Full Stack</p>
                  </div>
                  <div className="p-2 rounded bg-secondary">
                    <span className="font-bold block text-sm">$135,000 - $175,000</span>
                    <p className="text-[9px] text-muted-foreground">Senior Tech Specialist</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4 dark:border-white/5">
                <span className="text-xs font-bold block mb-1 text-slate-500">Email Offer Negotiation Script:</span>
                <p className="p-3 bg-secondary/50 border border-border rounded-lg leading-relaxed text-slate-600 dark:text-slate-300 font-semibold">
                  "Dear [Hiring Lead],\n\nThank you so much for extending the offer for the [Role] at [Company]. I am incredibly excited about the prospect of joining the team and contributing to the development of your platforms.\n\nBefore signing, I wanted to discuss the base salary bounds. Given my experience deploying typescript architectures and matching database performance indexes, I was hoping we could adjust the starting compensation to [Requested Range]. I look forward to your thoughts!"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Negotiation Assistant</CardTitle>
              <CardDescription>Simulate salary talks or obtain immediate counters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Enter the details of your offer and let the AI generate customized argument points based on your active resume credentials.
              </p>
              <Button onClick={() => { setCoachTab('chat'); handleSendMessage('Help me negotiate a software engineering internship offer details.'); }} className="w-full gradient-primary">
                Open Negotiation Chat Advisor
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default CareerCoach;
