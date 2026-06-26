import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/ScrollReveal';
import { motion } from 'framer-motion';
import { User, ChevronRight, GraduationCap } from 'lucide-react';

export default function Teachers() {
  const navigate = useNavigate();

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
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading teachers...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen py-24 gradient-hero bg-background/50">
      <div className="container px-4 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
              Our Teachers & Guides
            </h1>
            <div className="h-1.5 w-20 bg-primary/20 rounded-full mx-auto mb-6"></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Learn from experienced meditation teachers dedicated to guiding you on your journey of mindfulness, inner peace, and self-discovery.
            </p>
          </div>
        </ScrollReveal>

        {teachers && teachers.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap justify-center gap-6 md:gap-8 w-full"
          >
            {teachers.map((teacher) => {
              return (
                <motion.div
                  key={teacher.id}
                  variants={cardVariants}
                  className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-sm flex"
                >
                  <div className="group relative flex flex-col justify-between w-full h-[390px] overflow-hidden rounded-3xl bg-card text-card-foreground shadow-soft border border-primary/5 p-6 hover:shadow-glow transition-all duration-300 ease-out hover:-translate-y-1.5 text-left">
                    {/* Floating Decorative Element */}
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                    {/* Top half alignment */}
                    <div className="flex flex-col items-center text-center space-y-3 flex-1">
                      {/* Circular Image Container */}
                      <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-primary/10 bg-muted shrink-0 group-hover:border-primary/30 transition-colors duration-300">
                        {teacher.image_url ? (
                          <img
                            src={teacher.image_url}
                            alt={teacher.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                            <User className="h-10 w-10" />
                          </div>
                        )}
                      </div>

                      {/* Teacher Details */}
                      <div className="space-y-1.5 w-full flex flex-col justify-between flex-1">
                        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 min-h-[56px] flex items-center justify-center px-2">
                          {teacher.name}
                        </h3>
                        
                        {teacher.specialization ? (
                          <div className="flex justify-center max-w-full">
                            <Badge variant="secondary" className="px-3 py-1.5 text-[11px] font-semibold bg-primary/5 border border-primary/10 text-primary rounded-full flex items-center justify-center gap-1.5 leading-relaxed text-center text-wrap min-h-[42px] max-h-[56px] overflow-hidden">
                              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-2">{teacher.specialization}</span>
                            </Badge>
                          </div>
                        ) : (
                          <div className="min-h-[42px]"></div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-primary/5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 rounded-xl gap-1 h-9"
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                      >
                        Read Biography
                        <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <ScrollReveal delay={200}>
            <div className="text-center py-16 bg-card/30 backdrop-blur-sm border border-primary/5 rounded-2xl max-w-md mx-auto shadow-soft">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold mb-1">No Teachers Listed Yet</h3>
              <p className="text-sm text-muted-foreground px-6">
                Our teacher profiles are being updated. Please check back soon!
              </p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

