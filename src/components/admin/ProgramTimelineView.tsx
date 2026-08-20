import React from 'react';
import { Program } from '../../types';
import { formatDate } from '../../lib/utils';
import { StatusBadge } from '../common/Badge';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ProgramTimelineViewProps {
  program: Program;
}

export const ProgramTimelineView: React.FC<ProgramTimelineViewProps> = ({ program }) => {
  const milestones = [
    {
      id: 'm-1',
      title: 'Pelantikan Jawatankuasa & Pengagihan Unit',
      phase: 'Fasa 1: Perancangan',
      dueDate: '1 Bulan Sebelum',
      completed: true,
      description: 'Lantikan semua Ketua Unit dan pengedaran senarai semak keperluan asas.',
    },
    {
      id: 'm-2',
      title: 'Pengesahan Bajet & Kelulusan Tempat / Permit',
      phase: 'Fasa 2: Kelulusan',
      dueDate: '3 Minggu Sebelum',
      completed: true,
      description: 'Kelulusan Pengurusan Kampus, bayaran deposit tempat dan tempahan peralatan.',
    },
    {
      id: 'm-3',
      title: 'Mesyuarat Penyelarasan Urusetia & Semakan Vendor',
      phase: 'Fasa 3: Persediaan Lapangan',
      dueDate: '2 Minggu Sebelum',
      completed: program.overallProgress >= 50,
      description: 'Semakan status pentas, lampu, audio, kawalan lalu lintas, dan publisiti.',
    },
    {
      id: 'm-4',
      title: 'Pemeriksaan Teknikal & Raptai Penuh',
      phase: 'Fasa 4: Raptai & Dry Run',
      dueDate: program.deadlineDate,
      completed: program.overallProgress >= 85,
      description: 'Semua unit mesti mencapai status hijau (Siap) sebelum raptai akhir.',
    },
    {
      id: 'm-5',
      title: 'Hari Acara Berlangsung (Event Day)',
      phase: 'Fasa 5: Operasi Lapangan',
      dueDate: program.startDate,
      completed: program.overallProgress >= 100,
      description: 'Penyelarasan urusetia bertugas, kawalan keselamatan, dan operasi peserta.',
    },
    {
      id: 'm-6',
      title: 'Post-Mortem & Laporan Dokumentasi Akhir',
      phase: 'Fasa 6: Penutupan',
      dueDate: program.endDate,
      completed: false,
      description: 'Penyediaan laporan penyata kewangan, minit post-mortem, dan serahan stor.',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold uppercase tracking-widest font-mono">
            GARIS MASA
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Garis Masa & Fasa Pelaksanaan Program
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Garis panduan fasa perancangan dari pelantikan sehingga dokumentasi akhir.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold">
            Sasaran Kesiapsiagaan: {formatDate(program.deadlineDate)}
          </span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 ml-3 sm:ml-4 my-4">
        {milestones.map((m, idx) => (
          <div key={m.id} className="relative group">
            {/* Dot Indicator */}
            <div
              className={`absolute -left-[31px] sm:-left-[39px] top-1 w-7 h-7 rounded-lg flex items-center justify-center border-2 border-slate-100 dark:border-slate-900 ${
                m.completed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {m.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
              )}
            </div>

            {/* Card Content */}
            <div
              className={`p-5 rounded-2xl border transition shadow-xs ${
                m.completed
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/80'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {m.phase}
                  </span>
                  {m.completed && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Selesai</span>
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{m.dueDate}</span>
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {m.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {m.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
