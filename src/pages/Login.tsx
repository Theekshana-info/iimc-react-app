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
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AuthButton } from '@/components/auth/AuthButton';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);


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
    watch,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });


  const onSubmit = async (data: SignInValues) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Upon success, the AuthContext will automatically update and trigger the useEffect to redirect
      toast.success('Logged in successfully');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email address before logging in');
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout>
      <AuthCard 
        title="Welcome Back" 
        description="Log in to your IIMC account"
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

          <div className="space-y-1">
            <PasswordInput
              id="password"
              label="Password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs font-medium text-destructive mt-1">
                {errors.password.message}
              </p>
            )}
            <div className="text-right mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <AuthButton type="submit" loading={loading} loadingText="Signing in..." className="mt-4">
            Sign In
          </AuthButton>

          <div className="text-center text-sm mt-4">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
