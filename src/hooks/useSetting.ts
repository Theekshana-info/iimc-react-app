import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSetting(key: string) {
  const queryClient = useQueryClient();

  const { data: setting, isLoading } = useQuery({
    queryKey: ['setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newValue: string) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setting', key] });
    },
  });

  return {
    value: setting?.value || '',
    loading: isLoading,
    update: updateMutation.mutate,
  };
}
