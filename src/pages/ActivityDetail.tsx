import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeft, Calendar } from 'lucide-react';

interface ActivityBlock {
    type: 'text' | 'media';
    content: string;
    mediaType?: 'image' | 'video';
}

interface ActivitySection {
    blocks?: ActivityBlock[];
    text?: string;
    media?: { url: string; type: 'image' | 'video' }[];
}

interface ActivityDetailRow {
    id: string;
    title: string;
    summary: string;
    cover_image_url: string;
    created_at: string;
    sections: ActivitySection[];
}

const normalizeBlocks = (section: ActivitySection): ActivityBlock[] => {
    if (Array.isArray(section.blocks)) {
        return section.blocks
            .map((block) => {
                if (block.type === 'text') {
                    return { type: 'text', content: block.content ?? block.text ?? '' };
                }

                const mediaType = block.mediaType ?? (block.type === 'video' ? 'video' : 'image');
                const content = block.content ?? block.url ?? '';
                return { type: 'media', content, mediaType };
            })
            .filter((block) => block.content !== undefined);
    }

    const blocks: ActivityBlock[] = [];
    if (section.text !== undefined) {
        blocks.push({ type: 'text', content: section.text ?? '' });
    }
    if (Array.isArray(section.media)) {
        section.media.forEach((media) => {
            blocks.push({ type: 'media', content: media.url, mediaType: media.type });
        });
    }
    return blocks;
};

export default function ActivityDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: activity, isLoading } = useQuery({
        queryKey: ['activity', id],
        enabled: !!id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as ActivityDetailRow;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading activity...</p>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-muted-foreground mb-4">Activity not found</p>
                <Button onClick={() => navigate('/activities')}>Back to Activities</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20">
            <article className="container px-4 max-w-4xl">
                <Button variant="ghost" onClick={() => navigate('/activities')} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Activities
                </Button>

                <img
                    src={activity.cover_image_url}
                    alt={activity.title}
                    className="w-full h-80 object-cover rounded-2xl shadow-soft mb-8"
                    loading="lazy"
                />

                <h1 className="text-4xl md:text-5xl font-bold mb-4">{activity.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(activity.created_at), 'PPP')}
                </div>

                <div className="space-y-10">
                    {activity.sections?.map((section, sectionIndex) => {
                        const blocks = normalizeBlocks(section);
                        const groups: Array<{ type: 'text'; content: string } | { type: 'media'; items: ActivityBlock[] }> = [];
                        let pendingMedia: ActivityBlock[] = [];

                        const flushMedia = () => {
                            if (pendingMedia.length > 0) {
                                groups.push({ type: 'media', items: pendingMedia });
                                pendingMedia = [];
                            }
                        };

                        blocks.forEach((block) => {
                            if (block.type === 'media') {
                                pendingMedia.push(block);
                            } else {
                                flushMedia();
                                groups.push({ type: 'text', content: block.content });
                            }
                        });

                        flushMedia();

                        return (
                            <div key={`${activity.id}-${sectionIndex}`} className="space-y-4">
                                {groups.map((group, groupIndex) => {
                                    if (group.type === 'text') {
                                        const lines = group.content
                                            .split(/\n+/)
                                            .map((line) => line.trim())
                                            .filter(Boolean);

                                        if (lines.length === 0) return null;

                                        return (
                                            <div key={`${sectionIndex}-text-${groupIndex}`} className="space-y-3 text-muted-foreground leading-relaxed">
                                                {lines.map((line, lineIndex) => (
                                                    <p key={`${sectionIndex}-text-${groupIndex}-${lineIndex}`}>{line}</p>
                                                ))}
                                            </div>
                                        );
                                    }

                                    const mediaItems = group.items.filter((item) => item.content);
                                    if (mediaItems.length === 0) return null;

                                    const isSingleMedia = mediaItems.length === 1;

                                    return (
                                        <div
                                            key={`${sectionIndex}-media-${groupIndex}`}
                                            className={isSingleMedia ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}
                                        >
                                            {mediaItems.map((media, mediaIndex) => {
                                                const isVideo = media.mediaType === 'video';

                                                if (isSingleMedia) {
                                                    return isVideo ? (
                                                        <video
                                                            key={`${sectionIndex}-media-${groupIndex}-${mediaIndex}`}
                                                            src={media.content}
                                                            controls
                                                            className="w-full rounded-2xl bg-black max-h-[520px]"
                                                        />
                                                    ) : (
                                                        <img
                                                            key={`${sectionIndex}-media-${groupIndex}-${mediaIndex}`}
                                                            src={media.content}
                                                            alt={`Activity media ${mediaIndex + 1}`}
                                                            className="w-full max-h-[520px] rounded-2xl object-contain bg-muted/30"
                                                            loading="lazy"
                                                        />
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={`${sectionIndex}-media-${groupIndex}-${mediaIndex}`}
                                                        className={`overflow-hidden rounded-2xl bg-muted/30 ${isVideo ? 'aspect-video' : 'aspect-[4/3]'}`}
                                                    >
                                                        {isVideo ? (
                                                            <video
                                                                src={media.content}
                                                                controls
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={media.content}
                                                                alt={`Activity media ${mediaIndex + 1}`}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </article>
        </div>
    );
}
