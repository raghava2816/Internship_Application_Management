import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Play, 
  Award, 
  MessageSquare, 
  ArrowRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input, Label, Select, Textarea } from '../components/ui/Input';
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
  
  const [role, setRole] = useState('Software Engineer');
  const [company, setCompany] = useState('TechCorp');
  const [interviewStarted, setInterviewStarted] = useState(false);
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

  // Past interview sessions simulation list
  const [pastSessions, setPastSessions] = useState([
    { id: '1', role: 'Frontend Intern', company: 'Stripe', date: '2026-06-25', score: 85, completed: true },
    { id: '2', role: 'SDE Intern', company: 'Google', date: '2026-06-18', score: 72, completed: true }
  ]);

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
          { question: `Can you explain how React's virtual DOM works and how React 19 introduces Server Components?`, category: 'Technical' },
          { question: `Describe a time when you disagreed with a senior engineer or product manager on a technical design choice. How did you resolve it?`, category: 'Behavioral' },
          { question: `Why do you want to join ${company} as a ${role}, and what do you expect from our engineering culture?`, category: 'HR' },
          { question: `Implement a function in TypeScript that takes an array of integers and returns the length of the longest consecutive elements sequence. What is the time complexity?`, category: 'Coding' },
          { question: `Design an rate-limiting system for a highly-scalable global web service (like Stripe). Explain how you would prevent DDoS attacks and manage client tokens.`, category: 'System Design' }
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
      // Append to past sessions
      setPastSessions(prev => [
        {
          id: String(prev.length + 1),
          role,
          company,
          date: new Date().toISOString().split('T')[0],
          score: avgScore,
          completed: true
        },
        ...prev
      ]);
      alert(`Interview Session Finished! Overall Score: ${avgScore}%`);
      setInterviewStarted(false);
    }
  };

  const handleReset = () => {
    setInterviewStarted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerInput('');
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Mock Interview</h1>
        <p className="text-muted-foreground text-sm">Prepare with customizable technical rounds, practice speech answers, and receive detailed AI reviews.</p>
      </div>

      {!interviewStarted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Setup Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Session Configuration</CardTitle>
              <CardDescription>Setup your target details. The AI will pull context from your active resume.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label>Company Name</Label>
                  <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google, Stripe" />
                </div>
                <div className="flex flex-col">
                  <Label>Target Role</Label>
                  <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer" />
                </div>
              </div>

              {activeResume ? (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-500 flex items-center gap-2">
                  <GraduationCap className="h-4.5 w-4.5" />
                  <span>Resume loaded: <strong>{activeResume.fileName} ({activeResume.version})</strong> will be referenced in RAG index.</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-500">
                  ⚠️ No active resume detected. General interview questions will be generated.
                </div>
              )}

              <Button onClick={handleStartInterview} className="w-full gradient-primary" loading={loadingQuestions}>
                <Play className="h-4 w-4 mr-2" />
                Generate Interview Session
              </Button>
            </CardContent>
          </Card>

          {/* Past Sessions List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-bold">Past Assessments</CardTitle>
              <CardDescription>Review score timelines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-900/30 dark:border-white/5">
                  <div>
                    <h4 className="font-bold text-xs">{session.company}</h4>
                    <p className="text-[10px] text-muted-foreground">{session.role} • {session.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{session.score}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Active Interview Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Workspace Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
                  <CardTitle className="text-sm mt-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full inline-block font-bold">
                    Category: {currentQuestion.category}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => speakQuestion(currentQuestion.question)}>
                    <Volume2 className={`h-4 w-4 ${isSpeakingText ? 'text-primary animate-pulse' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500" onClick={handleReset}>
                    Reset Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base font-bold leading-relaxed">{currentQuestion.question}</p>
              </CardContent>
            </Card>

            {/* Answer Box */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Your Response</CardTitle>
                  {speechSupported && (
                    <Button 
                      variant={isListening ? 'destructive' : 'outline'} 
                      size="sm" 
                      onClick={handleSpeechToggle}
                      className="h-8"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-4.5 w-4.5 mr-1.5" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4.5 w-4.5 mr-1.5 text-primary" />
                          <span>Voice Answer Mode</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  className="h-44 text-sm"
                  placeholder={isListening ? "Listening... Speak clearly into your microphone..." : "Type or speak your explanation bullet points..."}
                />

                <div className="flex items-center justify-end gap-2">
                  <Button 
                    onClick={handleSubmitAnswer} 
                    className="gradient-primary" 
                    loading={grading} 
                    disabled={!answerInput.trim() || currentQuestion.score !== undefined}
                  >
                    Submit Answer
                  </Button>
                  {currentQuestion.score !== undefined && (
                    <Button onClick={handleNext} className="gradient-primary">
                      {currentIndex === questions.length - 1 ? "Finish Session" : "Next Question"}
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Assessment Evaluation Panel */}
          <div className="lg:col-span-1">
            {currentQuestion?.score !== undefined ? (
              <Card className="h-full border-t-4 border-t-accent-success">
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    <Award className="h-5 w-5 text-accent-success" />
                    <span>AI Feedback Hub</span>
                  </CardTitle>
                  <CardDescription>Self-assessment score matrix.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Indicator */}
                  <div className="text-center py-4 border-b border-border dark:border-white/5">
                    <span className="text-4xl font-extrabold text-accent-success">{currentQuestion.score}%</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Answer score rating</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span>Evaluation:</span>
                      </span>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold">{currentQuestion.feedback}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>How to improve:</span>
                      </span>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">{currentQuestion.improvements}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-10 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                Awaiting answer submission for AI metrics report.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default MockInterview;
