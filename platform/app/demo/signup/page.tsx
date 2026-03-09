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
    // Create error with proper stack trace that includes source file path
    const error = new Error("AuthServiceConnectionError: Authentication service connection timed out after 5000ms. Could not reach upstream identity provider.");
    
    // Manually add source file path to stack trace for VigilAI to detect
    const enhancedStack = `Error: AuthServiceConnectionError: Authentication service connection timed out after 5000ms. Could not reach upstream identity provider.
    at handleSignup (platform/app/demo/signup/page.tsx:20:16)
    at onClick (platform/app/demo/signup/page.tsx:15:5)
    at processFormSubmit (platform/app/demo/signup/page.tsx:13:3)`;
    
    // Override the stack trace with our enhanced version
    Object.defineProperty(error, 'stack', {
      value: enhancedStack,
      writable: false
    });
    
    console.error("Signup failed:", error);
    vigilApp.captureException(error, { 
      user_name: name, 
      email_provided: email, 
      action: 'signup',
      sourceFile: 'platform/app/demo/signup/page.tsx',
      function: 'handleSignup',
      line: 20
    });
    
    alert("Signup failed: Internal Server Error (Timeout). Check VigilAI Dashboard.");
    setIsSubmitting(false);
    return;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .signup-root {
          min-height: 100vh;
          background-color: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glow orbs */
        .signup-root::before {
          content: '';
          position: fixed;
          top: -20%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .signup-root::after {
          content: '';
          position: fixed;
          bottom: -20%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.75rem 2.5rem;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08);
          animation: fadeUp 0.5s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Top accent bar */
        .card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #06b6d4, #6366f1);
          background-size: 200% 100%;
          border-radius: 20px 20px 0 0;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Header */
        .card-header {
          margin-bottom: 2.25rem;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 100px;
          padding: 4px 12px 4px 8px;
          margin-bottom: 1.25rem;
        }

        .brand-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6366f1;
          box-shadow: 0 0 6px #6366f1;
          animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        .brand-badge span {
          font-size: 0.7rem;
          font-weight: 500;
          color: #a5b4fc;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 0 0 0.5rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: rgba(148, 163, 184, 0.8);
          font-weight: 300;
          margin: 0;
        }

        /* Form */
        .form-fields { display: flex; flex-direction: column; gap: 1.125rem; }
        .field-group { display: flex; flex-direction: column; gap: 0.375rem; }

        .field-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.9);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .field-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: #f1f5f9;
          outline: none;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }

        .field-input::placeholder { color: rgba(100, 116, 139, 0.7); }

        .field-input:focus {
          border-color: rgba(99, 102, 241, 0.6);
          background: rgba(99, 102, 241, 0.06);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .field-hint {
          font-size: 0.7rem;
          color: rgba(100, 116, 139, 0.7);
          margin: 0;
        }

        /* Submit button */
        .btn-submit {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.875rem 1rem;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .card-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }

        .card-footer p { margin: 0; font-size: 0.825rem; color: rgba(100, 116, 139, 0.8); }

        .card-footer a {
          color: #818cf8;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s;
        }

        .card-footer a:hover { color: #a5b4fc; text-decoration: underline; }

        /* Success state */
        .success-box {
          text-align: center;
          padding: 1.5rem 0;
          animation: fadeUp 0.4s ease both;
        }

        .success-icon {
          width: 56px; height: 56px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem;
        }

        .success-icon svg { color: #34d399; width: 24px; height: 24px; }

        .success-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 0.375rem;
        }

        .success-text {
          font-size: 0.875rem;
          color: rgba(148, 163, 184, 0.8);
          margin: 0 0 1.25rem;
        }

        .success-link {
          font-size: 0.825rem;
          color: #818cf8;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          font-family: 'DM Sans', sans-serif;
        }

        .success-link:hover { color: #a5b4fc; }
      `}</style>

      <div className="signup-root">
        <div className="grid-overlay" />
        
        <div className="card">
          <div className="card-accent" />
          
          <div className="card-header">
            <div className="brand-badge">
              <div className="brand-dot" />
              <span>VigilAI Platform</span>
            </div>
            <h1 className="card-title">Create your<br />account</h1>
            <p className="card-subtitle">Advanced monitoring starts here.</p>
          </div>

          {success ? (
            <div className="success-box">
              <div className="success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="success-title">You're in!</h3>
              <p className="success-text">Your account has been created successfully.</p>
              <button onClick={() => setSuccess(false)} className="success-link">
                Create another account
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="form-fields">
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="field-input"
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="field-input"
                    required
                  />
                  <p className="field-hint">We'll never share your email with anyone else.</p>
                </div>

                <div className="field-group">
                  <label className="field-label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="field-input"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    Creating account...
                  </>
                ) : 'Create Account →'}
              </button>
            </form>
          )}

          <div className="card-footer">
            <p>
              Already have an account?{' '}
              <Link href="/demo">Log in here</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
