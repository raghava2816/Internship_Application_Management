import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!provider || !code) {
      setErrorMsg('Missing authorization code or provider details.');
      return;
    }

    const verifyOAuth = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
        await completeOAuthLogin(provider, code, redirectUri);
        navigate('/', { replace: true });
      } catch (err: any) {
        console.error('OAuth Callback Verification Error:', err);
        setErrorMsg(
          err.response?.data?.message || 
          `Failed to authenticate with ${provider}. Make sure server credentials are configured.`
        );
      }
    };

    verifyOAuth();
  }, [provider, searchParams, completeOAuthLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      {/* Background neon blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 glass border border-white/10 dark:border-white/5 rounded-2xl shadow-2xl p-8 text-center">
        {errorMsg ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Authentication Failed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold gradient-primary text-white shadow-md hover:opacity-90 transition-opacity"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold uppercase">{provider ? provider[0] : 'O'}</span>
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
              Authenticating with {provider}
            </h2>
            <p className="text-sm text-muted-foreground animate-pulse">
              Verifying credentials, securing your workspace...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
