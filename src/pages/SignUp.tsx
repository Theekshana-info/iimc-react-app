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

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol');

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If already logged in, redirect away
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: SignUpValues) => {
    try {
      setLoading(true);

      const redirectUrl = `${window.location.origin}/login`;

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // Update additional fields if necessary - the trigger handle_new_user 
      // now handles full_name, email, and phone insertion to profiles automatically.

      setIsSuccess(true);
      toast.success('Account created successfully!');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists');
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthCard 
          title="Check your email" 
          description="We've sent a verification link to your email address."
        >
          <div className="text-center space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the verification link to complete your registration.
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
        title="Create an Account" 
        description="Join Isipathana International Meditation Center"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <AuthInput
            id="fullName"
            label="Full Name"
            placeholder="John Doe"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          
          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthInput
            id="phone"
            label="Phone Number"
            type="tel"
            placeholder="+94 71 234 5678"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <PasswordInput
            id="password"
            label="Password"
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

          <AuthButton type="submit" loading={loading} loadingText="Creating account..." className="mt-6">
            Sign Up
          </AuthButton>

          <div className="text-center text-sm mt-4">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
