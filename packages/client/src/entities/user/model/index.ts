export type UserType = 'personal' | 'recruiter' | 'company' | 'coach';
export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  provider?: string;
  role: UserRole;
  userType: UserType;
  isOpenToWork?: boolean;
  openToWorkRoles?: string[];
  companyName?: string;
  companyTitle?: string;
  marketingOptIn?: boolean;
  llmOptIn?: boolean;
  createdAt?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  userType: UserType;
}
