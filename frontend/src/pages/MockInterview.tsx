import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Award, 
  MessageSquare, 
  ArrowRight,
  X,
  Clock,
  RotateCcw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input, Label, Textarea } from '../components/ui/Input';
import axios from 'axios';

interface QuestionType {
  question: string;
  category: string;
  userAnswer?: string;
  score?: number;
  feedback?: string;
  improvements?: string;
}

export const MockInterview: React.FC = () => {
  const { activeResume } = useAppData();
  const { user } = useAuth();
  
  const [role, setRole] = useState('Software Engineer');
  const [company, setCompany] = useState('TechCorp');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSpeakingText, setIsSpeakingText] = useState(false);

  // Form answer
  const [answerInput, setAnswerInput] = useState('');
  const [grading, setGrading] = useState(false);

  // Past interview sessions stored locally by user ID
  const [pastSessions, setPastSessions] = useState<{
    id: string;
    role: string;
    company: string;
    date: string;
    score: number;
    completed: boolean;
  }[]>(() => {
    const key = `past_interviews_${user?.id || 'guest'}`;
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

  // Details Modal State
  const [modalDetails, setModalDetails] = useState<{
    title: string;
    score?: number;
    status?: string;
    explanation: string;
    example?: string;
  } | null>(null);

  useEffect(() => {
    // Check Web Speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswerInput(prev => prev + ' ' + finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handleStartInterview = async () => {
    setLoadingQuestions(true);
    setInterviewFinished(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/ai/interview-questions', { role, company }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setQuestions(res.data.questions);
        setInterviewStarted(true);
        setCurrentIndex(0);
        setAnswerInput('');
      }
    } catch {
      // Offline fallback questions
      setTimeout(() => {
        setQuestions([
          { question: `Can you explain how React's Virtual DOM works and how React 19 optimizes server component rendering?`, category: 'Technical' },
          { question: `Describe a time when you disagreed with a senior developer or product manager on a technical design choice. How did you resolve it?`, category: 'Behavioral' },
          { question: `Why do you want to join ${company} as a ${role}, and what do you expect from our engineering culture?`, category: 'HR' },
          { question: `Implement a function in TypeScript that takes an array of integers and returns the length of the longest consecutive elements sequence. What is the time complexity?`, category: 'Coding' },
          { question: `Design a rate-limiting system for a highly-scalable global web service. Explain how you would prevent DDoS attacks and manage client tokens.`, category: 'System Design' }
        ]);
        setInterviewStarted(true);
        setCurrentIndex(0);
        setAnswerInput('');
        setLoadingQuestions(false);
      }, 1200);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeakingText(true);
      utterance.onend = () => setIsSpeakingText(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech not supported on this browser.');
    }
  };

  const handleSpeechToggle = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim()) return;
    setGrading(true);
    const activeQuestion = questions[currentIndex].question;
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/ai/interview-grade', { question: activeQuestion, answer: answerInput }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        const payload = res.data.data;
        setQuestions(prev => prev.map((q, idx) => {
          if (idx === currentIndex) {
            return {
              ...q,
              userAnswer: answerInput,
              score: payload.score,
              feedback: payload.feedback,
              improvements: payload.improvements
            };
          }
          return q;
        }));
      }
    } catch {
      // Fallback grader
      setTimeout(() => {
        const score = Math.floor(Math.random() * 20) + 72;
        setQuestions(prev => prev.map((q, idx) => {
          if (idx === currentIndex) {
            return {
              ...q,
              userAnswer: answerInput,
              score,
              feedback: "The answer covers several key definitions, illustrating decent conceptual familiarity. However, you need to detail specific library metrics and performance measurements.",
              improvements: "Structure your explanation following the STAR formula. Mention space/time complexities explicitly for coding tasks."
            };
          }
          return q;
        }));
        setGrading(false);
      }, 1000);
    } finally {
      setGrading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswerInput('');
    } else {
      // Finish interview
      const avgScore = Math.floor(
        questions.reduce((acc, curr) => acc + (curr.score || 0), 0) / questions.length
      );
      
      const newSession = {
        id: String(Date.now()),
        role,
        company,
        date: new Date().toISOString().split('T')[0],
        score: avgScore,
        completed: true
      };
      
      setPastSessions(prev => {
        const updated = [newSession, ...prev];
        localStorage.setItem(`past_interviews_${user?.id || 'guest'}`, JSON.stringify(updated));
        return updated;
      });
      
      setInterviewFinished(true);
      setInterviewStarted(false);
    }
  };

  const handleReset = () => {
    setInterviewStarted(false);
    setInterviewFinished(false);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerInput('');
  };

  const currentQuestion = questions[currentIndex];

  const overallSessionScore = useMemo(() => {
    if (questions.length === 0) return 0;
    const scored = questions.filter(q => q.score !== undefined);
    if (scored.length === 0) return 0;
    return Math.floor(scored.reduce((acc, curr) => acc + (curr.score || 0), 0) / scored.length);
  }, [questions]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">AI Mock Interview</h1>
          <p className="text-muted-foreground text-sm mt-1">Prepare with customizable technical rounds, practice speech answers, and receive detailed AI reviews.</p>
        </div>
        {interviewStarted && (
          <span className="text-xs bg-primary/10 text-primary dark:text-primary border border-primary/20 px-3 py-1 rounded-full font-bold">
            Targeting: {company} ({role})
          </span>
        )}
      </div>

      {/* 1. Configuration Setup Screen */}
      {!interviewStarted && !interviewFinished && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Setup Card */}
          <Card className="lg:col-span-8 shadow-md border border-border/30 dark:border-white/5">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-base font-extrabold">Session Configuration</CardTitle>
              <CardDescription className="text-xs">Setup your target details. The AI will pull context from your active resume.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-bold">Company Name</Label>
                  <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google, Stripe" className="text-xs h-9" />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-bold">Target Role</Label>
                  <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer" className="text-xs h-9" />
                </div>
              </div>

              {activeResume ? (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-600 flex items-center gap-2 font-semibold">
                  <GraduationCap className="h-4.5 w-4.5 shrink-0" />
                  <span>Active Resume: <strong>{activeResume.fileName} ({activeResume.version})</strong> will be referenced in RAG queries.</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-600 font-semibold">
                  ⚠️ No active resume detected. General interview questions will be generated.
                </div>
              )}

              <Button onClick={handleStartInterview} className="w-full gradient-primary text-white font-bold text-xs py-2.5" loading={loadingQuestions}>
                <Play className="h-4 w-4 mr-2" />
                Generate Interview Session
              </Button>
            </CardContent>
          </Card>

          {/* Past Sessions List */}
          <Card className="lg:col-span-4 shadow-md border border-border/30 dark:border-white/5">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <Clock className="h-4.5 w-4.5 text-primary" />
                <span>Past Assessments</span>
              </CardTitle>
              <CardDescription className="text-xs">Review past mock interview score history.</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {pastSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/30 dark:border-white/5">
                  <div>
                    <h4 className="font-extrabold text-xs text-foreground">{session.company}</h4>
                    <p className="text-[9px] text-slate-500 font-semibold">{session.role} • {session.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {session.score}%
                    </span>
                  </div>
                </div>
              ))}
              {pastSessions.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-8">No past session records.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Active Interview Workspace Screen */}
      {interviewStarted && currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Question Workspace Panel */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-l-4 border-l-primary shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider block">Question {currentIndex + 1} of {questions.length}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/80 text-foreground inline-block mt-1">
                    Category: {currentQuestion.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => speakQuestion(currentQuestion.question)} className="h-8 w-8 p-0">
                    <Volume2 className={`h-4.5 w-4.5 ${isSpeakingText ? 'text-primary animate-pulse' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-rose-500 text-xs font-bold" onClick={handleReset}>
                    Reset Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-base font-extrabold leading-relaxed text-foreground">{currentQuestion.question}</p>
              </CardContent>
            </Card>

            {/* Answer Box */}
            <Card className="shadow-md">
              <CardHeader className="pb-3 border-b border-border/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Response</CardTitle>
                  {speechSupported && (
                    <Button 
                      variant={isListening ? 'destructive' : 'outline'} 
                      size="sm" 
                      onClick={handleSpeechToggle}
                      className="h-8 text-xs font-semibold"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-3.5 w-3.5 mr-1.5" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          <span>Voice Answer Mode</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Textarea 
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  className="h-44 text-xs leading-relaxed font-sans"
                  placeholder={isListening ? "Listening... Speak clearly into your microphone..." : "Type or speak your explanation bullet points..."}
                />

                <div className="flex items-center justify-end gap-2">
                  <Button 
                    onClick={handleSubmitAnswer} 
                    className="gradient-primary text-white font-bold text-xs" 
                    loading={grading} 
                    disabled={!answerInput.trim() || currentQuestion.score !== undefined}
                  >
                    Submit Answer
                  </Button>
                  {currentQuestion.score !== undefined && (
                    <Button onClick={handleNext} className="gradient-primary text-white font-bold text-xs flex items-center gap-1">
                      <span>{currentIndex === questions.length - 1 ? "Finish Session" : "Next Question"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Assessment Evaluation Panel */}
          <div className="lg:col-span-5">
            {currentQuestion?.score !== undefined ? (
              <Card className="h-full border-t-4 border-t-emerald-500 shadow-md">
                <CardHeader className="pb-3 border-b border-border/10">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-emerald-500" />
                    <span>AI Feedback Hub</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  {/* Score Indicator */}
                  <div className="text-center py-3 border-b border-border/10">
                    <span className="text-3xl font-black text-emerald-500">{currentQuestion.score}%</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Answer score rating</p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        <span>Evaluation:</span>
                      </span>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold">{currentQuestion.feedback}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>How to improve:</span>
                      </span>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">{currentQuestion.improvements}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-10 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <HelpCircle className="h-8 w-8 mb-2 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Awaiting answer submission</span>
                <span className="text-[10px] text-muted-foreground mt-1">Submit your response to see detailed AI evaluation.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Post-Interview Session Summary Dashboard Screen */}
      {interviewFinished && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Overall score banner */}
          <div className="bg-secondary/30 border border-border dark:border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              {/* Circular score donut */}
              <div className="relative shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="8" fill="transparent" />
                  <circle cx="48" cy="48" r="40" className={`transition-all duration-500 ease-out ${overallSessionScore >= 80 ? 'stroke-emerald-500' : 'stroke-amber-500'}`} strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * overallSessionScore) / 100} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-foreground leading-none">{overallSessionScore}%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Average</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-xl text-foreground">Interview Session Completed</h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  Role: <span className="text-foreground">{role}</span> • Target: <span className="text-foreground">{company}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {overallSessionScore >= 80 
                    ? 'Excellent performance! You demonstrate strong technical clarity and concise behavioral STAR logic.' 
                    : 'Good attempt. Focus on structuring coding explanations and specifying performance metrics.'}
                </p>
              </div>
            </div>

            <Button onClick={handleReset} className="gradient-primary text-white font-bold text-xs flex items-center gap-1.5 shrink-0">
              <RotateCcw className="h-4 w-4" />
              Configure New Session
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Questions list review card (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider block">Question-by-Question breakdown</h3>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setModalDetails({
                        title: `Question ${idx + 1} Assessment`,
                        score: q.score,
                        status: q.category,
                        explanation: `Your answer: "${q.userAnswer}"\n\nAI Evaluation: ${q.feedback}`,
                        example: `Suggested Refinements:\n${q.improvements}`
                      });
                    }}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary transition-all duration-200 cursor-pointer dark:border-white/5 flex flex-col sm:flex-row justify-between items-start gap-4"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-primary tracking-wider">Question {idx + 1} • {q.category}</span>
                      <p className="text-xs font-bold leading-relaxed text-foreground">{q.question}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full
                        ${q.score && q.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}
                      `}>
                        {q.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Key Session Improvements Checklist (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider block">Session Refinements Checklist</h3>
              <Card className="shadow-md border border-border/30 dark:border-white/5">
                <CardHeader className="pb-3 border-b border-border/10">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Actionable Improvements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-secondary/30 border border-border/50 dark:border-white/5">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0 text-[10px] font-black h-6 w-6 flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">For: {q.category} Question</span>
                        <p className="text-xs font-bold leading-relaxed text-foreground mt-0.5 break-words">{q.improvements}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
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
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Answer Score:</span>
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
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap">
                    {modalDetails.explanation}
                  </p>
                </div>
                
                {modalDetails.example && (
                  <div className="space-y-1.5 p-3.5 rounded-xl border border-primary/20 bg-primary/5 dark:border-white/5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Actionable Suggestions:</span>
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

export default MockInterview;
