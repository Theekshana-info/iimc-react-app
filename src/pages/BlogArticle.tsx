import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sanitizeHtml } from '@/lib/sanitize';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Calendar, User, ArrowLeft, ArrowRight, Share2, Facebook, Twitter,
  Linkedin, Link as LinkIcon, Clock, ChevronRight, Home, BookOpen, Printer, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Utilities ────────────────────────────────────────────────

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function extractHeadings(html: string): TocHeading[] {
  const regex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  const headings: TocHeading[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (text) {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: parseInt(match[1]) as 2 | 3 });
    }
  }
  return headings;
}

function injectHeadingIds(html: string, headings: TocHeading[]): string {
  let idx = 0;
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (fullMatch, level, attrs, content) => {
    if (idx < headings.length) {
      const heading = headings[idx];
      idx++;
      return `<h${level}${attrs} id="${heading.id}">${content}</h${level}>`;
    }
    return fullMatch;
  });
}


// ─── Component ────────────────────────────────────────────────

export default function BlogArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const articleRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  // ── Main post query ──
  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles:author_id (full_name, avatar_url, bio, location)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // ── Adjacent posts query (prev/next) ──
  const { data: adjacentPosts } = useQuery({
    queryKey: ['blog-adjacent', id],
    enabled: !!post,
    queryFn: async () => {
      const [prevResult, nextResult] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, title, image_url, created_at')
          .eq('published', true)
          .lt('created_at', post!.created_at!)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('blog_posts')
          .select('id, title, image_url, created_at')
          .eq('published', true)
          .gt('created_at', post!.created_at!)
          .order('created_at', { ascending: true })
          .limit(1),
      ]);
      return {
        prev: prevResult.data?.[0] || null,
        next: nextResult.data?.[0] || null,
      };
    },
  });

  // ── Related posts query ──
  const { data: relatedPosts } = useQuery({
    queryKey: ['blog-related', id],
    enabled: !!post,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, image_url, excerpt, content, created_at')
        .eq('published', true)
        .neq('id', id!)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  // ── Derived data ──
  const readingTime = useMemo(() => post ? estimateReadingTime(post.content || '') : 0, [post]);
  const headings = useMemo(() => post ? extractHeadings(post.content || '') : [], [post]);
  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    const sanitized = sanitizeHtml(post.content);
    return headings.length > 0 ? injectHeadingIds(sanitized, headings) : sanitized;
  }, [post, headings]);

  const authorName = post?.profiles && typeof post.profiles !== 'string' && 'full_name' in post.profiles
    ? post.profiles.full_name : null;
  const authorAvatar = post?.profiles && typeof post.profiles !== 'string' && 'avatar_url' in post.profiles
    ? (post.profiles as any).avatar_url : null;
  const authorBio = post?.profiles && typeof post.profiles !== 'string' && 'bio' in post.profiles
    ? (post.profiles as any).bio : null;

  // ── SEO meta tags ──
  useEffect(() => {
    if (!post) return;

    document.title = `${post.title} | Isipathana International Meditation Center`;

    const desc = post.excerpt || post.content?.replace(/<[^>]*>?/gm, '').substring(0, 155) + '...';

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);
      if (el) el.setAttribute('content', content);
    };

    setMeta('og:title', post.title);
    setMeta('og:description', desc || '');
    setMeta('og:type', 'article');
    if (post.image_url) setMeta('og:image', post.image_url);
    setMeta('og:url', window.location.href);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('description', desc || '');

    // JSON-LD Article schema
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'article-schema';
    schemaScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: desc,
      image: post.image_url,
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      author: {
        '@type': 'Person',
        name: authorName || 'IIMC Editorial',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Isipathana International Meditation Center',
      },
    });
    document.head.appendChild(schemaScript);

    return () => {
      const existing = document.getElementById('article-schema');
      if (existing) existing.remove();
    };
  }, [post, authorName]);

  // ── Reading progress ──
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const el = articleRef.current;
      const height = el.scrollHeight - window.innerHeight;
      if (height <= 0) { setReadProgress(100); return; }
      const pct = Math.min(100, Math.max(0, (window.scrollY / height) * 100));
      setReadProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  // ── Share handlers ──
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  }, [shareUrl]);

  const shareFacebook = useCallback(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      toast.info("Facebook sharing doesn't work on localhost — it'll work once deployed.", { duration: 5000 });
    }
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  }, [shareUrl]);

  const shareTwitter = useCallback(() => {
    if (!post) return;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`, '_blank');
  }, [shareUrl, post]);

  const shareLinkedIn = useCallback(() => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  }, [shareUrl]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading article…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Article Not Found</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The article you're looking for doesn't exist or has been removed.
            </p>
          </div>
          <Button
            onClick={() => navigate('/blog')}
            className="rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          >
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Reading progress bar */}
      <div
        className="reading-progress-bar"
        style={{ width: `${readProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(readProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />

      <article className="min-h-screen bg-background pt-10 lg:pt-15 pb-20" ref={articleRef}>

        {/* ── Breadcrumb ── */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-foreground/[0.06] mb-8"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  Home
                </Link>
              </li>
              <li><ChevronRight className="h-3 w-3 text-muted-foreground/50" /></li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li><ChevronRight className="h-3 w-3 text-muted-foreground/50" /></li>
              <li className="text-foreground/70 truncate max-w-[200px] sm:max-w-[300px]" aria-current="page">
                {post.title}
              </li>
            </ol>
          </div>
        </nav>

        {/* ── Wide Page Container (Spans full 1200px container width) ── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Article Header ── */}
          <header className="pb-8 mb-8 border-b border-foreground/[0.06]">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-muted-foreground mb-4">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary/70" />
                {readingTime} min read
              </span>
              <span className="text-foreground/20">·</span>
              <time dateTime={post.created_at || ''} className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary/70" />
                {post.created_at ? format(new Date(post.created_at), 'MMMM d, yyyy') : 'Unknown date'}
              </time>
              {post.updated_at && post.updated_at !== post.created_at && (
                <>
                  <span className="text-foreground/20">·</span>
                  <span className="text-muted-foreground/70">
                    Updated {format(new Date(post.updated_at), 'MMM d, yyyy')}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight leading-[1.15] text-foreground mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-6 font-light font-serif">
                {post.excerpt}
              </p>
            )}

            {/* Author row */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-3">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName || 'Author'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-foreground/[0.06]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary/60" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {authorName || 'IIMC Editorial'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Author</p>
                </div>
              </div>

              {/* Share shortcuts */}
              <div className="flex items-center gap-2">
                <ShareButton icon={<Facebook className="h-4 w-4" />} onClick={shareFacebook} label="Share on Facebook" />
                <ShareButton icon={<Twitter className="h-4 w-4" />} onClick={shareTwitter} label="Share on X" />
                <ShareButton icon={<LinkIcon className="h-4 w-4" />} onClick={copyLink} label="Copy link" />
              </div>
            </div>
          </header>

          {/* ── Hero Image ── */}
          {post.image_url && (
            <figure className="mb-10 overflow-hidden rounded-xl sm:rounded-2xl bg-muted/20 aspect-[16/9]">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </figure>
          )}

          {/* Table of Contents Accordion */}
          {headings.length > 0 && (
            <nav className="mb-8 border border-foreground/[0.06] rounded-xl overflow-hidden font-sans" aria-label="Table of contents">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground bg-muted/20 hover:bg-muted/30 transition-colors"
                aria-expanded={tocOpen}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary/70" />
                  Table of Contents
                </span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${tocOpen ? 'rotate-90' : ''}`} />
              </button>
              {tocOpen && (
                <div className="px-4 py-3 bg-muted/5 border-t border-foreground/[0.04] space-y-1">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      onClick={() => setTocOpen(false)}
                      className={`block hover:text-primary transition-colors text-sm text-muted-foreground font-sans ${h.level === 3 ? 'pl-4 text-xs' : 'font-medium'}`}
                    >
                      {h.text}
                    </a>
                  ))}
                </div>
              )}
            </nav>
          )}

          {/* Article body (uses full width of the container) ── */}
          <section
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* ── Author Card ── */}
          <section className="mt-16 pt-10 border-t border-foreground/[0.06]" aria-label="About the author">
            <div className="flex items-start gap-4">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName || 'Author'}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-foreground/[0.06] shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-primary/50" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1 font-sans">
                  Written by
                </p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {authorName || 'IIMC Editorial'}
                </p>
                {authorBio && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                    {authorBio}
                  </p>
                )}
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 mt-3 transition-colors font-sans"
                >
                  View all articles
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── Share Section ── */}
          <section className="mt-12 pt-10 border-t border-foreground/[0.06]" aria-label="Share this article">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2 font-sans">
              <Share2 className="h-4 w-4" />
              Share this article
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <ShareButtonLarge icon={<Facebook className="h-4 w-4" />} label="Facebook" onClick={shareFacebook} />
              <ShareButtonLarge icon={<Twitter className="h-4 w-4" />} label="X" onClick={shareTwitter} />
              <ShareButtonLarge icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" onClick={shareLinkedIn} />
              <ShareButtonLarge icon={<LinkIcon className="h-4 w-4" />} label="Copy Link" onClick={copyLink} />
              <ShareButtonLarge icon={<Printer className="h-4 w-4" />} label="Print" onClick={handlePrint} />
            </div>
          </section>

          {/* ── Prev / Next ── */}
          {adjacentPosts && (adjacentPosts.prev || adjacentPosts.next) && (
            <nav className="mt-12 pt-10 border-t border-foreground/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Previous and next articles">
              {adjacentPosts.prev ? (
                <Link
                  to={`/blog/${adjacentPosts.prev.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-foreground/[0.06] hover:border-foreground/[0.12] hover:bg-muted/10 transition-all"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                  <div className="min-w-0 font-sans">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Previous</p>
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {adjacentPosts.prev.title}
                    </p>
                  </div>
                </Link>
              ) : <div />}
              {adjacentPosts.next && (
                <Link
                  to={`/blog/${adjacentPosts.next.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-foreground/[0.06] hover:border-foreground/[0.12] hover:bg-muted/10 transition-all text-right sm:justify-end"
                >
                  <div className="min-w-0 font-sans">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Next</p>
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {adjacentPosts.next.title}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </nav>
          )}

          {/* ── Related Articles ── */}
          {relatedPosts && relatedPosts.length > 0 && (
            <section className="mt-20 pt-12 border-t border-foreground/[0.06]" aria-label="Related articles">
              <h2 className="text-xl font-bold tracking-tight text-foreground mb-8 font-sans">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/blog/${rp.id}`}
                    className="group block rounded-xl border border-foreground/[0.06] overflow-hidden hover:border-foreground/[0.12] hover:bg-muted/5 transition-all"
                  >
                    {rp.image_url && (
                      <div className="aspect-[16/10] overflow-hidden bg-muted/20">
                        <img
                          src={rp.image_url}
                          alt={rp.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 font-sans">
                        <Clock className="h-3 w-3 text-primary/70" />
                        {estimateReadingTime(rp.content || '')} min read
                        <span className="text-foreground/15">·</span>
                        {rp.created_at ? format(new Date(rp.created_at), 'MMM d, yyyy') : ''}
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>

      </article>
    </>
  );
}


// ─── Sub-components ──────────────────────────────────────────

function ShareButton({ icon, onClick, label }: { icon: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-8 w-8 rounded-lg border border-foreground/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/[0.15] hover:bg-muted/20 transition-all duration-150"
    >
      {icon}
    </button>
  );
}

function ShareButtonLarge({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-foreground/[0.08] text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/[0.15] hover:bg-muted/20 transition-all duration-150 font-sans"
    >
      {icon}
      {label}
    </button>
  );
}
