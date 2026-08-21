import React, { useState } from 'react';
import { Program, ProgramUnit, Person, CompetitionReadiness, ReadinessLevel } from '../../types';
import { formatDate, getPersonDisplayName } from '../../lib/utils';
import { IconRenderer } from '../common/IconRenderer';
import { secretariatStore } from '../../lib/storage';
import { SOARContingentReportModal } from './SOARContingentReportModal';
import {
  Trophy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Calendar,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  FileText,
  Users,
  Activity,
  Sliders,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface SOARCommandDashboardProps {
  program: Program;
  people: Person[];
  onInspectUnit: (unit: ProgramUnit) => void;
  onOpenAssistanceTab: () => void;
  onOpenRequirementsTab: () => void;
  onOpenSquadTab?: () => void;
  onOpenTrainingTab?: () => void;
  onOpenLogisticsTab?: () => void;
}

export function renderReadinessBadge(level: ReadinessLevel) {
  if (level === 'READY') {
    return (
      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>READY</span>
      </span>
    );
  }
  if (level === 'NEAR_READY') {
    return (
      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>NEAR READY</span>
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 text-[10px] font-bold font-mono inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      <span>NOT READY</span>
    </span>
  );
}

export const SOARCommandDashboard: React.FC<SOARCommandDashboardProps> = ({
  program,
  people,
  onInspectUnit,
  onOpenAssistanceTab,
  onOpenRequirementsTab,
  onOpenSquadTab,
  onOpenTrainingTab,
  onOpenLogisticsTab,
}) => {
  const units = Array.isArray(program?.units) ? program.units : [];
  const [showReportModal, setShowReportModal] = useState(false);

  // 5D Assessment Modal state
  const [assessingUnit, setAssessingUnit] = useState<ProgramUnit | null>(null);
  const [assessmentForm, setAssessmentForm] = useState<CompetitionReadiness | null>(null);

  // Overall Contingent 5D Status
  const contingent5D = secretariatStore.getContingentOverall5D(program.id);
  const competitionConfigs = secretariatStore.getCompetitionEventConfigs();

  // Aggregate stats from real data
  let totalRequirements = 0;
  let completedRequirements = 0;
  let inProgressRequirements = 0;
  let actionRequiredCount = 0;
  let attentionUnitsCount = 0;
  let unassignedPICCount = 0;
  const upcomingDueDates: { date: string; title: string; unitName: string }[] = [];

  units.forEach((u) => {
    const e5d = secretariatStore.get5DReadiness(u.id);
    if (e5d.overall === 'NOT_READY' || u.assistanceStatus === 'OPEN') {
      attentionUnitsCount++;
    }
    const conf = competitionConfigs.find((c) => c.programUnitId === u.id);
    if (!u.leaderId && !conf?.picPersonId) {
      unassignedPICCount++;
    }

    const reqs = Array.isArray(u.requirements) ? u.requirements : [];
    reqs.forEach((r) => {
      totalRequirements++;
      if (r.status === 'COMPLETED') {
        completedRequirements++;
      } else {
        if (r.status === 'IN_PROGRESS') inProgressRequirements++;
        if (r.status === 'ACTION_REQUIRED') actionRequiredCount++;

        if (r.dueDate) {
          upcomingDueDates.push({
            date: r.dueDate,
            title: r.title,
            unitName: u.name,
          });
        }
      }
    });
  });

  upcomingDueDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nearestDeadline = upcomingDueDates.length > 0 ? upcomingDueDates[0] : null;

  // Calculate contingent average progress
  const contingentProgress =
    units.length > 0
      ? Math.round(units.reduce((acc, u) => acc + (u.progress || 0), 0) / units.length)
      : program.overallProgress || 0;

  // Handlers for 5D assessment
  const handleOpen5DAssessment = (unit: ProgramUnit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current5D = secretariatStore.get5DReadiness(unit.id);
    setAssessingUnit(unit);
    setAssessmentForm(current5D);
  };

  const handleSave5DAssessment = () => {
    if (!assessingUnit || !assessmentForm) return;
    secretariatStore.update5DReadiness(assessingUnit.id, assessmentForm);
    setAssessingUnit(null);
    setAssessmentForm(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full min-w-0 overflow-hidden">
      {/* 🏆 Header: SOAR 2026 KPMBP & Contingent Status */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-widest font-mono shrink-0 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>KONTINJEN KPMBP</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {program.code || 'SOAR-2026'} • 5 Acara Rasmi
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>🏆 SOAR 2026 KPMBP</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat Kawalan Kesiapsiagaan 5 Acara Kontinjen KPM Bandar Penawar.
            </p>

            {/* Quick Action to Generate Contingent Report */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-200" />
                <span>Jana Laporan Kesiapsiagaan Kontinjen</span>
              </button>
            </div>
          </div>

          {/* Contingent Readiness Dial */}
          <div className="flex items-center gap-4 bg-slate-800/90 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-700 shrink-0 w-full sm:w-auto">
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
                    contingent5D.overall === 'READY'
                      ? 'text-emerald-400'
                      : contingent5D.overall === 'NEAR_READY'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  } transition-all duration-700`}
                  strokeDasharray={`${contingentProgress}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="font-bold text-base sm:text-xl font-mono text-white">
                  {contingentProgress}%
                </span>
                <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-slate-400">
                  Kemajuan
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs min-w-0 flex-1">
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] sm:text-[10px]">
                Status Keseluruhan:
              </p>
              <div className="flex items-center gap-1.5">
                {renderReadinessBadge(contingent5D.overall)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                {completedRequirements} / {totalRequirements} Keperluan Selesai
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 5-Dimension Overview Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">1. Peserta</span>
            <div className="mt-1">{renderReadinessBadge(contingent5D.participants)}</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">2. Latihan</span>
            <div className="mt-1">{renderReadinessBadge(contingent5D.training)}</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">3. Prestasi</span>
            <div className="mt-1">{renderReadinessBadge(contingent5D.performance)}</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">4. Teknikal</span>
            <div className="mt-1">{renderReadinessBadge(contingent5D.technical)}</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400">5. Compliance</span>
            <div className="mt-1">{renderReadinessBadge(contingent5D.compliance)}</div>
          </div>
        </div>
      </div>

      {/* 📊 COMMAND BAR (5 KAD SOALAN EKSEKUTIF) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full">
        {/* 1. 🟢 Sudah Siap */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              1. Sudah Siap
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {completedRequirements}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">/ {totalRequirements}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Keperluan selesai</p>
        </div>

        {/* 2. 🟡 Belum Siap */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              2. Belum Siap
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {inProgressRequirements + actionRequiredCount}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">Keperluan</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Dalam proses / pending</p>
        </div>

        {/* 3. 🔴 Acara Perlu Perhatian */}
        <div
          onClick={attentionUnitsCount > 0 ? onOpenAssistanceTab : undefined}
          className={`bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border shadow-xs flex flex-col justify-between transition ${
            attentionUnitsCount > 0
              ? 'border-red-300 dark:border-red-800/80 cursor-pointer hover:bg-red-50/30'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              3. Perlu Perhatian
            </span>
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {attentionUnitsCount}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">Acara</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {attentionUnitsCount > 0 ? 'Klik untuk semak isu' : 'Tiada isu kritikal'}
          </p>
        </div>

        {/* 4. 👤 Tindakan Diperlukan */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              4. Tindakan Perlu
            </span>
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {actionRequiredCount + unassignedPICCount}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">Item</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {unassignedPICCount > 0 ? `${unassignedPICCount} acara tiada PIC` : 'Tindakan teknikal'}
          </p>
        </div>

        {/* 5. ⏰ Deadline Terdekat */}
        <div
          onClick={onOpenRequirementsTab}
          className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              5. Deadline Terdekat
            </span>
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-mono">
              {nearestDeadline ? formatDate(nearestDeadline.date) : 'Belum ditetapkan'}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 truncate mt-1">
            {nearestDeadline ? `${nearestDeadline.unitName}: ${nearestDeadline.title}` : 'Semua mengikut jadual'}
          </p>
        </div>
      </div>

      {/* 🎭 SENARAI KAD ACARA SOAR 2026 (5 ACARA RASMI DENGAN 5 DIMENSI) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Status Kesediaan 5 Acara SOAR 2026
            </h2>
          </div>
          <button
            onClick={onOpenRequirementsTab}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Semak Semua Keperluan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => {
            const e5d = secretariatStore.get5DReadiness(unit.id);
            const reqs = Array.isArray(unit.requirements) ? unit.requirements : [];
            const completedReqCount = reqs.filter((r) => r.status === 'COMPLETED').length;

            // Find nearest incomplete deadline for this unit
            const pendingReqs = reqs.filter((r) => r.status !== 'COMPLETED' && r.dueDate);
            pendingReqs.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
            const unitDeadline = pendingReqs.length > 0 ? formatDate(pendingReqs[0].dueDate!) : 'Belum ditetapkan';

            // PIC & Coach status from competition config & unit leader
            const eventConfig = competitionConfigs.find((c) => c.programUnitId === unit.id);
            const coachPerson = eventConfig?.coachPersonId
              ? people.find((p) => p.id === eventConfig.coachPersonId)
              : null;
            const picPerson = unit.leader || (eventConfig?.picPersonId ? people.find((p) => p.id === eventConfig.picPersonId) : null);

            const picName = picPerson ? getPersonDisplayName(picPerson) : 'Belum ditetapkan';
            const coachName = coachPerson ? getPersonDisplayName(coachPerson) : 'Belum ditetapkan';

            return (
              <div
                key={unit.id}
                onClick={() => onInspectUnit(unit)}
                className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 ${
                  e5d.overall === 'NOT_READY'
                    ? 'border-red-200 dark:border-red-900/60'
                    : e5d.overall === 'NEAR_READY'
                    ? 'border-amber-200 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Card Header: Icon, Name & Overall Readiness Badge */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                        <IconRenderer name={unit.icon} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {unit.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {unit.description}
                        </p>
                      </div>
                    </div>

                    {/* Overall Badge */}
                    <div className="shrink-0">
                      {renderReadinessBadge(e5d.overall)}
                    </div>
                  </div>

                  {/* 5-Dimension Mini Indicators */}
                  <div className="my-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <span>5 Dimensi Kesediaan</span>
                      <button
                        onClick={(e) => handleOpen5DAssessment(unit, e)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 normal-case font-semibold text-[10px]"
                        title="Ubah atau semak penilaian 5 dimensi"
                      >
                        <Sliders className="w-2.5 h-2.5" />
                        <span>Nilai</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-center">
                      <div className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="block text-[8px] text-slate-400">Peserta</span>
                        <span className="text-[9px] font-bold font-mono">
                          {e5d.participants === 'READY' ? '🟢' : e5d.participants === 'NEAR_READY' ? '🟡' : '🔴'}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="block text-[8px] text-slate-400">Latihan</span>
                        <span className="text-[9px] font-bold font-mono">
                          {e5d.training === 'READY' ? '🟢' : e5d.training === 'NEAR_READY' ? '🟡' : '🔴'}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="block text-[8px] text-slate-400">Prestasi</span>
                        <span className="text-[9px] font-bold font-mono">
                          {e5d.performance === 'READY' ? '🟢' : e5d.performance === 'NEAR_READY' ? '🟡' : '🔴'}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="block text-[8px] text-slate-400">Teknikal</span>
                        <span className="text-[9px] font-bold font-mono">
                          {e5d.technical === 'READY' ? '🟢' : e5d.technical === 'NEAR_READY' ? '🟡' : '🔴'}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="block text-[8px] text-slate-400">Syarat</span>
                        <span className="text-[9px] font-bold font-mono">
                          {e5d.compliance === 'READY' ? '🟢' : e5d.compliance === 'NEAR_READY' ? '🟡' : '🔴'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 my-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium text-[11px]">Kemajuan Persiapan</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {unit.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          unit.progress >= 85
                            ? 'bg-emerald-500'
                            : unit.progress >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${unit.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Grid (PIC, Coach, Keperluan, Deadline) */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                        PIC Acara
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {picName}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                        Jurulatih / Coach
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {coachName}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                        Keperluan
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 font-mono">
                        {completedReqCount} / {reqs.length} Selesai
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                        Deadline Terdekat
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 font-mono">
                        {unitDeadline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {unit.id}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectUnit(unit);
                    }}
                    className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition shadow-xs"
                  >
                    <span>Perincian Acara</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL: 5-DIMENSION READINESS ASSESSMENT --- */}
      {assessingUnit && assessmentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Penilaian Kesiapsiagaan 5 Dimensi
                </h3>
                <p className="text-xs text-slate-500">
                  {assessingUnit.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setAssessingUnit(null);
                  setAssessmentForm(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Dimensi 1: Participants */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">1. Peserta & Pasukan</span>
                  <span className="text-[10px] text-slate-400">Status pemilihan & kehadiran kuota</span>
                </div>
                <select
                  value={assessmentForm.participants}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, participants: e.target.value as ReadinessLevel })
                  }
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                >
                  <option value="READY">🟢 READY</option>
                  <option value="NEAR_READY">🟡 NEAR READY</option>
                  <option value="NOT_READY">🔴 NOT READY</option>
                </select>
              </div>

              {/* Dimensi 2: Training */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">2. Latihan & Jadual</span>
                  <span className="text-[10px] text-slate-400">Kekerapan & kehadiran latihan</span>
                </div>
                <select
                  value={assessmentForm.training}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, training: e.target.value as ReadinessLevel })
                  }
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                >
                  <option value="READY">🟢 READY</option>
                  <option value="NEAR_READY">🟡 NEAR READY</option>
                  <option value="NOT_READY">🔴 NOT READY</option>
                </select>
              </div>

              {/* Dimensi 3: Performance */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">3. Prestasi & Mutu Persembahan</span>
                  <span className="text-[10px] text-slate-400">Kemahiran, kefahaman skrip / lagu</span>
                </div>
                <select
                  value={assessmentForm.performance}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, performance: e.target.value as ReadinessLevel })
                  }
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                >
                  <option value="READY">🟢 READY</option>
                  <option value="NEAR_READY">🟡 NEAR READY</option>
                  <option value="NOT_READY">🔴 NOT READY</option>
                </select>
              </div>

              {/* Dimensi 4: Technical */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">4. Teknikal, Props & Busana</span>
                  <span className="text-[10px] text-slate-400">Peralatan, instrumen, audio & kostum</span>
                </div>
                <select
                  value={assessmentForm.technical}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, technical: e.target.value as ReadinessLevel })
                  }
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                >
                  <option value="READY">🟢 READY</option>
                  <option value="NEAR_READY">🟡 NEAR READY</option>
                  <option value="NOT_READY">🔴 NOT READY</option>
                </select>
              </div>

              {/* Dimensi 5: Compliance */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">5. Pematuhan & Syarat Pertandingan</span>
                  <span className="text-[10px] text-slate-400">Borang pendaftaran, audio/skrip submit</span>
                </div>
                <select
                  value={assessmentForm.compliance}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, compliance: e.target.value as ReadinessLevel })
                  }
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono"
                >
                  <option value="READY">🟢 READY</option>
                  <option value="NEAR_READY">🟡 NEAR READY</option>
                  <option value="NOT_READY">🔴 NOT READY</option>
                </select>
              </div>

              {/* Overall Override */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block">Status Keseluruhan Acara</span>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-400">Ringkasan kesiapsiagaan</span>
                </div>
                <select
                  value={assessmentForm.overall}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, overall: e.target.value as ReadinessLevel })
                  }
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-xs font-bold font-mono"
                >
                  <option value="READY">🟢 READY</option>
                  <option value="NEAR_READY">🟡 NEAR READY</option>
                  <option value="NOT_READY">🔴 NOT READY</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Penilaian
                </label>
                <textarea
                  rows={3}
                  value={assessmentForm.notes || ''}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
                  placeholder="Catatan ringkas mengenai status persediaan acara ini..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setAssessingUnit(null);
                  setAssessmentForm(null);
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSave5DAssessment}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Simpan Penilaian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REPORT MODAL --- */}
      {showReportModal && (
        <SOARContingentReportModal
          program={program}
          people={people}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
