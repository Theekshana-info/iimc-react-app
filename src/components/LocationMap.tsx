import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Compass, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'sonner';

export default function LocationMap() {
  const { theme } = useTheme();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const address = "Isipathana International Meditation Center (IIMC), Gandara, Sri Lanka";
  const coordinates = "5.9410472, 80.5716998";
  const googleMapsUrl = "https://maps.app.goo.gl/udmAByvUPiBfzuxs7";
  const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=5.9410472,80.5716998";

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  const handleCopyCoords = async () => {
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopiedCoords(true);
      toast.success("Coordinates copied to clipboard");
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch (err) {
      toast.error("Failed to copy coordinates");
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 mt-12 sm:mt-16">
      {/* Upper Main Card containing Split-Screen Map & Info */}
      <Card className="shadow-soft overflow-hidden border-0 neu-raised bg-background/60 backdrop-blur-md">
        <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Panel: Glassmorphic Information (5 columns on large screens) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-primary/5 via-transparent to-primary/5 border-r border-slate-200/20 dark:border-slate-800/20">
            <div>
              {/* Header Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4 border border-primary/20">
                <Sparkles className="h-3 w-3" />
                <span>Spiritual Sanctuary</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                Our Sanctuary
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed">
                A serene sanctuary for mindfulness, meditation, and inner peace in Gandara.
              </p>

              {/* Info Rows */}
              <div className="space-y-5">
                {/* Address Row */}
                <div className="flex gap-3 items-start group">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Address</div>
                    <p className="text-sm font-medium text-foreground leading-snug">{address}</p>
                    <button
                      onClick={handleCopyAddress}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-all"
                    >
                      {copiedAddress ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied address</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy address</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Coordinates Row */}
                <div className="flex gap-3 items-start group">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">GPS Coordinates</div>
                    <p className="text-sm font-medium text-foreground tracking-wide">{coordinates}</p>
                    <button
                      onClick={handleCopyCoords}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-all"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied coordinates</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy coordinates</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-200/20 dark:border-slate-800/20 flex flex-col sm:flex-row gap-3">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                <span>Get Directions</span>
                <Compass className="h-4 w-4" />
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-primary/20 hover:bg-primary/10 text-primary font-semibold transition-all duration-300 hover:-translate-y-0.5"
              >
                <span>View Google Maps</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Panel: Styled Interactive Map View (7 columns) */}
          <div className="lg:col-span-7 h-[380px] sm:h-[450px] lg:h-full min-h-[380px] w-full relative group overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200/20 dark:border-slate-800/20">
            {/* Elegant glassmorphic floating control badge on top-right */}
            <div className="absolute top-4 right-4 z-10 bg-background/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/30 dark:border-slate-700/30 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Location Active</span>
            </div>

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3968.4239845700516!2d80.56951111538356!3d5.941047199999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae139004ad5c299%3A0xe8e377d526693cf4!2sIsipathana+International+Meditation+Center+(IIMC)!5e0!3m2!1sen!2slk!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Isipathana International Meditation Center Location"
              className={`w-full h-full border-0 transition-all duration-700 select-none ${
                theme === 'dark'
                  ? 'invert-[90%] hue-rotate-[180deg] brightness-[95%] contrast-[92%] saturate-[1.1]'
                  : 'grayscale-[15%] contrast-[1.08] brightness-[102%] saturate-[0.85]'
              }`}
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
