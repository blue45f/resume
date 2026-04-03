export interface LinkItem {
  label: string;
  url: string;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  github?: string;
  summary: string;
  photo?: string;
  birthYear?: string;
  links?: LinkItem[];
  military?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  department?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string;
  techStack?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  gpa?: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  category: string;
  items: string;
}

export interface Project {
  id: string;
  name: string;
  company?: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  techStack?: string;
  link: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  description: string;
}

export interface Language {
  id: string;
  name: string;
  testName: string;
  score: string;
  testDate: string;
}

export interface Award {
  id: string;
  name: string;
  issuer: string;
  awardDate: string;
  description: string;
}

export interface Activity {
  id: string;
  name: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type SectionId = 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'awards' | 'activities';

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'experience', 'education', 'skills', 'projects',
  'certifications', 'languages', 'awards', 'activities',
];

export interface Resume {
  id: string;
  title: string;
  slug?: string;
  userId?: string;
  viewCount?: number;
  visibility?: 'public' | 'private' | 'link-only';
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
  tags?: Tag[];
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
}

export interface ResumeSummary {
  id: string;
  title: string;
  slug?: string;
  userId?: string;
  viewCount?: number;
  visibility?: 'public' | 'private' | 'link-only';
  personalInfo: PersonalInfo;
  tags: Tag[];
  skills?: Skill[];
  createdAt: string;
  updatedAt: string;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  layout: string;
  visibility: string;
  usageCount: number;
  rating: number | null;
  isDefault: boolean;
}

export interface TransformResult {
  id: string;
  text: string;
  tokensUsed: number;
  provider: string;
  model: string;
  createdAt: string;
}

export interface LlmProvider {
  name: string;
  available: boolean;
  isDefault: boolean;
}

export function createEmptyResumeData() {
  return {
    title: "",
    personalInfo: { name: "", email: "", phone: "", address: "", website: "", github: "", summary: "", photo: "", birthYear: "", links: [] as LinkItem[], military: "" },
    experiences: [] as Experience[],
    educations: [] as Education[],
    skills: [] as Skill[],
    projects: [] as Project[],
    certifications: [] as Certification[],
    languages: [] as Language[],
    awards: [] as Award[],
    activities: [] as Activity[],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [] as SectionId[],
  };
}
