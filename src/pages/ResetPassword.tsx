import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AuthButton } from '@/components/auth/AuthButton';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check hash for type=recovery or type=invite
    if (window.location.hash.includes('type=recovery')) {
      setReady(true);
    }

    // If an already logged in user accesses this without a recovery token, redirect
    if (user && !window.location.hash.includes('type=recovery')) {
      const from = (location.state as any)?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }

    return () => subscription.unsubscribe();
  }, [user, navigate, location]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({ password: data.password });

      if (error) throw error;

      toast.success('Password updated successfully. Please log in.');
      navigate('/login');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <AuthLayout>
        <AuthCard 
          title="Invalid Link" 
          description="This password reset link is invalid or has expired."
        >
          <div className="text-center space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please request a new password reset link.
            </p>
            <AuthButton onClick={() => navigate('/forgot-password')} className="mt-4">
              Request New Link
            </AuthButton>
            <div className="text-center text-sm mt-4">
              <Link to="/login" className="text-primary hover:underline font-medium">
                Back to log in
              </Link>
            </div>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard 
        title="Reset Password" 
        description="Enter your new password below."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <PasswordInput
            id="password"
            label="New Password"
            showStrength={true}
            value={watch('password')}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errors.password.message}
            </p>
          )}

          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            value={watch('confirmPassword')}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs font-medium text-destructive mt-1">
              {errors.confirmPassword.message}
            </p>
          )}

          <AuthButton type="submit" loading={loading} loadingText="Updating..." className="mt-6">
            Update Password
          </AuthButton>

          <div className="text-center text-sm mt-4">
            <Link to="/login" className="text-primary hover:underline font-medium">
              Back to log in
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
