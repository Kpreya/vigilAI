"use client";
import React, { useState } from 'react';
import vigilApp from '@/lib/vigil-web'; // VigilAI SDK
import Link from 'next/link';

export default function DemoSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate a realistic backend system failure (Network/DB issue)
    const error = new Error("AuthServiceConnectionError: Authentication service connection timed out after 5000ms. Could not reach upstream identity provider.");
    console.error("Signup failed:", error);
    vigilApp.captureException(error, { user_name: name, email_provided: email, action: 'signup' });
    alert("Signup failed: Internal Server Error (Timeout). Check VigilAI Dashboard.");
    setIsSubmitting(false);
    return;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl p-8 sm:p-10 max-w-md w-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
        
        <div className="text-center mb-8">
            <h1 className="text-3xl tracking-tight font-extrabold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-500 text-sm">Join VigilAI for advanced platform monitoring.</p>
        </div>
        
        {success ? (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">Success!</h3>
            <p className="text-green-700 text-sm mb-4">Your account has been created successfully.</p>
            <button onClick={() => setSuccess(false)} className="text-green-700 font-medium text-sm hover:underline">Create another account</button>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                required
              />
              <p className="text-xs text-slate-500 mt-1.5">We'll never share your email with anyone else.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-semibold rounded-lg py-3 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        )}
        
        <div className="mt-8 text-center bg-slate-50 -mx-8 sm:-mx-10 -mb-8 sm:-mb-10 p-6 border-t border-slate-100">
             <p className="text-sm text-slate-600">
                Already have an account? <Link href="/demo" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">Log in here</Link>
             </p>
        </div>
      </div>
    </div>
  );
}
