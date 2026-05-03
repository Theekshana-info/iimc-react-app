import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Trash2, Plus, Image, Video } from 'lucide-react';
import { z } from 'zod';
import { GALLERY_CATEGORIES } from '@/hooks/useGalleryItems';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const imageSchema = z.object({
  type: z.literal('image'),
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  file: z.instanceof(File).refine(f => f.size <= MAX_FILE_SIZE, 'Max file size is 5MB'),
});

const videoSchema = z.object({
  type: z.literal('video'),
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  url: z.string().url('Must be a valid URL'),
});

interface GalleryItem {
  id: string;
  type: string;
  url: string;
  title: string;
  category: string;
  created_at: string;
}

export const GalleryManager = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [itemType, setItemType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-gallery-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as GalleryItem[]) ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: GalleryItem) => {
      // If image, also delete from storage
      if (item.type === 'image' && item.url.includes('gallery_media')) {
        const path = item.url.split('/gallery_media/')[1];
        if (path) {
          await supabase.storage.from('gallery_media').remove([path]);
        }
      }
      const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-items'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const resetForm = () => {
    setTitle(''); setCategory(''); setVideoUrl(''); setFile(null); setItemType('image');
  };

  const handleSubmit = async () => {
    try {
      if (itemType === 'video') {
        const result = videoSchema.safeParse({ type: 'video', title, category, url: videoUrl });
        if (!result.success) {
          toast.error(result.error.issues[0].message);
          return;
        }
        const { error } = await supabase.from('gallery_items').insert({
          type: 'video', url: videoUrl, title, category,
        });
        if (error) throw error;
      } else {
        if (!file) { toast.error('Please select an image file'); return; }
        const result = imageSchema.safeParse({ type: 'image', title, category, file });
        if (!result.success) {
          toast.error(result.error.issues[0].message);
          return;
        }
        setUploading(true);
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('gallery_media').upload(path, file);
        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage.from('gallery_media').getPublicUrl(path);

        const { error } = await supabase.from('gallery_items').insert({
          type: 'image', url: publicUrl, title, category,
        });
        if (error) throw error;
      }

      toast.success('Item added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-items'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      resetForm();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item');
    } finally {
      setUploading(false);
    }
  };

  const categories = GALLERY_CATEGORIES.filter(c => c !== 'All' && c !== 'Videos');

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} items</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Media</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Gallery Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                <Button variant={itemType === 'image' ? 'default' : 'outline'} className="flex-1"
                  onClick={() => setItemType('image')}>
                  <Image className="h-4 w-4 mr-2" />Image
                </Button>
                <Button variant={itemType === 'video' ? 'default' : 'outline'} className="flex-1"
                  onClick={() => setItemType('video')}>
                  <Video className="h-4 w-4 mr-2" />Video
                </Button>
              </div>

              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title" />
              </div>

              <div>
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {itemType === 'image' ? (
                <div>
                  <Label>Image File * (max 5MB)</Label>
                  <Input type="file" accept="image/*"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  {file && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label>Video URL * (YouTube / Vimeo)</Label>
                  <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..." />
                </div>
              )}

              <Button onClick={handleSubmit} disabled={uploading} className="w-full">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : 'Add Item'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-video relative bg-muted">
              {item.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
              ) : (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              )}
            </div>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold truncate">{item.title}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{item.category}</Badge>
                <Badge variant={item.type === 'video' ? 'default' : 'outline'}>{item.type}</Badge>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this media?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{item.title}"{item.type === 'image' ? ' and its stored file' : ''}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(item)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No gallery items yet. Add your first one above.</p>
      )}
    </div>
  );
};
