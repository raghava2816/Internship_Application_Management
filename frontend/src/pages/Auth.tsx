import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, User, Github } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input, Label } from '../components/ui/Input';

export const Auth: React.FC = () => {
  const { token, login, register, getOAuthConfig, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Real OAuth configuration state
  const [oauthConfig, setOauthConfig] = useState<{ googleClientId: string; githubClientId: string }>({
    googleClientId: '',
    githubClientId: ''
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getOAuthConfig();
        setOauthConfig(config);
      } catch (err) {
        console.error('Failed to get OAuth config', err);
      }
    };
    fetchConfig();
  }, [getOAuthConfig]);

  // Redirect if already authenticated - placed after all hook declarations to satisfy Rules of Hooks
  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    }
  };

  const triggerSocialLogin = (provider: 'google' | 'github') => {
    // If the backend has real client IDs configured → use the real OAuth redirect
    if (provider === 'google' && oauthConfig.googleClientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback/google`);
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${oauthConfig.googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
      return;
    }
    if (provider === 'github' && oauthConfig.githubClientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback/github`);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${oauthConfig.githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
      return;
    }

    // No real credentials configured — show error
    setErrorMsg(`${provider === 'google' ? 'Google' : 'GitHub'} OAuth is not configured for this environment.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      {/* Background neon blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <Card className="w-full max-w-md relative z-10 glass border-white/10 dark:border-white/5 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg">
              <img src="/logo.jpg" alt="CareerFlow Logo" className="h-full w-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight gradient-text">CareerFlow</CardTitle>
          <CardDescription className="text-xs">Your unified dashboard for applications tracking, resume edits, and speech interview preps.</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="flex flex-col">
                <Label>Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="pl-9 h-10 text-xs font-semibold"
                    placeholder="Enter name" 
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col">
              <Label>Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="pl-9 h-10 text-xs font-semibold"
                  placeholder="e.g. name@domain.com" 
                />
              </div>
            </div>

            <div className="flex flex-col">
              <Label>Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="pl-9 h-10 text-xs font-semibold"
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary h-10 text-sm font-bold" loading={loading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Social mock buttons */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-2.5 border-t border-border dark:border-white/5" />
            <span className="relative bg-card-light dark:bg-card-dark px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider z-10">
              Or connect via
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => triggerSocialLogin('google')}>
              Google OAuth
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => triggerSocialLogin('github')}>
              <Github className="h-4 w-4 mr-1.5" />
              GitHub Auth
            </Button>
          </div>

          {/* Fast Switchers */}
          <div className="text-center pt-2 text-xs font-semibold">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Auth;
