import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, Compass, BookOpen, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function MobileNavbar() {
  const { user, profile } = useAuth();
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(to);
  };

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
    },
    {
      to: '/events',
      label: 'Events',
      icon: Calendar,
    },
    {
      to: '/activities',
      label: 'Activities',
      icon: Compass,
    },
    {
      to: '/blog',
      label: 'Blog',
      icon: BookOpen,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
      isProfile: true,
    },
  ];

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sky-100/80 dark:bg-sky-950/75 backdrop-blur-xl border-t border-white/50 dark:border-sky-900/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-md shadow-sky-950/5 dark:shadow-black/30 transition-all duration-300"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex h-[52px] items-center justify-around px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center flex-1 h-full px-1 py-1"
            >
              {/* Top sliding indicator bar matching the example image */}
              {active && (
                <motion.div
                  layoutId="mobileActiveTabLine"
                  className="absolute top-0 left-2 right-2 h-0.5 bg-primary dark:bg-sky-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Icon & Tap feedback */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center justify-center transition-colors duration-200 ${
                  active 
                    ? 'text-primary dark:text-sky-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {item.isProfile && user && profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className={`h-5 w-5 rounded-full object-cover border transition-all ${
                      active
                        ? 'border-primary dark:border-sky-400 ring-2 ring-primary/20 dark:ring-sky-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                
                <span className="text-[9px] font-semibold mt-0.5 tracking-wide select-none">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
