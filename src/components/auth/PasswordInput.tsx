import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ id, label, showStrength = false, className, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const calculateStrength = (pass: string) => {
      let score = 0;
      if (!pass) return score;
      
      if (pass.length > 8) score += 1;
      if (/[A-Z]/.test(pass)) score += 1;
      if (/[a-z]/.test(pass)) score += 1;
      if (/[0-9]/.test(pass)) score += 1;
      if (/[^A-Za-z0-9]/.test(pass)) score += 1;

      return Math.min(score, 5);
    };

    const strength = calculateStrength((value as string) || '');
    
    const getStrengthColor = () => {
      switch (strength) {
        case 1: return 'bg-red-500';
        case 2: return 'bg-orange-500';
        case 3: return 'bg-yellow-500';
        case 4: return 'bg-lime-500';
        case 5: return 'bg-green-500';
        default: return 'bg-gray-200 dark:bg-gray-800';
      }
    };

    const getStrengthLabel = () => {
      switch (strength) {
        case 1: return 'Very Weak';
        case 2: return 'Weak';
        case 3: return 'Fair';
        case 4: return 'Good';
        case 5: return 'Strong';
        default: return '';
      }
    };

    return (
      <div className="space-y-2 w-full">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn("pr-10", className)}
            value={value}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {showStrength && (value as string)?.length > 0 && (
          <div className="space-y-1.5 mt-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 border-r border-white/20 last:border-0 transition-all duration-300",
                    i < strength ? getStrengthColor() : "bg-transparent"
                  )}
                />
              ))}
            </div>
            <div className="text-xs text-right text-muted-foreground font-medium">
              {getStrengthLabel()}
            </div>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
