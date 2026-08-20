import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { Program, ProgramUnit, AssistanceStatus } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { IconRenderer } from '../common/IconRenderer';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  Phone,
  User,
  ArrowRight,
} from 'lucide-react';

interface AssistanceHubProps {
  program: Program;
  onInspectUnit: (unit: ProgramUnit) => void;
}

export const AssistanceHub: React.FC<AssistanceHubProps> = ({ program, onInspectUnit }) => {
  const [selectedUnit, setSelectedUnit] = useState<ProgramUnit | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<AssistanceStatus>('RESOLVED');

  const safeUnits = Array.isArray(program?.units) ? program.units : [];
  const assistanceUnits = safeUnits.filter((u) => u.assistanceStatus && u.assistanceStatus !== 'NONE');
  const openUnits = assistanceUnits.filter((u) => u.assistanceStatus === 'OPEN');
  const inReviewUnits = assistanceUnits.filter((u) => u.assistanceStatus === 'IN_REVIEW');
  const resolvedUnits = assistanceUnits.filter((u) => u.assistanceStatus === 'RESOLVED');

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    secretariatStore.resolveEscalation({
      programId: program.id,
      unitId: selectedUnit.id,
      adminNote: adminNote.trim() || 'Tindakan susulan telah diambil oleh Urusetia Pusat.',
      newStatus: resolutionStatus,
    });

    setSelectedUnit(null);
    setAdminNote('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-widest font-mono">
                  ESKALASI URUSETIA
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Hab Bantuan & Eskalasi Urusetia
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Penyelesaian isu kritikal dan sokongan operasi untuk Ketua Unit di lapangan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold font-mono">
              {openUnits.length} Tiket Menunggu Tindakan
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Escalated Units */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Senarai Permohonan Bantuan ({assistanceUnits.length})
            </h3>
          </div>

          {assistanceUnits.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tiada Isu / Eskalasi Terbuka
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Semua unit sedang berjalan lancar tanpa sebarang laporan kekangan kritikal daripada Ketua Unit.
              </p>
            </div>
          ) : (
            assistanceUnits.map((u) => (
              <div
                key={u.id}
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  u.assistanceStatus === 'OPEN'
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    : u.assistanceStatus === 'IN_REVIEW'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <IconRenderer name={u.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {u.leader?.fullName || 'Belum Dilantik'}
                        </span>
                        {u.leader?.phone && (
                          <span className="text-slate-400 font-mono">({u.leader.phone})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        u.assistanceStatus === 'OPEN'
                          ? 'bg-red-600 text-white'
                          : u.assistanceStatus === 'IN_REVIEW'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.assistanceStatus === 'OPEN'
                        ? 'Memerlukan Tindakan'
                        : u.assistanceStatus === 'IN_REVIEW'
                        ? 'Dalam Semakan'
                        : 'Selesai'}
                    </span>
                  </div>
                </div>

                {/* Problem & Request Content */}
                <div className="space-y-2 text-xs bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-red-700 dark:text-red-400">Masalah Lapangan: </span>
                    <span className="text-slate-800 dark:text-slate-200">{u.assistanceReason}</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Bantuan Yang Diperlukan: </span>
                    <span className="text-slate-800 dark:text-slate-200">{u.assistanceRequest}</span>
                  </div>
                  {u.assistanceAdminNote && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">Tindakan Admin Terakhir: </span>
                      <span>{u.assistanceAdminNote}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                  <span className="font-mono">Dihantar: {formatDateTime(u.assistanceCreatedAt)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onInspectUnit(u)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Buka Unit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUnit(u);
                        setAdminNote(u.assistanceAdminNote || '');
                        setResolutionStatus(u.assistanceStatus === 'OPEN' ? 'IN_REVIEW' : 'RESOLVED');
                      }}
                      className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs"
                    >
                      Beri Tindakan
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Resolution Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Panel Tindakan Urusetia</span>
          </h3>

          {selectedUnit ? (
            <form onSubmit={handleResolve} className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedUnit.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedUnit.assistanceReason}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Bantuan
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as AssistanceStatus)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="IN_REVIEW">Sedang Disemak / Dalam Proses Bantuan</option>
                  <option value="RESOLVED">Selesai / Isu Telah Diselesaikan</option>
                  <option value="OPEN">Kekalkan Status Buka (Open)</option>
                  <option value="NONE">Tutup Tiket Bantuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maklum Balas / Arahan Urusetia kepada Ketua Unit
                </label>
                <textarea
                  rows={4}
                  required
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="cth: Kelulusan bajet sewaan RM300 telah diluluskan. Sila ambil pesanan di Stor Pusat jam 2:00 petang."
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUnit(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kemas Kini Status</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Pilih mana-mana tiket permohonan bantuan di sebelah untuk memberikan maklum balas atau menutup isu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
