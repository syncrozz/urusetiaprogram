import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { MainCategory, ProgramTemplate, Person } from '../../types';
import { getPersonDisplayName } from '../../lib/utils';
import { IconRenderer } from '../common/IconRenderer';
import { PriorityBadge } from '../common/Badge';
import {
  Sparkles,
  Layers,
  Calendar,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  ShieldCheck,
  FolderKanban,
  FileText,
} from 'lucide-react';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MainCategory[];
  templates: ProgramTemplate[];
  people: Person[];
  onProgramCreated: (programId: string) => void;
}

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  isOpen,
  onClose,
  categories,
  templates,
  people,
  onProgramCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-theatre');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-09-15');
  const [endDate, setEndDate] = useState('2026-09-17');
  const [deadlineDate, setDeadlineDate] = useState('2026-09-14');
  const [venue, setVenue] = useState('');
  const [expectedAttendance, setExpectedAttendance] = useState(300);
  const [budgetAllocated, setBudgetAllocated] = useState(10000);

  // Template Units Selection & Assignment State
  const [selectedUnits, setSelectedUnits] = useState<{
    [templateUnitId: string]: { selected: boolean; leaderId?: string };
  }>({});

  // Auto-load template structure when category changes
  const activeTemplate =
    templates.find((t) => t.categoryId === categoryId) || templates[0];

  React.useEffect(() => {
    if (activeTemplate && activeTemplate.units) {
      const initialMap: Record<string, { selected: boolean; leaderId?: string }> = {};
      activeTemplate.units.forEach((u) => {
        initialMap[u.id] = { selected: true, leaderId: undefined };
      });
      setSelectedUnits(initialMap);
    }
  }, [categoryId, activeTemplate]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) return;
      if (!code.trim()) {
        setCode(`PRG-${Math.floor(1000 + Math.random() * 9000)}`);
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleLaunch = () => {
    const unitAssignments = (Object.entries(selectedUnits) as [string, { selected: boolean; leaderId?: string }][])
      .filter(([_, v]) => v.selected)
      .map(([k, v]) => ({
        templateUnitId: k,
        leaderId: v.leaderId,
      }));

    const created = secretariatStore.createProgram({
      name: name.trim(),
      categoryId,
      templateId: activeTemplate?.id,
      code: code.trim() || `PRG-${Math.floor(1000 + Math.random() * 9000)}`,
      description: description.trim(),
      startDate,
      endDate,
      deadlineDate,
      venue: venue.trim() || 'Dewan / Tapak Acara Kampus',
      expectedAttendance,
      budgetAllocated,
      selectedTemplateUnits: unitAssignments,
    });

    onProgramCreated(created.id);
    onClose();
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        selected: !prev[unitId]?.selected,
      },
    }));
  };

  const setUnitLeader = (unitId: string, leaderId?: string) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        leaderId,
      },
    }));
  };

  const selectedUnitsCount = (Object.values(selectedUnits) as { selected: boolean; leaderId?: string }[]).filter((v) => v.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              Enjin Template Program
            </span>
            <span className="text-xs text-slate-400">Langkah {step} daripada 3</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {step === 1 && '1. Maklumat Asas Program'}
            {step === 2 && '2. Semak Cadangan Struktur Unit & Tugasan'}
            {step === 3 && '3. Lantik Ketua Unit & Pengesahan'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1 && 'Pilih kategori utama untuk membolehkan sistem menjana struktur kerja dan senarai semak automatik.'}
            {step === 2 && 'Sistem membaca template kategori dan mencadangkan unit serta keperluan yang terbukti sesuai.'}
            {step === 3 && 'Tugaskan Ketua Unit yang bertanggungjawab sebelum melancarkan dashboard urusetia.'}
          </p>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* STEP 1: Basic Info & Category */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth: Festival Kesenian Teater Belia 2026"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Main Category Grid Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Kategori Utama (Main Category) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                        categoryId === cat.id
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                        <IconRenderer name={cat.icon} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {cat.name}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {cat.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kod Program
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="cth: TH-KPMBP-26"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi / Venue <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="cth: Panggung Gemilang Utama"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh Mula
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh Tamat
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh Kesiapsiagaan
                  </label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Ringkas
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan objektif dan sasaran program..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Recommended Units & Requirements Inspection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Template <strong>{activeTemplate?.name}</strong> mencadangkan{' '}
                    <strong>{activeTemplate?.units.length} Unit Urusetia</strong>.
                  </span>
                </div>
                <span className="font-bold">{selectedUnitsCount} dipilih</span>
              </div>

              <div className="space-y-3">
                {activeTemplate?.units.map((tu) => {
                  const isChecked = selectedUnits[tu.id]?.selected ?? true;

                  return (
                    <div
                      key={tu.id}
                      className={`p-4 rounded-2xl border transition ${
                        isChecked
                          ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleUnit(tu.id)}
                            className="mt-1 w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {tu.name}
                              </h4>
                              <PriorityBadge priority={tu.priority} />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{tu.description}</p>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono font-semibold text-slate-400 shrink-0">
                          {tu.requirements.length} Tugasan
                        </span>
                      </div>

                      {/* Preview of Requirements */}
                      {isChecked && (
                        <div className="mt-3 pl-7 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                          {tu.requirements.map((req) => (
                            <div
                              key={req.id}
                              className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span className="font-medium">{req.title}</span>
                              {req.required && (
                                <span className="text-[9px] text-rose-500 font-bold">(Wajib)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Assign Ketua Unit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                Lantik Ketua Unit untuk unit terpilih. Anda juga boleh melantik atau menukar mereka kemudian dari Dashboard.
              </div>

              <div className="space-y-3">
                {activeTemplate?.units
                  .filter((tu) => selectedUnits[tu.id]?.selected)
                  .map((tu) => {
                    const currentLeaderId = selectedUnits[tu.id]?.leaderId;

                    return (
                      <div
                        key={tu.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                            <IconRenderer name={tu.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{tu.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {tu.requirements.length} checklist dijana
                            </p>
                          </div>
                        </div>

                        <select
                          value={currentLeaderId || ''}
                          onChange={(e) => setUnitLeader(tu.id, e.target.value || undefined)}
                          className="p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="">-- Pilih Ketua Unit (Pilihan) --</option>
                          {people.map((p) => (
                            <option key={p.id} value={p.id}>
                              {getPersonDisplayName(p)} ({p.studentId})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-100"
            >
              Batal
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleNext}
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 shadow-md transition"
            >
              <span>Seterusnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              className="py-2 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-lg transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lancarkan Program ({selectedUnitsCount} Unit)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
