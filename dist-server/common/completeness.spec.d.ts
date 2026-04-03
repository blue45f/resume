interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    github?: string;
    summary: string;
    photo?: string;
}
interface Experience {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    techStack?: string;
}
interface Education {
    id: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
}
interface Skill {
    id: string;
    category: string;
    items: string;
}
interface Project {
    id: string;
    name: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    link: string;
}
interface Certification {
    id: string;
    name: string;
}
interface Language {
    id: string;
    name: string;
}
interface Award {
    id: string;
    name: string;
}
interface Activity {
    id: string;
    name: string;
}
interface Resume {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    personalInfo: PersonalInfo;
    experiences: Experience[];
    educations: Education[];
    skills: Skill[];
    projects: Project[];
    certifications: Certification[];
    languages: Language[];
    awards: Award[];
    activities: Activity[];
}
interface SectionScore {
    label: string;
    score: number;
    maxScore: number;
}
interface CompletenessResult {
    percentage: number;
    grade: string;
    sections: SectionScore[];
    tips: string[];
}
declare function calculateCompleteness(resume: Resume): CompletenessResult;
declare function createEmptyResume(): Resume;
declare function createFullResume(): Resume;
