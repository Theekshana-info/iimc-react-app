import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Search, User, ChevronRight, GraduationCap } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function TeachersManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [quote, setQuote] = useState('');
  const [specializedFields, setSpecializedFields] = useState('');
  const [guidedRetreats, setGuidedRetreats] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');


  const { data: teachers, isLoading } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newTeacher: any) => {
      const { error } = await supabase.from('teachers').insert(newTeacher);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher added successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add teacher');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: any) => {
      const { error } = await supabase.from('teachers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update teacher');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher removed successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove teacher');
    }
  });

  const resetForm = () => {
    setName('');
    setBio('');
    setSpecialization('');
    setImageUrl('');
    setQuote('');
    setSpecializedFields('');
    setGuidedRetreats('');
    setEditingTeacher(null);
    setShowDialog(false);
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setBio(teacher.bio || '');
    setSpecialization(teacher.specialization || '');
    setImageUrl(teacher.image_url || '');
    setQuote(teacher.quote || '');
    setSpecializedFields(teacher.specialized_fields || '');
    setGuidedRetreats(teacher.guided_retreats || '');
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const teacherData = {
      name,
      bio,
      specialization,
      image_url: imageUrl || null,
      quote: quote || null,
      specialized_fields: specializedFields || null,
      guided_retreats: guidedRetreats || null,
    };

    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, updates: teacherData });
    } else {
      createMutation.mutate(teacherData);
    }
  };



  const filteredTeachers = teachers?.filter((teacher) => {
    const nameMatch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase());
    const specMatch = (teacher.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || specMatch;
  });

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
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 backdrop-blur-sm border border-primary/5 p-4 rounded-2xl shadow-soft">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-background/50 border-primary/10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-semibold text-muted-foreground bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full">
            Total: {filteredTeachers?.length || 0}
          </span>
          <Button onClick={() => setShowDialog(true)} className="rounded-xl h-10 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10">
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-medium animate-pulse">Loading teachers...</p>
          </div>
        </div>
      ) : filteredTeachers && filteredTeachers.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredTeachers.map((teacher) => {
            return (
              <motion.div
                key={teacher.id}
                variants={cardVariants}
                className="flex"
              >
                <div className="group relative flex flex-col justify-between w-full h-[390px] overflow-hidden rounded-3xl bg-card text-card-foreground shadow-soft border border-primary/5 p-6 hover:shadow-glow transition-all duration-300 ease-out hover:-translate-y-1 text-left">
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

                  {/* Actions & View Profile Button */}
                  <div className="mt-4 pt-3 border-t border-primary/5 shrink-0 flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 rounded-xl gap-1 px-3 h-9"
                      onClick={() => window.open(`/teachers/${teacher.id}`, '_blank')}
                    >
                      View Profile
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 text-primary animate-smooth"
                        onClick={() => handleEdit(teacher)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive border-primary/5 hover:border-destructive/20 text-muted-foreground animate-smooth"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${teacher.name}?`)) {
                            deleteMutation.mutate(teacher.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-card/30 backdrop-blur-sm border border-primary/5 rounded-2xl max-w-md mx-auto shadow-soft">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold mb-1">No Teachers Found</h3>
          <p className="text-sm text-muted-foreground px-6">
            Try adjusting your search terms or add a new teacher profile.
          </p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl bg-card border-primary/10 rounded-2xl shadow-glow">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {editingTeacher ? 'Edit Teacher Profile' : 'Add New Teacher'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Scrollable fields container */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name *</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="bg-background/50 border-primary/10 rounded-xl"
                    placeholder="e.g. Ajahn Brahm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specialization</Label>
                  <Input 
                    id="specialization" 
                    value={specialization} 
                    onChange={(e) => setSpecialization(e.target.value)} 
                    className="bg-background/50 border-primary/10 rounded-xl"
                    placeholder="e.g. Vipassana Meditation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Biography</Label>
                <Textarea 
                  id="bio" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  rows={4} 
                  className="bg-background/50 border-primary/10 rounded-xl resize-none"
                  placeholder="Write a brief background biography for the teacher..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile Quote / Message</Label>
                <Input 
                  id="quote" 
                  value={quote} 
                  onChange={(e) => setQuote(e.target.value)} 
                  className="bg-background/50 border-primary/10 rounded-xl"
                  placeholder="e.g. Guiding seekers towards internal silence, mindfulness..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specializedFields" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specialized Fields (One item per line)</Label>
                  <Textarea 
                    id="specializedFields" 
                    value={specializedFields} 
                    onChange={(e) => setSpecializedFields(e.target.value)} 
                    rows={4} 
                    className="bg-background/50 border-primary/10 rounded-xl resize-none"
                    placeholder="Vipassana Meditation & Insight practices&#10;Mindful Breathing (Anapanasati) sessions"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidedRetreats" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guided Retreats (One item per line)</Label>
                  <Textarea 
                    id="guidedRetreats" 
                    value={guidedRetreats} 
                    onChange={(e) => setGuidedRetreats(e.target.value)} 
                    rows={4} 
                    className="bg-background/50 border-primary/10 rounded-xl resize-none"
                    placeholder="Silent retreats ranging from 3 to 10 days&#10;Weekly mindfulness classes"
                  />
                </div>
              </div>

              <ImageUploadField
                label="Teacher Profile Photo"
                value={imageUrl}
                onChange={setImageUrl}
                folder="teachers"
              />
            </div>

            {/* Fixed footer action buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-primary/5">
              <Button variant="outline" onClick={resetForm} className="rounded-xl border-primary/10">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!name || createMutation.isPending || updateMutation.isPending}
                className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10"
              >
                {editingTeacher ? 'Update Profile' : 'Add Teacher'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
