import { useSetting } from '@/hooks/useSetting';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12">
          <ScrollReveal delay={0} direction="left">
            <Card className="shadow-soft h-full">
              <CardContent className="pt-6">
                <h3 className="text-xl sm:text-2xl font-semibold mb-4">Our Mission</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  To provide a welcoming sanctuary where individuals can explore meditation practices,
                  cultivate mindfulness, and discover inner peace through authentic teachings and community support.
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={100} direction="right">
            <Card className="shadow-soft h-full">
              <CardContent className="pt-6">
                <h3 className="text-xl sm:text-2xl font-semibold mb-4">Our Vision</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  To create a world where more people have access to the transformative power of meditation,
                  leading to greater compassion, awareness, and harmony in daily life.
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={200}>
          <div className="mt-12 sm:mt-16">
            <Card className="shadow-soft overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <h3 className="text-xl sm:text-2xl font-semibold">Our Location</h3>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Visit us at Isipathana International Meditation Center
                  </p>
                </div>
                <div className="aspect-video w-full">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.798654789!2d79.86059!3d6.91342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259665c4e1b6b%3A0x8e5c3e5e5e5e5e5e!2sIsipathana%20International%20Meditation%20Center!5e0!3m2!1sen!2slk!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Isipathana International Meditation Center Location"
                  ></iframe>
                </div>
                <div className="p-4 sm:p-6 bg-muted/30">
                  <a
                    href="https://maps.app.goo.gl/GbqVBgsUCue7Vu8T8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm sm:text-base"
                  >
                    <MapPin className="h-4 w-4" />
                    Open in Google Maps
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
