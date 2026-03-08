import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen paper-grid bg-paper-bg flex items-center justify-center px-4 py-12">
      <main className="max-w-2xl w-full">
        <div className="bg-white border-2 border-black shadow-brutal p-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl">🛡️</span>
            <h1 className="text-5xl font-display font-bold">VigilAI Platform</h1>
          </div>
          
          <p className="text-slate-600 font-mono text-sm mb-8 max-w-xl mx-auto">
            A comprehensive SaaS platform for application monitoring, incident tracking, and automated fix management.
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/login"
              className="px-8 py-3 bg-black text-white border-2 border-black font-mono font-semibold hover:bg-white hover:text-black transition-colors shadow-brutal-sm hover:shadow-brutal"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-black border-2 border-black font-mono font-semibold hover:bg-black hover:text-white transition-colors shadow-brutal-sm hover:shadow-brutal"
            >
              Sign Up
            </Link>
          </div>

          <div className="border-t-2 border-black pt-8">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center justify-center gap-2">
              <span>✨</span> Features
            </h2>
            <ul className="text-left space-y-3 max-w-md mx-auto font-mono text-sm">
              <li className="flex items-start gap-2">
                <span>🔍</span>
                <span>Real-time application monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🚨</span>
                <span>Intelligent incident detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🤖</span>
                <span>AI-powered diagnostics</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🔧</span>
                <span>Automated fix generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📊</span>
                <span>Comprehensive analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🔐</span>
                <span>Secure authentication</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
