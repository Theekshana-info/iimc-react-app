import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useState } from 'react';
import { Download, Search } from 'lucide-react';

interface EventRegistrationsViewProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventRegistrationsView({ event, open, onOpenChange }: EventRegistrationsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['event-registrations', event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('event_id', event.id)
        .order('registered_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!event && open,
  });

  const filteredRegistrations = registrations?.filter((reg: any) => {
    const profile = reg.profiles;
    if (!profile) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower) ||
      profile.phone?.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    if (!filteredRegistrations) return;

    const headers = ['Name', 'Email', 'Phone', 'Registration Date', 'Status'];
    const rows = filteredRegistrations.map((reg: any) => [
      reg.profiles?.full_name || '',
      reg.profiles?.email || '',
      reg.profiles?.phone || '',
      format(new Date(reg.registered_at), 'PPP'),
      reg.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrations for {event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
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

          {isLoading ? (
            <p>Loading registrations...</p>
          ) : filteredRegistrations && filteredRegistrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg: any) => (
                  <TableRow key={reg.id}>
                    <TableCell>{reg.profiles?.full_name || 'N/A'}</TableCell>
                    <TableCell>{reg.profiles?.email || 'N/A'}</TableCell>
                    <TableCell>{reg.profiles?.phone || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(reg.registered_at), 'PPP')}</TableCell>
                    <TableCell>
                      <span className="capitalize">{reg.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No registrations found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
