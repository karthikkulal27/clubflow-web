import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Megaphone, Plus, Trash2, X, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { authStore } from '../store/auth.store';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../lib/announcements.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const schema = z.object({
  title: z.string().min(2, 'Title required'),
  body: z.string().min(5, 'Message required'),
});
type FormData = z.infer<typeof schema>;

function AnnouncementModal({
  onClose,
  announcementId,
  defaultValues,
}: {
  onClose: () => void;
  announcementId?: string;
  defaultValues?: Partial<FormData>;
}) {
  const qc = useQueryClient();
  const isEditing = !!announcementId;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const mutation = useMutation({
    mutationFn: (d: FormData) => isEditing ? updateAnnouncement(announcementId, d) : createAnnouncement(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-slate-900">{isEditing ? 'Edit Announcement' : 'Post Announcement'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutateAsync(d))} className="flex flex-col gap-4 p-6">
          <Input label="Title" placeholder="e.g. Practice cancelled" error={errors.title?.message} {...register('title')} />
          <div className="flex flex-col" style={{ gap: 6 }}>
            <label className="text-[13px] font-medium text-slate-600">Message</label>
            <textarea {...register('body')} rows={4} placeholder="Write your announcement here…"
              className="rounded-[14px] border-[1.5px] border-slate-200 px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary resize-none" />
            {errors.body && <p className="text-[11px] text-danger">{errors.body.message}</p>}
          </div>
          {mutation.error && <p className="text-[11px] text-danger">{(mutation.error as any)?.response?.data?.message ?? 'Failed'}</p>}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>{isEditing ? 'Save Changes' : 'Post Announcement'}</Button>
        </form>
      </div>
    </div>
  );
}

function AnnouncementCard({ a, isAdmin, onEdit }: { a: any; isAdmin: boolean; onEdit?: (a: any) => void }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useMutation({
    mutationFn: () => deleteAnnouncement(a.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const dateStr = a.publishedAt ?? a.createdAt;
  const isLong = a.body.length > 120;

  return (
    <Card padding="md">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-[#fef3c7] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Megaphone size={18} className="text-[#f59e0b]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] font-semibold text-slate-900">{a.title}</p>
            {isAdmin && (
              <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                {!confirmDelete && (
                  <button onClick={() => onEdit?.(a)} className="text-slate-300 hover:text-primary transition-colors">
                    <Pencil size={14} />
                  </button>
                )}
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-100">Cancel</button>
                    <button onClick={() => del.mutate()} disabled={del.isPending} className="text-[11px] text-white bg-red-500 px-2 py-1 rounded disabled:opacity-50">Delete</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className={`text-[13px] text-slate-600 mt-1 leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
            {a.body}
          </p>

          {isLong && (
            <button onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[12px] text-primary font-medium mt-1">
              {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
            </button>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400">— {a.author?.name ?? 'Admin'}</p>
            <p className="text-[11px] text-slate-400">{format(new Date(dateStr), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AnnouncementsPage() {
  const user = authStore.getUser();
  const isAdmin = user?.role === 'ADMIN';
  const [showCreate, setShowCreate] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<{ id: string; defaultValues: Partial<FormData> } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['announcements'], queryFn: () => getAnnouncements() });
  const announcements = data?.items ?? [];

  return (
    <div className="px-5 pt-3 pb-8 flex flex-col gap-5">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <p className="text-[20px] font-bold text-slate-900">Announcements</p>
          <p className="text-[13px] text-slate-400 mt-0.5">{announcements.length} posts</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
            <Plus size={18} color="white" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((n) => <div key={n} className="h-24 bg-white rounded-[18px] border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {announcements.length > 0 && (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              a={a}
              isAdmin={isAdmin}
              onEdit={isAdmin ? (item) => setEditingAnnouncement({ id: item.id, defaultValues: { title: item.title, body: item.body } }) : undefined}
            />
          ))}
        </div>
      )}

      {announcements.length === 0 && !isLoading && (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Megaphone size={40} className="mb-3 opacity-30" />
          <p className="text-[15px] font-medium">No announcements yet</p>
        </div>
      )}

      {showCreate && <AnnouncementModal onClose={() => setShowCreate(false)} />}
      {editingAnnouncement && (
        <AnnouncementModal
          announcementId={editingAnnouncement.id}
          defaultValues={editingAnnouncement.defaultValues}
          onClose={() => setEditingAnnouncement(null)}
        />
      )}
    </div>
  );
}
