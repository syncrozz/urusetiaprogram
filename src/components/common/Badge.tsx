import React from 'react';
import { PriorityLevel, RequirementStatus, AssistanceStatus, ProgramStatus } from '../../types';
import { getStatusColor, getPriorityBadge } from '../../lib/utils';
import { AlertTriangle, CheckCircle2, Clock, XCircle, ShieldAlert, Sparkles } from 'lucide-react';

export const StatusBadge: React.FC<{ status: RequirementStatus; showIcon?: boolean; className?: string }> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  const meta = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${meta.badgeBg} ${meta.border} ${className}`}
    >
      {showIcon && (
        <>
          {status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          {status === 'IN_PROGRESS' && <Clock className="w-3 h-3 text-amber-600" />}
          {status === 'ACTION_REQUIRED' && <AlertTriangle className="w-3 h-3 text-red-600" />}
          {status === 'NOT_APPLICABLE' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
        </>
      )}
      <span>{meta.label.split(' ')[0]}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel; className?: string }> = ({
  priority,
  className = '',
}) => {
  const meta = getPriorityBadge(priority);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${meta.bg} ${className}`}>
      {priority === 'CRITICAL' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-ping" />}
      {meta.label}
    </span>
  );
};

export const AssistanceBadge: React.FC<{ status: AssistanceStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  if (status === 'NONE') return null;

  if (status === 'OPEN') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-xs ${className}`}
      >
        <ShieldAlert className="w-3 h-3" />
        <span>Perlu Bantuan</span>
      </span>
    );
  }

  if (status === 'IN_REVIEW') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs ${className}`}
      >
        <Clock className="w-3 h-3" />
        <span>Dalam Semakan</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 ${className}`}
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      <span>Selesai</span>
    </span>
  );
};

export const ProgramStatusBadge: React.FC<{ status: ProgramStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const styles: Record<ProgramStatus, { bg: string; text: string; label: string }> = {
    PLANNING: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', text: 'text-indigo-700', label: 'Perancangan (Planning)' },
    PREPARATION: { bg: 'bg-sky-50 border-sky-200 text-sky-700', text: 'text-sky-700', label: 'Persediaan (Preparation)' },
    ACTIVE: { bg: 'bg-emerald-50 border-emerald-300 text-emerald-700', text: 'text-emerald-700', label: 'Aktif (Active)' },
    COMPLETED: { bg: 'bg-emerald-100 border-emerald-300 text-emerald-800', text: 'text-emerald-800', label: 'Selesai (Completed)' },
    ARCHIVED: { bg: 'bg-slate-100 border-slate-300 text-slate-600', text: 'text-slate-600', label: 'Arkib (Archived)' },
  };

  const c = styles[status] || styles.PLANNING;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${c.bg} ${className}`}>
      {status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
      {c.label}
    </span>
  );
};
