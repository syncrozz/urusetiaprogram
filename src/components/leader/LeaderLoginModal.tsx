import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { Person } from '../../types';
import { getPersonDisplayName } from '../../lib/utils';
import { UserCheck, Shield, KeyRound, ArrowRight, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface LeaderLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  people: Person[];
}

export const LeaderLoginModal: React.FC<LeaderLoginModalProps> = ({ isOpen, onClose, onSuccess, people }) => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (val?: string) => {
    const inputVal = val || identifier;
    if (!inputVal.trim()) {
      setError('Sila masukkan No. ID Pelajar atau 4 Digit Terakhir No. IC.');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const result = secretariatStore.loginAsLeader(inputVal);
      setIsLoading(false);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Maklumat tidak ditemui.');
      }
    }, 300);
  };

  const leaders = (Array.isArray(people) ? people : []).filter((p) => p.role === 'KETUA_UNIT');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-inner">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Portal Ketua Unit</h3>
            <p className="text-xs text-slate-500">Akses Pengurusan & Kemaskini Unit Lapangan</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          Log masuk pantas untuk Ketua Unit mengemaskini status tugasan, melampirkan bukti, dan memohon bantuan urusetia secara terus.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              No. ID Pelajar / 4 Digit Terakhir No. IC / Gmail
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="cth: PDL-2502-078, 0480, atau nurzara.sofea07@gmail.com"
                className="w-full py-3.5 px-4 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                autoFocus
              />
              <KeyRound className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            {error && (
              <p className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => handleLogin()}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Akses Unit Saya</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Demo Quick Logins */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ketua Unit Berdaftar</span>
            </span>
          </div>

          {leaders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {leaders.slice(0, 4).map((leader) => (
                <button
                  key={leader.id}
                  type="button"
                  onClick={() => {
                    setIdentifier(leader.studentId);
                    handleLogin(leader.studentId);
                  }}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition group flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-700">
                      {getPersonDisplayName(leader)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {leader.studentId} • IC: {leader.icLast4}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      {leader.position || leader.department || 'Ketua Unit'}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              Tiada ketua unit berdaftar dalam pangkalan data semasa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
