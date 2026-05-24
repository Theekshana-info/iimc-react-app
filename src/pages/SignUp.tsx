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
import { CountryPhoneInput } from '@/components/auth/CountryPhoneInput';
import { GoogleSignInButton, AuthDivider } from '@/components/auth/GoogleSignInButton';
import { Checkbox } from '@/components/ui/checkbox';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol');

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
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
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [googleExistsMessage, setGoogleExistsMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
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
    setGoogleExistsMessage(null);

    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions to create an account.');
      return;
    }

    // Validate phone separately
    const localPart = phone.replace(/^\+\d+\s*/, '').replace(/\D/g, '');
    if (!phone || localPart.length < 6) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setPhoneError('');

    try {
      setLoading(true);

      const redirectUrl = `${window.location.origin}/login`;

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Account created successfully!');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          // Check if this is a Google account
          const { data: profileData } = await supabase
            .from('profiles')
            .select('auth_methods')
            .eq('email', data.email)
            .maybeSingle();

          if (profileData?.auth_methods?.includes('google')) {
            setGoogleExistsMessage(
              'This email is linked to a Google account. Sign in with Google, then go to Profile Settings to set a password if you want both login methods.'
            );
          } else {
            toast.error('An account with this email already exists');
          }
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

        {googleExistsMessage && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {googleExistsMessage}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthInput
            id="fullName"
            label="Full Name"
            placeholder="Enter your full name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register('email')}
          />

          <CountryPhoneInput
            defaultCountry="LK"
            onChange={(val) => {
              setPhone(val);
              if (val) setPhoneError('');
            }}
            error={phoneError}
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

          <div className="flex items-start gap-3 mt-6 mb-4">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:opacity-80 font-semibold">
                Terms & Conditions
              </Link>{' '}
              and confirm I am at least 18 years old.
            </label>
          </div>

          <AuthButton 
            type="submit" 
            loading={loading} 
            loadingText="Creating account..." 
            className="w-full mt-2"
            disabled={loading || !termsAccepted}
          >
            Sign Up
          </AuthButton>

          <AuthDivider />

          <GoogleSignInButton termsAccepted={termsAccepted} />

          <div className="text-center text-sm mt-6">
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
