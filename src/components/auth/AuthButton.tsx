import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const AuthButton = ({ 
  children, 
  loading, 
  loadingText, 
  className, 
  ...props 
}: AuthButtonProps) => {
  return (
    <Button 
      {...props}
      className={`w-full ${className || ''}`} 
      disabled={loading || props.disabled}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
