'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, AlertCircle, Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 flex flex-col items-center text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(20,241,149,0.15)] backdrop-blur-xl mb-6">
          <UserPlus className="h-8 w-8 text-[#00c2ff]" />
        </div>
        <h1 className="font-[family:var(--font-space-grotesk)] text-3xl font-bold tracking-tight">
          Create account
        </h1>
        <p className="mt-2 text-white/40">
          Start monitoring your Solana programs in seconds
        </p>
      </div>

      <div className="solana-panel rounded-[2rem] p-px">
        <div className="rounded-[2rem] bg-[#050714]/80 backdrop-blur-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {registerError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 text-white">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  {(registerError as any)?.response?.data?.message || 'Registration failed. Please try again.'}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-white/60 ml-1">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00c2ff]/50 focus:ring-[#00c2ff]/20 rounded-xl"
                {...register('name')}
                disabled={isRegistering}
              />
              {errors.name && (
                <p className="text-xs text-red-400 ml-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/60 ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00c2ff]/50 focus:ring-[#00c2ff]/20 rounded-xl"
                {...register('email')}
                disabled={isRegistering}
              />
              {errors.email && (
                <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 text-white">
              <Label htmlFor="password" className="text-sm font-medium text-white/60 ml-1">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00c2ff]/50 focus:ring-[#00c2ff]/20 rounded-xl pr-12"
                  {...register('password')}
                  disabled={isRegistering}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2 text-white">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/60 ml-1">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00c2ff]/50 focus:ring-[#00c2ff]/20 rounded-xl"
                {...register('confirmPassword')}
                disabled={isRegistering}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 ml-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="solana-button w-full h-12 rounded-xl text-base font-bold text-[#03050c] hover:scale-[1.01] transition-all border-none mt-4"
              disabled={isRegistering}
            >
              {isRegistering ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="flex items-center justify-center gap-2 mt-4 py-2 px-4 rounded-xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="h-4 w-4 text-[#14f195]" />
              <span className="text-[10px] uppercase tracking-widest text-white/30">Enterprise-grade security included</span>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-white/40">Already have an account?</span>{' '}
            <Link href="/login" className="text-[#00c2ff] hover:text-[#00c2ff]/80 font-bold transition">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-white/20 hover:text-white/40 transition">
          <Activity className="h-3 w-3" />
          Back to Probe Home
        </Link>
      </div>
    </div>
  );
}
