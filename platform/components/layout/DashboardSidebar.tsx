'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Incidents', href: '/incidents', icon: 'warning' },
  { name: 'Pull Requests', href: '/pull-requests', icon: 'call_split' },
  { name: 'Applications', href: '/applications', icon: 'grid_view' },
];

const configuration = [
  { name: 'API Keys', href: '/api-keys', icon: 'vpn_key' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-black flex flex-col h-full z-20 flex-shrink-0" style={{ backgroundColor: '#f1f0ea' }}>
      {/* Logo */}
      <div className="p-6 border-b border-black flex items-center space-x-3 bg-white">
        <div className="w-10 h-10 bg-black border border-black flex items-center justify-center shadow-brutal-sm">
          <span className="material-symbols-outlined text-white text-2xl">
            visibility
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl tracking-tight text-black">
          VigilAI
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 transition-all duration-150 group ${
                isActive
                  ? 'bg-white border border-black shadow-brutal-sm text-black font-semibold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  : 'text-slate-600 hover:text-black hover:bg-white hover:border hover:border-black hover:shadow-brutal-sm'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  isActive ? 'scale-110' : ''
                }`}
                style={{
                  transform: item.icon === 'call_split' ? 'rotate(90deg)' : undefined,
                }}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 pb-2">
          <p className="px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Configuration
          </p>
        </div>

        {configuration.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 transition-all duration-150 group ${
                isActive
                  ? 'bg-white border border-black shadow-brutal-sm text-black font-semibold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  : 'text-slate-600 hover:text-black hover:bg-white hover:border hover:border-black hover:shadow-brutal-sm'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-black bg-white">
        <div className="flex items-center space-x-3">
          {user?.image ? (
            <img
              alt="User Avatar"
              className="w-10 h-10 border border-black"
              src={user.image}
            />
          ) : (
            <div className="w-10 h-10 border border-black bg-blue-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate font-mono">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
