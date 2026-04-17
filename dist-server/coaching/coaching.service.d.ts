import { PrismaService } from '../prisma/prisma.service';
export interface UpsertCoachProfileDto {
    specialty: string;
    bio?: string;
    hourlyRate?: number;
    yearsExp?: number;
    languages?: string;
    availableHours?: string;
    isActive?: boolean;
}
export interface CreateSessionDto {
    coachId: string;
    scheduledAt: string;
    duration?: number;
    note?: string;
}
export interface ListCoachesQuery {
    specialty?: string;
    minRate?: number;
    maxRate?: number;
}
export interface UpdateSessionStatusDto {
    status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
    meetingUrl?: string;
}
export interface ReviewSessionDto {
    rating: number;
    review?: string;
}
export declare class CoachingService {
    private prisma;
    constructor(prisma: PrismaService);
    private get coach();
    private get session();
    listCoaches(query: ListCoachesQuery): Promise<any>;
    getCoach(id: string): Promise<any>;
    upsertCoachProfile(userId: string, data: UpsertCoachProfileDto): Promise<any>;
    createSession(clientId: string, data: CreateSessionDto): Promise<any>;
    mySessions(userId: string): Promise<{
        asClient: any;
        asCoach: any[];
    }>;
    updateStatus(sessionId: string, userId: string, data: UpdateSessionStatusDto): Promise<any>;
    reviewSession(sessionId: string, userId: string, data: ReviewSessionDto): Promise<any>;
}
