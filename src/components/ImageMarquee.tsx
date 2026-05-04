import image1 from '@/assets/iimc-loby/iimc-loby-1.png';
import image2 from '@/assets/iimc-loby/iimc-loby-2.png';
import image3 from '@/assets/iimc-loby/iimc-loby-3.png';
import image4 from '@/assets/iimc-loby/iimc-loby-4.png';
import image5 from '@/assets/iimc-loby/iimc-loby-5.png';
import image6 from '@/assets/iimc-loby/iimc-loby-6.png';
import image7 from '@/assets/iimc-loby/iimc-loby-7.png';
import image8 from '@/assets/iimc-loby/iimc-loby-8.png';
import image9 from '@/assets/iimc-loby/iimc-loby-9.png';

const images = [image1, image2, image3, image4, image5, image6, image7, image8, image9];

export function ImageMarquee() {
    const trackImages = [...images, ...images];

    return (
        <div className="relative w-full overflow-hidden">
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
        </div>
    );
}
