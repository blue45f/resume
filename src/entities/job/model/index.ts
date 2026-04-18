export interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string;
  minYears?: number;
  maxYears?: number;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  deadline?: string;
  tags?: string[];
  authorId?: string;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CuratedJob extends JobPost {
  source?: 'wanted' | 'jumpit' | 'saramin' | 'manual';
  externalUrl?: string;
}

export type EmploymentType = NonNullable<JobPost['employmentType']>;
