'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: 'Invalid email or password' });
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-grid bg-paper-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-black shadow-brutal p-8 mb-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🛡️</span>
              <h1 className="text-3xl font-display font-bold">VigilAI</h1>
            </div>
            <p className="text-terminal-grey font-mono text-sm">
              Sign in to your account
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-terminal-red">
              <p className="text-sm font-mono text-terminal-red">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-mono font-semibold mb-2">
                EMAIL
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.email && (
                <p className="mt-2 text-sm font-mono text-terminal-red">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-mono font-semibold mb-2">
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.password && (
                <p className="mt-2 text-sm font-mono text-terminal-red">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-black text-white border-2 border-black font-mono font-semibold hover:bg-white hover:text-black transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-mono text-terminal-grey">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-black font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs font-mono text-terminal-grey">
            Demo accounts: alice@example.com / password123
          </p>
        </div>
      </div>
    </div>
  );
}
