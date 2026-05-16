import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CountryPhoneInput } from '@/components/auth/CountryPhoneInput';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, Heart, Loader2, Pencil, Shield, User } from 'lucide-react';
import { UserActivities } from '@/components/profile/UserActivities';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});


type SectionKey = 'profile' | 'activity' | 'donations' | 'security';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);

  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const [showResetPanel, setShowResetPanel] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const [securityName, setSecurityName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [securityPhone, setSecurityPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login', { state: { from: { pathname: '/profile' } } });
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setDateOfBirth(profileData.date_of_birth || '');
        setLocation(profileData.location || '');
        setBio(profileData.bio || '');
        setSecurityName(profileData.full_name || '');
        setSecurityPhone(profileData.phone || '');
      }

      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_type', 'donation')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (paymentData) {
        setDonations(paymentData);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    event.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB.');
      return;
    }

    try {
      setAvatarUploading(true);
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => prev ? { ...prev, avatar_url: publicData.publicUrl } : prev);
      toast.success('Avatar updated');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update avatar');
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const validated = profileSchema.parse({
        fullName,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        location: location || undefined,
        bio: bio || undefined,
      });

      const normalizedPhone = (phone || '').replace(/\s+/g, '');
      if (normalizedPhone && !phoneRegex.test(normalizedPhone)) {
        toast.error('Invalid phone number');
        return;
      }

      setSavingProfile(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: validated.fullName,
          phone: validated.phone || null,
          date_of_birth: validated.dateOfBirth || null,
          location: validated.location || null,
          bio: validated.bio || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev: any) => prev ? {
        ...prev,
        full_name: validated.fullName,
        phone: validated.phone || null,
        date_of_birth: validated.dateOfBirth || null,
        location: validated.location || null,
        bio: validated.bio || null,
      } : prev);
      setSecurityName(validated.fullName);
      setSecurityPhone(validated.phone || '');
      toast.success('Profile updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!user?.email) return;
    try {
      setSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent. Check your email.');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to send reset link');
      }
    } finally {
      setSendingReset(false);
    }
  };

  const handleNameSave = async () => {
    if (securityName.trim().length < 2 || securityName.trim().length > 100) {
      toast.error('Name must be between 2 and 100 characters');
      return;
    }

    try {
      setSavingName(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: securityName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setFullName(securityName.trim());
      setProfile((prev: any) => prev ? { ...prev, full_name: securityName.trim() } : prev);
      toast.success('Name updated');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update name');
      }
    } finally {
      setSavingName(false);
    }
  };

  const handlePhoneSave = async () => {
    const normalizedPhone = (securityPhone || '').replace(/\s+/g, '');
    if (normalizedPhone && !phoneRegex.test(normalizedPhone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      setSavingPhone(true);
      const { error } = await supabase
        .from('profiles')
        .update({ phone: securityPhone || null })
        .eq('id', user.id);

      if (error) throw error;

      setPhone(securityPhone || '');
      setProfile((prev: any) => prev ? { ...prev, phone: securityPhone || null } : prev);
      toast.success('Phone number updated');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update phone number');
      }
    } finally {
      setSavingPhone(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const displayName = fullName || profile?.full_name || 'User';
  const displayEmail = user.email || '';

  const totalGiven = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const currentYear = new Date().getFullYear();
  const thisYearTotal = donations
    .filter((donation) => donation.created_at && new Date(donation.created_at).getFullYear() === currentYear)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const navItems = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'activity', label: 'Activity', icon: Calendar },
    { key: 'donations', label: 'Donations', icon: Heart },
    { key: 'security', label: 'Security', icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4 max-w-4xl space-y-6">
        <div className="shadow-soft rounded-3xl px-4 py-3 md:px-6 flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            {avatarUploading && (
              <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
              onClick={handleAvatarClick}
              aria-label="Edit avatar"
              disabled={avatarUploading}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="shadow-soft rounded-3xl p-3 md:col-span-1">
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              {navItems.map((item) => {
                const isActive = activeSection === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={
                      `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-smooth flex-shrink-0 ${isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shadow-soft rounded-3xl p-6 md:p-8 md:col-span-2">
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profile</h2>

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-28 w-28">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Button type="button" onClick={handleAvatarClick} disabled={avatarUploading}>
                      Upload Photo
                    </Button>
                  </div>
                </div>

                <hr className="border-border my-6" />

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={displayEmail} disabled className="bg-muted" />
                  </div>

                  <CountryPhoneInput
                    value={phone}
                    onChange={(value) => setPhone(value)}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      max={format(new Date(), 'yyyy-MM-dd')}
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Colombo, Sri Lanka"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      {bio.length} / 500
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </form>
              </div>
            )}

            {activeSection === 'activity' && (
              <div className="space-y-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity</h2>
                <UserActivities userId={user.id} />
              </div>
            )}

            {activeSection === 'donations' && (
              <div className="space-y-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Donations</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="shadow-soft">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Given</p>
                      <p className="text-xl font-semibold mt-2">LKR {totalGiven.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">This Year</p>
                      <p className="text-xl font-semibold mt-2">LKR {thisYearTotal.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Number of Donations</p>
                      <p className="text-xl font-semibold mt-2">{donations.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {donations.length === 0 ? (
                  <Card className="shadow-soft">
                    <CardContent className="py-12 text-center">
                      <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium">No donations yet</p>
                      <p className="text-sm text-muted-foreground">Your contributions will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <Card key={donation.id} className="shadow-soft">
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

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reset Password</h3>
                  {!showResetPanel ? (
                    <Button type="button" onClick={() => setShowResetPanel(true)}>
                      Reset Password
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail">Email Address</Label>
                        <Input id="resetEmail" type="email" value={displayEmail} disabled className="bg-muted" />
                      </div>
                      <Button type="button" onClick={handleSendResetLink} disabled={sendingReset}>
                        {sendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Password Reset Link'}
                      </Button>
                    </div>
                  )}
                </div>

                <hr className="border-border my-6" />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Change Name</h3>
                  <div className="flex flex-col md:flex-row gap-3 md:items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="securityName">Full Name</Label>
                      <Input
                        id="securityName"
                        value={securityName}
                        onChange={(e) => setSecurityName(e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <Button type="button" onClick={handleNameSave} disabled={savingName}>
                      {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </div>

                <hr className="border-border my-6" />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Change Phone Number</h3>
                  <CountryPhoneInput
                    value={securityPhone}
                    onChange={(value) => setSecurityPhone(value)}
                  />
                  <Button type="button" onClick={handlePhoneSave} disabled={savingPhone}>
                    {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
    </div>
  );
}
