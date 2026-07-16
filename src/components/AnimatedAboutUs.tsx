import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ScrollReveal';

// Import loby images (fixed set of 6)
import loby1 from '@/assets/iimc-loby/iimc-loby-1.jpeg';
import loby2 from '@/assets/iimc-loby/iimc-loby-2.jpeg';
import loby3 from '@/assets/iimc-loby/iimc-loby-3.jpeg';
import loby4 from '@/assets/iimc-loby/iimc-loby-4.jpeg';
import loby5 from '@/assets/iimc-loby/iimc-loby-5.jpeg';
import loby6 from '@/assets/iimc-loby/iimc-loby-6.jpeg';

const DISPLAY_IMAGES = [loby1, loby2, loby3, loby4, loby5, loby6];

const TESTIMONIALS = [
  {
    text: "IIMC's serene meditation hall and the guidance of our teachers transformed my practice. I found a depth of inner peace I never thought possible.",
    author: "A Grateful Meditator",
  },
  {
    text: "Rooted in traditional wisdom and guided by experienced teachers, IIMC provides a welcoming space where individuals can slow down and reconnect with themselves.",
    author: "IIMC Community",
  },
  {
    text: "The retreats at Isipathana are life-changing. Every session helped me cultivate mindfulness and carry that stillness into my daily life.",
    author: "Retreat Participant",
  },
  {
    text: "From the moment I stepped into the meditation center, I felt embraced by calm. The atmosphere and teachings at IIMC are truly extraordinary.",
    author: "First-time Visitor",
  },
];

// ── Image positions for desktop (right side of card) ──
const DESKTOP_IMAGE_POSITIONS = [
  { top: '-8%', left: '22%', width: '180px', height: '200px', rotate: -3, zIndex: 30, featured: true, animDuration: '4s', animDelay: '0s' },
  { top: '-4%', left: '68%', width: '110px', height: '120px', rotate: 5, zIndex: 20, featured: false, animDuration: '5s', animDelay: '0.5s' },
  { top: '15%', left: '88%', width: '120px', height: '135px', rotate: -4, zIndex: 20, featured: false, animDuration: '4.5s', animDelay: '1s' },
  { top: '55%', left: '5%', width: '115px', height: '125px', rotate: 4, zIndex: 20, featured: false, animDuration: '5.5s', animDelay: '1.5s' },
  { top: '52%', left: '38%', width: '125px', height: '135px', rotate: -2, zIndex: 25, featured: false, animDuration: '4s', animDelay: '0.8s' },
  { top: '60%', left: '75%', width: '120px', height: '140px', rotate: 6, zIndex: 20, featured: false, animDuration: '5s', animDelay: '1.2s' },
];

// ── Image positions for mobile (top portion of card) ──
const MOBILE_IMAGE_POSITIONS = [
  // Row 1 — three images across
  { top: '2%', left: '3%', width: '90px', height: '95px', rotate: -3, zIndex: 20, featured: false, animDuration: '4s', animDelay: '0s' },
  { top: '0%', left: '36%', width: '85px', height: '90px', rotate: 3, zIndex: 20, featured: false, animDuration: '5s', animDelay: '0.4s' },
  { top: '3%', left: '68%', width: '88px', height: '92px', rotate: -2, zIndex: 20, featured: false, animDuration: '4.5s', animDelay: '0.8s' },
  // Row 2 — three images across
  { top: '42%', left: '5%', width: '85px', height: '90px', rotate: 2, zIndex: 20, featured: false, animDuration: '5.5s', animDelay: '1s' },
  { top: '44%', left: '35%', width: '90px', height: '95px', rotate: -3, zIndex: 20, featured: false, animDuration: '4s', animDelay: '0.6s' },
  { top: '40%', left: '66%', width: '88px', height: '92px', rotate: 4, zIndex: 20, featured: false, animDuration: '5s', animDelay: '1.2s' },
];

// Testimonial text animation (only text changes, not images)
const textVariants = {
  enter: { opacity: 0, y: 20, filter: 'blur(4px)' },
  center: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, filter: 'blur(4px)', transition: { duration: 0.4, ease: 'easeIn' } },
};

