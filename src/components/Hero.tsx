import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Typewriter from 'typewriter-effect';
import heroVideo from '@/assets/hero-video.mp4';
import mobileVideo from '@/assets/mobile-loop.mp4';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative h-[100svh] max-h-[900px] min-h-[480px] sm:min-h-[600px] flex flex-col items-center justify-between pt-24 pb-[calc(52px+env(safe-area-inset-bottom,0px)+12px)] lg:pb-20 overflow-hidden -mt-24">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Desktop Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover hidden sm:block"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Mobile Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover block sm:hidden"
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
    </section>
  );
}
