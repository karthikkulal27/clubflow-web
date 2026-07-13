export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: 'ADMIN' | 'MEMBER';
  clubId: string;
  clubName: string;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  profileCompletion?: number;
  joinedAt?: string | null;
  isActive: boolean;
}

export interface Club {
  id: string;
  name: string;
  sport: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface Payment {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'WAIVED';
  dueDate: string;
  paidAt?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  member: { id: string; name: string; phone: string };
  specialCollection?: { id: string; name: string } | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  expenseDate: string;
  description?: string | null;
  category?: string | null;
  addedBy: { id: string; name: string };
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  location?: string | null;
  organizer: { id: string; name: string };
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardDue {
  id: string;
  amount: number;
  status: string;
  dueDate?: string | null;
  paidAt: string | null;
  month: number;
  year: number;
}

export interface DashboardEvent {
  id: string;
  title: string;
  startAt: string;
  location?: string | null;
}

export interface MemberDashboard {
  role: 'MEMBER';
  currentMonth: { month: number; year: number };
  currentDue: DashboardDue | null;
  finance: { totalCollection: number; totalExpenses: number; availableBalance: number };
  upcomingEvents: DashboardEvent[];
  latestAnnouncement: { id: string; title: string; body: string; publishedAt: string } | null;
  myPaymentHistory: { id: string; amount: number; month: number; year: number; status: string; paidAt: string | null }[];
}

export interface AdminDashboard {
  role: 'ADMIN';
  currentMonth: { month: number; year: number };
  currentDue: DashboardDue | null;
  stats: {
    totalMembers: number;
    paidCount: number;
    pendingCount: number;
    totalMemberPayments?: number;
    totalAdminIncome?: number;
    totalIncome?: number;
    totalCollection?: number;
    totalExpenses: number;
    availableBalance: number;
  };
  upcomingEvents: DashboardEvent[];
  recentPayments: { id: string; amount: number; month: number; year: number; paidAt: string | null; user: { id: string; name: string } }[];
  recentExpenses: { id: string; title: string; amount: number; category?: string | null; expenseDate: string }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
