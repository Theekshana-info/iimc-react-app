import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sanitizeHtml } from '@/lib/sanitize';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Link } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Isipathana International Meditation Center`;
      
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', post.title);
      
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const desc = post.excerpt || post.content?.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
      if (ogDesc && desc) ogDesc.setAttribute('content', desc);

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && post.image_url) ogImage.setAttribute('content', post.image_url);
    }
  }, [post]);

  const getShareUrl = () => window.location.href;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareUrl());
    toast.success('Article link copied to clipboard!');
  };

  const handleShareFacebook = () => {
    const url = getShareUrl();
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      toast.info("Facebook sharing notice: On localhost, Facebook's crawler cannot access your local site to retrieve preview tags. It will render fully once deployed.", {
        duration: 6000,
      });
    }
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (!post) return;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(post.title)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/10 p-4">
        <div className="text-center space-y-4 max-w-md bg-card border border-primary/5 p-8 rounded-2xl shadow-soft">
          <User className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Article Not Found</h1>
          <p className="text-muted-foreground">The blog post you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/blog')} className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95">
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 bg-muted/10">
      <div className="container px-4 max-w-4xl mx-auto space-y-8">
        
        {/* Back navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="group hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl pl-2.5 pr-4 h-10 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Blog
          </Button>
        </motion.div>

        <motion.article 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card/50 backdrop-blur-sm border border-primary/5 rounded-3xl p-6 md:p-10 shadow-soft space-y-8"
        >
          {/* Main Article Image */}
          {post.image_url && (
            <div className="w-full aspect-video md:h-96 overflow-hidden rounded-2xl shadow-soft shrink-0 bg-neutral-200 dark:bg-neutral-800">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title & Category Details */}
          <div className="space-y-4 text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>

            {/* Metadata (Date & Author) */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground pb-6 border-b border-primary/5">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary/70" />
                {format(new Date(post.created_at), 'PPP')}
              </div>
              {post.profiles && typeof post.profiles !== 'string' && 'full_name' in post.profiles && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary/70" />
                  {post.profiles.full_name}
                </div>
              )}
            </div>
          </div>

          {/* Rich text Content container */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line text-left pt-2 font-normal"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || '') }}
          />

          {/* Social Share Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-primary/5 to-primary/[0.02] border border-primary/10 rounded-2xl shadow-soft text-left mt-8 pt-6 border-t border-primary/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Share2 className="h-4.5 w-4.5 text-primary shrink-0 animate-pulse" />
                <span className="text-sm font-bold tracking-tight text-foreground">Inspired by this wisdom?</span>
              </div>
              <p className="text-xs text-muted-foreground">Share this insight with your friends and community to support their mindful journey.</p>
            </div>
            
            <div className="flex flex-wrap gap-2.5 sm:gap-3 shrink-0">
              <Button
                variant="outline"
                className="rounded-xl font-bold bg-[#1877F2] text-white hover:bg-[#1877F2]/90 hover:text-white border-transparent gap-2 px-4 shadow-sm hover:shadow-md transition-all duration-200 h-10"
                onClick={handleShareFacebook}
              >
                <Facebook className="h-4 w-4 fill-current" />
                Share
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 hover:text-background border-transparent gap-2 px-4 shadow-sm hover:shadow-md transition-all duration-200 h-10"
                onClick={handleShareTwitter}
              >
                <Twitter className="h-4 w-4 fill-current" />
                Post on X
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-bold bg-background text-foreground hover:bg-muted border-primary/10 gap-2 px-4 shadow-sm hover:shadow-md transition-all duration-200 h-10"
                onClick={copyToClipboard}
              >
                <Link className="h-4 w-4 text-primary" />
                Copy Link
              </Button>
            </div>
          </div>
        </motion.article>

      </div>
    </div>
  );
}
