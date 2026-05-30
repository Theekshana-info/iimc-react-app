import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventsManager } from '@/components/admin/EventsManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { TeachersManager } from '@/components/admin/TeachersManager';
import { UsersManager } from '@/components/admin/UsersManager';
import { MessagesManager } from '@/components/admin/MessagesManager';
import { DonationsManager } from '@/components/admin/DonationsManager';
import BankDetailsManager from '@/components/admin/BankDetailsManager';
import { HomeMessagesManager } from '@/components/admin/HomeMessagesManager';
import { SocialLinksManager } from '@/components/admin/SocialLinksManager';
import { ActivitiesManager } from '@/components/admin/ActivitiesManager';
import { PaymentAttemptsManager } from '@/components/admin/PaymentAttemptsManager';
import { Calendar, BookOpen, Users, MessageSquare, Heart, GraduationCap, Building2, FileText, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const adminTabs = [
  { value: 'events', label: 'Events', icon: Calendar },
  { value: 'blog', label: 'Blog', icon: BookOpen },
  { value: 'teachers', label: 'Teachers', icon: GraduationCap },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'messages', label: 'Messages', icon: MessageSquare },
  { value: 'donations', label: 'Donations & Payments', icon: Heart },
  { value: 'bank-details', label: 'Banks', icon: Building2 },
  { value: 'activities', label: 'Activities', icon: BookOpen },
  { value: 'home-messages', label: 'Home Msg', icon: MessageSquare },
  { value: 'social-links', label: 'Social Links', icon: Users },
  { value: 'payment-log', label: 'Payment Log', icon: FileText },
];

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login', { state: { from: { pathname: '/admin' } } });
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderContent = () => {
    const contentMap: Record<string, { title: string; desc: string; component: React.ReactNode }> = {
      events: { title: 'Events Management', desc: 'Create, edit, and manage meditation events', component: <EventsManager /> },
      blog: { title: 'Blog Management', desc: 'Publish and manage insightful blog posts', component: <BlogManager /> },
      teachers: { title: 'Teachers Management', desc: 'Maintain the list of center teachers and guides', component: <TeachersManager /> },
      users: { title: 'Users Management', desc: 'View registered users and assign roles', component: <UsersManager /> },
      messages: { title: 'Messages', desc: 'Review contact form submissions from visitors', component: <MessagesManager /> },
      donations: { title: 'Donations & Payments', desc: 'Track verified payments and donations', component: <DonationsManager /> },
      'bank-details': { title: 'Bank Details', desc: 'Manage bank accounts shown for direct transfers', component: <BankDetailsManager /> },
      activities: { title: 'Activities Manager', desc: 'Create and update ongoing activities', component: <ActivitiesManager /> },
      'home-messages': { title: 'Home Messages', desc: 'Set announcements for the homepage', component: <HomeMessagesManager /> },
      'social-links': { title: 'Social Links', desc: 'Update footer social media URLs', component: <SocialLinksManager /> },
      'payment-log': { title: 'Payment Attempts Log', desc: 'Audit log of all payment attempts (pending, failed, success)', component: <PaymentAttemptsManager /> },
    };

    const item = contentMap[activeTab];
    if (!item) return null;

    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm relative overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <CardHeader className="pb-6 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {item.title}
          </CardTitle>
          <CardDescription className="text-sm">{item.desc}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {item.component}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-muted/10 pb-12">
      {/* Mobile Header & Nav */}
      <div className="lg:hidden p-4 bg-background/80 backdrop-blur-md border-b sticky top-16 z-40 flex flex-col gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your center</p>
        </div>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full bg-background shadow-sm border-muted-foreground/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {adminTabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                <span className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4 text-primary" />
                  {tab.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="container max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 lg:p-8 lg:pt-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6 sticky top-28 h-[calc(100vh-8rem)]">
          <div className="px-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Center Management</p>
          </div>
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-4 custom-scrollbar">
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.02]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={cn(
                      "h-5 w-5 transition-colors", 
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    {tab.label}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
