import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from './RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function HomeMessagesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-home-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const { error } = await supabase.from('home_messages').insert(messageData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-home-messages'] });
      queryClient.invalidateQueries({ queryKey: ['home-messages'] });
      toast.success('Message created successfully');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('home_messages').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-home-messages'] });
      queryClient.invalidateQueries({ queryKey: ['home-messages'] });
      toast.success('Message updated successfully');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('home_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-home-messages'] });
      queryClient.invalidateQueries({ queryKey: ['home-messages'] });
      toast.success('Message deleted successfully');
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setLinkUrl('');
    setLinkText('');
    setIsVisible(true);
    setStartDate('');
    setEndDate('');
    setEditingMessage(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (message: any) => {
    setEditingMessage(message);
    setTitle(message.title);
    setContent(message.content);
    setLinkUrl(message.link_url || '');
    setLinkText(message.link_text || '');
    setIsVisible(message.is_visible);
    setStartDate(message.start_date ? message.start_date.split('T')[0] : '');
    setEndDate(message.end_date ? message.end_date.split('T')[0] : '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const messageData = {
      title,
      content,
      link_url: linkUrl || null,
      link_text: linkText || null,
      is_visible: isVisible,
      start_date: startDate || null,
      end_date: endDate || null,
    };

    if (editingMessage) {
      updateMutation.mutate({ id: editingMessage.id, data: messageData });
    } else {
      createMutation.mutate(messageData);
    }
  };

  if (isLoading) {
    return <p>Loading messages...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Home Messages</h2>
        <Button onClick={() => setIsDialogOpen(true)}>Add Message</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages?.map((message) => (
            <TableRow key={message.id}>
              <TableCell>{message.title}</TableCell>
              <TableCell>{message.is_visible ? 'Yes' : 'No'}</TableCell>
              <TableCell>{message.start_date ? format(new Date(message.start_date), 'PP') : '-'}</TableCell>
              <TableCell>{message.end_date ? format(new Date(message.end_date), 'PP') : '-'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(message)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this message?')) {
                        deleteMutation.mutate(message.id);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMessage ? 'Edit Message' : 'Create Message'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <RichTextEditor
              label="Content"
              value={content}
              onChange={setContent}
            />
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL (optional)</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkText">Link Text (optional)</Label>
              <Input
                id="linkText"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Learn More"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="visible"
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
              <Label htmlFor="visible">Visible</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMessage ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
