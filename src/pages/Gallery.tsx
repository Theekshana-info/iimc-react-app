import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryItems, GALLERY_CATEGORIES, GalleryCategory, GalleryItem } from '@/hooks/useGalleryItems';
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox';
import { Loader2, Play } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

const Gallery = () => {
  const { data: items = [], isLoading } = useGalleryItems();
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = activeCategory === 'All'
    ? items
    : activeCategory === 'Videos'
      ? items.filter(i => i.type === 'video')
      : items.filter(i => i.category === activeCategory);

  const handleOpen = useCallback((i: number) => setLightboxIndex(i), []);
  const handleClose = useCallback(() => setLightboxIndex(null), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 px-4">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {"Our Gallery".split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore moments of peace, meditation, and spiritual growth captured at our center
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Category Pills */}
      <section className="container mx-auto px-4 pt-10">
        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-smooth border ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Masonry Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading gallery...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No items found in this category</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
            >
              {filtered.map((item, index) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  index={index}
                  onClick={() => handleOpen(index)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          items={filtered}
          currentIndex={lightboxIndex}
          onClose={handleClose}
          onIndexChange={setLightboxIndex}
        />
      )}

      <div className="h-16" />
    </div>
  );
};

/* ─── Card ─── */
const GalleryCard = ({ item, index, onClick }: { item: GalleryItem; index: number; onClick: () => void }) => {
  const [loaded, setLoaded] = useState(false);
  const isVideo = item.type === 'video';

  // Extract YouTube thumbnail
  const thumbUrl = isVideo ? getVideoThumb(item.url) : item.url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.08 }}
      className="break-inside-avoid mb-4 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative rounded-xl overflow-hidden shadow-soft transition-smooth hover:shadow-glow hover:scale-[1.03]">
        {/* Image / Thumbnail */}
        <div className={`relative ${isVideo ? 'aspect-video' : ''}`}>
          {!loaded && (
            <div className="absolute inset-0 bg-muted animate-pulse rounded-xl" />
          )}
          <img
            src={thumbUrl}
            alt={item.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${!isVideo ? 'block' : 'w-full h-full'}`}
          />
          
          {/* Video play overlay */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
                <Play className="h-7 w-7 text-primary-foreground ml-1" />
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-semibold text-sm">{item.title}</p>
              <p className="text-white/70 text-xs mt-1">{item.category}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/** Extract thumbnail from YouTube/Vimeo URL */
function getVideoThumb(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;

  // Vimeo – use placeholder since Vimeo thumbnails require API
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return '/placeholder.svg';

  return '/placeholder.svg';
}

export default Gallery;
