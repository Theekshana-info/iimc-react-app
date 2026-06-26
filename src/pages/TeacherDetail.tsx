import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, GraduationCap, Quote, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/10 p-4">
        <div className="text-center space-y-4 max-w-md bg-card border border-primary/5 p-8 rounded-2xl shadow-soft">
          <User className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Profile Not Found</h1>
          <p className="text-muted-foreground">The teacher profile you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/teachers')} className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95">
            Back to Teachers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 bg-muted/10">
      <div className="container px-4 max-w-6xl mx-auto space-y-8">
        
        {/* Back navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/teachers')}
            className="group hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl pl-2.5 pr-4 h-10 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Teachers
          </Button>
        </motion.div>

        {/* Profile Split-panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Sticky Profile Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 bg-card/60 backdrop-blur-sm border border-primary/5 rounded-3xl p-8 shadow-soft flex flex-col items-center text-center space-y-6 relative overflow-hidden">
              {/* Decorative top header highlight */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30"></div>
              
              {/* Profile Image Frame */}
              <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-primary/10 shadow-glow bg-muted shrink-0 group">
                {teacher.image_url ? (
                  <img
                    src={teacher.image_url}
                    alt={teacher.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                    <User className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Identity Details */}
              <div className="space-y-3 w-full">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {teacher.name}
                </h1>
                
                {teacher.specialization && (
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold bg-primary/5 border border-primary/10 text-primary rounded-full flex items-center gap-1 max-w-full text-wrap text-center justify-center">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      {teacher.specialization}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Decorative Quote Box */}
              {teacher.quote && (
                <div className="w-full pt-6 border-t border-primary/5 relative">
                  <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/5 pointer-events-none" />
                  <p className="text-xs text-muted-foreground italic px-4 leading-relaxed">
                    "{teacher.quote}"
                  </p>
                </div>
              )}


            </div>
          </motion.div>

          {/* Right Column - Comprehensive Profile details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Biography Section */}
            <div className="bg-card/45 backdrop-blur-sm border border-primary/5 rounded-3xl p-8 md:p-10 shadow-soft space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span className="w-2.5 h-6 bg-primary/40 rounded-full inline-block"></span>
                About the Guide
              </h2>
              <div className="h-[1px] w-full bg-primary/5"></div>
              
              <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-line space-y-4">
                {teacher.bio ? (
                  teacher.bio
                ) : (
                  <p className="italic text-muted-foreground/60">No biography details are available at the moment.</p>
                )}
              </div>
            </div>

            {/* Additional dynamic sections for layout premium-ness */}
            {(teacher.specialized_fields || teacher.guided_retreats) && (
              <div className={cn(
                "grid grid-cols-1 gap-6",
                (teacher.specialized_fields && teacher.guided_retreats) ? "md:grid-cols-2" : ""
              )}>
                {teacher.specialized_fields && (
                  <div className="bg-card/45 backdrop-blur-sm border border-primary/5 rounded-3xl p-6 shadow-soft space-y-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Specialized Fields
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-2.5">
                      {teacher.specialized_fields.split('\n').filter(line => line.trim() !== '').map((field, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-2 shrink-0"></span>
                          <span>{field.trim()}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {teacher.guided_retreats && (
                  <div className="bg-card/45 backdrop-blur-sm border border-primary/5 rounded-3xl p-6 shadow-soft space-y-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Guided Retreats
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-2.5">
                      {teacher.guided_retreats.split('\n').filter(line => line.trim() !== '').map((retreat, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-2 shrink-0"></span>
                          <span>{retreat.trim()}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Premium CTA box */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft">
              <div className="space-y-1 md:text-left text-center">
                <h3 className="text-lg font-bold">Have questions about meditation?</h3>
                <p className="text-xs text-muted-foreground max-w-md">Reach out to our guides or join one of their upcoming weekly classes to learn directly.</p>
              </div>
              <Button onClick={() => navigate('/contact')} className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10">
                Contact Center
              </Button>
            </div>
            
          </motion.div>
        </div>

      </div>
    </div>
  );
}
