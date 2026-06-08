import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Phone, Lock, User, Trophy, Hash } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

type Mode = 'create-club' | 'join-club';

const createSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Enter valid phone'),
  password: z.string().min(6, 'Min 6 characters'),
  clubName: z.string().min(2, 'Club name required'),
  sport: z.string().min(2, 'Sport required'),
});

const joinSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Enter valid phone'),
  password: z.string().min(6, 'Min 6 characters'),
  inviteCode: z.string().min(4, 'Enter invite code'),
});

type CreateData = z.infer<typeof createSchema>;
type JoinData = z.infer<typeof joinSchema>;

function CreateForm() {
  const { registerClub } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateData>({ resolver: zodResolver(createSchema) });

  async function onSubmit(data: CreateData) {
    try { setError(''); await registerClub(data); navigate('/dashboard', { replace: true }); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Registration failed.'); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        <Input label="Full Name" placeholder="Your name" leftIcon={<User size={18} />} error={errors.name?.message} {...register('name')} />
        <Input label="Phone" type="tel" placeholder="9876543210" leftIcon={<Phone size={18} />} error={errors.phone?.message} {...register('phone')} />
        <Input label="Password" type="password" placeholder="Min 6 characters" leftIcon={<Lock size={18} />} error={errors.password?.message} {...register('password')} />
        <Input label="Club Name" placeholder="e.g. City FC" leftIcon={<Trophy size={18} />} error={errors.clubName?.message} {...register('clubName')} />
        <Input label="Sport" placeholder="e.g. Football" error={errors.sport?.message} {...register('sport')} />
      </div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          {error}
        </div>
      )}
      <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Create Club</Button>
    </form>
  );
}

function JoinForm() {
  const { joinClub } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JoinData>({ resolver: zodResolver(joinSchema) });

  async function onSubmit(data: JoinData) {
    try { setError(''); await joinClub(data); navigate('/dashboard', { replace: true }); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Registration failed.'); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        <Input label="Full Name" placeholder="Your name" leftIcon={<User size={18} />} error={errors.name?.message} {...register('name')} />
        <Input label="Phone" type="tel" placeholder="9876543210" leftIcon={<Phone size={18} />} error={errors.phone?.message} {...register('phone')} />
        <Input label="Password" type="password" placeholder="Min 6 characters" leftIcon={<Lock size={18} />} error={errors.password?.message} {...register('password')} />
        <Input label="Invite Code" placeholder="Get this from your admin" leftIcon={<Hash size={18} />} error={errors.inviteCode?.message} {...register('inviteCode')} />
      </div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          {error}
        </div>
      )}
      <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="!bg-emerald-500 hover:!bg-emerald-600">
        Join Club
      </Button>
    </form>
  );
}

export default function RegisterPage() {
  const [mode, setMode] = useState<Mode>('create-club');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#eef2ff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            width: 68,
            height: 68,
            background: '#2563eb',
            borderRadius: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
            marginBottom: 16,
          }}
        >
          <Users size={30} color="#fff" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
          ClubFlow
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>
          Create or join a club
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#ffffff',
          borderRadius: 24,
          padding: '24px 24px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          boxSizing: 'border-box',
        }}
      >
        {/* Tab toggle */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {([
            { key: 'create-club' as const, label: 'Create Club', activeColor: '#2563eb' },
            { key: 'join-club' as const, label: 'Join Club', activeColor: '#059669' },
          ]).map(({ key, label, activeColor }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === key ? '#ffffff' : 'transparent',
                color: mode === key ? activeColor : '#64748b',
                boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'create-club' ? <CreateForm /> : <JoinForm />}
      </div>

      <div style={{ marginTop: 24 }}>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
