import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import iimcLogo from '@/assets/iimc-logo.jpg';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(to);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!roles);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/events', label: 'Events' },
    { to: '/teachers', label: 'Teachers' },
    { to: '/blog', label: 'Blog' },
    { to: '/activities', label: 'Activities' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto rounded-full flex h-16 items-center justify-between px-4 sm:px-6 transition-all duration-300 bg-sky-100/80 dark:bg-sky-950/75 backdrop-blur-xl border border-white/50 dark:border-sky-900/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-md shadow-sky-950/5 dark:shadow-black/30">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={iimcLogo}
            alt="IIMC Logo"
            className="h-8 sm:h-9 w-8 sm:w-9 rounded-full object-cover p-0.5 border border-border"
          />
          <span className="text-xl sm:text-2xl font-bold text-primary">
            IIMC
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 text-sm font-bold transition-colors duration-300 whitespace-nowrap rounded-full ${active
                    ? 'text-white dark:text-slate-950 font-extrabold'
                    : 'text-black dark:text-white hover:text-primary'
                  }`}
              >
                <span className="relative z-10">{link.label}</span>
                {active && (
                  <motion.span
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-primary dark:bg-sky-400 rounded-full shadow-md shadow-primary/20 dark:shadow-sky-400/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center space-x-3">
          <ThemeToggle />
          <Button
            variant="outline"
            size="default"
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-500 px-5 text-sm sm:text-base"
            onClick={() => navigate('/donate')}
          >
            Donate
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              Admin
            </Button>
          )}
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-3 ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-500 text-xs px-3 h-9"
            onClick={() => navigate('/donate')}
          >
            Donate
          </Button>
          <ThemeToggle />
          <Button
            variant="default"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden rounded-3xl absolute left-4 right-4 top-full mt-4 max-h-[80vh] overflow-y-auto bg-sky-100/90 dark:bg-sky-950/90 backdrop-blur-xl border border-white/50 dark:border-sky-900/40 shadow-lg shadow-sky-950/10 dark:shadow-black/30 transition-all duration-300">
          <nav className="flex flex-col p-4 space-y-1.5">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-between ${active
                      ? 'text-white bg-primary dark:text-slate-950 dark:bg-sky-400 shadow-sm'
                      : 'text-black dark:text-white hover:bg-sky-200/50 dark:hover:bg-sky-900/40'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="relative z-10">{link.label}</span>
                  {active && <span className="w-2 h-2 bg-white dark:bg-slate-950 rounded-full relative z-10" />}
                </Link>
              );
            })}
            <div className="border-t mt-4 pt-4 flex flex-col gap-4">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => { navigate('/admin'); setIsOpen(false); }}
                >
                  Admin
                </Button>
              )}
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => { navigate('/profile'); setIsOpen(false); }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => { setShowLogoutConfirm(true); setIsOpen(false); }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => { navigate('/login'); setIsOpen(false); }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your profile and register for events
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
