import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryItem } from '@/hooks/useGalleryItems';
import { ChevronLeft, ChevronRight, X, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export const GalleryLightbox = ({ items, currentIndex, onClose, onIndexChange }: Props) => {
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const prev = useCallback(() => hasPrev && onIndexChange(currentIndex - 1), [hasPrev, currentIndex, onIndexChange]);
  const next = useCallback(() => hasNext && onIndexChange(currentIndex + 1), [hasNext, currentIndex, onIndexChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  // Touch swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 60) next();
    else if (diff < -60) prev();
    setTouchStart(null);
  };

  const isVideo = item?.type === 'video';
  const embedUrl = isVideo ? getEmbedUrl(item.url) : null;

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        onClick={onClose}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative w-full max-w-5xl mx-4" onClick={(e) => e.stopPropagation()}>
          {/* Close */}
          <Button variant="ghost" size="icon" onClick={onClose}
            className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10" aria-label="Close">
            <X className="h-6 w-6" />
          </Button>

          {/* Prev / Next */}
          {hasPrev && (
            <Button variant="ghost" size="icon" onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20" aria-label="Previous">
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          {hasNext && (
            <Button variant="ghost" size="icon" onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20" aria-label="Next">
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Content */}
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl overflow-hidden bg-card"
          >
            {isVideo && embedUrl ? (
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  title={item.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex items-center justify-center max-h-[70vh] bg-black">
                <img src={item.url} alt={item.title} className="max-w-full max-h-[70vh] object-contain" />
              </div>
            )}

            {/* Caption */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.category} · {currentIndex + 1} of {items.length}</p>
              </div>
              {!isVideo && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" aria-label="Download"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = item.url; a.download = item.title; document.body.appendChild(a); a.click(); a.remove();
                      toast.success('Download started');
                    }}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Share"
                    onClick={async () => {
                      const url = `${window.location.origin}/gallery?item=${item.id}`;
                      if (navigator.share) { try { await navigator.share({ title: item.title, url }); } catch {} }
                      else { navigator.clipboard.writeText(url); toast.success('Link copied'); }
                    }}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;

  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}?autoplay=1`;

  return null;
}
