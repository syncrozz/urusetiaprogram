import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface MasterPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MasterPinModal: React.FC<MasterPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Sila masukkan PIN keselamatan');
      return;
    }

    const isValid = secretariatStore.verifyMasterPin(pin);
    if (isValid) {
      setError('');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPin('');
        onSuccess();
        onClose();
      }, 600);
    } else {
      setError('PIN keselamatan tidak sah. Sila semak semula.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Akses Master Admin</h3>
            <p className="text-xs text-slate-500">Konfigurasi Master Categories & Program Templates</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
          Zon ini dikhaskan untuk pengurusan kategori utama, standardisasi template program dan peraturan kesiagaan. Sila masukkan PIN keselamatan sistem.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              PIN Keselamatan (4 Digit)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                autoFocus
              />
              <KeyRound className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-rose-600">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <span className="font-bold">Nota Sistem:</span>
            <span>PIN keselamatan lalai untuk persekitaran ini ialah <strong>5313</strong>.</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition shadow-md ${
                isSuccess
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Disahkan!</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Buka Konfigurasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
