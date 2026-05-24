import { Link } from 'react-router-dom';
import { useSetting } from '@/hooks/useSetting';
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
  const { value: email } = useSetting('contact_email');
  const { value: phone } = useSetting('contact_phone');

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
    <footer className="mt-20 neu-raised rounded-3xl pt-8 pb-4 mx-4 sm:mx-6 lg:mx-8 mb-6">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <ScrollReveal>
            <div>
              <div className="flex items-center gap-3 mb-4">
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
                >IIMC</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Isipathana International Meditation Center - A sanctuary for mindfulness, meditation, and inner peace.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-smooth">About Us</Link></li>
                <li><Link to="/events" className="text-muted-foreground hover:text-primary transition-smooth">Events</Link></li>
                <li><Link to="/teachers" className="text-muted-foreground hover:text-primary transition-smooth">Teachers</Link></li>
                <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-smooth">Blog</Link></li>
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
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

          <ScrollReveal delay={300}>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{email}</li>
                <li>{phone}</li>
              </ul>
            </div>
          </ScrollReveal>
        </div>

        {socialLinks && socialLinks.length > 0 && (
          <ScrollReveal>
            <div className="mt-8 p-8 neu-inset rounded-2xl">
              <h4 className="font-semibold mb-6 text-center">Follow Us</h4>
              <div className="flex justify-center gap-6 flex-wrap">
                {socialLinks.map((link) => {
                  const Icon = iconMap[link.icon_name.toLowerCase()] || Facebook;
                  return (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
                      <Icon className="h-5 w-5" />
                      <span className="hidden sm:inline">{link.platform}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <div className="mt-12 text-center text-sm text-muted-foreground font-medium">
            <p>&copy; {new Date().getFullYear()} Isipathana International Meditation Center (IIMC). All rights reserved.</p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
