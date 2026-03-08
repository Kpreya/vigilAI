'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validatePassword } from '@/lib/password-validation';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): {
    strength: number;
    label: string;
    color: string;
  } => {
    if (!pwd) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (pwd.length >= 12) strength += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength += 1;

    if (strength <= 2) {
      return { strength, label: 'WEAK', color: 'bg-terminal-red' };
    } else if (strength <= 3) {
      return { strength, label: 'FAIR', color: 'bg-terminal-yellow' };
    } else if (strength <= 4) {
      return { strength, label: 'GOOD', color: 'bg-blue-500' };
    } else {
      return { strength, label: 'STRONG', color: 'bg-terminal-green' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ email: 'An account with this email already exists' });
        } else {
          setErrors({ general: data.error?.message || 'Failed to create account' });
        }
        return;
      }

      // Auto sign in after successful signup
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        // Signup succeeded but login failed - redirect to login page
        router.push('/login?message=Account created successfully. Please sign in.');
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
        <div className="bg-white border-2 border-black shadow-brutal p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🛡️</span>
              <h1 className="text-3xl font-display font-bold">VigilAI</h1>
            </div>
            <p className="text-terminal-grey font-mono text-sm">
              Create your account
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-terminal-red">
              <p className="text-sm font-mono text-terminal-red">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-mono font-semibold mb-2">
                NAME
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.name && (
                <p className="mt-2 text-sm font-mono text-terminal-red">{errors.name}</p>
              )}
            </div>

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
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.password && (
                <p className="mt-2 text-sm font-mono text-terminal-red">{errors.password}</p>
              )}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-terminal-grey">
                      STRENGTH:
                    </span>
                    <span className="text-xs font-mono font-semibold">
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 border border-black">
                    <div
                      className={`h-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-mono font-semibold mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm font-mono text-terminal-red">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-black text-white border-2 border-black font-mono font-semibold hover:bg-white hover:text-black transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-mono text-terminal-grey">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-black font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
