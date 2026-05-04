import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ScrollReveal';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface ActivitySummary {
  id: string;
  title: string;
  summary: string;
  cover_image_url: string;
  created_at: string;
}

export default function Activities() {
  const navigate = useNavigate();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title, summary, cover_image_url, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as ActivitySummary[]) ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4">
        <ScrollReveal>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Activities</h1>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Stories and highlights from our meditation center and community.
          </p>
        </ScrollReveal>

        {activities.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No activities yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity, index) => (
              <ScrollReveal key={activity.id} delay={index * 80}>
                <Card className="shadow-soft hover:shadow-glow transition-smooth h-full flex flex-col">
                  <img
                    src={activity.cover_image_url}
                    alt={activity.title}
                    className="w-full h-52 object-cover rounded-t-xl"
                    loading="lazy"
                  />
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl">{activity.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(activity.created_at), 'PPP')}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {activity.summary}
                    </p>
                    <Button className="mt-auto" onClick={() => navigate(`/activities/${activity.id}`)}>
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
