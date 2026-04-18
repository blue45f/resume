export type {
  Resume,
  ResumeSummary,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  Award,
  Activity,
  SectionId,
} from '@/types/resume';
export { DEFAULT_SECTION_ORDER } from '@/types/resume';

export type ResumeVisibility = 'public' | 'private' | 'link-only';

export interface ResumeAuthor {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  isOpenToWork?: boolean;
}
