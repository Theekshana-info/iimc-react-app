import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, User, ArrowLeft } from 'lucide-react';

export default function BlogArticle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles:author_id (full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Article not found</p>
        <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <article className="container px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/blog')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg mb-8 shadow-soft"
          />
        )}

        <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-muted-foreground mb-8 pb-8 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(post.created_at), 'PPP')}
          </div>
          {(() => {
            const authorProfile = post.profiles;
            if (authorProfile && typeof authorProfile !== 'string' && 'full_name' in authorProfile) {
              return (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {(authorProfile as any).full_name}
                </div>
              );
            }
            return null;
          })()}
        </div>

        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
