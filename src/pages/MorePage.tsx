import { useNavigate } from 'react-router-dom';
import { Megaphone, User, Bell, ChevronRight, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const baseItems = [
  { label: 'Announcements', icon: <Megaphone size={18} />, to: '/announcements', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Profile', icon: <User size={18} />, to: '/profile', color: '#2563eb', bg: '#eff6ff' },
  { label: 'Notifications', icon: <Bell size={18} />, to: '/notifications', color: '#8b5cf6', bg: '#f5f3ff' },
];

const adminItems = [
  { label: 'Club Settings', icon: <Settings size={18} />, to: '/club-settings', color: '#0f766e', bg: '#f0fdfa' },
];

export default function MorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-6">
      <div className="pt-2">
        <p className="text-[20px] font-bold text-slate-900">More</p>
      </div>

      {/* User card */}
      <div className="bg-white rounded-[18px] border border-slate-100 px-4 py-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
          <span className="text-[16px] font-bold text-primary">
            {user?.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-slate-900 truncate">{user?.name}</p>
          <p className="text-[12px] text-slate-400">{user?.role} · {user?.clubName}</p>
        </div>
      </div>

      {/* Nav links */}
      <div className="bg-white rounded-[18px] border border-slate-100 overflow-hidden">
        {items.map(({ label, icon, to, color, bg }, i) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors active:bg-slate-50 ${i > 0 ? 'border-t border-slate-50' : ''}`}
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: bg, color }}>
              {icon}
            </div>
            <span className="flex-1 text-[15px] font-medium text-slate-900">{label}</span>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 bg-white rounded-[18px] border border-slate-100 px-4 py-4 text-left active:bg-slate-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-[10px] bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
          <LogOut size={18} className="text-[#ef4444]" />
        </div>
        <span className="flex-1 text-[15px] font-medium text-[#ef4444]">Sign Out</span>
      </button>
    </div>
  );
}
