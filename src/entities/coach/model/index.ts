export interface CoachProfile {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  specialty: string[];
  bio: string;
  hourlyRate: number;
  avgRating?: number;
  reviewCount?: number;
  totalSessions?: number;
  languages?: string[];
  yearsOfExperience?: number;
  verified?: boolean;
  createdAt: string;
}

export type CoachingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface CoachingSession {
  id: string;
  coachId: string;
  clientId: string;
  scheduledAt: string;
  durationMinutes: number;
  totalPrice: number;
  commission: number;
  coachEarn: number;
  status: CoachingStatus;
  meetingUrl?: string;
  notes?: string;
  review?: { rating: number; comment: string };
  createdAt: string;
  updatedAt: string;
}

export const COMMISSION_RATE = 0.15;
export const COACHING_DURATIONS = [30, 45, 60, 90, 120] as const;
export type CoachingDuration = (typeof COACHING_DURATIONS)[number];
