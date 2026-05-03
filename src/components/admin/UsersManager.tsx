import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';

export function UsersManager() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Fetch event registrations for each user
      const usersWithRegistrations = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: registrations, error: regError } = await supabase
            .from('event_registrations')
            .select(`
              id,
              status,
              registered_at,
              events (
                title,
                event_date
              )
            `)
            .eq('user_id', profile.id);
          
          return {
            ...profile,
            event_registrations: registrations || []
          };
        })
      );

      return usersWithRegistrations;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  const filteredUsers = users?.filter((user: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers && filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {Array.isArray(user.user_roles) && user.user_roles.length > 0 ? (
                      user.user_roles.map((role: any, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {role.role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">user</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.event_registrations && user.event_registrations.length > 0 ? (
                    <div className="space-y-1 max-w-xs">
                      {user.event_registrations.map((reg: any) => (
                        <div key={reg.id} className="text-sm">
                          <div className="font-medium">{reg.events?.title || 'Unknown Event'}</div>
                          <div className="text-muted-foreground text-xs flex items-center gap-2">
                            <Badge variant={reg.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                              {reg.status}
                            </Badge>
                            {reg.events?.event_date && format(new Date(reg.events.event_date), 'PP')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No registrations</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No users match your search' : 'No users found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
