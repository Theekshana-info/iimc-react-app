import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DonationsManager() {
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: donations, isLoading: donationsLoading } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (paymentsLoading || donationsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Tabs defaultValue="payments">
      <TabsList>
        <TabsTrigger value="payments">All Payments</TabsTrigger>
        <TabsTrigger value="donor-info">Donor Information</TabsTrigger>
      </TabsList>

      <TabsContent value="payments" className="mt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {(() => {
                      const profile = payment.profiles;
                      if (profile && typeof profile !== 'string' && 'email' in profile) {
                        return (profile as any).email;
                      }
                      return payment.user_id ? 'N/A' : 'Anonymous Donor';
                    })()}
                  </TableCell>
                  <TableCell className="capitalize">{payment.payment_type}</TableCell>
                  <TableCell>
                    {payment.amount} {payment.currency}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === 'completed'
                          ? 'default'
                          : payment.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{payment.payment_gateway}</TableCell>
                  <TableCell>{format(new Date(payment.created_at), 'PPP')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="donor-info" className="mt-6">
        {donations && donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <Card key={donation.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {donation.donor_name || 'Anonymous Donor'}
                      </CardTitle>
                      <CardDescription>
                        {donation.donor_email || 'No email provided'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        LKR {donation.amount}
                      </p>
                      <Badge variant={donation.status === 'completed' ? 'default' : 'secondary'}>
                        {donation.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(donation.created_at), 'PPp')}
                  </p>
                </CardHeader>
                {donation.donor_message && (
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <p className="text-sm italic">"{donation.donor_message}"</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No donor information available yet</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
