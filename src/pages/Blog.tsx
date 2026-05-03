import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function Blog() {
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles:author_id (full_name)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading blog posts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4">
        <ScrollReveal>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Blog</h1>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Wisdom teachings, dharma talks, and insights on meditation practice.
          </p>
        </ScrollReveal>

        <div className="max-w-4xl mx-auto space-y-6">
          {posts?.map((post, index) => (
            <ScrollReveal key={post.id} delay={index * 100}>
              <Card className="shadow-soft hover:shadow-glow transition-smooth">
                <div className="md:flex">
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full md:w-64 h-48 object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                    />
                  )}
                  <div className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-2xl">{post.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.created_at), 'PPP')}
                        </div>
                        {(() => {
                          const authorProfile = post.profiles;
                          if (authorProfile && typeof authorProfile !== 'string' && 'full_name' in authorProfile) {
                            return (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {(authorProfile as any).full_name}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-3 mb-4">
                        {post.excerpt || post.content.substring(0, 150) + '...'}
                      </p>
                      <Button onClick={() => navigate(`/blog/${post.id}`)}>
                        Read More
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
