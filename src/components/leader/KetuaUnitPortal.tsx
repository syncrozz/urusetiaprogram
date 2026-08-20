import React, { useState } from 'react';
import { Program, ProgramUnit, UnitRequirement, RequirementStatus, Person, UnitUpdate } from '../../types';
import { secretariatStore } from '../../lib/storage';
import { formatDateTime, formatDate } from '../../lib/utils';
import { StatusBadge, PriorityBadge, AssistanceBadge } from '../common/Badge';
import { IconRenderer } from '../common/IconRenderer';
import { EscalationModal } from './EscalationModal';
import { EvidenceModal } from './EvidenceModal';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Paperclip,
  ShieldAlert,
  Sparkles,
  Plus,
  Calendar,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Award,
  LogOut,
  Info,
} from 'lucide-react';

interface KetuaUnitPortalProps {
  program: Program;
  unit: ProgramUnit;
  currentPerson: Person;
  updates: UnitUpdate[];
  onBackToAdmin: () => void;
}

export const KetuaUnitPortal: React.FC<KetuaUnitPortalProps> = ({
  program,
  unit,
  currentPerson,
  updates,
  onBackToAdmin,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedReqForEvidence, setSelectedReqForEvidence] = useState<UnitRequirement | null>(null);
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [isAddingCustomReq, setIsAddingCustomReq] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqPriority, setNewReqPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  const unitUpdates = updates.filter((u) => u.unitId === unit.id);

  const handleUpdateStatus = (reqId: string, newStatus: RequirementStatus) => {
    secretariatStore.updateRequirement({
      programId: program.id,
      unitId: unit.id,
      requirementId: reqId,
      status: newStatus,
    });

    if (newStatus === 'COMPLETED') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleProgressChange = (reqId: string, newProgress: number) => {
    const status: RequirementStatus =
      newProgress === 100 ? 'COMPLETED' : newProgress > 0 ? 'IN_PROGRESS' : 'ACTION_REQUIRED';

    secretariatStore.updateRequirement({
      programId: program.id,
      unitId: unit.id,
      requirementId: reqId,
      status,
      progress: newProgress,
    });
  };

  const handleSaveNote = (reqId: string, note: string) => {
    const req = unit.requirements.find((r) => r.id === reqId);
    if (!req) return;
    secretariatStore.updateRequirement({
      programId: program.id,
      unitId: unit.id,
      requirementId: reqId,
      status: req.status,
      notes: note,
    });
  };

  const handlePostQuickUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;

    secretariatStore.addUnitUpdate({
      unitId: unit.id,
      programId: program.id,
      message: quickNote.trim(),
      type: 'PROGRESS',
    });

    setQuickNote('');
  };

  const handleAddCustomRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle.trim()) return;

    secretariatStore.addCustomRequirement({
      programId: program.id,
      unitId: unit.id,
      title: newReqTitle.trim(),
      description: newReqDesc.trim(),
      priority: newReqPriority,
      required: true,
      dueDate: program.deadlineDate,
    });

    setNewReqTitle('');
    setNewReqDesc('');
    setIsAddingCustomReq(false);
  };

  const filteredRequirements = unit.requirements.filter((req) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTION_REQUIRED') return req.status === 'ACTION_REQUIRED';
    if (filterStatus === 'IN_PROGRESS') return req.status === 'IN_PROGRESS';
    if (filterStatus === 'COMPLETED') return req.status === 'COMPLETED';
    return true;
  });

  const completedCount = unit.requirements.filter((r) => r.status === 'COMPLETED').length;
  const inProgressCount = unit.requirements.filter((r) => r.status === 'IN_PROGRESS').length;
  const actionRequiredCount = unit.requirements.filter((r) => r.status === 'ACTION_REQUIRED').length;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 pb-16">
      {/* Mobile Top App Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 shadow-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-widest font-mono">
                Portal Ketua Unit
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {program.code}
              </span>
            </div>

            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Kembali ke Admin</span>
            </button>
          </div>

          {/* Unit & Leader Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0">
                <IconRenderer name={unit.icon} className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{program.name}</p>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {unit.name}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <span className="font-semibold">{currentPerson.fullName}</span>
                  <span className="text-slate-400 font-mono">• ID: {currentPerson.studentId}</span>
                </p>
              </div>
            </div>

            {/* Readiness Dial Card */}
            <div className="bg-slate-800/90 rounded-xl p-3 sm:p-3.5 border border-slate-700 flex items-center gap-4 min-w-[200px]">
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
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
                      unit.progress >= 90
                        ? 'text-emerald-400'
                        : unit.progress >= 50
                        ? 'text-amber-400'
                        : 'text-red-400'
                    } transition-all duration-500`}
                    strokeDasharray={`${unit.progress}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-bold text-xs font-mono text-white">
                  {unit.progress}%
                </span>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Kesiapsiagaan Unit
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusBadge status={unit.status} />
                </div>
                {unit.assistanceStatus === 'OPEN' && (
                  <div className="mt-1">
                    <AssistanceBadge status="OPEN" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Urgent Escalation Alert Banner */}
        {unit.assistanceStatus === 'OPEN' && (
          <div className="p-4 rounded-xl bg-red-600 text-white flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-white">
                  Permohonan Bantuan Admin Sedang Dibuka
                </p>
                <span className="text-[10px] text-red-200 font-mono">
                  {formatDateTime(unit.assistanceCreatedAt)}
                </span>
              </div>
              <p className="mt-1 text-red-100">
                <strong>Isu:</strong> {unit.assistanceReason}
              </p>
              <p className="mt-0.5 text-red-100">
                <strong>Keperluan:</strong> {unit.assistanceRequest}
              </p>
              {unit.assistanceAdminNote && (
                <div className="mt-2 p-2.5 rounded-lg bg-red-700/80 border border-red-500 text-xs">
                  <p className="font-bold text-white">Maklum Balas Admin:</p>
                  <p className="text-red-100">{unit.assistanceAdminNote}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Action Hub (Seminit Update) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tindakan Pantas Lapangan (&lt; 1 Minit)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Dikemaskini: {formatDateTime(unit.lastUpdated)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => {
                const firstAction = unit.requirements.find((r) => r.status !== 'COMPLETED');
                if (firstAction) {
                  handleUpdateStatus(firstAction.id, 'COMPLETED');
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>[ ✓ SELESAI ]</span>
            </button>

            <button
              onClick={() => {
                const firstAction = unit.requirements.find((r) => r.status === 'ACTION_REQUIRED');
                if (firstAction) {
                  handleUpdateStatus(firstAction.id, 'IN_PROGRESS');
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-xs"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>[ 🟡 SEDANG BUAT ]</span>
            </button>

            <button
              onClick={() => setIsEscalationOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-xs"
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>[ ⚠️ ADA MASALAH ]</span>
            </button>

            <button
              onClick={() => setIsAddingCustomReq(true)}
              className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>[ ➕ TAMBAH TUGAS ]</span>
            </button>
          </div>

          {/* Quick Note Input */}
          <form onSubmit={handlePostQuickUpdate} className="mt-3 flex gap-2">
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Catat status atau perkembangan terkini unit anda..."
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!quickNote.trim()}
              className="py-2 px-3.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hantar Catatan</span>
            </button>
          </form>
        </div>

        {/* Requirements Checklist Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Senarai Semak & Keperluan Unit</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                  {completedCount}/{unit.requirements.length} Siap
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tandakan status setiap keperluan untuk menyumbang kepada kesiapsiagaan program.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs overflow-x-auto">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterStatus === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Semua ({unit.requirements.length})
              </button>
              <button
                onClick={() => setFilterStatus('ACTION_REQUIRED')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                  filterStatus === 'ACTION_REQUIRED'
                    ? 'bg-red-600 text-white shadow-xs font-bold'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                <span>Perlu</span> ({actionRequiredCount})
              </button>
              <button
                onClick={() => setFilterStatus('IN_PROGRESS')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                  filterStatus === 'IN_PROGRESS'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                <span>Proses</span> ({inProgressCount})
              </button>
              <button
                onClick={() => setFilterStatus('COMPLETED')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                  filterStatus === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                <span>Siap</span> ({completedCount})
              </button>
            </div>
          </div>

          {/* Add Custom Requirement Inline Form */}
          {isAddingCustomReq && (
            <form
              onSubmit={handleAddCustomRequirement}
              className="mb-5 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-900 dark:text-indigo-300">
                  Tambah Keperluan Khusus Unit Ini
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomReq(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Tutup
                </button>
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={newReqTitle}
                  onChange={(e) => setNewReqTitle(e.target.value)}
                  placeholder="Tajuk tugasan / keperluan (cth: Sediakan 5 unit extension kabel)"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  placeholder="Keterangan ringkas (pilihan)"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />

                <select
                  value={newReqPriority}
                  onChange={(e) => setNewReqPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="CRITICAL">Keutamaan: Kritikal</option>
                  <option value="HIGH">Keutamaan: Tinggi</option>
                  <option value="MEDIUM">Keutamaan: Sederhana</option>
                  <option value="LOW">Keutamaan: Rendah</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomReq(false)}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs"
                >
                  Simpan Tugasan
                </button>
              </div>
            </form>
          )}

          {/* List of Requirement Cards */}
          <div className="space-y-3">
            {filteredRequirements.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-500">Tiada tugasan dalam tapisan ini.</p>
              </div>
            ) : (
              filteredRequirements.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition ${
                    req.status === 'COMPLETED'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/60'
                      : req.status === 'IN_PROGRESS'
                      ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/60'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <PriorityBadge priority={req.priority} />
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Sasaran: {formatDate(req.dueDate || program.deadlineDate)}</span>
                        </span>
                        {req.evidences && req.evidences.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>{req.evidences.length} Bukti</span>
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold ${
                          req.status === 'COMPLETED'
                            ? 'line-through text-slate-500 dark:text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {req.title}
                      </h3>
                      {req.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {req.description}
                        </p>
                      )}

                      {/* Notes / Evidence Section */}
                      {req.notes && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-100/80 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <span className="font-semibold text-slate-500">Nota: </span>
                          <span>{req.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Segmented Controls */}
                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.id, 'ACTION_REQUIRED')}
                          className={`px-2.5 py-1.5 rounded-md font-bold text-[11px] transition ${
                            req.status === 'ACTION_REQUIRED'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                          title="Perlu Tindakan"
                        >
                          Perlu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.id, 'IN_PROGRESS')}
                          className={`px-2.5 py-1.5 rounded-md font-bold text-[11px] transition ${
                            req.status === 'IN_PROGRESS'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                          title="Sedang Dibuat"
                        >
                          Proses
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                          className={`px-2.5 py-1.5 rounded-md font-bold text-[11px] transition ${
                            req.status === 'COMPLETED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                          title="Siap"
                        >
                          Siap
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReqForEvidence(req)}
                          className="py-1 px-2.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Lampirkan Bukti</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress slider if In Progress */}
                  {req.status === 'IN_PROGRESS' && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center gap-3">
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                        Peratus Siap:
                      </span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="10"
                        value={req.progress || 50}
                        onChange={(e) => handleProgressChange(req.id, parseInt(e.target.value))}
                        className="flex-1 accent-amber-600 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-200 w-10 text-right">
                        {req.progress || 50}%
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Updates & Activity Stream for this Unit */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rekod & Catatan Unit Terkini ({unitUpdates.length})</span>
          </h3>

          <div className="space-y-2.5">
            {unitUpdates.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Belum ada catatan aktiviti direkodkan untuk unit ini.
              </p>
            ) : (
              unitUpdates.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-3"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === 'ESCALATION'
                        ? 'bg-red-100 text-red-600'
                        : item.type === 'STATUS_CHANGE'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    {item.type === 'ESCALATION' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : item.type === 'STATUS_CHANGE' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {item.authorName}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      <EscalationModal
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
        program={program}
        unit={unit}
      />

      {/* Evidence Modal */}
      {selectedReqForEvidence && (
        <EvidenceModal
          isOpen={!!selectedReqForEvidence}
          onClose={() => setSelectedReqForEvidence(null)}
          program={program}
          unit={unit}
          requirement={selectedReqForEvidence}
        />
      )}
    </div>
  );
};
