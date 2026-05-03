import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';

export function TeachersManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: teachers } = useQuery({
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
      toast.success('Teacher added');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: any) => {
      const { error } = await supabase.from('teachers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      toast.success('Teacher updated');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      toast.success('Teacher removed');
    },
  });

  const resetForm = () => {
    setName('');
    setBio('');
    setSpecialization('');
    setImageUrl('');
    setEditingTeacher(null);
    setShowDialog(false);
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setBio(teacher.bio || '');
    setSpecialization(teacher.specialization || '');
    setImageUrl(teacher.image_url || '');
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const teacherData = {
      name,
      bio,
      specialization,
      image_url: imageUrl || null,
    };

    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, updates: teacherData });
    } else {
      createMutation.mutate(teacherData);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Teacher
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers?.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.name}</TableCell>
                <TableCell>{teacher.specialization || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Remove this teacher?')) {
                          deleteMutation.mutate(teacher.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </div>
            <ImageUploadField
              label="Image"
              value={imageUrl}
              onChange={setImageUrl}
              folder="teachers"
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!name}>
                {editingTeacher ? 'Update' : 'Add'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
