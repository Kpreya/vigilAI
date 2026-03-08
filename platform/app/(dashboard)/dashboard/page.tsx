import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-black px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-display font-bold text-black mb-1">
              Welcome to VigilAI Dashboard
            </h2>
            <p className="text-slate-500 font-mono text-sm">
              Hello, {session?.user?.name || 'Dev Ops'}! Monitor your applications and track incidents in real-time.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black shadow-brutal-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-mono font-bold uppercase">
                System: Operational
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-12">

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border-2 border-black p-6 shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-mono text-xs uppercase font-bold tracking-widest">
                Total Incidents
              </span>
              <div className="w-10 h-10 bg-blue-50 border border-black flex items-center justify-center">
                <span className="material-symbols-outlined text-black">warning</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-mono font-bold text-black tracking-tighter">172</span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-6 shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-mono text-xs uppercase font-bold tracking-widest">
                Applications
              </span>
              <div className="w-10 h-10 bg-green-50 border border-black flex items-center justify-center">
                <span className="material-symbols-outlined text-black">grid_view</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-mono font-bold text-black tracking-tighter">08</span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-6 shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-mono text-xs uppercase font-bold tracking-widest">
                API Keys
              </span>
              <div className="w-10 h-10 bg-purple-50 border border-black flex items-center justify-center">
                <span className="material-symbols-outlined text-black">vpn_key</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-mono font-bold text-black tracking-tighter">03</span>
            </div>
          </div>
        </section>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Sentinel Bot */}
          <div className="lg:col-span-3 bg-white border-2 border-black p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-brutal min-h-[400px]">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                backgroundSize: '30px 30px',
              }}
            ></div>
            <svg
              className="w-64 h-64 mb-8 text-black"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="200" y1="100" y2="100"></line>
              <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="100" x2="100" y1="0" y2="200"></line>
              <rect fill="white" height="90" stroke="currentColor" strokeWidth="3" width="100" x="50" y="55"></rect>
              <rect fill="#f8fafc" height="50" stroke="currentColor" strokeWidth="1.5" width="80" x="60" y="65"></rect>
              <rect fill="black" height="10" width="10" x="75" y="75"></rect>
              <rect fill="black" height="10" width="10" x="115" y="75"></rect>
              <line stroke="currentColor" strokeWidth="3" x1="80" x2="120" y1="130" y2="130"></line>
              <line stroke="currentColor" strokeWidth="2.5" x1="100" x2="100" y1="55" y2="30"></line>
              <circle cx="100" cy="25" fill="white" r="6" stroke="currentColor" strokeWidth="2.5"></circle>
              <circle cx="160" cy="160" fill="none" r="20" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.5"></circle>
              <rect fill="none" height="15" stroke="currentColor" transform="rotate(45 37.5 167.5)" width="15" x="30" y="160"></rect>
            </svg>
            <h3 className="text-2xl font-display font-bold text-center mb-2">
              VigilAI Sentinel v1.0
            </h3>
            <p className="text-slate-500 font-mono text-sm max-w-sm text-center">
              Standard Monitoring Bot. Active and ready to scan for system anomalies.
            </p>
          </div>

          {/* Getting Started */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-display font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">rocket_launch</span>
              Getting Started
            </h3>
            <div className="space-y-4">
              <div className="bg-white border border-black p-4 shadow-brutal-sm flex gap-4 items-start group hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 flex-shrink-0 bg-black text-white flex items-center justify-center font-mono font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">
                    Create an Application
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Set up your first application container to start monitoring metrics.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-black p-4 shadow-brutal-sm flex gap-4 items-start group hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 flex-shrink-0 bg-black text-white flex items-center justify-center font-mono font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">
                    Generate an API Key
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Create an authentication token to securely integrate the VigilAI SDK.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-black p-4 shadow-brutal-sm flex gap-4 items-start group hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 flex-shrink-0 bg-black text-white flex items-center justify-center font-mono font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">
                    Install the SDK
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Add the library to your codebase and initialize the watcher service.
                  </p>
                </div>
              </div>

              <button className="w-full mt-4 bg-black text-white py-4 font-mono font-bold uppercase tracking-widest text-sm border-2 border-black hover:bg-white hover:text-black transition-all shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1">
                View Documentation →
              </button>
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="border-t border-black pt-8 flex flex-wrap gap-4">
          <div className="px-4 py-2 bg-slate-100 border border-black text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">terminal</span>
            vigilai-cli status
          </div>
          <div className="px-4 py-2 bg-slate-100 border border-black text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">database</span>
            storage-usage: 14%
          </div>
          <div className="px-4 py-2 bg-slate-100 border border-black text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">history</span>
            last-sync: 2m ago
          </div>
        </div>
      </div>
    </>
  );
}