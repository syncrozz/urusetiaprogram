import React, { useState } from 'react';
import { Program, ProgramUnit, Person } from '../../types';
import { calculateProgramReadiness, formatDateTime, formatDate, getPersonDisplayName } from '../../lib/utils';
import { StatusBadge, PriorityBadge, AssistanceBadge } from '../common/Badge';
import { IconRenderer } from '../common/IconRenderer';
import { UnitLeaderAssignModal } from './UnitLeaderAssignModal';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  UserPlus,
  Users,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Filter,
  CheckCircle,
  FileCheck,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

interface ProgramReadinessOverviewProps {
  program: Program;
  people: Person[];
  onInspectUnit: (unit: ProgramUnit) => void;
  onOpenAssistanceTab: () => void;
  onOpenSecretariatReport: () => void;
}

export const ProgramReadinessOverview: React.FC<ProgramReadinessOverviewProps> = ({
  program,
  people,
  onInspectUnit,
  onOpenAssistanceTab,
  onOpenSecretariatReport,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedUnitForAssign, setSelectedUnitForAssign] = useState<ProgramUnit | null>(null);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  const safeUnits = Array.isArray(program?.units) ? program.units : [];
  const stats = calculateProgramReadiness(safeUnits);

  // Filter logic
  const filteredUnits = safeUnits.filter((unit) => {
    if (!unit) return false;
    if (filterType === 'ALL') return true;
    if (filterType === 'COMPLETED') return unit.status === 'COMPLETED' || unit.progress >= 100;
    if (filterType === 'IN_PROGRESS') return unit.status === 'IN_PROGRESS' && unit.progress < 100;
    if (filterType === 'ACTION_REQUIRED') return unit.status === 'ACTION_REQUIRED';
    if (filterType === 'HAS_ASSISTANCE') return unit.assistanceStatus === 'OPEN' || unit.assistanceStatus === 'IN_REVIEW';
    if (filterType === 'NO_LEADER') return !unit.leaderId;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full min-w-0 overflow-hidden">
      {/* Hero Metric & Executive Readiness Panel */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-7 text-white border border-slate-800 shadow-md relative overflow-hidden w-full">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 relative z-10 w-full min-w-0">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-widest font-mono shrink-0">
                {program.code}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatDate(program.startDate)} — {formatDate(program.endDate)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white break-words">
              {program.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed break-words">
              {program.description} • Lokasi: <strong className="text-slate-100">{program.venue}</strong>
            </p>
          </div>

          {/* Readiness Score Dial & Summary */}
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-slate-800/90 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-700 shrink-0 w-full sm:w-auto">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    stats.overallPercentage >= 90
                      ? 'text-emerald-400'
                      : stats.overallPercentage >= 50
                      ? 'text-amber-400'
                      : 'text-red-400'
                  } transition-all duration-700`}
                  strokeDasharray={`${stats.overallPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="font-bold text-base sm:text-xl font-mono text-white">
                  {stats.overallPercentage}%
                </span>
                <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-slate-400">
                  Readiness
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs min-w-0 flex-1 sm:flex-initial">
              <p className="font-bold text-slate-300 uppercase tracking-widest text-[9px] sm:text-[10px]">
                Status Kesiapsiagaan:
              </p>
              <div className="flex items-center gap-1.5">
                {stats.isReadyForLaunch ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs sm:text-sm truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Bersedia Sepenuhnya</span>
                  </span>
                ) : stats.openAssistanceCount > 0 ? (
                  <span className="text-red-400 font-bold flex items-center gap-1 text-xs sm:text-sm truncate">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Perlu Tindakan Urusetia</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1 text-xs sm:text-sm truncate">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Dalam Persediaan</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                {stats.completedUnitsCount} / {program.units.length} unit selesai
              </p>
            </div>
          </div>
        </div>

        {/* 4 Core Geometric Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-5 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-2.5 sm:p-3.5 rounded-xl border border-slate-700/60 min-w-0">
            <span className="text-slate-400 block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate">
              1. Siap Sepenuhnya
            </span>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 font-mono truncate">
              {stats.completedUnitsCount} Unit
            </p>
          </div>

          <div className="bg-slate-800/60 p-2.5 sm:p-3.5 rounded-xl border border-slate-700/60 min-w-0">
            <span className="text-slate-400 block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate">
              2. Dalam Proses
            </span>
            <p className="text-lg sm:text-xl font-bold text-amber-400 mt-1 font-mono truncate">
              {stats.inProgressUnitsCount + stats.actionRequiredUnitsCount} Unit
            </p>
          </div>

          <div className="bg-slate-800/60 p-2.5 sm:p-3.5 rounded-xl border border-slate-700/60 min-w-0">
            <span className="text-slate-400 block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate">
              3. Isu Lapangan
            </span>
            <p className="text-lg sm:text-xl font-bold text-red-400 mt-1 font-mono truncate">
              {stats.openAssistanceCount} Tiket
            </p>
          </div>

          <div className="bg-slate-800/60 p-2.5 sm:p-3.5 rounded-xl border border-slate-700/60 min-w-0">
            <span className="text-slate-400 block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate">
              4. Tugasan Kritikal
            </span>
            <p className="text-lg sm:text-xl font-bold text-indigo-400 mt-1 font-mono truncate">
              {stats.criticalIncompleteCount} Terbuka
            </p>
          </div>
        </div>
      </div>

      {/* Critical Assistance Banner if Open */}
      {stats.openAssistanceCount > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-red-100">
                Eskalasi Urusetia Terbuka
              </p>
              <p className="font-bold text-xs sm:text-sm text-white break-words">
                {stats.openAssistanceCount} Unit Lapangan Memerlukan Bantuan / Kelulusan Segera!
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAssistanceTab}
            className="py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-lg bg-white hover:bg-slate-100 text-red-700 font-bold text-xs shrink-0 shadow-xs transition flex items-center justify-center gap-1.5 self-end sm:self-auto w-full sm:w-auto"
          >
            <span>Buka Hab Bantuan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Matrix Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs w-full min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Tapisan Status Unit:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap text-xs font-medium w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-indigo-600 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Semua ({program.units.length})
          </button>

          <button
            onClick={() => setFilterType('COMPLETED')}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
              filterType === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-slate-200'
            }`}
          >
            Siap ({stats.completedUnitsCount})
          </button>

          <button
            onClick={() => setFilterType('IN_PROGRESS')}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
              filterType === 'IN_PROGRESS'
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-slate-200'
            }`}
          >
            Dalam Proses ({stats.inProgressUnitsCount})
          </button>

          <button
            onClick={() => setFilterType('HAS_ASSISTANCE')}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
              filterType === 'HAS_ASSISTANCE'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-red-700 dark:text-red-400 hover:bg-slate-200'
            }`}
          >
            Ada Isu ({stats.openAssistanceCount})
          </button>

          <button
            onClick={() => setFilterType('NO_LEADER')}
            className={`px-2.5 sm:px-3 py-1 rounded-md transition whitespace-nowrap shrink-0 ${
              filterType === 'NO_LEADER'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 hover:bg-slate-200'
            }`}
          >
            Belum Ada Ketua
          </button>
        </div>
      </div>

      {/* Unit Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {filteredUnits.map((unit) => {
          const isExpanded = expandedUnitId === unit.id;
          const unitReqs = Array.isArray(unit?.requirements) ? unit.requirements : [];
          const reqCompleted = unitReqs.filter((r) => r.status === 'COMPLETED').length;

          return (
            <div
              key={unit.id}
              className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between w-full min-w-0 ${
                unit.assistanceStatus === 'OPEN'
                  ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  : unit.status === 'COMPLETED'
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/80'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="min-w-0 w-full">
                {/* Unit Header */}
                <div className="flex items-start justify-between gap-2.5 mb-3 min-w-0 w-full">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                      <IconRenderer name={unit.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {unit.name}
                        </h3>
                        <PriorityBadge priority={unit.priority} />
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {unit.description}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-sm sm:text-base font-mono text-slate-900 dark:text-white shrink-0 ml-1">
                    {unit.progress}%
                  </span>
                </div>

                {/* Progress Bar (Geometric h-1.5) */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      unit.progress >= 90
                        ? 'bg-emerald-500'
                        : unit.progress >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${unit.progress}%` }}
                  />
                </div>

                {/* Status Badges & Assistance Alert */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5">
                  <StatusBadge status={unit.status} />
                  {unit.assistanceStatus === 'OPEN' && (
                    <AssistanceBadge status="OPEN" />
                  )}
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    {reqCompleted}/{unit.requirements.length} Tugasan Selesai
                  </span>
                </div>

                {/* Leader Card / Assignment */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 mb-3 flex items-center justify-between gap-2 text-xs w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0 text-xs">
                      {unit.leader ? getPersonDisplayName(unit.leader).charAt(0) : '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-xs">
                        {unit.leader ? getPersonDisplayName(unit.leader) : 'Belum Ada Ketua Unit'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {unit.leader ? `ID: ${unit.leader.studentId} • Tel: ${unit.leader.phone}` : 'Klik untuk melantik Ketua'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedUnitForAssign(unit)}
                    className="py-1 px-2 sm:px-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 transition shrink-0 flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{unit.leader ? 'Tukar' : 'Lantik'}</span>
                  </button>
                </div>

                {/* Expandable Requirements Checklist Preview */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-fadeIn">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Senarai Keperluan Unit ({unit.requirements.length}):
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {unit.requirements.map((r) => (
                        <div
                          key={r.id}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p
                              className={`font-semibold truncate ${
                                r.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {r.title}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                              Keutamaan: {r.priority}
                            </p>
                          </div>
                          <StatusBadge status={r.status} showIcon={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium flex items-center gap-1"
                >
                  <span>{isExpanded ? 'Sembunyikan Tugasan' : 'Lihat Tugasan'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transform transition ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                <button
                  onClick={() => onInspectUnit(unit)}
                  className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 shadow-xs transition text-xs"
                >
                  <span>Perincian Unit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Leader Modal */}
      {selectedUnitForAssign && (
        <UnitLeaderAssignModal
          isOpen={!!selectedUnitForAssign}
          onClose={() => setSelectedUnitForAssign(null)}
          program={program}
          unit={selectedUnitForAssign}
          people={people}
        />
      )}
    </div>
  );
};
