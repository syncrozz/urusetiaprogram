import React, { useState } from 'react';
import { ActivityLog } from '../../types';
import { formatDateTime } from '../../lib/utils';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  PlusCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs = [] }) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredLogs = safeLogs.filter((log) => {
    if (!log) return false;
    const titleText = (log.details || log.action || log.entityName || '').toLowerCase();
    const performerText = (log.userName || log.userRole || '').toLowerCase();
    const matchesSearch =
      titleText.includes(search.toLowerCase()) ||
      performerText.includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterAction === 'ALL') return true;
    return log.action?.toLowerCase().includes(filterAction.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(filterAction.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold uppercase tracking-widest font-mono">
            LOG AKTIVITI
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Jejak Audit & Log Aktiviti Urusetia
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rekod masa sebenar (real-time) setiap perubahan status, pengemaskinian tugasan, dan lantikan ketua.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300">
          {safeLogs.length} Rekod Direkodkan
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari log atau nama pengguna..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setFilterAction('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filterAction === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-indigo-600 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterAction('UPDATE_STATUS')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filterAction === 'UPDATE_STATUS'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setFilterAction('ESCALATION')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filterAction === 'ESCALATION'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Eskalasi
          </button>
          <button
            onClick={() => setFilterAction('ASSIGN')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filterAction === 'ASSIGN'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Lantikan
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            Tiada rekod aktiviti ditemui.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 text-xs shadow-xs"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  log.entityType === 'ESCALATION' || log.action?.includes('Eskalasi')
                    ? 'bg-red-100 dark:bg-red-950/50 text-red-600'
                    : log.action?.includes('Selesai') || log.action?.includes('COMPLETED')
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                    : log.action?.includes('Lantik')
                    ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600'
                    : log.entityType === 'PROGRAM'
                    ? 'bg-teal-100 dark:bg-teal-950/50 text-teal-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {(log.entityType === 'ESCALATION' || log.action?.includes('Eskalasi')) && <AlertTriangle className="w-4 h-4" />}
                {!(log.entityType === 'ESCALATION' || log.action?.includes('Eskalasi')) && log.action?.includes('Lantik') && <UserPlus className="w-4 h-4" />}
                {!(log.entityType === 'ESCALATION' || log.action?.includes('Eskalasi')) && !log.action?.includes('Lantik') && log.entityType === 'PROGRAM' && <PlusCircle className="w-4 h-4" />}
                {!(log.entityType === 'ESCALATION' || log.action?.includes('Eskalasi')) && !log.action?.includes('Lantik') && log.entityType !== 'PROGRAM' && <Clock className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {log.details || log.entityName || log.action}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {log.userName || log.userRole || 'Urusetia'}
                  </span>
                  <span>•</span>
                  <span className="font-mono uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    {log.action}
                  </span>
                  {log.entityName && (
                    <>
                      <span>•</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {log.entityName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
