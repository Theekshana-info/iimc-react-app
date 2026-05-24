import image1 from '@/assets/iimc-loby/iimc-loby-1.jpeg';
import image2 from '@/assets/iimc-loby/iimc-loby-2.jpeg';
import image3 from '@/assets/iimc-loby/iimc-loby-3.jpeg';
import image4 from '@/assets/iimc-loby/iimc-loby-4.jpeg';
import image5 from '@/assets/iimc-loby/iimc-loby-5.jpeg';
import image6 from '@/assets/iimc-loby/iimc-loby-6.jpeg';
import image7 from '@/assets/iimc-loby/iimc-loby-7.jpeg';
import image8 from '@/assets/iimc-loby/iimc-loby-8.jpeg';
import image9 from '@/assets/iimc-loby/iimc-loby-9.jpeg';

const images = [image1, image2, image3, image4, image5, image6, image7, image8, image9];

export function ImageMarquee() {
    const trackImages = [...images, ...images];

    return (
        <div className="relative w-full overflow-hidden pb-6">
            <div className="marquee-fade-left" aria-hidden="true" />
            <div className="marquee-fade-right" aria-hidden="true" />

            <div className="marquee-track gap-6 px-4 py-8">
                {trackImages.map((image, index) => (
                    <div
                        key={`${image}-${index}`}
                        className={`marquee-item ${index % 2 === 1 ? 'translate-y-6' : ''}`}
                    >
                        <img
                            src={image}
                            alt={`Lobby image ${index % images.length + 1}`}
                            className="h-40 w-[220px] rounded-2xl object-cover shadow-soft"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
            {/* Bottom fade so grid doesn't cut off abruptly */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
    );
}
