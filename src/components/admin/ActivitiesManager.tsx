import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Pencil, Plus, Trash2, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

type MediaType = 'image' | 'video';

interface ActivityBlock {
    id: string;
    type: 'text' | 'media';
    content: string;
    mediaType?: MediaType;
}

interface ActivitySection {
    id: string;
    blocks: ActivityBlock[];
}

interface ActivityRow {
    id: string;
    title: string;
    summary: string;
    cover_image_url: string;
    sections: ActivitySection[];
    created_at: string;
}

const uid = () => Math.random().toString(36).slice(2);

const normalizeBlock = (block: any): ActivityBlock | null => {
    if (!block) return null;
    if (block.type === 'text') {
        return { id: block.id ?? uid(), type: 'text', content: block.content ?? block.text ?? '' };
    }

    const mediaType = block.mediaType ?? block.type;
    if (mediaType === 'video' || mediaType === 'image') {
        return {
            id: block.id ?? uid(),
            type: 'media',
            content: block.content ?? block.url ?? '',
            mediaType,
        };
    }

    return null;
};

const normalizeSections = (sections: any[] | null | undefined): ActivitySection[] => {
    if (!sections || !Array.isArray(sections)) return [];
    return sections.map((section) => {
        const blocks: ActivityBlock[] = [];

        if (Array.isArray(section.blocks)) {
            section.blocks.forEach((block: any) => {
                const normalized = normalizeBlock(block);
                if (normalized) blocks.push(normalized);
            });
        } else {
            blocks.push({
                id: uid(),
                type: 'text',
                content: section.text ?? '',
            });
            if (Array.isArray(section.media)) {
                section.media.forEach((item: any) => {
                    blocks.push({
                        id: uid(),
                        type: 'media',
                        content: item.url,
                        mediaType: item.type === 'video' ? 'video' : 'image',
                    });
                });
            }
        }

        return {
            id: section.id ?? uid(),
            blocks,
        };
    });
};

const compressImage = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
    );

    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
};

