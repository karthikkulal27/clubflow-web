export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: 'ADMIN' | 'MEMBER';
  clubId: string;
  clubName: string;
}

function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const authStore = {
  getUser,
  getAccessToken: () => localStorage.getItem('accessToken'),
  isAuthenticated: () => !!localStorage.getItem('accessToken') && !!getUser(),
  setSession(accessToken: string, refreshToken: string, user: AuthUser) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-change'));
  },
  clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
  },
};
