import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ScrollReveal';

export default function Teachers() {
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading teachers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 gradient-hero">
      <div className="container px-4">
        <ScrollReveal>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Our Teachers</h1>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Learn from experienced meditation teachers dedicated to guiding you on your journey.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teachers?.map((teacher, index) => (
            <ScrollReveal key={teacher.id} delay={index * 100}>
              <Card className="shadow-soft hover:shadow-glow transition-smooth h-full">
                {teacher.image_url && (
                  <img
                    src={teacher.image_url}
                    alt={teacher.name}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle>{teacher.name}</CardTitle>
                  {teacher.specialization && (
                    <p className="text-sm text-primary font-medium">{teacher.specialization}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{teacher.bio}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {teachers?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No teachers listed yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
