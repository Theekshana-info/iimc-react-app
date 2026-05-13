import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { z } from 'zod';
import { User, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { UserActivities } from '@/components/profile/UserActivities';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
});

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login', { state: { from: { pathname: '/profile' } } });
        return;
      }

      setUser(user);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
      }

      // Load user's donation history — only show completed/successful payments
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = profileSchema.parse({
        fullName,
        phone: phone || undefined,
      });

      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: validated.fullName,
          phone: validated.phone || null,
        })
        .eq('id', user.id);

      if (error) throw error;

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
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12">My Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activities">My Activities</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="shadow-glow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{fullName || 'User'}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: +[country code][number]
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle>My Activities</CardTitle>
                <CardDescription>
                  View your event registrations and subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserActivities userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="donations">
            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle>Donation History</CardTitle>
                <CardDescription>
                  View all your successful contributions to IIMC
                </CardDescription>
              </CardHeader>
              <CardContent>
                {donations.length > 0 && (
                  <div className="mb-6 bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-center justify-between">
                    <span className="font-medium">Total Contributions</span>
                    <span className="text-xl font-bold text-primary">
                      LKR {donations.reduce((sum, d) => sum + Number(d.amount), 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {donations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    You haven't made any donations yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {donations.map((donation: any) => (
                      <Card key={donation.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              <span className="font-semibold text-lg">
                                {donation.currency} {donation.amount}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(donation.created_at), 'PPP')}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Completed
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
