import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSetting } from '@/hooks/useSetting';
import { ScrollReveal } from '@/components/ScrollReveal';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { value: contactEmail } = useSetting('contact_email');
  const { value: contactPhone } = useSetting('contact_phone');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = contactSchema.parse({
        name,
        email,
        subject: subject || undefined,
        message,
      });

      setLoading(true);

      const { error } = await supabase.from('messages').insert({
        name: validated.name,
        email: validated.email,
        subject: validated.subject,
        message: validated.message,
      });

      if (error) throw error;

      toast.success('Message sent successfully! We will get back to you soon.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4 max-w-4xl">
        <ScrollReveal>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Contact Us</h1>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Have questions? We'd love to hear from you.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal direction="left">
            <Card className="shadow-soft h-full">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>Fill out the form and we'll get back to you soon</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollReveal direction="right">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <p className="text-muted-foreground">{contactEmail}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Phone</h4>
                    <p className="text-muted-foreground">{contactPhone}</p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={100}>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Visit Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Join us for daily meditation sessions and special events. Check our schedule for session times.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
