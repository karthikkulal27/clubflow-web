import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, MapPin, Plus, X, Users, Check, Minus, HelpCircle, ChevronRight, Pencil } from 'lucide-react';
import { authStore } from '../store/auth.store';
import { getEvents, getEvent, createEvent, updateEvent, rsvpEvent } from '../lib/events.api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const todayStr = new Date().toISOString().slice(0, 10);

const eventSchema = z.object({
  title: z.string().min(2, 'Title required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Select a date'),
  startTime: z.string().min(1, 'Select a time'),
  endTime: z.string().optional(),
  location: z.string().optional(),
});
type EventForm = z.infer<typeof eventSchema>;

function EventFormModal({
  onClose,
  eventId,
  defaultValues,
}: {
  onClose: () => void;
  eventId?: string;
  defaultValues?: Partial<EventForm>;
}) {
  const qc = useQueryClient();
  const isEditing = !!eventId;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: (data: EventForm) => {
      const payload = {
        title: data.title,
        description: data.description || undefined,
        startAt: `${data.date}T${data.startTime}:00.000Z`,
        endAt: data.endTime ? `${data.date}T${data.endTime}:00.000Z` : undefined,
        location: data.location || undefined,
      };
      return isEditing ? updateEvent(eventId, payload) : createEvent(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">{isEditing ? 'Edit Event' : 'Create Event'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutateAsync(d))} className="flex flex-col gap-4 p-6">
          <Input label="Title" placeholder="e.g. Team practice" error={errors.title?.message} {...register('title')} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="text-[13px] font-medium text-slate-600">Date</label>
              <div className="flex items-center min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 gap-2 focus-within:border-primary transition-colors">
                <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                <input type="date" min={isEditing ? undefined : todayStr} className="flex-1 text-[14px] text-slate-900 outline-none bg-transparent py-3" {...register('date')} />
              </div>
              {errors.date && <p className="text-[11px] text-danger">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col" style={{ gap: 6 }}>
              <label className="text-[13px] font-medium text-slate-600">Start Time</label>
              <div className="flex items-center min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 bg-white px-4 focus-within:border-primary transition-colors">
                <input type="time" className="flex-1 text-[14px] text-slate-900 outline-none bg-transparent py-3" {...register('startTime')} />
              </div>
              {errors.startTime && <p className="text-[11px] text-danger">{errors.startTime.message}</p>}
            </div>
          </div>
          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="text-[13px] font-medium text-slate-600">End Time (optional)</label>
            <div className="flex items-center min-h-[52px] rounded-[14px] border-[1.5px] border-slate-200 bg-white px-4 focus-within:border-primary transition-colors">
              <input type="time" className="flex-1 text-[14px] text-slate-900 outline-none bg-transparent py-3" {...register('endTime')} />
            </div>
          </div>
          <Input label="Location (optional)" placeholder="e.g. City Stadium" leftIcon={<MapPin size={16} />} {...register('location')} />
          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="text-[13px] font-medium text-slate-600">Description (optional)</label>
            <textarea {...register('description')} rows={3} placeholder="Any additional details…"
              className="rounded-[14px] border-[1.5px] border-slate-200 px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary resize-none" />
          </div>
          {mutation.error && <p className="text-[11px] text-danger">{(mutation.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>{isEditing ? 'Save Changes' : 'Create Event'}</Button>
        </form>
      </div>
    </div>
  );
}

/* ── Event detail + RSVP modal ── */
const RSVP_OPTIONS = [
  { status: 'GOING', label: "I'm Going", icon: <Check size={16} />, bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  { status: 'MAYBE', label: 'Maybe', icon: <HelpCircle size={16} />, bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  { status: 'NOT_GOING', label: "Can't Go", icon: <Minus size={16} />, bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' },
] as const;

function EventDetailModal({ eventId, onClose, onEdit }: { eventId: string; onClose: () => void; onEdit?: (event: any) => void }) {
  const qc = useQueryClient();
  const { data: event, isLoading } = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });
  const rsvp = useMutation({
    mutationFn: ({ status }: { status: 'GOING' | 'NOT_GOING' | 'MAYBE' }) => rsvpEvent(eventId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  const myRsvp = (event as any)?.myRsvp;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-100">
          <p className="text-[17px] font-bold text-slate-900">Event Details</p>
          <div className="flex items-center gap-2">
            {onEdit && event && (
              <button onClick={() => { onEdit(event); onClose(); }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <Pencil size={14} />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : event && (
          <div className="p-5 flex flex-col gap-4">
            {/* Hero icon + title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
                <Calendar size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[17px] font-bold text-slate-900">{event.title}</p>
                <p className="text-[13px] text-slate-500 mt-0.5">{format(new Date(event.startAt), 'EEEE, MMMM d · h:mm a')}</p>
                {(event as any).endAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Ends {format(new Date((event as any).endAt), 'h:mm a')}</p>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-[12px] px-4 py-3">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <p className="text-[13px] text-slate-700">{event.location}</p>
              </div>
            )}

            {event.description && (
              <div className="bg-slate-50 rounded-[12px] px-4 py-3">
                <p className="text-[13px] text-slate-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {((event as any).createdBy ?? event.organizer) && (
              <div className="flex items-center gap-2 text-[12px] text-slate-400">
                <Users size={12} />
                <span>Organized by {((event as any).createdBy ?? event.organizer)?.name}</span>
              </div>
            )}

            {/* Attendance counts */}
            {(event as any).rsvpCounts && (() => {
              const counts = (event as any).rsvpCounts as { GOING: number; NOT_GOING: number; MAYBE: number };
              const total = counts.GOING + counts.MAYBE + counts.NOT_GOING;
              return (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-semibold text-slate-700">Attendance</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#dcfce7] rounded-[12px] py-3 flex flex-col items-center gap-0.5">
                      <p className="text-[20px] font-bold text-[#16a34a]">{counts.GOING}</p>
                      <p className="text-[10px] font-semibold text-[#16a34a]">Going</p>
                    </div>
                    <div className="bg-[#fef3c7] rounded-[12px] py-3 flex flex-col items-center gap-0.5">
                      <p className="text-[20px] font-bold text-[#d97706]">{counts.MAYBE}</p>
                      <p className="text-[10px] font-semibold text-[#d97706]">Maybe</p>
                    </div>
                    <div className="bg-[#fee2e2] rounded-[12px] py-3 flex flex-col items-center gap-0.5">
                      <p className="text-[20px] font-bold text-[#ef4444]">{counts.NOT_GOING}</p>
                      <p className="text-[10px] font-semibold text-[#ef4444]">Can't Go</p>
                    </div>
                  </div>
                  {total > 0 && (
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      {counts.GOING > 0 && <div className="bg-[#22c55e] h-full" style={{ width: `${(counts.GOING / total) * 100}%` }} />}
                      {counts.MAYBE > 0 && <div className="bg-[#f59e0b] h-full" style={{ width: `${(counts.MAYBE / total) * 100}%` }} />}
                      {counts.NOT_GOING > 0 && <div className="bg-[#ef4444] h-full" style={{ width: `${(counts.NOT_GOING / total) * 100}%` }} />}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* RSVP */}
            <div className="pt-1">
              <p className="text-[13px] font-semibold text-slate-700 mb-2">Will you attend?</p>
              <div className="flex gap-2">
                {RSVP_OPTIONS.map((opt) => {
                  const isActive = myRsvp === opt.status;
                  return (
                    <button key={opt.status}
                      onClick={() => rsvp.mutate({ status: opt.status })}
                      disabled={rsvp.isPending}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[12px] border-[1.5px] transition-all disabled:opacity-50 text-[11px] font-semibold"
                      style={{
                        borderColor: isActive ? opt.border : '#e2e8f0',
                        background: isActive ? opt.bg : '#fff',
                        color: isActive ? opt.text : '#64748b',
                      }}>
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {myRsvp && (
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Your response: <span className="font-semibold text-slate-700">{RSVP_OPTIONS.find((o) => o.status === myRsvp)?.label}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const user = authStore.getUser();
  const isAdmin = user?.role === 'ADMIN';
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<{ id: string; defaultValues: Partial<EventForm> } | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');

  const { data, isLoading } = useQuery({
    queryKey: ['events', filter],
    queryFn: () => getEvents({ upcoming: filter === 'upcoming' }),
  });
  const events = data?.items ?? [];

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-5">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <p className="text-[20px] font-bold text-slate-900">Events</p>
          <p className="text-[13px] text-slate-400 mt-0.5">{events.length} {filter === 'upcoming' ? 'upcoming' : 'total'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
            <Plus size={18} color="white" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-[12px]">
        {(['upcoming', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold capitalize transition-all"
            style={{ background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#0f172a' : '#64748b', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
            {f === 'upcoming' ? 'Upcoming' : 'All Events'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((n) => <div key={n} className="h-20 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {events.length > 0 && (
        <div className="flex flex-col gap-3">
          {events.map((e) => (
            <div key={e.id} className="bg-white rounded-[18px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden cursor-pointer active:bg-slate-50 transition-colors"
              onClick={() => setSelectedEventId(e.id)}>
              <div className="flex items-start gap-3 p-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-slate-900">{e.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{format(new Date(e.startAt), 'EEE, MMM d · h:mm a')}</p>
                  {e.location && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{e.location}
                    </p>
                  )}
                  {e.description && <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{e.description}</p>}
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && !isLoading && (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Calendar size={40} className="mb-3 opacity-30" />
          <p className="text-[15px] font-medium">{filter === 'upcoming' ? 'No upcoming events' : 'No events yet'}</p>
        </div>
      )}

      {showCreate && <EventFormModal onClose={() => setShowCreate(false)} />}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onEdit={isAdmin ? (ev) => {
            const startAt = new Date(ev.startAt);
            const endAt = (ev as any).endAt ? new Date((ev as any).endAt) : null;
            setEditingEvent({
              id: ev.id,
              defaultValues: {
                title: ev.title,
                description: ev.description ?? '',
                date: ev.startAt.slice(0, 10),
                startTime: `${String(startAt.getUTCHours()).padStart(2, '0')}:${String(startAt.getUTCMinutes()).padStart(2, '0')}`,
                endTime: endAt ? `${String(endAt.getUTCHours()).padStart(2, '0')}:${String(endAt.getUTCMinutes()).padStart(2, '0')}` : '',
                location: ev.location ?? '',
              },
            });
          } : undefined}
        />
      )}
      {editingEvent && (
        <EventFormModal
          eventId={editingEvent.id}
          defaultValues={editingEvent.defaultValues}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
