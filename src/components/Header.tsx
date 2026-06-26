import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Info, 
  Users, 
  Mail, 
  Calendar, 
  Compass, 
  BookOpen, 
  User, 
  Heart, 
  LayoutDashboard, 
  LogIn, 
  LogOut 
} from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

interface HeaderProps {
  isAuthPage?: boolean;
}

export function Header({ isAuthPage = false }: HeaderProps) {
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
    { to: '/', label: 'Home', icon: Home },
    { to: '/about', label: 'About', icon: Info },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/teachers', label: 'Teachers', icon: Users },
    { to: '/blog', label: 'Blog', icon: BookOpen },
    { to: '/activities', label: 'Activities', icon: Compass },
    { to: '/contact', label: 'Contact', icon: Mail },
  ];

  const mainLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/about', label: 'About Us', icon: Info },
    { to: '/teachers', label: 'Our Teachers', icon: Users },
    { to: '/contact', label: 'Contact Us', icon: Mail },
  ];

  const exploreLinks = [
    { to: '/events', label: 'Events & Courses', icon: Calendar },
    { to: '/activities', label: 'Activities', icon: Compass },
    { to: '/blog', label: 'Insights & Blog', icon: BookOpen },
  ];

  // If on an authentication page, show the simplified header
  if (isAuthPage) {
    return (
      <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto rounded-full flex h-16 items-center justify-between px-4 sm:sm:px-6 transition-all duration-300 bg-slate-900/10 dark:bg-slate-900/25 backdrop-blur-lg border border-white/40 dark:border-sky-900/20 shadow-md shadow-sky-950/5 dark:shadow-black/20">
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

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto rounded-full flex h-16 items-center justify-between px-4 sm:px-6 transition-all duration-300 bg-slate-900/15 dark:bg-slate-900/35 backdrop-blur-lg border border-white/50 dark:border-sky-900/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-md shadow-sky-950/5 dark:shadow-black/30">
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

          {/* Desktop Actions */}
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

          {/* Mobile Actions and Burger Toggle */}
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
            <SheetTrigger asChild>
              <Button
                variant="default"
                aria-label="Toggle menu"
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>

        {/* Mobile Slide-out Drawer Navigation */}
        <SheetContent 
          side="left" 
          className="w-[300px] sm:w-[350px] p-0 bg-background/95 backdrop-blur-md border-r border-primary/10 shadow-xl flex flex-col justify-between h-full z-[100] transition-transform duration-300"
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 border-b border-primary/5 flex items-center justify-between shrink-0">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <img
                  src={iimcLogo}
                  alt="IIMC Logo"
                  className="h-8 w-8 rounded-full object-cover p-0.5 border border-border"
                />
                <SheetTitle className="text-xl font-bold text-primary dark:text-sky-400">
                  IIMC
                </SheetTitle>
              </Link>
            </div>

            {/* Scrollable Link Groups */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {/* Section 1: Main Menu */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-3">
                  Main Menu
                </h4>
                <nav className="space-y-1">
                  {mainLinks.map((link) => {
                    const active = isActive(link.to);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                          active
                            ? 'bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-400 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-primary/[0.03] dark:hover:bg-sky-400/[0.02]'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className={`h-4.5 w-4.5 transition-colors duration-200 ${
                          active ? 'text-primary dark:text-sky-400' : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Section 2: Explore */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-3">
                  Explore
                </h4>
                <nav className="space-y-1">
                  {exploreLinks.map((link) => {
                    const active = isActive(link.to);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                          active
                            ? 'bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-400 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-primary/[0.03] dark:hover:bg-sky-400/[0.02]'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className={`h-4.5 w-4.5 transition-colors duration-200 ${
                          active ? 'text-primary dark:text-sky-400' : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Section 3: Management */}
              {(user || isAdmin) && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-3">
                    Management
                  </h4>
                  <nav className="space-y-1">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                          isActive('/admin')
                            ? 'bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-400 font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-primary/[0.03] dark:hover:bg-sky-400/[0.02]'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <LayoutDashboard className={`h-4.5 w-4.5 transition-colors duration-200 ${
                          isActive('/admin') ? 'text-primary dark:text-sky-400' : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    {user && (
                      <Link
                        to="/profile"
                        className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                          isActive('/profile')
                            ? 'bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-400 font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-primary/[0.03] dark:hover:bg-sky-400/[0.02]'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <User className={`h-4.5 w-4.5 transition-colors duration-200 ${
                          isActive('/profile') ? 'text-primary dark:text-sky-400' : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                        <span>My Profile</span>
                      </Link>
                    )}
                  </nav>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-primary/5 bg-slate-500/5 space-y-3.5 shrink-0">
              <Button
                className="w-full rounded-2xl font-bold bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 hover:opacity-95 text-white gap-2 h-11 transition-all duration-200"
                onClick={() => {
                  navigate('/donate');
                  setIsOpen(false);
                }}
              >
                <Heart className="h-4 w-4 fill-white" />
                Donate Now
              </Button>

              {user ? (
                <Button
                  variant="outline"
                  className="w-full rounded-2xl font-bold border-primary/10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-2 h-11 transition-all duration-200"
                  onClick={() => {
                    setIsOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  className="w-full rounded-2xl font-bold gap-2 h-11 transition-all duration-200"
                  onClick={() => {
                    navigate('/login');
                    setIsOpen(false);
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </header>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your profile and register for events.
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
    </Sheet>
  );
}