const uploadToStorage = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${uid()}.${ext}`;
    const { error } = await supabase.storage.from('admin-uploads').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('admin-uploads').getPublicUrl(path);
    return data.publicUrl;
};

const deleteFromStorage = async (url: string) => {
    if (!url.includes('/admin-uploads/')) return;
    const path = url.split('/admin-uploads/')[1];
    if (!path) return;
    await supabase.storage.from('admin-uploads').remove([path]);
};

export function ActivitiesManager() {
    const queryClient = useQueryClient();
    const [showDialog, setShowDialog] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ActivityRow | null>(null);

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [sections, setSections] = useState<ActivitySection[]>([]);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingSectionId, setUploadingSectionId] = useState<string | null>(null);

    const { data: activities = [], isLoading } = useQuery({
        queryKey: ['admin-activities'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as unknown as ActivityRow[]) ?? [];
        },
    });

    const resetForm = () => {
        setTitle('');
        setSummary('');
        setCoverImageUrl('');
        setSections([]);
        setEditingActivity(null);
    };

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.from('activities').insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Activity created');
            queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setShowDialog(false);
            resetForm();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create activity'),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            const { error } = await supabase.from('activities').update(updates).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Activity updated');
            queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            setShowDialog(false);
            resetForm();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to update activity'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (activity: ActivityRow) => {
            await deleteFromStorage(activity.cover_image_url);
            activity.sections?.forEach((section) => {
                section.blocks?.forEach((block) => {
                    if (block.type === 'media' && block.content) {
                        deleteFromStorage(block.content);
                    }
                });
            });
            const { error } = await supabase.from('activities').delete().eq('id', activity.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Activity deleted');
            queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
        onError: (error: any) => toast.error(error.message || 'Failed to delete activity'),
    });

    const handleCoverUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            toast.error('Image must be less than 5MB');
            return;
        }

        setUploadingCover(true);
        try {
            const compressed = await compressImage(file);
            const url = await uploadToStorage(compressed, 'activities/covers');
            setCoverImageUrl(url);
            toast.success('Cover image uploaded');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload cover image');
        } finally {
            setUploadingCover(false);
        }
    };

    const handleAddSection = () => {
        setSections((prev) => [...prev, { id: uid(), blocks: [] }]);
    };

    const handleRemoveSection = (id: string) => {
        setSections((prev) => prev.filter((section) => section.id !== id));
    };

    const handleSectionText = (id: string, text: string) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== id) return section;
                const blocks = [...section.blocks];
                const textIndex = blocks.findIndex((block) => block.type === 'text');

                if (textIndex === -1) {
                    if (text.trim().length === 0) return section;
                    blocks.push({ id: uid(), type: 'text', content: text });
                } else {
                    blocks[textIndex] = { ...blocks[textIndex], content: text };
                }

                return { ...section, blocks };
            })
        );
    };

    const handleAddMedia = async (sectionId: string, type: MediaType, files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploadingSectionId(sectionId);
        try {
            const uploaded: ActivityBlock[] = [];
            for (const file of Array.from(files)) {
                if (type === 'image') {
                    if (!file.type.startsWith('image/')) {
                        toast.error('Only image files are allowed');
                        continue;
                    }
                    if (file.size > MAX_IMAGE_SIZE) {
                        toast.error('Images must be less than 5MB');
                        continue;
                    }
                    const compressed = await compressImage(file);
                    const url = await uploadToStorage(compressed, 'activities/media');
                    uploaded.push({ id: uid(), type: 'media', content: url, mediaType: 'image' });
                } else {
                    if (!file.type.startsWith('video/')) {
                        toast.error('Only video files are allowed');
                        continue;
                    }
                    if (file.size > MAX_VIDEO_SIZE) {
                        toast.error('Videos must be less than 50MB');
                        continue;
                    }
                    const url = await uploadToStorage(file, 'activities/media');
                    uploaded.push({ id: uid(), type: 'media', content: url, mediaType: 'video' });
                }
            }

            setSections((prev) =>
                prev.map((section) =>
                    section.id === sectionId
                        ? { ...section, blocks: [...section.blocks, ...uploaded] }
                        : section
                )
            );
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload media');
        } finally {
            setUploadingSectionId(null);
        }
    };

    const handleRemoveMedia = (sectionId: string, mediaId: string) => {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? { ...section, blocks: section.blocks.filter((block) => block.id !== mediaId) }
                    : section
            )
        );
    };

    const startEdit = (activity: ActivityRow) => {
        setEditingActivity(activity);
        setTitle(activity.title);
        setSummary(activity.summary);
        setCoverImageUrl(activity.cover_image_url);
        setSections(normalizeSections(activity.sections));
        setShowDialog(true);
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }
        if (!summary.trim()) {
            toast.error('Summary is required');
            return;
        }
        if (!coverImageUrl) {
            toast.error('Cover image is required');
            return;
        }
        if (sections.length === 0) {
            toast.error('Add at least one section');
            return;
        }

        const payload = {
            title: title.trim(),
            summary: summary.trim(),
            cover_image_url: coverImageUrl,
            sections: sections.map((section) => ({
                blocks: section.blocks.map((block) =>
                    block.type === 'text'
                        ? { type: 'text', content: block.content }
                        : { type: 'media', content: block.content, mediaType: block.mediaType }
                ),
            })),
            updated_at: new Date().toISOString(),
        };

        if (editingActivity) {
            updateMutation.mutate({ id: editingActivity.id, updates: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{activities.length} activities</p>
                <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" />Add Activity</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Create Activity'}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Summary</Label>
                                <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                {coverImageUrl && (
                                    <div className="relative w-full max-w-[220px] aspect-video rounded-xl overflow-hidden border">
                                        <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => setCoverImageUrl('')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="activity-cover"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleCoverUpload(file);
                                        e.currentTarget.value = '';
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={uploadingCover}
                                    onClick={() => document.getElementById('activity-cover')?.click()}
                                >
                                    {uploadingCover ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                                    ) : (
                                        <><ImageIcon className="h-4 w-4 mr-2" />Upload Cover</>
                                    )}
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Sections</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                                        <Plus className="h-3 w-3 mr-1" />Add Section
                                    </Button>
                                </div>

                                {sections.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Add at least one section.</p>
                                )}

                                {sections.map((section, index) => {
                                    const textBlock = section.blocks.find((block) => block.type === 'text');
                                    const mediaBlocks = section.blocks.filter((block) => block.type === 'media');
                                    const imageInputId = `section-${section.id}-images`;
                                    const videoInputId = `section-${section.id}-videos`;
                                    const isUploading = uploadingSectionId === section.id;

                                    return (
                                        <Card key={section.id} className="border border-border/60">
                                            <CardContent className="space-y-3 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium">Section {index + 1}</p>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSection(section.id)}>
                                                        Remove
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    rows={4}
                                                    placeholder="Section text..."
                                                    value={textBlock?.content ?? ''}
                                                    onChange={(e) => handleSectionText(section.id, e.target.value)}
                                                />

                                                {mediaBlocks.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {mediaBlocks.map((media) => (
                                                            <div key={media.id} className="relative rounded-xl overflow-hidden border bg-muted/40">
                                                                {media.mediaType === 'image' ? (
                                                                    <img src={media.content} alt="Activity media" className="w-full h-28 object-cover" />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-28 bg-black/80 text-white">
                                                                        <VideoIcon className="h-6 w-6" />
                                                                    </div>
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 h-6 w-6"
                                                                    onClick={() => handleRemoveMedia(section.id, media.id)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2">
                                                    <input
                                                        id={imageInputId}
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            handleAddMedia(section.id, 'image', e.target.files);
                                                            e.currentTarget.value = '';
                                                        }}
                                                    />
                                                    <input
                                                        id={videoInputId}
                                                        type="file"
                                                        accept="video/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            handleAddMedia(section.id, 'video', e.target.files);
                                                            e.currentTarget.value = '';
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isUploading}
                                                        onClick={() => document.getElementById(imageInputId)?.click()}
                                                    >
                                                        <ImageIcon className="h-4 w-4 mr-2" />Add Images
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isUploading}
                                                        onClick={() => document.getElementById(videoInputId)?.click()}
                                                    >
                                                        <VideoIcon className="h-4 w-4 mr-2" />Add Videos
                                                    </Button>
                                                    {isUploading && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                                                            <Loader2 className="h-3 w-3 animate-spin" />Uploading...
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleSubmit}>
                                    {editingActivity ? 'Update Activity' : 'Create Activity'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {activities.length === 0 ? (
                <Card className="shadow-soft">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No activities yet. Add your first activity.</p>
                    </CardContent>
                </Card>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities.map((activity) => (
                            <TableRow key={activity.id}>
                                <TableCell className="font-medium">{activity.title}</TableCell>
                                <TableCell>{format(new Date(activity.created_at), 'PPP')}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => startEdit({ ...activity, sections: normalizeSections(activity.sections) })}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            if (confirm('Delete this activity?')) {
                                                deleteMutation.mutate(activity);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
