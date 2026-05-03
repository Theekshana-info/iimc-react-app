import { useState } from 'react';
import { GalleryImage } from '@/hooks/useGallery';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ImageCardProps {
  image: GalleryImage;
  onClick: () => void;
  index: number;
}

export const ImageCard = ({ image, onClick, index }: ImageCardProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer break-inside-avoid mb-4 hover-scale animate-staggered-fade-up"
      style={{
        animationDelay: `${(index % 20) * 50}ms`,
        opacity: 0,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className="relative"
        style={{ paddingBottom: `${(image.height / image.width) * 100}%` }}
      >
        {/* Placeholder blur */}
        {image.placeholder && !loaded && (
          <img
            src={image.placeholder}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
            aria-hidden="true"
          />
        )}
        
        {/* Skeleton pulse while loading */}
        {!loaded && !error && (
          <div className="absolute inset-0 bg-muted animate-skeleton-pulse" />
        )}

        {/* Main image */}
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${error ? 'hidden' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            Failed to load image
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-semibold text-sm mb-2">{image.alt}</h3>
            {image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {image.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {image.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{image.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
