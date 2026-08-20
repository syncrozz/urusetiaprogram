import React, { useState } from 'react';
import { Program, MainCategory } from '../../types';
import { formatDate } from '../../lib/utils';
import { StatusBadge } from '../common/Badge';
import { IconRenderer } from '../common/IconRenderer';
import {
  Layers,
  Plus,
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ProgramListProps {
  programs: Program[];
  categories: MainCategory[];
  activeProgramId?: string;
  onSelectProgram: (programId: string) => void;
  onOpenCreateProgram: () => void;
}

export const ProgramList: React.FC<ProgramListProps> = ({
  programs,
  categories,
  activeProgramId,
  onSelectProgram,
  onOpenCreateProgram,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const safePrograms = Array.isArray(programs) ? programs : [];

  const filteredPrograms = safePrograms.filter((p) => {
    if (!p) return false;
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.venue || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'ALL') return true;
    return p.categoryId === selectedCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Pengurusan Semua Program Urusetia</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau, laksana dan bertukar antara pelbagai program dan festival kampus.
          </p>
        </div>

        <button
          onClick={onOpenCreateProgram}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cipta Program Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kod, atau lokasi program..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrograms.map((prog) => {
          const isActive = prog.id === activeProgramId;

          return (
            <div
              key={prog.id}
              className={`p-6 rounded-3xl border transition shadow-xs flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-500/80 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {prog.code}
                  </span>
                  <StatusBadge status={prog.status} />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {prog.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {prog.description}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {formatDate(prog.startDate)} — {formatDate(prog.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{prog.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{prog.units.length} Unit Urusetia Berdaftar</span>
                  </div>
                </div>

                {/* Progress Metric */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Kesiapsiagaan Program
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {prog.overallProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        prog.overallProgress >= 90
                          ? 'bg-emerald-500'
                          : prog.overallProgress >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${prog.overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2">
                <button
                  onClick={() => onSelectProgram(prog.id)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{isActive ? 'Program Aktif Semasa' : 'Buka Dashboard Program'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
