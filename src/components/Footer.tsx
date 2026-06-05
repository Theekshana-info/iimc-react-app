import { Link } from 'react-router-dom';
import { CONTACT_INFO } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Youtube, Instagram, Twitter, Linkedin } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import iimcLogo from '@/assets/iimc-logo.jpg';

const iconMap: Record<string, any> = {
  facebook: Facebook,
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
};

export function Footer() {
  const email = CONTACT_INFO.email;
  const phone = CONTACT_INFO.phone;

  const { data: socialLinks } = useQuery({
    queryKey: ['social-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <footer className="relative z-10 mt-16 mb-24 lg:mb-6 mx-4 sm:mx-6 lg:mx-8 neu-raised rounded-3xl">
      <div className="container px-6 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <ScrollReveal>
              <div className="flex items-center gap-3">
                <img
                  src={iimcLogo}
                  alt="IIMC Logo"
                  className="h-10 w-10 rounded-full object-cover neu-inset p-0.5"
                />
                <h3
                  className="font-semibold text-lg"
                  style={{
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  IIMC
                </h3>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={50}>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Isipathana International Meditation Center - A sanctuary for mindfulness, meditation, and inner peace.
              </p>
            </ScrollReveal>

            {/* Social Links Row */}
            {socialLinks && socialLinks.length > 0 && (
              <ScrollReveal delay={100}>
                <div className="flex flex-wrap gap-3 pt-2">
                  {socialLinks.map((link) => {
                    const Icon = iconMap[link.icon_name.toLowerCase()] || Facebook;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full neu-inset text-muted-foreground hover:text-primary hover:shadow-glow transition-all duration-300 flex items-center justify-center"
                        aria-label={link.platform}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </ScrollReveal>
            )}
          </div>

          {/* Quick Links Column */}
          <div className="col-span-1">
            <ScrollReveal delay={150}>
              <div>
                <h4 className="font-semibold text-sm md:text-base mb-4 text-foreground">Quick Links</h4>
                <ul className="space-y-2.5 text-xs md:text-sm">
                  <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-smooth">About Us</Link></li>
                  <li><Link to="/events" className="text-muted-foreground hover:text-primary transition-smooth">Events</Link></li>
                  <li><Link to="/teachers" className="text-muted-foreground hover:text-primary transition-smooth">Teachers</Link></li>
                  <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-smooth">Blog</Link></li>
                </ul>
              </div>
            </ScrollReveal>
          </div>

          {/* Support Column */}
          <div className="col-span-1">
            <ScrollReveal delay={200}>
              <div>
                <h4 className="font-semibold text-sm md:text-base mb-4 text-foreground">Support</h4>
                <ul className="space-y-2.5 text-xs md:text-sm">
                  <li><Link to="/donate" className="text-muted-foreground hover:text-primary transition-smooth">Donate</Link></li>
                  <li>
                    <Link to="/terms" className="text-muted-foreground hover:text-primary transition-smooth">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-smooth">Contact</Link></li>
                </ul>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Column */}
          <div className="col-span-2 md:col-span-1">
            <ScrollReveal delay={250}>
              <div>
                <h4 className="font-semibold text-sm md:text-base mb-4 text-foreground">Contact</h4>
                <ul className="space-y-2.5 text-xs md:text-sm text-muted-foreground">
                  <li className="break-all">{email}</li>
                  <li>{phone}</li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>

        <hr className="border-border/60 my-8" />

        {/* Bottom Section */}
        <ScrollReveal delay={300}>
          <div className="text-center text-xs text-muted-foreground font-medium">
            <p>&copy; {new Date().getFullYear()} Isipathana International Meditation Center (IIMC). All rights reserved.</p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
