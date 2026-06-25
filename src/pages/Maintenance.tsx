import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldAlert, Loader2, Lock, Shield } from 'lucide-react';
import iimcLogo from '@/assets/iimc-logo.jpg';

export default function Maintenance() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (meta) {
        meta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/maintenance/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Incorrect password.');
      }

      window.location.href = redirectPath;
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#070b19] text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* ─── Animated Ambient Glow Orbs ─── */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* ─── Secure Portal Pulse Badge ─── */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500" />
              IIMC Secure Portal
            </span>
          </div>
        </div>

        {/* ─── Premium Glassmorphic Card ─── */}
        <div className="relative rounded-3xl border border-slate-800/60 bg-slate-950/40 p-8 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden group">
          {/* Inner soft glow border */}
          <div className="absolute inset-0 border border-t-white/10 border-l-white/5 border-r-transparent border-b-transparent rounded-3xl pointer-events-none" />

          <div className="text-center pb-4 relative z-10">
            {/* Floating Logo with Ring Glow */}
            <div className="relative flex justify-center mb-6">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 opacity-30 blur-md animate-pulse" />
              <div className="relative h-24 w-24 rounded-full border border-slate-700 bg-slate-900 p-1 overflow-hidden shadow-xl">
                <img
                  src={iimcLogo}
                  alt="IIMC Logo"
                  className="h-full w-full rounded-full object-cover select-none"
                />
              </div>
              <div className="absolute bottom-0 right-[calc(50%-44px)] bg-indigo-600 rounded-full p-1.5 border border-slate-800 shadow-md">
                <Lock className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-300">
              Welcome to IIMC
            </h1>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Our website is currently under development. Authorized reviewers and testers may continue by entering the access password.
            </p>
          </div>
          
          <div className="space-y-5 relative z-10 mt-2">
            {/* Error alerts */}
            {error && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs animate-shake">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-400" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleContinue} className="space-y-4">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="maintenance-password" className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                    Access Password
                  </Label>
                </div>
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-focus-within/input:opacity-20 transition-all duration-300 blur-sm" />
                  <Input
                    id="maintenance-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter site password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative w-full pr-11 h-12 rounded-2xl border-slate-800/80 bg-slate-900/60 text-white placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50 transition-all duration-300"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Glowing Gradient Action Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl font-bold bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.25)] hover:shadow-[0_0_30px_rgba(79,70,229,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 border-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying Session...</span>
                  </div>
                ) : (
                  'Unlock Access'
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[10px] tracking-wider text-slate-600 uppercase font-semibold flex items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} IIMC Center</span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" /> End-To-End Secure
          </span>
        </div>

      </div>
    </div>
  );
}
