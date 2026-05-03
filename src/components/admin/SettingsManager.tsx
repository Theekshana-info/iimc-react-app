import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function SettingsManager() {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key');
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['setting'] });
      toast.success('Setting updated');
      setEditingKey(null);
      setEditValue('');
    },
  });

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, value: editValue });
  };

  return (
    <div className="space-y-4">
      {settings?.map((setting) => (
        <Card key={setting.key}>
          <CardContent className="pt-6">
            {editingKey === setting.key ? (
              <div className="space-y-4">
                <div>
                  <Label>{setting.key}</Label>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  )}
                </div>
                {setting.key.includes('content') || setting.key.includes('subtitle') ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                )}
                <div className="flex gap-2">
                  <Button onClick={() => handleSave(setting.key)}>Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingKey(null);
                      setEditValue('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{setting.key}</h4>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground mb-2">{setting.description}</p>
                  )}
                  <p className="text-sm">{setting.value}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(setting.key, setting.value)}
                >
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
