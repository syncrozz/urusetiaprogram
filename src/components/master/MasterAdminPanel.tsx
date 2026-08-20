import React, { useState, useRef } from 'react';
import { MainCategory, ProgramTemplate, Person, Program } from '../../types';
import { secretariatStore } from '../../lib/storage';
import { IconRenderer } from '../common/IconRenderer';
import { PriorityBadge } from '../common/Badge';
import {
  exportPeopleToCSV,
  importPeopleFromCSV,
  downloadCSV,
  exportUnitsReadinessToCSV,
  getSampleStudentCSVTemplate,
} from '../../lib/csvHelper';
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
  Users,
  FileSpreadsheet,
  FileDown,
  FileUp,
  Search,
  Mail,
  Phone,
  Shield,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';

interface MasterAdminPanelProps {
  categories: MainCategory[];
  templates: ProgramTemplate[];
  people?: Person[];
  activeProgram?: Program;
  onLock: () => void;
}

export const MasterAdminPanel: React.FC<MasterAdminPanelProps> = ({
  categories,
  templates,
  people = [],
  activeProgram,
  onLock,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'templates' | 'students_csv' | 'backup'>('students_csv');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  // Search & Filter for Students
  const [studentSearch, setStudentSearch] = useState('');
  
  // CSV Import State
  const [isDragOver, setIsDragOver] = useState(false);
  const [importedPreview, setImportedPreview] = useState<{
    parsed: Person[];
    count: number;
    errors: string[];
    rawText: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Student Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newIcNumber, setNewIcNumber] = useState('');
  const [newIcLast4, setNewIcLast4] = useState('');
  const [newGmail, setNewGmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('Perempuan');
  const [newProgramStudy, setNewProgramStudy] = useState('DLM');
  const [newSemester, setNewSemester] = useState('Semester 3');

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const safePeople = Array.isArray(people) ? people : secretariatStore.getState().people || [];

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 4500);
  };

  // --- CSV Export Handlers ---
  const handleExportStudentsCSV = () => {
    const csvData = exportPeopleToCSV(safePeople);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `senarai-pelajar-ketua-unit-${dateStr}.csv`);
    showFeedback(`Berjaya mengeksport ${safePeople.length} rekod pelajar ke CSV!`);
  };

  const handleExportReadinessCSV = () => {
    if (!activeProgram) {
      showFeedback('Tiada program aktif dipilih.', 'error');
      return;
    }
    const csvData = exportUnitsReadinessToCSV(activeProgram);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `laporan-kesediaan-unit-${activeProgram.name.replace(/\s+/g, '-').toLowerCase()}-${dateStr}.csv`);
    showFeedback(`Laporan Kesediaan Unit untuk ${activeProgram.name} berjaya dieksport ke CSV!`);
  };

  const handleDownloadSampleTemplate = () => {
    const templateData = getSampleStudentCSVTemplate();
    downloadCSV(templateData, 'templat-contoh-import-pelajar.csv');
    showFeedback('Templat contoh CSV berjaya dimuat turun!');
  };

  // --- CSV Import Handlers ---
  const processCSVFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      showFeedback('Sila pilih fail berformat .CSV sahaja.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = importPeopleFromCSV(text);
      if (result.success) {
        setImportedPreview({
          parsed: result.people,
          count: result.importedCount,
          errors: result.errors,
          rawText: text,
        });
        showFeedback(`Pratonton fail CSV dimuatkan (${result.importedCount} rekod dikesan). Sila sahkan untuk import.`);
      } else {
        showFeedback(result.errors.join(', ') || 'Gagal membaca fail CSV.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (!importedPreview || importedPreview.parsed.length === 0) return;

    const finalCount = secretariatStore.importPeople(importedPreview.parsed, importMode);
    showFeedback(`Berjaya mengimport ${importedPreview.parsed.length} rekod pelajar! Jumlah rekod terkini: ${finalCount}`);
    setImportedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Manual Add Student ---
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newStudentId.trim()) {
      showFeedback('Sila lengkapkan Nama Penuh dan No. ID Pelajar.', 'error');
      return;
    }

    let calculatedIcLast4 = newIcLast4.trim();
    if (!calculatedIcLast4 && newIcNumber.trim()) {
      const digits = newIcNumber.replace(/[^0-9]/g, '');
      if (digits.length >= 4) {
        calculatedIcLast4 = digits.slice(-4);
      }
    }
    if (!calculatedIcLast4) {
      calculatedIcLast4 = '1234';
    }

    const emailPrefix = newFullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const officialEmail = `${emailPrefix}@bpenawar.kpm.edu.my`;

    secretariatStore.addNewPerson({
      fullName: newFullName.trim(),
      nickname: newNickname.trim() || newFullName.trim().split(' ')[0],
      position: newPosition.trim() || 'Ketua Unit',
      studentId: newStudentId.trim(),
      icNumber: newIcNumber.trim() || undefined,
      icLast4: calculatedIcLast4,
      phone: newPhone.trim() || '-',
      gmail: newGmail.trim() || undefined,
      email: officialEmail,
      gender: newGender,
      programStudy: newProgramStudy,
      semester: newSemester,
      role: 'KETUA_UNIT',
      department: newPosition.trim() || newProgramStudy || 'Ketua Unit',
    });

    showFeedback(`Pelajar ${newFullName.trim()} berjaya ditambah ke pangkalan data!`);
    setIsAddStudentOpen(false);
    // Reset form
    setNewFullName('');
    setNewNickname('');
    setNewPosition('');
    setNewStudentId('');
    setNewIcNumber('');
    setNewIcLast4('');
    setNewGmail('');
    setNewPhone('');
  };

  const handleDeleteStudent = (p: Person) => {
    if (window.confirm(`Adakah anda pasti mahu memadam rekod [${p.fullName}] (${p.studentId})?`)) {
      secretariatStore.deletePerson(p.id);
      showFeedback(`Rekod ${p.fullName} telah dipadam.`);
    }
  };

  // --- JSON Backup Handlers ---
  const handleExportBackup = () => {
    const jsonStr = secretariatStore.exportJSONBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncrozz-secretariat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Pangkalan data JSON berjaya dieksport!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = secretariatStore.importJSONBackup(content);
      if (success) {
        showFeedback('Pangkalan data JSON berjaya diimport dan dimuat semula!');
      } else {
        showFeedback('Format fail JSON tidak sah.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Adakah anda pasti mahu set semula pangkalan data ke contoh asal (Seed Data)? Semua rekod pelajar dan perubahan manual akan dikembalikan ke tetapan awal.'
      )
    ) {
      secretariatStore.resetToInitialSeed();
      showFeedback('Sistem berjaya diset semula kepada Seed Data asal.');
    }
  };

  // Filtered students
  const filteredStudents = safePeople.filter((p) => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.nickname || '').toLowerCase().includes(q) ||
      (p.studentId || '').toLowerCase().includes(q) ||
      (p.icLast4 || '').toLowerCase().includes(q) ||
      (p.icNumber || '').toLowerCase().includes(q) ||
      (p.gmail || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.position || '').toLowerCase().includes(q) ||
      (p.programStudy || '').toLowerCase().includes(q)
    );
  });

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
              <h2 className="text-xl font-bold tracking-tight">Pusat Kawalan Master Admin</h2>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                Akses Dibenarkan
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Hab Pengurusan Data Pelajar (CSV Ready), Kategori Induk, Blueprint Template & Sandaran Sistem.
            </p>
          </div>
        </div>

        <button
          onClick={onLock}
          className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition self-start sm:self-auto border border-white/10"
        >
          Kunci Mod Master
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            feedbackType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedbackType === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('students_csv')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'students_csv'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Pengurusan Pelajar & Hab CSV ({safePeople.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Master Template Program ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Sandaran JSON & Reset</span>
        </button>
      </div>

      {/* TAB: Pengurusan Pelajar & CSV Hub */}
      {activeTab === 'students_csv' && (
        <div className="space-y-6">
          {/* Quick Action CSV Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
                  <FileDown className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eksport CSV Sedia Ada</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Muat turun senarai lengkap semua pelajar & Ketua Unit mengandungi Gmail, 4 Digit No. IC, Jawatan, ID dan Kursus.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleExportStudentsCSV}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Eksport Data Pelajar (.CSV)</span>
                </button>
                {activeProgram && (
                  <button
                    onClick={handleExportReadinessCSV}
                    className="w-full py-2 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Eksport Kesediaan Unit (.CSV)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Import Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
                  <FileUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import Fail CSV Pelajar</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Muat naik fail CSV untuk mendaftar atau mengemaskini maklumat pelajar secara pukal dengan pengesahan segera.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Pilih & Muat Naik Fail .CSV</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Sample Template Download & Manual Add */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Templat & Daftar Manual</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dapatkan contoh templat CSV yang telah diformatkan mengikut susunan lajur sistem atau daftar pelajar secara individu.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleDownloadSampleTemplate}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Muat Turun Templat Contoh CSV</span>
                </button>
                <button
                  onClick={() => setIsAddStudentOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pelajar Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Import Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`p-6 rounded-3xl border-2 border-dashed transition text-center flex flex-col items-center justify-center ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Seret dan lepaskan fail CSV ke sini
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Menyokong format CSV UTF-8 dengan lajur Gmail, Nama, No. Kad Pengenalan, 4 Digit IC, No. ID, Jawatan & Program
            </p>
            <label className="mt-3 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs cursor-pointer transition">
              Cari Fail Komputer
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* CSV Import Preview Modal / Section */}
          {importedPreview && (
            <div className="p-6 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Pratonton Fail CSV: {importedPreview.count} Rekod Dijumpai</span>
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Sila pilih mod import di bawah sebelum menyimpan ke pangkalan data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportedPreview(null)}
                    className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Sahkan & Import Sekarang</span>
                  </button>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Mod Import:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="APPEND"
                    checked={importMode === 'APPEND'}
                    onChange={() => setImportMode('APPEND')}
                    className="text-emerald-600"
                  />
                  <span>Gabung & Kemaskini (Kekalkan Data Sedia Ada)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="REPLACE"
                    checked={importMode === 'REPLACE'}
                    onChange={() => setImportMode('REPLACE')}
                    className="text-emerald-600"
                  />
                  <span>Gantian Penuh (Gantikan Seluruh Senarai)</span>
                </label>
              </div>

              {/* Preview Table (First 5) */}
              <div className="overflow-x-auto rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-100/50 dark:bg-indigo-950/60 text-[11px] font-bold uppercase text-indigo-900 dark:text-indigo-200 border-b border-indigo-200 dark:border-indigo-800">
                    <tr>
                      <th className="p-2.5">Nama Penuh</th>
                      <th className="p-2.5">Panggilan</th>
                      <th className="p-2.5">Jawatan</th>
                      <th className="p-2.5">No. ID</th>
                      <th className="p-2.5">4 Digit IC</th>
                      <th className="p-2.5">Gmail</th>
                      <th className="p-2.5">Telefon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {importedPreview.parsed.slice(0, 5).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{p.fullName}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{p.nickname || '-'}</td>
                        <td className="p-2.5 text-emerald-600 font-semibold">{p.position || '-'}</td>
                        <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{p.studentId}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">{p.icLast4}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{p.gmail || '-'}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{p.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importedPreview.parsed.length > 5 && (
                  <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                    + {importedPreview.parsed.length - 5} rekod lagi sedia diimport
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Directory of People / Students in Database */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Direktori Pelajar & Kredensial Log Masuk ({filteredStudents.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pelajar boleh log masuk ke Portal Ketua Unit menggunakan <strong>No. ID Pelajar</strong>, <strong>4 Digit No. IC</strong>, atau <strong>Gmail</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari nama, ID, IC, Gmail..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Nama & Panggilan</th>
                    <th className="p-3">Jawatan / Portfolio</th>
                    <th className="p-3">No. ID Pelajar</th>
                    <th className="p-3">4 Digit No. IC</th>
                    <th className="p-3">Gmail Pelajar</th>
                    <th className="p-3">No. Telefon</th>
                    <th className="p-3">Program & Sem</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{p.fullName}</div>
                        {p.nickname && (
                          <span className="text-[10px] text-slate-500">Panggilan: {p.nickname}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                          {p.position || p.department || 'Ketua Unit'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.studentId}
                      </td>
                      <td className="p-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-emerald-600 dark:text-emerald-400">
                          {p.icLast4}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.gmail ? (
                          <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{p.gmail}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {p.phone || '-'}
                      </td>
                      <td className="p-3 text-slate-500">
                        <div>{p.programStudy || 'DLM'}</div>
                        <div className="text-[10px] text-slate-400">{p.semester || 'Sem 3'}</div>
                      </td>
                      <td className="p-3 text-right">
                        {p.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteStudent(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Padam Rekod"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tiada rekod pelajar dijumpai untuk carian &quot;{studentSearch}&quot;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddStudentOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Pelajar / Ketua Unit Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Maklumat disimpan terus ke pangkalan data dan tersedia untuk lantikan.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penuh (seperti dalam IC) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="cth: NURZARA SOFEA BT SAIFUL NIZAM"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="cth: Zara"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jawatan / Portfolio
                  </label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="cth: Presiden / Ketua Unit"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. ID Pelajar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="PDL-2502-078"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4 Digit Terakhir IC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newIcLast4}
                    onChange={(e) => setNewIcLast4(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0480"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Kad Pengenalan Penuh
                  </label>
                  <input
                    type="text"
                    value={newIcNumber}
                    onChange={(e) => setNewIcNumber(e.target.value)}
                    placeholder="071012-14-0480"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Gmail
                  </label>
                  <input
                    type="email"
                    value={newGmail}
                    onChange={(e) => setNewGmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="016-4976385"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Program Pengajian
                  </label>
                  <input
                    type="text"
                    value={newProgramStudy}
                    onChange={(e) => setNewProgramStudy(e.target.value)}
                    placeholder="DLM / DIA"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    placeholder="Semester 3"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
                >
                  Simpan Pelajar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
