import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import LocationMap from '@/components/LocationMap';
import { Leaf, Heart, Users, Sun, ArrowRight, ChevronRight, User } from 'lucide-react';

// ── Images ──
import heroImage from '@/assets/iimc-about-page-images/about-page-hero-image.png';
import storyImage from '@/assets/iimc-about-page-images/iimc-loby-1.jpeg';
import hallImage from '@/assets/iimc-about-page-images/iimc-loby-6.jpeg';
import teachingImage from '@/assets/iimc-about-page-images/iimc-loby-2.jpeg';
import practiceImage from '@/assets/iimc-about-page-images/iimc-loby-5.jpeg';
import youthImage from '@/assets/iimc-about-page-images/iimc-loby-3.jpeg';

// ── Journey steps ──
const JOURNEY_STEPS = [
  {
    number: '01',
    title: 'Arrive',
    description: 'Step into a calm, blue-walled space designed to quiet the noise of everyday life the moment you walk through the door.',
  },
  {
    number: '02',
    title: 'Settle In',
    description: 'Find your cushion among the carefully arranged meditation mats. Let the atmosphere gently guide your mind toward stillness.',
  },
  {
    number: '03',
    title: 'Guided Practice',
    description: 'Follow the voice of experienced teachers as they lead you through traditional meditation techniques rooted in centuries of wisdom.',
  },
  {
    number: '04',
    title: 'Learn',
    description: 'Discover the principles behind mindfulness — not as abstract philosophy, but as practical tools for clarity and peace.',
  },
  {
    number: '05',
    title: 'Reflect',
    description: 'Carry the stillness you cultivate here into your daily life. Each visit deepens your practice and understanding.',
  },
];

// ── Values ──
const VALUES = [
  { icon: Leaf, title: 'Mindfulness', description: 'Present-moment awareness as the foundation for a meaningful, awakened life.' },
  { icon: Heart, title: 'Compassion', description: 'Genuine care for every person who walks through our doors, without judgment or condition.' },
  { icon: Users, title: 'Community', description: 'A welcoming space where practitioners support one another on the path to inner peace.' },
  { icon: Sun, title: 'Inner Peace', description: 'The quiet confidence that comes from knowing yourself deeply and living with intention.' },
];

// ── Why people visit ──
const REASONS = [
  { number: '01', title: 'Finding inner peace', description: 'A space to step away from daily pressures and reconnect with what truly matters.' },
  { number: '02', title: 'Learning meditation', description: 'Practical, traditional techniques taught by experienced practitioners in a supportive environment.' },
  { number: '03', title: 'Reducing stress', description: 'Evidence-based mindfulness practices that bring lasting calm to body and mind.' },
  { number: '04', title: 'Joining a community', description: 'Meeting others who share a genuine interest in mindful living and personal growth.' },
  { number: '05', title: 'Developing mindfulness', description: 'Building a sustainable daily practice that transforms how you experience every moment.' },
  { number: '06', title: 'Improving daily life', description: 'Carrying clarity, patience, and compassion from the cushion into your relationships and work.' },
];

