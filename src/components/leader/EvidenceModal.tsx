import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { UnitRequirement, ProgramUnit, Program } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { Paperclip, Plus, Link, FileText, Image as ImageIcon, ExternalLink, X, Check } from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  unit: ProgramUnit;
  requirement: UnitRequirement;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  program,
  unit,
  requirement,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'pdf' | 'link' | 'document'>('image');
  const [mediaUrl, setMediaUrl] = useState('');

  if (!isOpen) return null;

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalUrl = mediaUrl.trim();
    if (!finalUrl) {
      if (mediaType === 'image') {
        finalUrl = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80';
      } else if (mediaType === 'pdf') {
        finalUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      } else {
        finalUrl = 'https://drive.google.com';
      }
    }

    secretariatStore.addEvidenceToRequirement({
      programId: program.id,
      unitId: unit.id,
      requirementId: requirement.id,
      title: title.trim(),
      mediaType,
      mediaUrl: finalUrl,
    });

    setTitle('');
    setMediaUrl('');
    setShowAddForm(false);
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Paperclip className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lampiran & Bukti Siap</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{requirement.title}</p>
          </div>
        </div>

        {/* Existing Evidences List */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Senarai Bukti ({requirement.evidences?.length || 0})
            </span>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Bukti</span>
              </button>
            )}
          </div>

          {requirement.evidences && requirement.evidences.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {requirement.evidences.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                      {ev.mediaType === 'image' && <ImageIcon className="w-4 h-4" />}
                      {ev.mediaType === 'pdf' && <FileText className="w-4 h-4" />}
                      {ev.mediaType === 'link' && <Link className="w-4 h-4" />}
                      {ev.mediaType === 'document' && <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-400">
                        Dimuat naik oleh {ev.uploadedByName} • {formatDateTime(ev.createdAt)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={ev.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition shrink-0"
                    title="Buka Pautan Bukti"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
              Belum ada bukti dilampirkan untuk tugasan ini.
            </div>
          )}
        </div>

        {/* Add Evidence Form */}
        {showAddForm ? (
          <form onSubmit={handleAddEvidence} className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-fadeIn">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Muat Naik / Lampirkan Bukti Baru
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tajuk Bukti / Dokumen
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth: Gambar Pemasangan Spotlight / Resit Sewaan"
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Media
                </label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="image">Gambar / Foto (JPG/PNG)</option>
                  <option value="pdf">Dokumen PDF / Surat</option>
                  <option value="link">Pautan Google Drive / Cloud</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pautan URL / Cloud (Pilihan)
                </label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-1.5 px-3 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Bukti</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
