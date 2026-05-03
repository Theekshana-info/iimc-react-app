import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export function HomeMessage() {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    const stored = localStorage.getItem('dismissedMessages');
    return stored ? JSON.parse(stored) : [];
  });
  const [expandedMessage, setExpandedMessage] = useState<any>(null);

  const { data: messages } = useQuery({
    queryKey: ['home-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_messages')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
  });

  const activeMessage = messages?.[0];

  if (!activeMessage || dismissed.includes(activeMessage.id)) {
    return null;
  }

  const handleDismiss = () => {
    const newDismissed = [...dismissed, activeMessage.id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedMessages', JSON.stringify(newDismissed));
  };

  const isLongContent = activeMessage.content.length > 100;

  return (
    <>
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1">{activeMessage.title}</p>
              <div
                className="text-sm text-muted-foreground truncate sm:whitespace-normal [&_*]:!m-0 [&_*]:!p-0"
                dangerouslySetInnerHTML={{
                  __html: isLongContent
                    ? activeMessage.content.substring(0, 100) + '...'
                    : activeMessage.content,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              {isLongContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedMessage(activeMessage)}
                >
                  Read More
                </Button>
              )}
              {activeMessage.link_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={activeMessage.link_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {activeMessage.link_text || 'Link'}
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!expandedMessage} onOpenChange={() => setExpandedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{expandedMessage?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div
              className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: expandedMessage?.content || '' }}
            />
            {expandedMessage?.link_url && (
              <Button
                className="mt-4"
                asChild
              >
                <a href={expandedMessage.link_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {expandedMessage.link_text || 'Learn More'}
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
