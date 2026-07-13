import { NavLink, Outlet } from 'react-router-dom';
import { usePlatformAuth } from '@/context/PlatformAuthContext';

const NAV_ITEMS = [
  { to: '/signup-requests', label: 'Signup Requests', icon: '📥' },
  { to: '/schools', label: 'Schools', icon: '🏫' },
  { to: '/audit-log', label: 'Audit Log', icon: '📜' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
];

function navLinkClass(isActive: boolean) {
  return `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
  }`;
}

export function AppShell() {
  const { logout } = usePlatformAuth();

  return (
    <div className="bg-mesh min-h-screen bg-slate-50">
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg shadow-glow">
            🛠️
          </span>
          <div className="leading-tight">
            <span className="text-gradient block text-lg font-extrabold tracking-tight">Operator Console</span>
            <span className="hidden text-[11px] font-medium uppercase tracking-widest text-slate-400 sm:block">
              School Management — Platform Admin
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Sign out
        </button>
      </header>

      <div className="relative mx-auto flex w-full max-w-7xl">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-16 p-3">
            <div className="glass space-y-1 rounded-2xl p-3 shadow-card">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <nav className="glass mb-4 flex gap-1 overflow-x-auto rounded-2xl p-2 shadow-card lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${navLinkClass(isActive)} shrink-0`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
