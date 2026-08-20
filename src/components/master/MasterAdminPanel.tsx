import React, { useState } from 'react';
import { MainCategory, ProgramTemplate } from '../../types';
import { secretariatStore } from '../../lib/storage';
import { IconRenderer } from '../common/IconRenderer';
import { PriorityBadge } from '../common/Badge';
import {
  Lock,
  FolderTree,
  FileCode,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Save,
  Sparkles,
} from 'lucide-react';

interface MasterAdminPanelProps {
  categories: MainCategory[];
  templates: ProgramTemplate[];
  onLock: () => void;
}

export const MasterAdminPanel: React.FC<MasterAdminPanelProps> = ({
  categories,
  templates,
  onLock,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'templates' | 'backup'>('categories');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [feedback, setFeedback] = useState<string>('');

  // Category Edit State
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Layers');

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleExportBackup = () => {
    const jsonStr = secretariatStore.exportJSONBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncrozz-secretariat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Pangkalan data berjaya dieksport!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = secretariatStore.importJSONBackup(content);
      if (success) {
        showFeedback('Pangkalan data berjaya diimport dan dimuat semula!');
      } else {
        alert('Format fail JSON tidak sah.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Adakah anda pasti mahu set semula pangkalan data ke contoh asal (Seed Data)? Semua perubahan manual akan dipadam.')) {
      secretariatStore.resetToInitialSeed();
      showFeedback('Sistem berjaya diset semula kepada Seed Data asal.');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Master Admin Header */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 rounded-3xl p-6 text-white border border-amber-800/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                Pusat Kawalan Master Admin
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                PIN Terbuka: 5313
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Urus Kategori Induk, Blueprint Template Program, dan Sandaran Data Sistem.
            </p>
          </div>
        </div>

        <button
          onClick={onLock}
          className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition self-start sm:self-auto"
        >
          Kunci Mod Master
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kategori Utama ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Master Template Program</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Sandaran & Import / Reset</span>
        </button>
      </div>

      {/* TAB 1: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mb-3">
                    <IconRenderer name={c.icon} className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-slate-400">ID: {c.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Program Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selector */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Pilih Blueprint Template
            </h3>
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`w-full text-left p-4 rounded-2xl border transition ${
                  selectedTemplate?.id === t.id
                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-xs sm:text-sm text-slate-900 dark:text-white">{t.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                  {t.units.length} Unit Piawai • Kategori: {t.categoryId}
                </p>
              </button>
            ))}
          </div>

          {/* Template Units Inspection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Struktur Unit Piawai — {selectedTemplate?.name}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Setiap kali program baru dicipta daripada kategori ini, unit-unit di bawah akan diwarisi secara automatik.
              </p>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedTemplate?.units.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconRenderer name={u.icon} className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {u.name}
                        </span>
                        <PriorityBadge priority={u.priority} />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {u.requirements.length} checklist
                      </span>
                    </div>

                    <div className="space-y-1 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                      {u.requirements.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400"
                        >
                          <span>• {req.title}</span>
                          {req.required && (
                            <span className="text-[9px] font-bold text-rose-500">(Wajib)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Backup & Data Reset */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <Download className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Eksport Sandaran JSON</h4>
              <p className="text-xs text-slate-500 mt-1">
                Muat turun fail sandaran lengkap mengandungi semua program, template, unit, ketua dan log aktiviti.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun Fail .JSON</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <Upload className="w-8 h-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Import Sandaran JSON</h4>
              <p className="text-xs text-slate-500 mt-1">
                Muat naik fail sandaran JSON untuk memulihkan keseluruhan pangkalan data sistem.
              </p>
            </div>
            <label className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Pilih Fail JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <RotateCcw className="w-8 h-8 text-rose-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Set Semula ke Seed Data</h4>
              <p className="text-xs text-slate-500 mt-1">
                Padam semua data ujian dan kembalikan kepada data demo asal (Pertandingan Teater & Pasar Malam).
              </p>
            </div>
            <button
              onClick={handleResetData}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Set Semula Sekarang</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
