import { useState, useEffect, useCallback } from 'react';
import { authStore, type AuthUser } from '../store/auth.store';
import { loginApi, registerClubApi, joinClubApi, type LoginPayload, type RegisterClubPayload, type JoinClubPayload } from '../lib/auth.api';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(authStore.getUser);

  useEffect(() => {
    const sync = () => setUser(authStore.getUser());
    window.addEventListener('auth-change', sync);
    return () => window.removeEventListener('auth-change', sync);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { accessToken, refreshToken, user } = await loginApi(payload);
    authStore.setSession(accessToken, refreshToken, user);
  }, []);

  const registerClub = useCallback(async (payload: RegisterClubPayload) => {
    const { accessToken, refreshToken, user } = await registerClubApi(payload);
    authStore.setSession(accessToken, refreshToken, user);
  }, []);

  const joinClub = useCallback(async (payload: JoinClubPayload) => {
    const { accessToken, refreshToken, user } = await joinClubApi(payload);
    authStore.setSession(accessToken, refreshToken, user);
  }, []);

  const logout = useCallback(() => {
    authStore.clearSession();
  }, []);

  return { user, isAuthenticated: !!user, login, registerClub, joinClub, logout };
}
