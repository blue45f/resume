import { CoachingService, UpsertCoachProfileDto, CreateSessionDto, UpdateSessionStatusDto, ReviewSessionDto } from './coaching.service';
export declare class CoachingController {
    private readonly service;
    constructor(service: CoachingService);
    listCoaches(specialty?: string, minRate?: string, maxRate?: string): Promise<any>;
    getCoach(id: string): Promise<any>;
    upsertCoachProfile(body: UpsertCoachProfileDto, req: any): Promise<any>;
    createSession(body: CreateSessionDto, req: any): Promise<any>;
    mySessions(req: any): Promise<{
        asClient: any;
        asCoach: any[];
    }>;
    updateStatus(id: string, body: UpdateSessionStatusDto, req: any): Promise<any>;
    reviewSession(id: string, body: ReviewSessionDto, req: any): Promise<any>;
}
