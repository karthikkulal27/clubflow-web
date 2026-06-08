import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Lock, ShieldCheck, Users, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const schema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      setError('');
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Login failed. Please check your credentials.');
    }
  }

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
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
          Manage your club, effortlessly
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#ffffff',
          borderRadius: 24,
          padding: '28px 24px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
          Sign In
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
          Enter your phone number and password
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              leftIcon={<Phone size={18} />}
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ padding: 4, lineHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass
                    ? <EyeOff size={18} color="#94a3b8" />
                    : <Eye size={18} color="#94a3b8" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: 13,
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Sign In
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
          <ShieldCheck size={14} />
          <span style={{ fontSize: 12 }}>Secured with end-to-end encryption</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(['Payments', 'Transparency', 'Events'] as const).map(f => (
            <span
              key={f}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 999,
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
              }}
            >
              {f}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          New here?{' '}
          <Link to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
