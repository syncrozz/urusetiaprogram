import React, { useState } from 'react';
import { Program, ProgramUnit, UnitRequirement } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { IconRenderer } from '../common/IconRenderer';
import { formatDate } from '../../lib/utils';
import {
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SOARRequirementsViewProps {
  program: Program;
  onInspectUnit: (unit: ProgramUnit) => void;
}

export const SOARRequirementsView: React.FC<SOARRequirementsViewProps> = ({
  program,
  onInspectUnit,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  const allUnits = Array.isArray(program?.units) ? program.units : [];

  // Aggregate all requirements
  const allReqs: { req: UnitRequirement; unit: ProgramUnit }[] = [];
  allUnits.forEach((u) => {
    (u.requirements || []).forEach((r) => {
      allReqs.push({ req: r, unit: u });
    });
  });

  const filtered = allReqs.filter(({ req, unit }) => {
    if (selectedUnitFilter !== 'ALL' && unit.id !== selectedUnitFilter) return false;
    if (filterStatus === 'COMPLETED') return req.status === 'COMPLETED';
    if (filterStatus === 'IN_PROGRESS') return req.status === 'IN_PROGRESS';
    if (filterStatus === 'ACTION_REQUIRED') return req.status === 'ACTION_REQUIRED';
    if (filterStatus === 'NOT_APPLICABLE') return req.status === 'NOT_APPLICABLE';
    return true;
  });

  const completedCount = allReqs.filter((i) => i.req.status === 'COMPLETED').length;
  const inProgressCount = allReqs.filter((i) => i.req.status === 'IN_PROGRESS').length;
  const actionCount = allReqs.filter((i) => i.req.status === 'ACTION_REQUIRED').length;

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      {/* Header Panel */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-widest font-mono">
                {program.code}
              </span>
              <span className="text-xs text-slate-400">
                Matriks Keperluan Acara
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Keperluan & Syarat Persiapan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Senarai semak dan syarat dokumentasi serta persiapan teknikal bagi 5 acara SOAR 2026.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 shrink-0">
            <div className="text-center px-2 border-r border-slate-700">
              <span className="block text-base sm:text-lg font-bold text-emerald-400 font-mono">
                {completedCount}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Selesai
              </span>
            </div>
            <div className="text-center px-2 border-r border-slate-700">
              <span className="block text-base sm:text-lg font-bold text-amber-400 font-mono">
                {inProgressCount}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Dalam Proses
              </span>
            </div>
            <div className="text-center px-2">
              <span className="block text-base sm:text-lg font-bold text-red-400 font-mono">
                {actionCount}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Tindakan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0 mr-1">
            Acara:
          </span>
          <button
            onClick={() => setSelectedUnitFilter('ALL')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
              selectedUnitFilter === 'ALL'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua Acara
          </button>
          {allUnits.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUnitFilter(u.id)}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                selectedUnitFilter === u.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0 mr-1">
            Status:
          </span>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-indigo-600 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua ({allReqs.length})
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
              filterStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            Siap ({completedCount})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
            }`}
          >
            Proses ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('ACTION_REQUIRED')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
              filterStatus === 'ACTION_REQUIRED'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400'
            }`}
          >
            Tindakan ({actionCount})
          </button>
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {filtered.map(({ req, unit }) => (
          <div
            key={req.id}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-indigo-300 dark:hover:border-indigo-800"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                  <IconRenderer name={unit.icon} className="w-3 h-3 text-indigo-500" />
                  <span>{unit.name}</span>
                </span>
                <PriorityBadge priority={req.priority} />
                {req.dueDate && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Sasaran: {formatDate(req.dueDate)}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {req.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {req.description}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
              <StatusBadge status={req.status} />

              <button
                onClick={() => onInspectUnit(unit)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Buka Acara"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Tiada keperluan dijumpai untuk tapisan yang dipilih.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
