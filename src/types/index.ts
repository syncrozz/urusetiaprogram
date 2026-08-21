export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RequirementStatus = 'ACTION_REQUIRED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_APPLICABLE';

export type ProgramStatus = 'PLANNING' | 'PREPARATION' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type AssistanceStatus = 'NONE' | 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export type UserRole = 'MASTER_ADMIN' | 'ADMIN' | 'KETUA_UNIT' | 'AJK';

export interface Person {
  id: string;
  fullName: string;
  nickname?: string;
  position?: string;
  studentId: string;
  icNumber?: string;
  icLast4: string;
  phone: string;
  gmail?: string;
  email: string;
  gender?: string;
  programStudy?: string;
  semester?: string;
  avatar?: string;
  role: UserRole;
  department?: string;
}

export interface TemplateRequirement {
  id: string;
  unitId: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  required: boolean;
  requiresEvidence?: boolean;
  suggestedDurationDays?: number;
  sortOrder: number;
}

export interface TemplateUnit {
  id: string;
  templateId: string;
  name: string;
  description: string;
  icon: string;
  priority: PriorityLevel;
  sortOrder: number;
  suggestedRoles?: string[];
  requirements: TemplateRequirement[];
}

export interface ProgramTemplate {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  units: TemplateUnit[];
  createdAt: string;
  updatedAt: string;
}

export interface MainCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'ACTIVE' | 'ARCHIVED';
  color: string;
  templatesCount?: number;
  createdAt: string;
}

export interface UnitEvidence {
  id: string;
  requirementId: string;
  mediaType: 'image' | 'pdf' | 'link' | 'document';
  title: string;
  mediaUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

export interface UnitRequirement {
  id: string;
  programUnitId: string;
  templateRequirementId?: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  required: boolean;
  status: RequirementStatus;
  progress: number; // 0 to 100
  dueDate?: string;
  completedAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  notes?: string;
  evidences?: UnitEvidence[];
}

export interface ProgramUnit {
  id: string;
  programId: string;
  templateUnitId?: string;
  name: string;
  description: string;
  icon: string;
  leaderId?: string;
  leader?: Person;
  priority: PriorityLevel;
  progress: number; // calculated percentage 0-100
  status: RequirementStatus;
  membersCount?: number;
  requirements: UnitRequirement[];
  
  // Escalation / Assistance
  assistanceStatus: AssistanceStatus;
  assistanceReason?: string;
  assistanceRequest?: string;
  assistanceCreatedAt?: string;
  assistanceResolvedAt?: string;
  assistanceAdminNote?: string;
  
  lastUpdated: string;
}

export interface ProgramMilestone {
  id: string;
  programId: string;
  title: string;
  targetDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  phase: 'PLANNING' | 'PREPARATION' | 'REHEARSAL' | 'TECHNICAL_CHECK' | 'FINAL_PREP' | 'EVENT_DAY' | 'POST_EVENT';
}

export interface Program {
  id: string;
  categoryId: string;
  templateId?: string;
  name: string;
  description: string;
  code: string;
  startDate: string;
  endDate: string;
  deadlineDate: string;
  venue: string;
  status: ProgramStatus;
  targetAudience?: string;
  expectedAttendance?: number;
  budgetAllocated?: number;
  overallProgress: number; // 0 - 100%
  units: ProgramUnit[];
  milestones?: ProgramMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface UnitUpdate {
  id: string;
  unitId: string;
  programId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  type: 'PROGRESS' | 'STATUS_CHANGE' | 'ESCALATION' | 'EVIDENCE' | 'NOTE';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'PROGRAM' | 'UNIT' | 'REQUIREMENT' | 'TEMPLATE' | 'CATEGORY' | 'ESCALATION' | 'AUTH';
  entityId: string;
  entityName?: string;
  details?: string;
  createdAt: string;
}

export interface AuthSession {
  role: UserRole;
  person?: Person;
  programId?: string;
  unitId?: string;
  isMasterUnlocked?: boolean;
}

export * from './competition';
