import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthInputProps extends React.ComponentProps<"input"> {
  id: string;
  label: string;
  error?: string;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ id, label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        <Label htmlFor={id} className={error ? 'text-destructive' : ''}>
          {label}
        </Label>
        <Input
          id={id}
          ref={ref}
          className={`${error ? 'border-destructive focus-visible:ring-destructive' : ''} ${className || ''}`}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-destructive mt-1 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
AuthInput.displayName = 'AuthInput';
