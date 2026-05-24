import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useSetting } from '@/hooks/useSetting';
import { ShieldCheck, ArrowUp, Mail, Phone, ChevronRight } from 'lucide-react';

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const { value: email } = useSetting('contact_email');
  const { value: phone } = useSetting('contact_phone');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sections = [
    { id: 'intro', title: '1. Introduction & Acceptance' },
    { id: 'about', title: '2. About IIMC' },
    { id: 'accounts', title: '3. User Accounts' },
    { id: 'events', title: '4. Event Registrations' },
    { id: 'payments', title: '5. Payments & PayHere' },
    { id: 'refunds', title: '6. Refund & Cancellation Policy' },
    { id: 'donations', title: '7. Donations' },
    { id: 'delivery', title: '8. Delivery of Services' },
    { id: 'privacy', title: '9. Privacy & Data Collection' },
    { id: 'use', title: '10. Acceptable Use' },
    { id: 'liability', title: '11. Limitation of Liability' },
    { id: 'changes', title: '12. Changes to Terms' },
    { id: 'contact', title: '13. Contact Information' },
    { id: 'law', title: '14. Governing Law' },
  ];

  return (
    <div className="min-h-screen py-12 sm:py-20 gradient-hero bg-background">
      <div className="container px-4 max-w-4xl">
        <ScrollReveal>
          <div className="text-center mb-8">
            <ShieldCheck className="h-14 w-14 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">Terms & Conditions</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: May 24, 2026
            </p>
          </div>
        </ScrollReveal>

        {/* Table of Contents */}
        <ScrollReveal delay={100}>
          <Card className="shadow-soft mb-8 bg-muted/30">
            <CardHeader className="py-4 px-6 border-b border-border/50">
              <CardTitle className="text-lg font-semibold">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-medium">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className="flex items-center text-left hover:text-primary text-muted-foreground transition-colors py-1 group"
                  >
                    <ChevronRight className="h-4 w-4 mr-1 text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Terms Content */}
        <ScrollReveal delay={150}>
          <Card className="shadow-glow overflow-hidden">
            <CardContent className="p-6 sm:p-10 space-y-10 text-muted-foreground leading-relaxed text-sm sm:text-base">
              
              {/* 1. Introduction & Acceptance */}
              <section id="intro" className="space-y-3 pt-4 border-t border-border/20 first:border-t-0 first:pt-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  1. Introduction & Acceptance
                </h2>
                <p>
                  Welcome to the website of Isipathana International Meditation Center (IIMC). By using this website, creating an account, registering for events, or making donations, you agree to comply with and be bound by the following Terms & Conditions. If you do not agree with any part of these terms, you must not access or use our services.
                </p>
              </section>

              {/* 2. About IIMC */}
              <section id="about" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  2. About IIMC
                </h2>
                <p>
                  IIMC (Isipathana International Meditation Center) is a spiritual and meditation center located in Sri Lanka. Our purpose is to provide peaceful spaces, wisdom teachings, and practical mindfulness and meditation techniques to nurture spiritual growth, inner peace, and compassionate living within our community.
                </p>
              </section>

              {/* 3. User Accounts */}
              <section id="accounts" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  3. User Accounts
                </h2>
                <p>
                  To register for specific events or access customized profile features, you may need to create an account. You represent and warrant that the information you provide is accurate, current, and complete. You are responsible for keeping your credentials confidential and secure. A verified email address is mandatory for event registration and payment processing.
                </p>
              </section>

              {/* 4. Event Registrations */}
              <section id="events" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  4. Event Registrations
                </h2>
                <p>
                  You can register for meditation courses, workshops, and retreats via our Events page. For paid events, your registration is only confirmed and secured once we receive a successful payment transaction. Event capacity is limited, and slots are filled on a first-come, first-served basis. IIMC reserves the right to cancel, reschedule, or change the venue of an event due to weather, local restrictions, or other unforeseen events.
                </p>
              </section>

              {/* 5. Payments & PayHere */}
              <section id="payments" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  5. Payments & PayHere Gateway
                </h2>
                <p>
                  All online payments made on our site (for donations or paid events) are processed securely in Sri Lankan Rupees (LKR) by **PayHere Payment Gateway**, a PCI-DSS compliant third-party processor. IIMC does not store, handle, or possess your credit/debit card numbers or bank information directly. By proceeding to payment, you agree to be bound by PayHere’s terms and conditions. Learn more about PayHere at{' '}
                  <a 
                    href="https://www.payhere.lk" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary underline hover:opacity-80"
                  >
                    https://www.payhere.lk
                  </a>.
                </p>
              </section>

              {/* 6. Refund & Cancellation Policy */}
              <section id="refunds" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  6. Refund & Cancellation Policy
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Event Registrations:</strong> Fees paid for event registrations are non-refundable, except in cases where IIMC cancels the event in its entirety.
                  </li>
                  <li>
                    <strong>Donations:</strong> All voluntary donations made to IIMC are final and non-refundable.
                  </li>
                  <li>
                    <strong>Event Cancellations:</strong> If an event is cancelled by IIMC, we will contact you via your registered email address and process a full refund of your registration fee within 14 working days via the original payment method.
                  </li>
                  <li>
                    <strong>Disputes:</strong> Users wishing to dispute a transaction charge must contact IIMC within 7 days of the payment date.
                  </li>
                </ul>
              </section>

              {/* 7. Donations */}
              <section id="donations" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  7. Donations
                </h2>
                <p>
                  Donations made to IIMC are voluntary contributions intended to support our spiritual mission and the upkeep of the center. No goods, services, or personal benefits are exchanged in return for donations. All donation amounts are final once submitted.
                </p>
              </section>

              {/* 8. Delivery of Services */}
              <section id="delivery" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  8. Delivery of Services
                </h2>
                <p>
                  All meditation sessions, teachings, courses, and retreats take place in-person at the IIMC premises in Colombo, Sri Lanka, unless explicitly stated otherwise. Dates, times, and location details are displayed on the events page and confirmed via email post-registration.
                </p>
              </section>

              {/* 9. Privacy & Data Collection */}
              <section id="privacy" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  9. Privacy & Data Collection
                </h2>
                <p>
                  We are committed to protecting your privacy. IIMC collects your name, email address, and phone number during account creation and event registration. This data is stored securely via Supabase and is used solely for registration confirmation, communication, and event coordination. IIMC does not sell, trade, or lease user data to third parties. All financial data is securely handled exclusively by PayHere.
                </p>
              </section>

              {/* 10. Acceptable Use */}
              <section id="use" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  10. Acceptable Use
                </h2>
                <p>
                  You agree to use our website and services only for lawful purposes. You must not attempt to upload malicious code, execute fraudulent payments, create duplicate or fake registrations, or otherwise interfere with the correct functioning of our platform.
                </p>
              </section>

              {/* 11. Limitation of Liability */}
              <section id="liability" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  11. Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by applicable law, IIMC’s total liability for any claim arising out of or related to these terms, our services, or event registrations shall be strictly limited to the actual amount paid by you for the specific event or service in question.
                </p>
              </section>

              {/* 12. Changes to Terms */}
              <section id="changes" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  12. Changes to Terms
                </h2>
                <p>
                  IIMC reserves the right to update or modify these Terms & Conditions at any time without prior notice. Any updates will be posted on this page with an updated "Last updated" date. Your continued use of our website or services after such changes are published constitutes your binding acceptance of the new terms.
                </p>
              </section>

              {/* 13. Contact Information */}
              <section id="contact" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  13. Contact Information
                </h2>
                <p>
                  If you have any questions, concerns, or requests regarding these Terms & Conditions, please contact us:
                </p>
                <div className="flex flex-col gap-2 mt-3 font-semibold text-foreground bg-muted/40 p-4 rounded-xl">
                  {email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Email: <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Phone: <a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a></span>
                    </div>
                  )}
                  <p className="text-xs font-normal text-muted-foreground mt-2">
                    Alternatively, you can send us a message directly via our <Link to="/contact" className="text-primary underline">Contact page</Link>.
                  </p>
                </div>
              </section>

              {/* 14. Governing Law */}
              <section id="law" className="space-y-3 pt-6 border-t border-border/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2">
                  14. Governing Law
                </h2>
                <p>
                  These Terms & Conditions shall be governed by and construed in accordance with the laws of the Democratic Socialist Republic of Sri Lanka. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.
                </p>
              </section>

            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Back Button */}
        <ScrollReveal delay={200}>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </ScrollReveal>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/95 transition-all duration-300 z-50 flex items-center justify-center animate-fade-in-scale"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
