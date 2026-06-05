import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Typewriter from 'typewriter-effect';
import heroVideo from '@/assets/hero-video.mp4';
import mobileVideo from '@/assets/mobile-loop.mp4';

export function Hero() {
  const navigate = useNavigate();
  const [isMobileVideo, setIsMobileVideo] = useState<boolean | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Detect which video format to load (mobile vs desktop)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    setIsMobileVideo(mql.matches);
    
    const listener = (e: MediaQueryListEvent) => {
      setIsMobileVideo(e.matches);
    };
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  // Safe fallback to auto-dismiss loader if video loading is slow, blocked, or not starting
  useEffect(() => {
    const timeout = setTimeout(() => {
      setVideoLoaded(true);
    }, 6000); // 6 seconds safety timeout
    return () => clearTimeout(timeout);
  }, []);

  // Control overlay fade-out and manage body scrolling
  useEffect(() => {
    if (videoLoaded) {
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 600); // Wait for exit animation to complete
      return () => clearTimeout(timer);
    }
  }, [videoLoaded]);

  useEffect(() => {
    if (showOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showOverlay]);

  return (
    <section className="relative h-[100svh] max-h-[900px] min-h-[480px] sm:min-h-[600px] flex flex-col items-center justify-between pt-24 pb-[calc(52px+env(safe-area-inset-bottom,0px)+12px)] lg:pb-20 overflow-hidden -mt-24">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {isMobileVideo !== null && (
          <video
            key={isMobileVideo ? 'mobile' : 'desktop'}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
              videoLoaded ? 'blur-0 scale-100' : 'blur-2xl scale-110'
            }`}
          >
            <source src={isMobileVideo ? mobileVideo : heroVideo} type="video/mp4" />
          </video>
        )}

        {/* Atmospheric Cinematic Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col justify-between items-center w-full max-w-2xl px-6 sm:px-8">
        {/* Top spacer to push text down under the fixed Header */}
        <div className="h-16 sm:h-20" />

        {/* Text Container (Tagline/Title) */}
        <div className="text-center my-auto py-4 flex flex-col items-center justify-center">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-sky-200 tracking-widest mb-2 uppercase"
            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
          >
            IIMC
          </h1>

          {/* Elegant Glowing Divider */}
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-sky-200/80 to-transparent my-5 shadow-[0_0_12px_rgba(125,211,252,0.7)]" />

          <div
            className="min-h-[4rem] sm:min-h-[3rem] text-xl sm:text-2xl md:text-3xl font-['Cormorant_Garamond',serif] italic font-semibold text-sky-300 tracking-wider max-w-xl mx-auto leading-relaxed"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
          >
            <Typewriter
              options={{
                strings: [
                  "Breathe. Relax. Renew.",
                  "Calm Mind. Peaceful Life.",
                  "Be Present. Be Peaceful.",
                  "Pause. Breathe. Flourish.",
                  "Find Peace Within.",
                  "Live Mindfully.",
                  "Embrace Stillness.",
                  "Journey to Inner Peace.",
                  "Serenity Starts Here."
                ],
                autoStart: true,
                loop: true,
                delay: 35,
                deleteSpeed: 5,
                cursorClassName: "text-sky-500 font-light not-italic animate-pulse ml-1 text-[1.6em] font-sans inline-block align-middle relative -translate-y-[5.5px]"
              }}
            />
          </div>
        </div>

        {/* Buttons & Scroll Indicator Group */}
        <div className="w-full flex flex-col items-center gap-4 sm:gap-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full"
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

          {/* Scroll Indicator (Nested inside flex container to prevent overlap on all screen sizes) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="flex flex-col items-center cursor-pointer text-white/60 hover:text-white transition-colors"
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight - 80,
                behavior: 'smooth'
              });
            }}
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-7 w-7" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Light blue fade transition at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background via-sky-100/30 dark:via-sky-950/20 to-transparent pointer-events-none" />

      {/* Premium Glassmorphic Loading Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xl pointer-events-auto"
          >
            <div className="relative flex flex-col items-center max-w-md px-6 text-center">
              {/* Concentric Breathing & Spinning Rings */}
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                {/* Outermost pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-sky-400/20 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                  animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Middle fast-spinning gradient ring */}
                <motion.div
                  className="absolute w-20 h-20 rounded-full border-t-2 border-r-2 border-transparent border-sky-400"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                {/* Inner breathing glowing core */}
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-[0_0_20px_rgba(56,189,248,0.6)]"
                  animate={{
                    scale: [0.85, 1.1, 0.85],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Glowing IIMC Text */}
              <h2 className="text-4xl font-extrabold text-sky-200 tracking-[0.2em] uppercase mb-4 font-sans select-none">
                IIMC
              </h2>
              
              {/* Loading Status Indicator */}
              <div className="h-8 flex items-center justify-center">
                <motion.p
                  className="text-sky-300/90 font-['Cormorant_Garamond',serif] italic text-2xl tracking-wider select-none"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  Loading serenity...
                </motion.p>
              </div>
              
              <p className="text-xs text-slate-400 mt-8 tracking-[0.15em] uppercase select-none opacity-80">
                Entering a space of mindfulness
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
