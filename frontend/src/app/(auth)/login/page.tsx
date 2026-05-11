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
import { Activity, AlertCircle, Eye, EyeOff, Sparkles, UserCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const [registered, setRegistered] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setRegistered(params.get('registered') === 'true');
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
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const handleDemoLogin = () => {
    const demoEmail = 'admin@probe.dev';
    const demoPassword = 'admin123';
    setValue('email', demoEmail);
    setValue('password', demoPassword);
    login({ email: demoEmail, password: demoPassword });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 flex flex-col items-center text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(20,241,149,0.15)] backdrop-blur-xl mb-6">
          <Activity className="h-8 w-8 text-[#14f195]" />
        </div>
        <h1 className="font-[family:var(--font-space-grotesk)] text-3xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-white/40">
          Enter your credentials to access the Probe dashboard
        </p>
      </div>

      <div className="solana-panel rounded-[2rem] p-px">
        <div className="rounded-[2rem] bg-[#050714]/80 backdrop-blur-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {registered && (
              <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                <Sparkles className="h-5 w-5" />
                Registration successful! Please sign in.
              </div>
            )}
            
            {loginError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 text-white">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  {(loginError as any)?.response?.data?.message || 'Invalid email or password'}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/60 ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#14f195]/50 focus:ring-[#14f195]/20 rounded-xl"
                {...register('email')}
                disabled={isLoggingIn}
              />
              {errors.email && (
                <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 text-white">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-medium text-white/60">Password</Label>
                <button type="button" className="text-xs text-[#14f195] hover:text-[#14f195]/80 transition">Forgot password?</button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#14f195]/50 focus:ring-[#14f195]/20 rounded-xl pr-12"
                  {...register('password')}
                  disabled={isLoggingIn}
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

            <Button
              type="submit"
              className="solana-button w-full h-12 rounded-xl text-base font-bold text-[#03050c] hover:scale-[1.01] transition-all border-none"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-[#050714] px-2 text-white/20">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              className="w-full h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all gap-2"
              disabled={isLoggingIn}
            >
              <UserCheck className="h-5 w-5 text-[#00c2ff]" />
              Demo Login
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-white/40">Don&apos;t have an account?</span>{' '}
            <Link href="/register" className="text-[#14f195] hover:text-[#14f195]/80 font-bold transition">
              Create one for free
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
