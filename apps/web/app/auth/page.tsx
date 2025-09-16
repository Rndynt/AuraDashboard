'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@acme/auth/client';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@acme/db/client-schemas';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';


export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      if (session.data?.user) {
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Login attempt:', data.email);
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      console.log('Login result:', result);
      
      if (result.data?.user) {
        console.log('Login success, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('Login failed - no user in result');
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.data?.user) {
        router.push('/dashboard');
      } else {
        setError('Failed to create account');
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'login' 
                ? 'Sign in to your account to continue' 
                : 'Get started with your Better Auth dashboard'
              }
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    autoComplete="email"
                    className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter your email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="block w-full px-3 py-2 pr-10 border border-input rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Full name
                  </label>
                  <input
                    {...registerForm.register('name')}
                    type="text"
                    autoComplete="name"
                    className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {registerForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-destructive">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    autoComplete="email"
                    className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter your email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-destructive">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...registerForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="block w-full px-3 py-2 pr-10 border border-input rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-destructive">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                {mode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-primary to-accent">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-center h-full p-12">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-6">
              Enterprise-Grade Authentication
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-md">
              Secure multi-tenant dashboard with advanced RBAC, audit logging, and real-time session management.
            </p>
            <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
              <div className="flex items-center space-x-3 text-white/90">
                <ShieldCheck className="w-5 h-5" />
                <span>PostgreSQL RLS Security</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <ShieldCheck className="w-5 h-5" />
                <span>Role-Based Access Control</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <ShieldCheck className="w-5 h-5" />
                <span>Complete Audit Trail</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
