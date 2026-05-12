import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useState } from 'react';
import { Search, Download } from 'lucide-react';

export function PaymentAttemptsManager() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['admin-payment-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_attempts')
        .select(`
          *,
          profiles:user_id (full_name, email),
          events:event_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredAttempts = attempts?.filter((attempt: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const profile = attempt.profiles;
    const event = attempt.events;
    return (
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower) ||
      event?.title?.toLowerCase().includes(searchLower) ||
      attempt.type?.toLowerCase().includes(searchLower) ||
      attempt.status?.toLowerCase().includes(searchLower) ||
      attempt.payhere_order_id?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'cancelled': return 'outline';
      case 'chargeback': return 'destructive';
      default: return 'secondary';
    }
  };

  const exportToCSV = () => {
    if (!filteredAttempts) return;

    const headers = ['User', 'Email', 'Type', 'Event', 'Amount', 'Status', 'Failure Reason', 'PayHere Order ID', 'Date'];
    const rows = filteredAttempts.map((a: any) => [
      a.profiles?.full_name || 'Anonymous',
      a.profiles?.email || '',
      a.type,
      a.events?.title || '',
      `${a.currency || 'LKR'} ${a.amount}`,
      a.status,
      a.failure_reason || '',
      a.payhere_order_id || '',
      a.created_at ? format(new Date(a.created_at), 'PPp') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-attempts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div>Loading payment attempts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, event, status, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredAttempts?.length ?? 0} records found
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Failure Reason</TableHead>
              <TableHead>PayHere ID</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttempts && filteredAttempts.length > 0 ? (
              filteredAttempts.map((attempt: any) => (
                <TableRow key={attempt.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {attempt.profiles?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.profiles?.email || '—'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">
                      {attempt.type?.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {attempt.events?.title || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {attempt.currency || 'LKR'} {attempt.amount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(attempt.status)}>
                      {attempt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
                      {attempt.failure_reason || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {attempt.payhere_order_id || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {attempt.created_at ? format(new Date(attempt.created_at), 'PPp') : '—'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No payment attempts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
