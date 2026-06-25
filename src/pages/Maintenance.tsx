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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] text-zinc-100 font-sans relative selection:bg-zinc-800">
      
      {/* ─── Minimalist Ambient Background Glow ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_65%)] pointer-events-none" />

      <div className="w-full max-w-[400px] z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Pulse Status Badge */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1">
              <Shield className="h-3 w-3 text-zinc-400" />
              IIMC Secure Access
            </span>
          </div>
        </div>

        {/* ─── Sleek Enterprise Card ─── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          <div className="text-center pb-4 relative z-10">
            {/* Logo Framed Elegantly */}
            <div className="relative flex justify-center mb-5">
              <div className="h-20 w-20 rounded-full border border-zinc-800 bg-zinc-950 p-1 overflow-hidden shadow-inner">
                <img
                  src={iimcLogo}
                  alt="IIMC Logo"
                  className="h-full w-full rounded-full object-cover select-none filter grayscale-[20%]"
                />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome to IIMC
            </h1>
            <p className="text-sm text-zinc-400 mt-2.5 leading-relaxed font-normal">
              Our website is currently under development. Authorized reviewers and testers may continue by entering the access password.
            </p>
          </div>
          
          <div className="space-y-4 relative z-10 mt-2">
            {/* Error alerts */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs animate-shake">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleContinue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance-password" className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  Access Password
                </Label>
                <div className="relative">
                  <Input
                    id="maintenance-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 h-11 rounded-xl border-zinc-800 bg-zinc-950 text-white placeholder-zinc-650 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all duration-200"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Solid Indigo Action Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.99] transition-all duration-200 border-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[10px] tracking-widest text-zinc-500 uppercase font-semibold flex items-center justify-center gap-3">
          <span>&copy; {new Date().getFullYear()} IIMC Center</span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" /> Encrypted Session
          </span>
        </div>

      </div>
    </div>
  );
}