export default function About() {
  const navigate = useNavigate();

  const { data: teachers } = useQuery({
    queryKey: ['about-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ═══════════════════════════════════════════════
          SECTION 1 — ABOUT HERO
      ═══════════════════════════════════════════════ */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] min-h-[380px] max-h-[700px] flex items-end overflow-hidden">
        {/* Background image */}
        <img
          src={heroImage}
          alt="IIMC Meditation Hall"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay — heavier at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Text */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-8 pb-12 md:pb-16">
          <ScrollReveal>
            <p className="text-sky-200 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-3">
              About IIMC
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] tracking-tight mb-4">
              A sanctuary for mindfulness<br className="hidden sm:block" /> and inner peace
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-xl leading-relaxed">
              Where ancient wisdom meets modern practice, in the heart of Gandara, Sri Lanka.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2 — OUR STORY
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image */}
            <ScrollReveal direction="left">
              <div className="relative">
                <img
                  src={storyImage}
                  alt="Meditation session at IIMC"
                  className="w-full h-[340px] sm:h-[420px] lg:h-[480px] object-cover rounded-2xl"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>

            {/* Text */}
            <ScrollReveal direction="right">
              <div className="max-w-prose">
                <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
                  Our Story
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-6">
                  Who we are
                </h2>
                <div className="space-y-4 text-muted-foreground text-base sm:text-[1.0625rem] leading-[1.75]">
                  <p>
                    The Isipathana International Meditation Center was founded with a simple purpose: to offer a genuine space where anyone — regardless of age, background, or belief — can discover the transformative power of meditation.
                  </p>
                  <p>
                    Nestled in the peaceful surroundings of Gandara, Sri Lanka, our center is guided by experienced teachers rooted in traditional Buddhist wisdom. We provide practical, contemplative teachings that go beyond theory — helping people cultivate real stillness, clarity, and compassion in their daily lives.
                  </p>
                  <blockquote className="border-l-2 border-primary/40 pl-5 my-6 italic text-foreground/80">
                    "Peace is not something you find at the end of a journey. It is the way you travel."
                  </blockquote>
                  <p>
                    Whether you are taking your first breath of mindfulness or deepening a lifelong practice, IIMC welcomes you as you are.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 3 — THE EXPERIENCE (Journey)
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32 bg-muted/30 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
              The Experience
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-4">
              What a visit looks like
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-14 max-w-xl">
              Every visit to IIMC follows a gentle rhythm — designed to help you leave the outside world behind and settle into stillness.
            </p>
          </ScrollReveal>

          {/* Journey steps */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-px bg-border dark:bg-white/10" />

            <div className="space-y-10 sm:space-y-12">
              {JOURNEY_STEPS.map((step, idx) => (
                <ScrollReveal key={step.number} delay={idx * 80}>
                  <div className="relative flex gap-5 sm:gap-7">
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0 w-[31px] sm:w-[39px] h-[31px] sm:h-[39px] rounded-full border-2 border-primary/30 bg-background flex items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-bold text-primary">{step.number}</span>
                    </div>
                    {/* Content */}
                    <div className="pt-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1.5">{step.title}</h3>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md">{step.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4 — INSIDE OUR CENTER (Editorial photos)
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
              Inside Our Center
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-14">
              A space designed for stillness
            </h2>
          </ScrollReveal>

          {/* Photo 1 — Full-width hero of the hall */}
          <ScrollReveal>
            <figure className="mb-16 md:mb-20">
              <img
                src={hallImage}
                alt="The Meditation Hall at IIMC"
                className="w-full h-[280px] sm:h-[380px] md:h-[460px] object-cover rounded-2xl"
                loading="lazy"
              />
              <figcaption className="mt-4 text-sm text-muted-foreground italic">
                The Meditation Hall — cushions and mats arranged beneath the serene gaze of the Buddha statue, ready for practice.
              </figcaption>
            </figure>
          </ScrollReveal>

          {/* Photo 2 + Text — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-16 md:mb-20">
            <ScrollReveal direction="left">
              <img
                src={teachingImage}
                alt="Community and teachers at IIMC"
                className="w-full h-[280px] sm:h-[340px] object-cover rounded-2xl"
                loading="lazy"
              />
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Guided by Tradition</h3>
                <p className="text-muted-foreground text-base sm:text-[1.0625rem] leading-[1.75] max-w-prose">
                  Our teachers carry forward centuries of Buddhist meditation tradition. Each session is led with patience, warmth, and a deep understanding of the path — making ancient practices accessible to modern minds.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Photo 3 + Text — reversed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-16 md:mb-20">
            <ScrollReveal direction="left" className="order-2 lg:order-1">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Practice in Community</h3>
                <p className="text-muted-foreground text-base sm:text-[1.0625rem] leading-[1.75] max-w-prose">
                  There is something powerful about sitting in stillness together. Our regular sessions bring practitioners of all levels — first-time visitors and experienced meditators alike — into a shared space of calm focus.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" className="order-1 lg:order-2">
              <img
                src={practiceImage}
                alt="Guided meditation practice"
                className="w-full h-[280px] sm:h-[340px] object-cover rounded-2xl"
                loading="lazy"
              />
            </ScrollReveal>
          </div>

          {/* Photo 4 — Full-width of young practitioners */}
          <ScrollReveal>
            <figure>
              <img
                src={youthImage}
                alt="Young practitioners at IIMC"
                className="w-full h-[280px] sm:h-[380px] md:h-[460px] object-cover rounded-2xl"
                loading="lazy"
              />
              <figcaption className="mt-4 text-sm text-muted-foreground italic">
                Young practitioners discovering mindfulness — IIMC welcomes all ages, nurturing the next generation of mindful individuals.
              </figcaption>
            </figure>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5 — MISSION & VISION
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32 bg-muted/30 dark:bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4 text-center">
              Purpose
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-14 text-center">
              Mission &amp; Vision
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-0">
            {/* Mission */}
            <ScrollReveal direction="left">
              <div className="md:pr-12 md:border-r border-border/50">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Our Mission</h3>
                <div className="space-y-3 text-muted-foreground text-base leading-[1.75] max-w-prose">
                  <p>
                    To offer spaces and practical techniques that nurture inner peace, mindful living, and spiritual growth.
                  </p>
                  <p>
                    To welcome all — regardless of age, background, or belief — into a community built on kindness and respect.
                  </p>
                  <p>
                    To inspire people to integrate mindfulness into daily life, so peace is not an escape, but a way of being.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Divider on mobile */}
            <div className="md:hidden border-t border-border/50" />

            {/* Vision */}
            <ScrollReveal direction="right">
              <div className="md:pl-12">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Our Vision</h3>
                <div className="space-y-3 text-muted-foreground text-base leading-[1.75] max-w-prose">
                  <p>
                    To be a sanctuary where every person can step beyond the boundaries of stress, fear, and limitation — and awaken to a life of clarity, compassion, and purpose.
                  </p>
                  <p>
                    True growth occurs when knowledge transforms into experience, and when the mind learns to be still enough for the heart to be heard.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 6 — OUR VALUES
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
              Guiding Principles
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-14">
              What we stand for
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 sm:gap-y-14">
            {VALUES.map((value, idx) => (
              <ScrollReveal key={value.title} delay={idx * 80}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/8 dark:bg-primary/15 flex items-center justify-center mt-0.5">
                    <value.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">{value.title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{value.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 7 — WHY PEOPLE VISIT
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32 bg-muted/30 dark:bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
              Why Visit
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-4">
              Why people come to IIMC
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-14 max-w-xl">
              People arrive for different reasons. They leave with a shared understanding of what it means to be truly present.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 sm:gap-y-12">
            {REASONS.map((reason, idx) => (
              <ScrollReveal key={reason.number} delay={idx * 60}>
                <div>
                  <span className="text-xs font-bold text-primary/50 tracking-widest">{reason.number}</span>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mt-1 mb-2">{reason.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{reason.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 8 — MEET OUR TEACHERS
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
              Our Teachers
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-14">
              Guided by experience
            </h2>
          </ScrollReveal>

          {teachers && teachers.length > 0 ? (
            <div className="space-y-12 md:space-y-14">
              {teachers.map((teacher: any, idx: number) => (
                <ScrollReveal key={teacher.id} delay={idx * 100}>
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                    {/* Portrait */}
                    <div className="flex-shrink-0">
                      {teacher.image_url ? (
                        <img
                          src={teacher.image_url}
                          alt={teacher.name}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-muted flex items-center justify-center">
                          <User className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">{teacher.name}</h3>
                      {teacher.role && (
                        <p className="text-primary text-sm font-medium mt-0.5 mb-2">{teacher.role}</p>
                      )}
                      {teacher.bio && (
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-3 mb-3">
                          {teacher.bio}
                        </p>
                      )}
                      <button
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View Profile <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}

              <ScrollReveal>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="group rounded-full px-6"
                    onClick={() => navigate('/teachers')}
                  >
                    View All Teachers
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          ) : (
            <ScrollReveal>
              <p className="text-muted-foreground">
                Our teachers are the heart of IIMC.{' '}
                <button onClick={() => navigate('/teachers')} className="text-primary hover:underline">
                  Meet them here →
                </button>
              </p>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 9 — VISIT OUR SANCTUARY
      ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 lg:py-32 bg-muted/30 dark:bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <ScrollReveal>
            <p className="text-primary text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase mb-4">
              Location
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-4">
              Visit our sanctuary
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-10 max-w-xl">
              Located in the peaceful town of Gandara, Sri Lanka, our center is easy to find and always welcoming. We look forward to receiving you.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <LocationMap />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 10 — FINAL INVITATION
      ═══════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-5">
              Begin your journey toward inner peace
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto">
              Whether you are a first-time visitor or a returning practitioner, there is always a place for you at IIMC.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="rounded-full px-8"
                onClick={() => navigate('/events')}
              >
                View Upcoming Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                onClick={() => navigate('/contact')}
              >
                Contact Us
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
