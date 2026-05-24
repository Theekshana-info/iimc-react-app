import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import Typewriter from 'typewriter-effect';
import heroVideo from '@/assets/hero-video.mp4';
import mobileVideo from '@/assets/mobile-loop.mp4';

export function Hero() {
  const navigate = useNavigate();

  const [showFullTitle, setShowFullTitle] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFullTitle((prev) => !prev);
    }, 4000); // Toggle every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[650px] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden -mt-24 pt-24">
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
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/70 animate-breathe" />
        <div className="absolute top-20 left-[10%] w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[15%] w-40 h-40 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center max-w-4xl w-full px-4 space-y-6 sm:space-y-8 mt-40 sm:mt-0">
        <div className="relative animate-fade-in-up flex justify-center items-center min-h-[160px] sm:min-h-[200px] md:min-h-[250px] w-full">
          <AnimatePresence mode="wait">
            <motion.h1
              key={showFullTitle ? 'full' : 'short'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-black dark:text-foreground drop-shadow-2xl px-4 w-full text-center"
            >
              {showFullTitle ? 'Isipathana International Meditation Center' : 'IIMC'}
            </motion.h1>
          </AnimatePresence>
        </div>

        <div className="animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] min-h-[60px] sm:min-h-[80px] flex items-center justify-center">
          <div className="text-base sm:text-xl md:text-2xl lg:text-3xl text-black dark:text-foreground/90 drop-shadow-lg font-medium text-center flex flex-wrap justify-center items-center gap-x-2">
            <span className="whitespace-pre">Join us on </span>
            <span className="font-bold drop-shadow-md inline-block">
              <Typewriter
                options={{
                  loop: true,
                  delay: 20,
                  deleteSpeed: 10,
                  autoStart: true,
                }}
                onInit={(typewriter) => {
                  typewriter
                    .typeString('<span style="color: #9d4012ff;">a path to true inner peace.</span>')
                    .pauseFor(2500)
                    .deleteAll(10)
                    .typeString('<span style="color: #9d4012ff;">a quest for mental clarity.</span>')
                    .pauseFor(2500)
                    .deleteAll(10)
                    .typeString('<span style="color: #9d4012ff;">an awakening of the mind.</span>')
                    .pauseFor(2500)
                    .deleteAll(10)
                    .typeString('<span style="color: #9d4012ff;">a journey toward daily balance.</span>')
                    .pauseFor(2500)
                    .deleteAll(10)
                    .typeString('<span style="color: #9d4012ff;">a retreat into absolute stillness.</span>')
                    .pauseFor(2500)
                    .deleteAll(10)
                    .typeString('<span style="color: #9d4012ff;">the road to focused mindfulness.</span>')
                    .pauseFor(2500)
                    .deleteAll(10)
                    .typeString('<span style="color: #9d4012ff;">an exploration of your inner self.</span>')
                    .pauseFor(2500)
                    .deleteAll(10)
                    .start();
                }}
              />
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
          <Button
            size="lg"
            className="shadow-glow hover-glow transition-smooth text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
            onClick={() => navigate('/events')}
          >
            Explore Events
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="hover-lift backdrop-blur-sm bg-background/50 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
            onClick={() => navigate('/about')}
          >
            Learn More
          </Button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
