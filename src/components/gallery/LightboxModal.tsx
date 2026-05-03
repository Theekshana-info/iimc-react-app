import { useEffect, useState } from 'react';
import { GalleryImage } from '@/hooks/useGallery';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface LightboxModalProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export const LightboxModal = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
}: LightboxModalProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onIndexChange(currentIndex + 1);
    }
  };

  useKeyboardNav({
    isOpen,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onClose,
  });

  // Touch/swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      handleNext();
    } else if (isRightSwipe && hasPrevious) {
      handlePrevious();
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = `${currentImage.alt}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image download started');
  };

  const handleShare = async () => {
    if (!currentImage) return;

    const shareData = {
      title: currentImage.alt,
      text: `Check out this image: ${currentImage.alt}`,
      url: window.location.href + `?image=${currentImage.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard');
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] p-0 animate-lightbox-fade-zoom"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Navigation buttons */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={handlePrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* Image */}
        <div className="flex items-center justify-center min-h-[60vh] max-h-[70vh] bg-black">
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Caption area */}
        <div className="bg-background p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-semibold">{currentImage.alt}</h2>
              
              {currentImage.photographer && (
                <p className="text-sm text-muted-foreground">
                  By {currentImage.photographer}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground">
                {new Date(currentImage.date).toLocaleDateString()}
              </p>

              {currentImage.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {currentImage.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                aria-label="Download image"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                aria-label="Share image"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} of {images.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
