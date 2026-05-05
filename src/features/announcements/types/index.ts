export type AnnouncementAudience = 'ALL_EMPLOYEES' | 'DEPARTMENT' | 'SPECIFIC_USERS';
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT';

export interface CreateAnnouncementBody {
  title: string;
  content: string;
  targetAudience: AnnouncementAudience;
  targetDepartmentIds?: string[];
  targetEmployeeIds?: string[];
  priority?: AnnouncementPriority;
}

export interface AnnouncementListResponse {
  id: string;
  title: string;
  content: string;
  targetAudience: AnnouncementAudience;
  priority: AnnouncementPriority;
  createdByName: string;
  createdAt: string;
}