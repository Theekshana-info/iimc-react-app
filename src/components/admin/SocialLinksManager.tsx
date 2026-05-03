import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { toast } from 'sonner';

export function SocialLinksManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [iconName, setIconName] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const { data: links, isLoading } = useQuery({
    queryKey: ['admin-social-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (linkData: any) => {
      const { error } = await supabase.from('social_links').insert(linkData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('Social link created successfully');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('social_links').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('Social link updated successfully');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('Social link deleted successfully');
    },
  });

  const resetForm = () => {
    setPlatform('');
    setUrl('');
    setIconName('');
    setDisplayOrder(0);
    setIsActive(true);
    setEditingLink(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (link: any) => {
    setEditingLink(link);
    setPlatform(link.platform);
    setUrl(link.url);
    setIconName(link.icon_name);
    setDisplayOrder(link.display_order);
    setIsActive(link.is_active);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const linkData = {
      platform,
      url,
      icon_name: iconName,
      display_order: displayOrder,
      is_active: isActive,
    };

    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data: linkData });
    } else {
      createMutation.mutate(linkData);
    }
  };

  if (isLoading) {
    return <p>Loading social links...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Social Links</h2>
        <Button onClick={() => setIsDialogOpen(true)}>Add Link</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links?.map((link) => (
            <TableRow key={link.id}>
              <TableCell>{link.platform}</TableCell>
              <TableCell className="max-w-xs truncate">{link.url}</TableCell>
              <TableCell>{link.icon_name}</TableCell>
              <TableCell>{link.display_order}</TableCell>
              <TableCell>{link.is_active ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(link)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this link?')) {
                        deleteMutation.mutate(link.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Social Link' : 'Create Social Link'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Input
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Facebook"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://facebook.com/yourpage"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iconName">Icon Name</Label>
              <Input
                id="iconName"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="facebook"
                required
              />
              <p className="text-xs text-muted-foreground">
                Available: facebook, youtube, instagram, twitter, linkedin
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLink ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
