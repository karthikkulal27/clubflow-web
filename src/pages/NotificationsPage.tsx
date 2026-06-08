import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Bell, CreditCard, Calendar, Megaphone, Info, CheckCheck, Circle } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notifications.api';

const TYPE_ICONS: Record<string, { icon: ReactNode; bg: string; color: string }> = {
  PAYMENT:      { icon: <CreditCard size={16} />,  bg: '#eff6ff', color: '#2563eb' },
  PAYMENT_PAID: { icon: <CreditCard size={16} />,  bg: '#dcfce7', color: '#16a34a' },
  EVENT:        { icon: <Calendar size={16} />,    bg: '#fef3c7', color: '#d97706' },
  ANNOUNCEMENT: { icon: <Megaphone size={16} />,   bg: '#fce7f3', color: '#db2777' },
  DUES:         { icon: <CreditCard size={16} />,  bg: '#fee2e2', color: '#ef4444' },
  DEFAULT:      { icon: <Info size={16} />,        bg: '#f1f5f9', color: '#64748b' },
};

function getStyle(type: string) {
  const upper = type?.toUpperCase?.() ?? '';
  for (const key of Object.keys(TYPE_ICONS)) {
    if (upper.includes(key)) return TYPE_ICONS[key];
  }
  return TYPE_ICONS.DEFAULT;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => getNotifications() });
  const items = data?.items ?? [];
  const unreadCount = items.filter((n) => !n.isRead).length;

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-5">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <p className="text-[20px] font-bold text-slate-900">Notifications</p>
          <p className="text-[13px] text-slate-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-primary bg-[#eff6ff] border border-[#bfdbfe] px-3 py-2 rounded-[10px] disabled:opacity-50"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map((n) => <div key={n} className="h-16 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="bg-white rounded-[18px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {items.map((n, i) => {
            const style = getStyle(n.type);
            return (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${!n.isRead ? 'bg-[#f8faff]' : 'bg-white'} ${i < items.length - 1 ? 'border-b border-slate-50' : ''}`}
                onClick={() => { if (!n.isRead) markOne.mutate(n.id); }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: style.bg, color: style.color }}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[13px] ${!n.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</p>
                    {!n.isRead && <Circle size={7} className="fill-primary text-primary flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{format(new Date(n.createdAt), 'MMM d · h:mm a')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <Bell size={44} className="mb-3 opacity-25" />
          <p className="text-[15px] font-medium">No notifications yet</p>
          <p className="text-[13px] mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
