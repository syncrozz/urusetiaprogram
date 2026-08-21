import React from 'react';
import { Program } from '../../types';
import { calculateProgramReadiness, formatDateTime, formatDate, getPersonDisplayName } from '../../lib/utils';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Printer, Download, X, Layers, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SecretariatReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
}

export const SecretariatReportModal: React.FC<SecretariatReportModalProps> = ({
  isOpen,
  onClose,
  program,
}) => {
  if (!isOpen) return null;

  const stats = calculateProgramReadiness(program.units);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[95vh] flex flex-col">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Laporan Rasmi Urusetia
            </span>
            <span className="text-xs text-slate-500 font-mono">Format Mesyuarat Penyelarasan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Eksport PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="flex-1 overflow-y-auto pr-1 text-slate-900 dark:text-slate-100 space-y-6 print:p-0 print:overflow-visible">
          {/* Document Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="font-mono font-bold text-sm tracking-widest text-emerald-700 dark:text-emerald-400">
                PUSAT URUSETIA PROGRAM
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              LAPORAN KESIAPSIAGAAN & STATUS JAWATANKUASA URUSETIA
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dijana pada: {formatDateTime(new Date().toISOString())} • Versi Sistem v2.0
            </p>
          </div>

          {/* Program Meta Information */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Nama Program
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{program.name}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Kod & Kategori
              </span>
              <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {program.code} ({program.categoryId})
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Tarikh Program
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {formatDate(program.startDate)} - {formatDate(program.endDate)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Lokasi & Sasaran
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {program.venue} ({program.expectedAttendance} pax)
              </p>
            </div>
          </div>

          {/* Executive Readiness Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Ringkasan Eksekutif Kesiapsiagaan:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                  {stats.overallPercentage}%
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {stats.isReadyForLaunch
                    ? '— Acara berada dalam keadaan BERSEDIA untuk berlangsung.'
                    : stats.openAssistanceCount > 0
                    ? '— Terdapat isu eskalasi lapangan yang memerlukan tindakan segera.'
                    : '— Persediaan sedang giat dilaksanakan mengikut jadual.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 font-bold text-emerald-700 dark:text-emerald-300">
                {stats.completedUnitsCount} / {program.units.length} Unit Siap
              </span>
              <span className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 font-bold text-rose-700 dark:text-rose-300">
                {stats.openAssistanceCount} Isu Terbuka
              </span>
            </div>
          </div>

          {/* Detailed Units Status Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Status Terperinci Mengikut Unit Jawatankuasa
            </h3>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Ketua Unit & No. ID</th>
                    <th className="p-3 text-center">Kemajuan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Tugasan Belum Selesai / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {(program?.units || []).map((u) => {
                    const reqs = Array.isArray(u?.requirements) ? u.requirements : [];
                    const incompleteReqs = reqs.filter((r) => r.status !== 'COMPLETED');

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {u.leader ? getPersonDisplayName(u.leader) : '— Belum Dilantik —'}
                          </p>
                          {u.leader && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {u.leader.studentId} • {u.leader.phone}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {u.progress}%
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge status={u.status} showIcon={false} />
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {u.assistanceStatus === 'OPEN' ? (
                            <span className="text-rose-600 font-bold">
                              ⚠️ PERLU BANTUAN: {u.assistanceReason}
                            </span>
                          ) : incompleteReqs.length > 0 ? (
                            <span>{incompleteReqs.map((r) => r.title).slice(0, 2).join('; ')}</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">✓ Semua tugasan selesai</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Endorsement & Sign-Off Section */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs border-t border-slate-200 dark:border-slate-800 print:mt-12">
            <div className="space-y-12">
              <p className="font-bold text-slate-600 dark:text-slate-400">Disediakan Oleh:</p>
              <div>
                <p className="font-bold text-slate-900 dark:text-white border-t border-slate-400 pt-1">
                  Setiausaha Urusetia
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Tarikh: ..............................</p>
              </div>
            </div>

            <div className="space-y-12">
              <p className="font-bold text-slate-600 dark:text-slate-400">Disemak Oleh:</p>
              <div>
                <p className="font-bold text-slate-900 dark:text-white border-t border-slate-400 pt-1">
                  Timbalan Pengarah Program
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Tarikh: ..............................</p>
              </div>
            </div>

            <div className="space-y-12">
              <p className="font-bold text-slate-600 dark:text-slate-400">Disahkan Oleh:</p>
              <div>
                <p className="font-bold text-slate-900 dark:text-white border-t border-slate-400 pt-1">
                  Pengarah Urusetia Program
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Tarikh: ..............................</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
