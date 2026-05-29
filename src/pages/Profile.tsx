import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CountryPhoneInput } from '@/components/auth/CountryPhoneInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar, Heart, Loader2, Pencil, Shield, User, Check } from 'lucide-react';
import { UserActivities } from '@/components/profile/UserActivities';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

type SectionKey = 'profile' | 'activity' | 'donations' | 'security';
type EditableField = 'fullName' | 'phone' | 'dateOfBirth' | 'location' | 'bio';

export default function Profile() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);

  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [savingField, setSavingField] = useState<EditableField | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const [showResetPanel, setShowResetPanel] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Password management state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast.error('User email not found');
      return;
    }
    try {
      setSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotPasswordSent(true);
      setShowResetPanel(false);
      toast.success('Reset link sent if the email exists.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setSendingReset(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
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
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setAuthLoading(false);
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

  const resetFieldValues = () => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setPhone(profile.phone || '');
    setDateOfBirth(profile.date_of_birth || '');
    setLocation(profile.location || '');
    setBio(profile.bio || '');
  };

  const toggleEditField = (field: EditableField) => {
    setEditingField((current) => {
      if (current === field) {
        resetFieldValues();
        return null;
      }
      resetFieldValues();
      return field;
    });
  };

  const handleFieldConfirm = async (field: EditableField) => {
    if (!user) return;

    const updates: Record<string, string | null> = {};
    if (field === 'fullName') {
      const name = fullName.trim();
      if (name.length < 2 || name.length > 100) {
        toast.error('Name must be between 2 and 100 characters');
        return;
      }
      updates.full_name = name;
      setFullName(name);
    }

    if (field === 'phone') {
      const normalizedPhone = (phone || '').replace(/\s+/g, '');
      if (normalizedPhone && !phoneRegex.test(normalizedPhone)) {
        toast.error('Invalid phone number');
        return;
      }
      updates.phone = phone || null;
    }

    if (field === 'dateOfBirth') {
      if (dateOfBirth) {
        const selectedDate = new Date(dateOfBirth);
        if (Number.isNaN(selectedDate.getTime())) {
          toast.error('Please select a valid date');
          return;
        }
        if (selectedDate > new Date()) {
          toast.error('Date of birth cannot be in the future');
          return;
        }
        updates.date_of_birth = dateOfBirth;
      } else {
        updates.date_of_birth = null;
      }
    }

    if (field === 'location') {
      if (location.length > 100) {
        toast.error('Location must be 100 characters or less');
        return;
      }
      updates.location = location || null;
    }

    if (field === 'bio') {
      if (bio.length > 500) {
        toast.error('Bio must be 500 characters or less');
        return;
      }
      updates.bio = bio || null;
    }

    try {
      setSavingField(field);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;

      setProfile((prev: any) => prev ? { ...prev, ...updates } : prev);
      setEditingField(null);
      toast.success('Changes saved');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save changes');
      }
    } finally {
      setSavingField(null);
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


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-20 gradient-hero flex items-center justify-center">
        <div className="container px-4 max-w-md text-center">
          <div className="shadow-soft rounded-3xl p-8 space-y-6 bg-card text-card-foreground border border-transparent">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">My Profile</h2>
              <p className="text-muted-foreground text-sm">
                Sign in to view your activity feed, manage registrations, track donations, and update your personal information.
              </p>
            </div>
            <Button 
              className="w-full"
              onClick={() => navigate('/login', { state: { from: { pathname: '/profile' } } })}
            >
              Sign In
            </Button>
          </div>
        </div>
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
  const dateOfBirthLabel = dateOfBirth
    ? format(new Date(dateOfBirth), 'PPP')
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

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleEditField('fullName')}
                        disabled={savingField === 'fullName'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {editingField === 'fullName' ? (
                      <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          maxLength={100}
                          required
                        />
                        <Button
                          type="button"
                          onClick={() => handleFieldConfirm('fullName')}
                          disabled={savingField === 'fullName'}
                        >
                          {savingField === 'fullName'
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : 'Confirm'}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id="fullName"
                        value={fullName || 'Not set'}
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={displayEmail} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Phone Number</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleEditField('phone')}
                        disabled={savingField === 'phone'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {editingField === 'phone' ? (
                      <div className="space-y-3">
                        <CountryPhoneInput
                          value={phone}
                          onChange={(value) => setPhone(value)}
                          showLabel={false}
                        />
                        <Button
                          type="button"
                          onClick={() => handleFieldConfirm('phone')}
                          disabled={savingField === 'phone'}
                        >
                          {savingField === 'phone'
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : 'Confirm'}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id="phone"
                        type="tel"
                        value={phone || 'Not set'}
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleEditField('dateOfBirth')}
                        disabled={savingField === 'dateOfBirth'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {editingField === 'dateOfBirth' ? (
                      <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <Input
                          id="dateOfBirth"
                          type="date"
                          max={format(new Date(), 'yyyy-MM-dd')}
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                        <Button
                          type="button"
                          onClick={() => handleFieldConfirm('dateOfBirth')}
                          disabled={savingField === 'dateOfBirth'}
                        >
                          {savingField === 'dateOfBirth'
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : 'Confirm'}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id="dateOfBirth"
                        value={dateOfBirthLabel}
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="location">Location</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleEditField('location')}
                        disabled={savingField === 'location'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {editingField === 'location' ? (
                      <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <Input
                          id="location"
                          placeholder="Colombo, Sri Lanka"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          maxLength={100}
                        />
                        <Button
                          type="button"
                          onClick={() => handleFieldConfirm('location')}
                          disabled={savingField === 'location'}
                        >
                          {savingField === 'location'
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : 'Confirm'}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id="location"
                        value={location || 'Not set'}
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bio">Bio</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleEditField('bio')}
                        disabled={savingField === 'bio'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {editingField === 'bio' ? (
                      <div className="space-y-3">
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          maxLength={500}
                          rows={4}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{bio.length} / 500</span>
                          <Button
                            type="button"
                            onClick={() => handleFieldConfirm('bio')}
                            disabled={savingField === 'bio'}
                          >
                            {savingField === 'bio'
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : 'Confirm'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Textarea
                        id="bio"
                        value={bio || 'Not set'}
                        disabled
                        className="bg-muted"
                        rows={4}
                      />
                    )}
                  </div>
                </div>
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

                {/* Connected Methods Badges */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Connected Sign-In Methods</Label>
                  <div className="flex flex-wrap gap-2">
                    {profile?.auth_methods?.includes('google') && (
                      <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                      </Badge>
                    )}
                    {(profile?.auth_methods?.includes('email') || profile?.auth_methods?.includes('password') || profile?.has_password) && (
                      <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3">
                        <Shield className="h-3.5 w-3.5" />
                        Password
                      </Badge>
                    )}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Set Password (Google-only user, no password yet) */}
                {!profile?.has_password && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">Set Password</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set a password so you can also log in with email and password.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <PasswordInput
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm Password</Label>
                        <PasswordInput
                          id="confirmNewPassword"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={savingPassword}
                        onClick={async () => {
                          if (newPassword.length < 8) {
                            toast.error('Password must be at least 8 characters');
                            return;
                          }
                          if (!/[0-9]/.test(newPassword)) {
                            toast.error('Password must contain at least one number');
                            return;
                          }
                          if (newPassword !== confirmNewPassword) {
                            toast.error('Passwords do not match');
                            return;
                          }
                          try {
                            setSavingPassword(true);
                            const { error } = await supabase.auth.updateUser({ password: newPassword });
                            if (error) throw error;

                            // Update profile
                            const currentMethods = profile?.auth_methods ?? [];
                            const newMethods = [...new Set([...currentMethods, 'password'])];
                            await supabase.from('profiles').update({
                              has_password: true,
                              auth_methods: newMethods,
                              updated_at: new Date().toISOString(),
                            }).eq('id', user.id);

                            setProfile((prev: any) => prev ? { ...prev, has_password: true, auth_methods: newMethods } : prev);
                            await refreshProfile();
                            setNewPassword('');
                            setConfirmNewPassword('');
                            toast.success('Password set! You can now log in with email and password.');
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Failed to set password');
                          } finally {
                            setSavingPassword(false);
                          }
                        }}
                      >
                        {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set Password'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Change Password (user has a password) */}
                {profile?.has_password && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Password Management</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Update your existing password or request a reset email.
                      </p>
                    </div>

                    {forgotPasswordSent ? (
                      <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-4 animate-fade-in-scale max-w-md">
                        <div className="flex gap-3">
                          <div className="mt-0.5 p-1.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                            <Check className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">Check your email</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              We have sent a secure password reset link to your email address:
                            </p>
                            <p className="text-xs font-semibold text-foreground mt-1 font-mono bg-card px-2 py-1 rounded border border-border inline-block">
                              {user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              Please check your inbox and follow the link to reset your password. You can close this notification once you're done.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setForgotPasswordSent(false)}
                            className="text-xs"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ) : !showResetPanel ? (
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowResetPanel(true)} className="shadow-glow">
                          Change Password
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={sendingReset}
                          onClick={handleForgotPassword}
                          className="hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                        >
                          {sendingReset && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Forgot Password?
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-w-md animate-fade-in-scale">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              className="text-xs text-[#268ad1] hover:underline font-medium focus:outline-none transition-colors"
                              disabled={sendingReset}
                            >
                              {sendingReset ? 'Sending...' : 'Forgot password?'}
                            </button>
                          </div>
                          <PasswordInput
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="changeNewPassword">New Password</Label>
                          <PasswordInput
                            id="changeNewPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="changeConfirmPassword">Confirm New Password</Label>
                          <PasswordInput
                            id="changeConfirmPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            disabled={savingPassword}
                            className="shadow-glow"
                            onClick={async () => {
                              if (newPassword.length < 8) {
                                toast.error('Password must be at least 8 characters');
                                return;
                              }
                              if (!/[0-9]/.test(newPassword)) {
                                toast.error('Password must contain at least one number');
                                return;
                              }
                              if (newPassword !== confirmNewPassword) {
                                toast.error('Passwords do not match');
                                return;
                              }
                              try {
                                setSavingPassword(true);
                                // Re-authenticate with current password first
                                const { error: authError } = await supabase.auth.signInWithPassword({
                                  email: user.email!,
                                  password: currentPassword,
                                });
                                if (authError) {
                                  toast.error('Current password is incorrect');
                                  return;
                                }
                                const { error } = await supabase.auth.updateUser({ password: newPassword });
                                if (error) throw error;

                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmNewPassword('');
                                setShowResetPanel(false);
                                toast.success('Password updated successfully.');
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Failed to change password');
                              } finally {
                                setSavingPassword(false);
                              }
                            }}
                          >
                            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => {
                            setShowResetPanel(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Link Google Account (if not already linked) */}
                {!profile?.auth_methods?.includes('google') && (
                  <>
                    <hr className="border-border" />
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold">Link Google Account</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Link your Google account so you can sign in with either method.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={linkingGoogle}
                        onClick={async () => {
                          try {
                            setLinkingGoogle(true);
                            const { error } = await supabase.auth.linkIdentity({
                              provider: 'google',
                              options: {
                                redirectTo: `${window.location.origin}/auth/callback`,
                              },
                            });
                            if (error) throw error;
                          } catch (err) {
                            setLinkingGoogle(false);
                            toast.error(err instanceof Error ? err.message : 'Failed to link Google account');
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        {linkingGoogle ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        )}
                        Link Google Account
                      </Button>
                    </div>
                  </>
                )}

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
