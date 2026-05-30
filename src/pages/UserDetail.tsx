import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Heart, Shield, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserActivities } from '@/components/profile/UserActivities';

type SectionKey = 'profile' | 'activity' | 'donations' | 'security';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['user-detail-admin', id],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (profileError) throw profileError;

      const { data: donationsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', id)
        .eq('payment_type', 'donation')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      return {
        profile,
        donations: donationsData || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userDetails || !userDetails.profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">User not found</p>
        <Button onClick={() => navigate('/admin')}>Back to Admin</Button>
      </div>
    );
  }

  const { profile, donations } = userDetails;
  const displayName = profile.full_name || 'User';
  const displayEmail = profile.email || '';

  const totalGiven = donations.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
  const currentYear = new Date().getFullYear();
  const thisYearTotal = donations
    .filter((donation: any) => donation.created_at && new Date(donation.created_at).getFullYear() === currentYear)
    .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

  const dateOfBirthLabel = profile.date_of_birth
    ? format(new Date(profile.date_of_birth), 'PPP')
    : 'Not set';

  const navItems = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'activity', label: 'Activity', icon: Calendar },
    { key: 'donations', label: 'Donations', icon: Heart },
    { key: 'security', label: 'Security', icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <Badge variant="outline" className="py-1 px-3 bg-primary/5 border-primary/20 text-primary">
            Admin View
          </Badge>
        </div>

        {/* Tab Navigation Card */}
        <div className="shadow-soft rounded-3xl p-3 bg-card border border-transparent">
          <div className="flex gap-1 md:gap-4 pb-1 md:pb-0 w-full">
            {navItems.map((item) => {
              const isActive = activeSection === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={
                    `flex items-center justify-center gap-1 md:gap-2 px-1.5 py-2 md:px-3 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-smooth flex-1 min-w-0 ${isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 hidden sm:block" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Card with Framer Motion transitions */}
        <div className="shadow-soft rounded-3xl p-6 md:p-8 bg-card border border-transparent overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profile</h2>

                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-28 w-28">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          <User className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-bold">{displayName}</p>
                      <p className="text-sm text-muted-foreground">{displayEmail}</p>
                    </div>
                  </div>

                  <hr className="border-border my-6" />

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile.full_name || 'Not set'}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={displayEmail} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone || 'Not set'}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        value={dateOfBirthLabel}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile.location || 'Not set'}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || 'Not set'}
                        disabled
                        className="bg-muted resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'activity' && (
                <div className="space-y-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity</h2>
                  {id && <UserActivities userId={id} />}
                </div>
              )}

              {activeSection === 'donations' && (
                <div className="space-y-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Donations</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-soft bg-muted/20 border-border/50">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Given</p>
                        <p className="text-xl font-semibold mt-2">LKR {totalGiven.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-soft bg-muted/20 border-border/50">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">This Year</p>
                        <p className="text-xl font-semibold mt-2">LKR {thisYearTotal.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-soft bg-muted/20 border-border/50">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Number of Donations</p>
                        <p className="text-xl font-semibold mt-2">{donations.length}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {donations.length === 0 ? (
                    <Card className="shadow-soft border-border/50 bg-muted/10">
                      <CardContent className="py-12 text-center">
                        <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium">No donations yet</p>
                        <p className="text-sm text-muted-foreground">This user has not made any donations.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {donations.map((donation: any) => (
                        <Card key={donation.id} className="shadow-soft border-border/50 bg-muted/10">
                          <CardContent className="p-4 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-lg font-semibold">
                                {donation.currency || 'LKR'} {donation.amount}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {donation.created_at
                                  ? format(new Date(donation.created_at), 'PPP')
                                  : 'Date not available'}
                              </p>
                            </div>
                            <Badge variant="default">Completed</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Security</h2>

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">Connected Sign-In Methods</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.auth_methods?.includes('google') && (
                        <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3 bg-muted/20">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Google
                        </Badge>
                      )}
                      {(profile.auth_methods?.includes('email') || profile.auth_methods?.includes('password') || profile.has_password) && (
                        <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3 bg-muted/20">
                          <Shield className="h-3.5 w-3.5" />
                          Password
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
