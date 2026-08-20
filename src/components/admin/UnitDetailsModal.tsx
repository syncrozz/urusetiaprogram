import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { ProgramUnit, Program, Person, RequirementStatus } from '../../types';
import { StatusBadge, PriorityBadge, AssistanceBadge } from '../common/Badge';
import { IconRenderer } from '../common/IconRenderer';
import { EvidenceModal } from '../leader/EvidenceModal';
import { EscalationModal } from '../leader/EscalationModal';
import { UnitLeaderAssignModal } from './UnitLeaderAssignModal';
import { formatDateTime, formatDate } from '../../lib/utils';
import {
  X,
  UserCheck,
  Paperclip,
  Plus,
  AlertTriangle,
  Send,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface UnitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  unit: ProgramUnit;
  people: Person[];
}

export const UnitDetailsModal: React.FC<UnitDetailsModalProps> = ({
  isOpen,
  onClose,
  program,
  unit,
  people,
}) => {
  const [selectedReqForEvidence, setSelectedReqForEvidence] = useState<any>(null);
  const [isAssignLeaderOpen, setIsAssignLeaderOpen] = useState(false);
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  if (!isOpen) return null;

  const handleUpdateStatus = (reqId: string, status: RequirementStatus) => {
    secretariatStore.updateRequirement({
      programId: program.id,
      unitId: unit.id,
      requirementId: reqId,
      status,
    });
  };

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    secretariatStore.addCustomRequirement({
      programId: program.id,
      unitId: unit.id,
      title: newTitle.trim(),
      priority: newPriority,
      required: true,
      dueDate: program.deadlineDate,
    });

    setNewTitle('');
    setIsAddingReq(false);
  };

  const completedCount = unit.requirements.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <IconRenderer name={unit.icon} className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {program.name}
              </span>
              <PriorityBadge priority={unit.priority} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {unit.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{unit.description}</p>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Ketua Unit
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {unit.leader ? unit.leader.fullName : 'Belum Dilantik'}
              </span>
              <button
                onClick={() => setIsAssignLeaderOpen(true)}
                className="text-[10px] text-emerald-600 hover:underline font-bold"
              >
                Tukar
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Kemajuan Unit
            </span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-white mt-0.5 block">
              {unit.progress}%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Status Operasi
            </span>
            <div className="mt-0.5">
              <StatusBadge status={unit.status} />
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Status Bantuan
            </span>
            <div className="mt-0.5">
              <AssistanceBadge status={unit.assistanceStatus || 'NONE'} />
            </div>
          </div>
        </div>

        {/* Requirements Checklist List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Senarai Keperluan & Semakan ({completedCount}/{unit.requirements.length} Selesai)
            </h3>
            <button
              onClick={() => setIsAddingReq(!isAddingReq)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Keperluan</span>
            </button>
          </div>

          {isAddingReq && (
            <form onSubmit={handleAddRequirement} className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2.5 animate-fadeIn">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tajuk keperluan baru (cth: Sediakan papan tanda arah parking)"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="CRITICAL">Kritikal</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="MEDIUM">Sederhana</option>
                  <option value="LOW">Rendah</option>
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingReq(false)}
                    className="py-1 px-3 rounded-lg border border-slate-300 text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-1 px-4 rounded-lg bg-indigo-600 text-white font-bold text-xs"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {unit.requirements.map((req) => (
              <div
                key={req.id}
                className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  req.status === 'COMPLETED'
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={req.priority} />
                    {req.required && (
                      <span className="text-[10px] font-bold text-rose-500 uppercase">Wajib</span>
                    )}
                    {req.evidences && req.evidences.length > 0 && (
                      <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5">
                        <Paperclip className="w-2.5 h-2.5" />
                        <span>{req.evidences.length} Bukti</span>
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-bold ${
                      req.status === 'COMPLETED'
                        ? 'line-through text-slate-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {req.title}
                  </p>
                  {req.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">
                      Nota: {req.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={req.status}
                    onChange={(e) => handleUpdateStatus(req.id, e.target.value as RequirementStatus)}
                    className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="ACTION_REQUIRED">🔴 Perlu Tindakan</option>
                    <option value="IN_PROGRESS">🟡 Sedang Buat</option>
                    <option value="COMPLETED">🟢 Selesai</option>
                  </select>

                  <button
                    onClick={() => setSelectedReqForEvidence(req)}
                    className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    title="Lampiran Bukti"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setIsEscalationOpen(true)}
            className="py-2 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Rekod Masalah / Bantuan</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Selesai
          </button>
        </div>

        {/* Sub-modals */}
        {selectedReqForEvidence && (
          <EvidenceModal
            isOpen={!!selectedReqForEvidence}
            onClose={() => setSelectedReqForEvidence(null)}
            program={program}
            unit={unit}
            requirement={selectedReqForEvidence}
          />
        )}

        {isAssignLeaderOpen && (
          <UnitLeaderAssignModal
            isOpen={isAssignLeaderOpen}
            onClose={() => setIsAssignLeaderOpen(false)}
            program={program}
            unit={unit}
            people={people}
          />
        )}

        {isEscalationOpen && (
          <EscalationModal
            isOpen={isEscalationOpen}
            onClose={() => setIsEscalationOpen(false)}
            program={program}
            unit={unit}
          />
        )}
      </div>
    </div>
  );
};
