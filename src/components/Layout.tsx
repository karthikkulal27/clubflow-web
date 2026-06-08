import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, BarChart3, Calendar,
  Users, MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const memberNav = [
  { to: '/dashboard', label: 'Home', Icon: LayoutDashboard },
  { to: '/payments', label: 'Payments', Icon: CreditCard },
  { to: '/finance', label: 'Finance', Icon: BarChart3 },
  { to: '/events', label: 'Events', Icon: Calendar },
  { to: '/more', label: 'More', Icon: MoreHorizontal },
];

const adminNav = [
  { to: '/dashboard', label: 'Home', Icon: LayoutDashboard },
  { to: '/members', label: 'Members', Icon: Users },
  { to: '/finance', label: 'Finance', Icon: BarChart3 },
  { to: '/events', label: 'Events', Icon: Calendar },
  { to: '/more', label: 'More', Icon: MoreHorizontal },
];

export default function Layout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <div className="flex flex-col min-h-dvh bg-[#f8fafc]">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[13px] font-bold">CF</span>
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900 leading-tight">{user?.clubName}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{user?.name} · {user?.role}</p>
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
        <div className="flex">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-primary-light' : ''}`}>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
