export declare class PersonalInfoDto {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    github?: string;
    summary?: string;
    photo?: string;
    birthYear?: string;
    links?: {
        label: string;
        url: string;
    }[];
    military?: string;
}
export declare class ExperienceDto {
    id?: string;
    company?: string;
    position?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements?: string;
    techStack?: string;
    sortOrder?: number;
}
export declare class EducationDto {
    id?: string;
    school?: string;
    degree?: string;
    field?: string;
    gpa?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    sortOrder?: number;
}
export declare class SkillDto {
    id?: string;
    category?: string;
    items?: string;
    sortOrder?: number;
}
export declare class ProjectDto {
    id?: string;
    name?: string;
    company?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    techStack?: string;
    link?: string;
    sortOrder?: number;
}
export declare class CertificationDto {
    id?: string;
    name?: string;
    issuer?: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    description?: string;
    sortOrder?: number;
}
export declare class LanguageDto {
    id?: string;
    name?: string;
    testName?: string;
    score?: string;
    testDate?: string;
    sortOrder?: number;
}
export declare class AwardDto {
    id?: string;
    name?: string;
    issuer?: string;
    awardDate?: string;
    description?: string;
    sortOrder?: number;
}
export declare class ActivityDto {
    id?: string;
    name?: string;
    organization?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    sortOrder?: number;
}
export declare class CreateResumeDto {
    title?: string;
    personalInfo?: PersonalInfoDto;
    experiences?: ExperienceDto[];
    educations?: EducationDto[];
    skills?: SkillDto[];
    projects?: ProjectDto[];
    certifications?: CertificationDto[];
    languages?: LanguageDto[];
    awards?: AwardDto[];
    activities?: ActivityDto[];
}
