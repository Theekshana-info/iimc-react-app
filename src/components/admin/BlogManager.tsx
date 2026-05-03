import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from './RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';

export function BlogManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(false);

  const { data: posts } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newPost: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('blog_posts').insert({ ...newPost, author_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Post created');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create post: ${error.message}`);
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: any) => {
      const { error } = await supabase.from('blog_posts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Post updated');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to update post: ${error.message}`);
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Post deleted');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete post: ${error.message}`);
      console.error(error);
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setExcerpt('');
    setImageUrl('');
    setPublished(false);
    setEditingPost(null);
    setShowDialog(false);
  };

  const generateSlug = (title: string) => {
    const baseSlug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
    return `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt || '');
    setImageUrl(post.image_url || '');
    setPublished(post.published);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const slug = editingPost ? editingPost.slug : generateSlug(title);
    const postData = {
      title,
      slug,
      content,
      excerpt,
      image_url: imageUrl || null,
      published,
    };

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, updates: postData });
    } else {
      createMutation.mutate(postData);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Post
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts?.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.title}</TableCell>
                <TableCell>{post.published ? 'Yes' : 'No'}</TableCell>
                <TableCell>{format(new Date(post.created_at), 'PPP')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this post?')) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </div>
            <RichTextEditor
              label="Content *"
              value={content}
              onChange={setContent}
            />
            <ImageUploadField
              label="Image"
              value={imageUrl}
              onChange={setImageUrl}
              folder="blog"
            />
            <div className="flex items-center gap-2">
              <Switch id="published" checked={published} onCheckedChange={setPublished} />
              <Label htmlFor="published">Published</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!title || !content}>
                {editingPost ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
