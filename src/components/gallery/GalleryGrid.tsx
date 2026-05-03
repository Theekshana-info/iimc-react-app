import { GalleryImage } from '@/hooks/useGallery';
import { ImageCard } from './ImageCard';

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

export const GalleryGrid = ({ images, onImageClick }: GalleryGridProps) => {
  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No images found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div
      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
      style={{
        columnGap: '1rem',
      }}
    >
      {images.map((image, index) => (
        <ImageCard
          key={image.id}
          image={image}
          onClick={() => onImageClick(index)}
          index={index}
        />
      ))}
    </div>
  );
};
