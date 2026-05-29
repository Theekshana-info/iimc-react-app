import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import heroVideo from '@/assets/hero-video.mp4';
import mobileVideo from '@/assets/mobile-loop.mp4';

const phrases = [
  { text: "Find ", highlight: "inner peace" },
  { text: "Begin your ", highlight: "meditation journey" },
  { text: "Discover ", highlight: "mindfulness" },
  { text: "Calm your ", highlight: "mind" },
  { text: "Experience ", highlight: "true serenity" }
];

export function Hero() {
  const navigate = useNavigate();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen max-h-[900px] min-h-[600px] flex flex-col items-center justify-between py-12 sm:py-16 md:py-20 overflow-hidden -mt-24 pt-24">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Desktop Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out hidden sm:block"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Mobile Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out block sm:hidden"
        >
          <source src={mobileVideo} type="video/mp4" />
        </video>
        
        {/* Atmospheric Cinematic Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col justify-between items-center w-full max-w-2xl px-6 sm:px-8">
        {/* Top spacer to push text down under the fixed Header */}
        <div className="h-16 sm:h-20" />

        {/* Text Container (Tagline/Title) */}
        <div className="text-center my-auto py-4">
          {/* Subtitle elevated to primary H1 with fixed height to prevent layout shifts */}
          <div className="min-h-[2.5rem] sm:min-h-[3.5rem] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={phraseIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white/95 leading-tight"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              >
                {phrases[phraseIndex].text}
                <span className="text-sky-300 font-extrabold">{phrases[phraseIndex].highlight}</span>
              </motion.h1>
            </AnimatePresence>
          </div>
        </div>

        {/* Buttons Container - positioned relative to the screen bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full pt-4 pb-4 sm:pb-8"
        >
          <button
            className="bg-sky-400 text-slate-950 font-semibold rounded-full px-8 py-3.5 text-base hover:bg-sky-300 transition-all duration-300 shadow-lg shadow-sky-900/10 w-full sm:w-auto"
            onClick={() => navigate('/events')}
          >
            Explore Events
          </button>
          <button
            className="bg-white text-slate-950 font-semibold rounded-full px-8 py-3.5 text-base hover:bg-white/90 transition-all duration-300 shadow-lg shadow-black/5 w-full sm:w-auto"
            onClick={() => navigate('/about')}
          >
            Learn More
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/60 hover:text-white cursor-pointer transition-colors"
          onClick={() => {
            window.scrollTo({
              top: window.innerHeight - 80,
              behavior: 'smooth'
            });
          }}
        >
          <ChevronDown className="h-8 w-8" />
        </motion.div>
      </motion.div>

      {/* Light blue fade transition at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background via-sky-100/30 dark:via-sky-950/20 to-transparent pointer-events-none" />
    </section>
  );
}
