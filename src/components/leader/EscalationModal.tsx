import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { ProgramUnit, Program } from '../../types';
import { AlertTriangle, Send, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  unit: ProgramUnit;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({ isOpen, onClose, program, unit }) => {
  const [reason, setReason] = useState(unit.assistanceReason || '');
  const [request, setRequest] = useState(unit.assistanceRequest || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !request.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      secretariatStore.submitEscalation({
        programId: program.id,
        unitId: unit.id,
        reason: reason.trim(),
        request: request.trim(),
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perlu Bantuan Urusetia (Admin)</h3>
            <p className="text-xs text-slate-500">
              {unit.name} • {program.name}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Gunakan borang ini jika unit anda menghadapi kekangan bajet, kelewatan vendor, kerosakan peralatan, atau isu kritikal yang memerlukan campur tangan Pegawai Urusetia Pusat.
        </p>

        {isSuccess ? (
          <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Permohonan Berjaya Dihantar!</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              Admin Urusetia telah menerima notifikasi dan tiket bantuan telah dibuka.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                1. Apa masalah / kekangan yang dihadapi? <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="cth: Vendor lighting memaklumkan 2 lampu spotlight rosak dan memerlukan sewaan luar gantian segera..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                2. Apakah bantuan / tindakan khusus yang diperlukan daripada Admin? <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="cth: Mohon kelulusan bajet kecemasan RM300 atau kelulusan meminjam dari kolej cawangan..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-1.5 transition shadow-md"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Hantar ke Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
