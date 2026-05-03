import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventsManager } from '@/components/admin/EventsManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { TeachersManager } from '@/components/admin/TeachersManager';
import { UsersManager } from '@/components/admin/UsersManager';
import { MessagesManager } from '@/components/admin/MessagesManager';
import { DonationsManager } from '@/components/admin/DonationsManager';
import BankDetailsManager from '@/components/admin/BankDetailsManager';
import { SettingsManager } from '@/components/admin/SettingsManager';
import { HomeMessagesManager } from '@/components/admin/HomeMessagesManager';
import { SocialLinksManager } from '@/components/admin/SocialLinksManager';
import { GalleryManager } from '@/components/admin/GalleryManager';
import { Calendar, BookOpen, Users, MessageSquare, Heart, Settings, GraduationCap, Building2, Image } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const adminTabs = [
  { value: 'events', label: 'Events', icon: Calendar },
  { value: 'blog', label: 'Blog', icon: BookOpen },
  { value: 'teachers', label: 'Teachers', icon: GraduationCap },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'messages', label: 'Messages', icon: MessageSquare },
  { value: 'donations', label: 'Donations', icon: Heart },
  { value: 'bank-details', label: 'Banks', icon: Building2 },
  { value: 'gallery', label: 'Gallery', icon: Image },
  { value: 'home-messages', label: 'Home Msg', icon: MessageSquare },
  { value: 'social-links', label: 'Social', icon: Users },
  { value: 'settings', label: 'Settings', icon: Settings },
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
        navigate('/auth', { state: { from: { pathname: '/admin' } } });
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderContent = () => {
    const contentMap: Record<string, { title: string; desc: string; component: React.ReactNode }> = {
      events: { title: 'Events Management', desc: 'Create and manage meditation events', component: <EventsManager /> },
      blog: { title: 'Blog Management', desc: 'Create and publish blog posts', component: <BlogManager /> },
      teachers: { title: 'Teachers Management', desc: 'Manage teacher profiles', component: <TeachersManager /> },
      users: { title: 'Users Management', desc: 'View and manage user accounts', component: <UsersManager /> },
      messages: { title: 'Messages', desc: 'View contact form submissions', component: <MessagesManager /> },
      donations: { title: 'Donations & Payments', desc: 'View payment history', component: <DonationsManager /> },
      'bank-details': { title: 'Bank Details', desc: 'Manage bank accounts for direct donations', component: <BankDetailsManager /> },
      gallery: { title: 'Gallery Manager', desc: 'Manage gallery images and videos', component: <GalleryManager /> },
      'home-messages': { title: 'Home Messages', desc: 'Manage homepage announcements', component: <HomeMessagesManager /> },
      'social-links': { title: 'Social Links', desc: 'Manage footer social media links', component: <SocialLinksManager /> },
      settings: { title: 'Site Settings', desc: 'Configure site-wide settings', component: <SettingsManager /> },
    };

    const item = contentMap[activeTab];
    if (!item) return null;

    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">{item.title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{item.desc}</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">{item.component}</CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen py-6 sm:py-12 lg:py-20 gradient-hero">
      <div className="container px-3 sm:px-4 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-8">Manage your meditation center</p>

        {/* Mobile: dropdown selector */}
        <div className="block lg:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {adminTabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  <span className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: tab bar */}
        <div className="hidden lg:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-11 gap-1">
              {adminTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs">
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4 lg:mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
