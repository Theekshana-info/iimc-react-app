import { useSetting } from '@/hooks/useSetting';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ScrollReveal';
import { motion } from 'framer-motion';
import LocationMap from '@/components/LocationMap';
import image1 from '@/assets/iimc-about-page-images/iimc-loby-1.jpeg';
import image2 from '@/assets/iimc-about-page-images/iimc-loby-2.jpeg';
import image3 from '@/assets/iimc-about-page-images/iimc-loby-3.jpeg';
import image4 from '@/assets/iimc-about-page-images/iimc-loby-4.jpeg';
import image5 from '@/assets/iimc-about-page-images/iimc-loby-5.jpeg';
import image6 from '@/assets/iimc-about-page-images/iimc-loby-6.jpeg';
import image7 from '@/assets/iimc-about-page-images/iimc-loby-7.jpeg';
import image8 from '@/assets/iimc-about-page-images/iimc-loby-8.jpeg';
import image9 from '@/assets/iimc-about-page-images/iimc-loby-9.jpeg';
import image10 from '@/assets/iimc-about-page-images/iimc-loby-10.jpeg';
import image11 from '@/assets/iimc-about-page-images/iimc-loby-11.jpeg';
import image12 from '@/assets/iimc-about-page-images/iimc-loby-12.jpeg';
import image13 from '@/assets/iimc-about-page-images/iimc-loby-13.jpeg';

const aboutImages = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
  image10,
  image11,
  image12,
];

export default function About() {
  const { value: title } = useSetting('about_title');
  const { value: content } = useSetting('about_content');

  return (
    <div className="min-h-screen py-12 sm:py-20">
      <div className="container px-4 max-w-4xl">
        <ScrollReveal>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 sm:mb-6">
            {title}
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-base sm:text-lg text-muted-foreground text-center mb-8 sm:mb-12">
            {content}
          </p>
        </ScrollReveal>
      </div>

      <div className="container px-4 max-w-6xl">
        <div className="about-gallery">
          {aboutImages.map((image, index) => (
            <motion.div
              key={`${image}-${index}`}
              className="about-gallery-item"
              initial={{ opacity: 0, y: 70, scale: 0.93, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.8,
                delay: (index % 3) * 0.12, // Beautiful cascading delay
                ease: [0.16, 1, 0.3, 1] // Smooth cinematic ease-out
              }}
            >
              <img
                src={image}
                alt={`About gallery image ${index + 1}`}
                className="about-float about-gallery-image transition-all duration-500 hover:scale-105 hover:shadow-xl hover:z-10 cursor-pointer"
                style={{
                  animationDelay: `${index * 0.25}s`,
                  animationDuration: `${6 + (index % 4)}s`,
                }}
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container px-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12">
          <ScrollReveal delay={0} direction="left">
            <Card className="shadow-soft h-full">
              <CardContent className="pt-6">
                <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Our Mission</h3>
                <div className="text-muted-foreground text-sm sm:text-base space-y-3 text-center">
                  <p>
                    To offer spaces and practical techniques that nurture inner peace, mindful living, and spiritual growth.
                  </p>
                  <p>
                    To welcome all regardless of age, background, or belief into a community built on kindness and respect.
                  </p>
                  <p>
                    To inspire people to integrate mindfulness into daily life, so peace is not an escape, but a way of being.
                  </p>
                  <p>
                    Here, every breath is a step towards awakening, and every person&apos;s journey is honored as unique and sacred.
                  </p>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={100} direction="right">
            <Card className="shadow-soft h-full">
              <CardContent className="pt-6">
                <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Our Vision</h3>
                <div className="text-muted-foreground text-sm sm:text-base space-y-3 text-center">
                  <p>
                    Vision is not just about teaching meditation; it is about creating a living space for transformation. We believe that true growth occurs when knowledge is transformed into experience, and when the mind learns to be still enough for the heart to be heard.
                  </p>
                  <p>
                    To be a sanctuary where every person can step beyond the boundaries of stress, fear, and limitation, and awaken to a life of clarity, compassion, and purpose.
                  </p>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={200}>
          <LocationMap />
        </ScrollReveal>
      </div>
    </div>
  );
}
