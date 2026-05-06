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
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If already logged in, redirect away
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Do not throw the error if it's a security risk (e.g. user not found),
        // but Supabase usually handles this safely.
        console.error('Password reset error:', error);
      }

      // Always show success to prevent email enumeration
      setIsSuccess(true);
      toast.success('Reset link sent if the email exists.');
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthCard 
          title="Check your email" 
          description="If an account exists for this email, a reset link has been sent."
        >
          <div className="text-center space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the verification link to reset your password.
            </p>
            <AuthButton onClick={() => navigate('/login')} className="mt-4">
              Return to Login
            </AuthButton>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard 
        title="Reset Password" 
        description="Enter your email to receive a password reset link."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthButton type="submit" loading={loading} loadingText="Sending link..." className="mt-4">
            Send Reset Link
          </AuthButton>

          <div className="text-center text-sm mt-4">
            <span className="text-muted-foreground">Remembered your password? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Back to log in
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
