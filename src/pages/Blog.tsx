import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, User, Search, Facebook, Twitter, Link, ChevronRight } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Blog() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  const getShareUrl = (postId: string) => `${window.location.origin}/blog/${postId}`;

  const copyToClipboard = (postId: string) => {
    navigator.clipboard.writeText(getShareUrl(postId));
    toast.success('Article link copied to clipboard!');
  };

  const handleShareFacebook = (postId: string) => {
    const url = getShareUrl(postId);
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      toast.info("Facebook sharing notice: On localhost, Facebook's crawler cannot access your local site to retrieve preview tags. It will render fully once deployed.", {
        duration: 6000,
      });
    }
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareTwitter = (postId: string, title: string) => {
    const url = getShareUrl(postId);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  // Filter posts based on search query
  const filteredPosts = posts?.filter((post) => {
    const titleMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = (post.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const excerptMatch = (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || contentMatch || excerptMatch;
  }) || [];

  // Render all filtered posts as a uniform list
  const displayPosts = filteredPosts;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen py-24 gradient-hero bg-background/50">
      <div className="container px-4 max-w-7xl mx-auto space-y-12">
        
        {/* Header Block */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
              Insights & Wisdom
            </h1>
            <div className="h-1.5 w-16 bg-primary/20 rounded-full mx-auto mb-6"></div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Explore teachings on mindfulness, dharma reflections, meditation guidance, and direct paths to inner balance.
            </p>
          </div>
        </ScrollReveal>

        {/* Search Bar Block */}
        <ScrollReveal delay={100}>
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/80" />
            <Input
              placeholder="Search articles by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-background/50 border-primary/10 rounded-2xl shadow-soft focus-visible:ring-primary/20"
            />
          </div>
        </ScrollReveal>

        {/* Regular Articles Stack */}
        {displayPosts.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6 w-full max-w-4xl mx-auto"
          >
            {displayPosts.map((post) => (
              <motion.div
                key={post.id}
                variants={itemVariants}
                className="w-full"
              >
                <div className="group relative flex flex-row w-full h-36 sm:h-44 overflow-hidden rounded-2xl bg-card text-card-foreground shadow-soft border border-primary/5 hover:shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 text-left">
                  
                  {/* Floating decoration */}
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                  {/* Image Block */}
                  {post.image_url && (
                    <div className="w-28 sm:w-48 h-full overflow-hidden relative shrink-0">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Details content */}
                  <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between min-w-0">
                    <div className="space-y-1 sm:space-y-2">
                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3 text-primary/70" />
                          {format(new Date(post.created_at), 'MMM dd, yyyy')}
                        </span>
                        {post.profiles && typeof post.profiles !== 'string' && 'full_name' in post.profiles && (
                          <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                            <User className="h-3 w-3 text-primary/70" />
                            {post.profiles.full_name}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 
                        onClick={() => navigate(`/blog/${post.id}`)}
                        className="text-sm sm:text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors duration-300 line-clamp-2 cursor-pointer leading-snug"
                      >
                        {post.title}
                      </h3>

                      {/* Excerpt - Hidden on mobile, visible on desktop */}
                      <p className="hidden sm:line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {post.excerpt || post.content?.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}
                      </p>
                    </div>

                    {/* Divider & Action Buttons */}
                    <div className="pt-2 border-t border-primary/5 flex items-center justify-between shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 rounded-xl gap-1 h-8 px-2 sm:px-3 -ml-2"
                        onClick={() => navigate(`/blog/${post.id}`)}
                      >
                        Read Article
                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Button>

                      {/* Emphasized Share buttons row */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="hidden md:inline text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase mr-1">
                          Share:
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl border border-primary/5 hover:bg-[#1877F2]/10 text-muted-foreground hover:text-[#1877F2] hover:border-[#1877F2]/20 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareFacebook(post.id);
                          }}
                          title="Share on Facebook"
                        >
                          <Facebook className="h-3.5 w-3.5 fill-current" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl border border-primary/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareTwitter(post.id, post.title);
                          }}
                          title="Share on Twitter / X"
                        >
                          <Twitter className="h-3.5 w-3.5 fill-current" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl border border-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary hover:border-primary/20 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(post.id);
                          }}
                          title="Copy Link"
                        >
                          <Link className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <ScrollReveal delay={200}>
            <div className="text-center py-16 bg-card/30 backdrop-blur-sm border border-primary/5 rounded-2xl max-w-md mx-auto shadow-soft">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold mb-1">No Articles Found</h3>
              <p className="text-sm text-muted-foreground px-6">
                No blog posts matched your search keywords. Try adjusting your query.
              </p>
            </div>
          </ScrollReveal>
        )}

      </div>
    </div>
  );
}
