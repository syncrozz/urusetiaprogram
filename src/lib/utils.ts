import { ProgramUnit, UnitRequirement, PriorityLevel, RequirementStatus } from '../types';

export function calculateUnitProgress(requirements: UnitRequirement[]): number {
  if (!requirements || requirements.length === 0) return 0;
  
  // Filter out NOT_APPLICABLE
  const activeReqs = requirements.filter((r) => r.status !== 'NOT_APPLICABLE');
  if (activeReqs.length === 0) return 100;

  // Weight critical & high items slightly higher for genuine operational readiness
  let totalWeight = 0;
  let weightedProgress = 0;

  activeReqs.forEach((r) => {
    let weight = 1;
    if (r.priority === 'CRITICAL') weight = 2.5;
    else if (r.priority === 'HIGH') weight = 1.8;
    else if (r.priority === 'MEDIUM') weight = 1.2;
    else weight = 1.0;

    let score = 0;
    if (r.status === 'COMPLETED') {
      score = 100;
    } else if (r.status === 'IN_PROGRESS') {
      score = r.progress && r.progress > 0 ? r.progress : 50;
    } else {
      score = 0;
    }

    totalWeight += weight;
    weightedProgress += score * weight;
  });

  return Math.min(100, Math.round(weightedProgress / (totalWeight || 1)));
}

export function calculateProgramReadiness(units: ProgramUnit[]): {
  overallPercentage: number;
  completedUnitsCount: number;
  inProgressUnitsCount: number;
  actionRequiredUnitsCount: number;
  openAssistanceCount: number;
  criticalIncompleteCount: number;
  isReadyForLaunch: boolean;
} {
  if (!units || units.length === 0) {
    return {
      overallPercentage: 0,
      completedUnitsCount: 0,
      inProgressUnitsCount: 0,
      actionRequiredUnitsCount: 0,
      openAssistanceCount: 0,
      criticalIncompleteCount: 0,
      isReadyForLaunch: false,
    };
  }

  let totalUnitProgress = 0;
  let completedUnits = 0;
  let inProgressUnits = 0;
  let actionRequiredUnits = 0;
  let openAssistance = 0;
  let criticalIncomplete = 0;

  units.forEach((u) => {
    const progress = calculateUnitProgress(u.requirements);
    totalUnitProgress += progress;

    if (progress >= 100 || u.status === 'COMPLETED') {
      completedUnits++;
    } else if (progress > 0 || u.status === 'IN_PROGRESS') {
      inProgressUnits++;
    } else {
      actionRequiredUnits++;
    }

    if (u.assistanceStatus === 'OPEN' || u.assistanceStatus === 'IN_REVIEW') {
      openAssistance++;
    }

    // Check critical incomplete requirements
    u.requirements?.forEach((req) => {
      if (req.priority === 'CRITICAL' && req.status !== 'COMPLETED' && req.status !== 'NOT_APPLICABLE') {
        criticalIncomplete++;
      }
    });
  });

  const overallPercentage = Math.round(totalUnitProgress / units.length);
  const isReadyForLaunch = overallPercentage >= 90 && openAssistance === 0 && criticalIncomplete === 0;

  return {
    overallPercentage,
    completedUnitsCount: completedUnits,
    inProgressUnitsCount: inProgressUnits,
    actionRequiredUnitsCount: actionRequiredUnits,
    openAssistanceCount: openAssistance,
    criticalIncompleteCount: criticalIncomplete,
    isReadyForLaunch,
  };
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getStatusColor(status: RequirementStatus): {
  badgeBg: string;
  badgeText: string;
  border: string;
  dot: string;
  label: string;
} {
  switch (status) {
    case 'COMPLETED':
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        label: 'Siap (Completed)',
      };
    case 'IN_PROGRESS':
      return {
        badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        badgeText: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
        label: 'Sedang Berjalan (In Progress)',
      };
    case 'ACTION_REQUIRED':
      return {
        badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        badgeText: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
        label: 'Perlu Tindakan (Action Required)',
      };
    case 'NOT_APPLICABLE':
      return {
        badgeBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        badgeText: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
        label: 'Tidak Berkenaan (N/A)',
      };
    default:
      return {
        badgeBg: 'bg-slate-100 text-slate-600',
        badgeText: 'text-slate-600',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
        label: 'Belum Ditentukan',
      };
  }
}

export function getPriorityBadge(priority: PriorityLevel): {
  bg: string;
  text: string;
  label: string;
} {
  switch (priority) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
        text: 'text-red-700 dark:text-red-400',
        label: 'Kritikal',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900',
        text: 'text-orange-700 dark:text-orange-400',
        label: 'Tinggi',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
        text: 'text-blue-700 dark:text-blue-400',
        label: 'Sederhana',
      };
    case 'LOW':
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-400',
        label: 'Rendah',
      };
  }
}
