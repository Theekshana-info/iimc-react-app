import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-detail', id],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (profileError) throw profileError;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id);

      const { data: registrations } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (title, event_date, location, price)
        `)
        .eq('user_id', id)
        .order('registered_at', { ascending: false });

      const { data: donations } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', id)
        .eq('payment_type', 'donation')
        .order('created_at', { ascending: false });

      return {
        profile,
        roles: roles || [],
        registrations: registrations || [],
        donations: donations || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">User not found</p>
        <Button onClick={() => navigate('/admin')}>Back to Admin</Button>
      </div>
    );
  }

  const totalDonations = user.donations
    .filter((d: any) => d.status === 'paid')
    .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

  return (
    <div className="min-h-screen py-20">
      <div className="container px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{user.profile.full_name || 'N/A'}</h3>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.profile.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{user.profile.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {format(new Date(user.profile.created_at), 'PPP')}</span>
            </div>
            {user.roles.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Roles:</p>
                <div className="flex gap-2">
                  {user.roles.map((r: any) => (
                    <span key={r.role} className="px-2 py-1 bg-primary/10 rounded text-sm">
                      {r.role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {user.registrations.length > 0 ? (
              <div className="space-y-4">
                {user.registrations.map((reg: any) => (
                  <div key={reg.id} className="border-b pb-4 last:border-0">
                    <h4 className="font-semibold">{reg.events?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {reg.events?.event_date && format(new Date(reg.events.event_date), 'PPP')}
                    </p>
                    <p className="text-sm">Location: {reg.events?.location || 'N/A'}</p>
                    <p className="text-sm">Status: <span className="capitalize">{reg.status}</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No event registrations</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-lg font-semibold">
                Total Donations: LKR {totalDonations.toFixed(2)}
              </p>
            </div>
            {user.donations.length > 0 ? (
              <div className="space-y-4">
                {user.donations.map((donation: any) => (
                  <div key={donation.id} className="border-b pb-4 last:border-0">
                    <p className="font-semibold">
                      {donation.currency} {donation.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(donation.created_at), 'PPP')}
                    </p>
                    <p className="text-sm">
                      Status: <span className="capitalize">{donation.status}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No donations</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