// Pure CSS floating images — no framer-motion, so they never re-render or re-mount
function FloatingImages({ positions }: { positions: typeof DESKTOP_IMAGE_POSITIONS }) {
  return (
    <>
      {positions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute about-float-img"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
            height: pos.height,
            zIndex: pos.zIndex,
            animationDuration: pos.animDuration,
            animationDelay: pos.animDelay,
          }}
        >
          <div
            className="w-full h-full rounded-xl overflow-hidden shadow-xl ring-1 ring-white/20"
            style={{ transform: `rotate(${pos.rotate}deg)` }}
          >
            <img
              src={DISPLAY_IMAGES[idx]}
              alt={`IIMC Gallery ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </>
  );
}

export function AnimatedAboutUs() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-cycle testimonials only
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          {/* ── DESKTOP LAYOUT ── */}
          <div className="hidden md:block">
            <div
              className="relative rounded-3xl overflow-visible"
              style={{ minHeight: '420px' }}
            >
              {/* Card background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 dark:from-sky-700 dark:via-sky-800 dark:to-blue-900 shadow-2xl shadow-sky-500/20" />

              {/* Content grid */}
              <div className="relative z-10 grid grid-cols-2" style={{ minHeight: '420px' }}>
                {/* Left: Testimonial text */}
                <div className="flex flex-col justify-center px-10 lg:px-14 py-12">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white/90 mb-5 w-fit backdrop-blur-sm">
                    About Us
                  </span>

                  <div className="min-h-[180px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTestimonial}
                        variants={textVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                      >
                        <p className="text-xl lg:text-2xl font-bold text-white leading-snug mb-5">
                          "{TESTIMONIALS[currentTestimonial].text}"
                        </p>
                        <p className="text-sm text-sky-100/80 font-medium">
                          — {TESTIMONIALS[currentTestimonial].author}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-6">
                    <Button
                      variant="outline"
                      className="group rounded-full px-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                      onClick={() => navigate('/about')}
                    >
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>

                {/* Right: Floating images area (pure CSS, never re-renders) */}
                <div className="relative" style={{ minHeight: '420px' }}>
                  <FloatingImages positions={DESKTOP_IMAGE_POSITIONS} />
                </div>
              </div>

              {/* Testimonial dots */}
              <div className="absolute bottom-5 left-10 lg:left-14 flex gap-2 z-20">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentTestimonial
                        ? 'bg-white w-6'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── MOBILE LAYOUT ── */}
          <div className="md:hidden">
            <div
              className="relative rounded-3xl overflow-visible"
              style={{ minHeight: '580px' }}
            >
              {/* Card background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 dark:from-sky-700 dark:via-sky-800 dark:to-blue-900 shadow-2xl shadow-sky-500/20" />

              {/* Content stacked */}
              <div className="relative z-10 flex flex-col" style={{ minHeight: '580px' }}>
                {/* Top: Floating images area (pure CSS, never re-renders) */}
                <div className="relative" style={{ height: '280px' }}>
                  <FloatingImages positions={MOBILE_IMAGE_POSITIONS} />
                </div>

                {/* Bottom: Testimonial text */}
                <div className="flex flex-col justify-center px-6 pb-10 pt-2">
                  <div className="min-h-[160px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTestimonial}
                        variants={textVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                      >
                        <p className="text-lg font-bold text-white leading-snug mb-4">
                          "{TESTIMONIALS[currentTestimonial].text}"
                        </p>
                        <p className="text-xs text-sky-100/80 font-medium">
                          — {TESTIMONIALS[currentTestimonial].author}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between mt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="group rounded-full px-5 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                      onClick={() => navigate('/about')}
                    >
                      Learn More
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>

                    {/* Testimonial dots */}
                    <div className="flex gap-2">
                      {TESTIMONIALS.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentTestimonial(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx === currentTestimonial
                              ? 'bg-white w-5'
                              : 'bg-white/40 hover:bg-white/60'
                          }`}
                          aria-label={`Testimonial ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
