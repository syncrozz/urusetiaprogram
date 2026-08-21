import React, { useState } from 'react';
import { Program, AuthSession, Person } from '../../types';
import { secretariatStore } from '../../lib/storage';
import { getPersonDisplayName } from '../../lib/utils';
import { usePWAInstall } from '../../lib/pwa';
import {
  Layers,
  ShieldCheck,
  UserCheck,
  Lock,
  Plus,
  AlertCircle,
  FileText,
  CheckCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  Smartphone,
  Download,
  Trophy,
  Users,
  Calendar,
  Bus,
  ClipboardList,
} from 'lucide-react';

interface NavbarProps {
  programs: Program[];
  activeProgram?: Program;
  authSession: AuthSession;
  onOpenCreateProgram: () => void;
  onOpenMasterPin: () => void;
  onOpenLeaderLogin: () => void;
  onOpenSecretariatReport: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAssistanceCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  programs,
  activeProgram,
  authSession,
  onOpenCreateProgram,
  onOpenMasterPin,
  onOpenLeaderLogin,
  onOpenSecretariatReport,
  activeTab,
  setActiveTab,
  openAssistanceCount,
}) => {
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  const handleProgramSelect = (progId: string) => {
    secretariatStore.setSelectedProgramId(progId);
    setShowProgramDropdown(false);
  };

  const handleSwitchToAdmin = () => {
    secretariatStore.loginAsAdmin();
    setShowRoleMenu(false);
  };

  const handleLogout = () => {
    secretariatStore.loginAsAdmin();
    setShowRoleMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md w-full max-w-full overflow-hidden">
      {/* Top Banner / Program Selector Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 gap-1.5 sm:gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-600 border border-indigo-500/30 flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-sm sm:text-lg text-white font-mono">
                  SOAR 2026
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded">
                  KPMBP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden md:block">
                Pusat Kesiapsiagaan Kontinjen
              </p>
            </div>
          </div>

          {/* Active Program Selector (Centralized) */}
          <div className="relative min-w-0 max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-sm flex-1 sm:flex-initial mx-1">
            <button
              onClick={() => setShowProgramDropdown(!showProgramDropdown)}
              className="w-full flex items-center justify-between gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-left transition"
              aria-expanded={showProgramDropdown}
            >
              <div className="truncate min-w-0">
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">Program Aktif</span>
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-white truncate">
                  {activeProgram?.name || 'Pilih Program'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {showProgramDropdown && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800">
                  Senarai Program Urusetia ({programs.length})
                </div>
                <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                  {programs.map((prog) => (
                    <button
                      key={prog.id}
                      onClick={() => handleProgramSelect(prog.id)}
                      className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between text-xs ${
                        prog.id === activeProgram?.id
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold truncate">{prog.name}</p>
                        <p className="text-[11px] text-slate-400">{prog.venue}</p>
                      </div>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {prog.overallProgress}%
                      </span>
                    </button>
                  ))}
                </div>
                <div className="p-1 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowProgramDropdown(false);
                      onOpenCreateProgram();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cipta Program Baru</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Escalation Alert Badge */}
            {openAssistanceCount > 0 && (
              <button
                onClick={() => setActiveTab('assistance')}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 text-xs font-bold transition animate-pulse"
                title={`${openAssistanceCount} unit memohon bantuan segera`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">{openAssistanceCount} Bantuan Diperlukan</span>
                <span className="md:hidden text-[11px] font-mono">{openAssistanceCount}</span>
              </button>
            )}

            {/* PWA Install Button (When prompt is available) */}
            {isInstallable && (
              <button
                onClick={triggerInstall}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs animate-bounce"
                title="Pasang aplikasi ke skrin utama"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pasang App (PWA)</span>
                <span className="sm:hidden text-[10px]">Pasang</span>
              </button>
            )}

            {/* Secretariat Report Button */}
            <button
              onClick={onOpenSecretariatReport}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
              title="Jana Laporan Rasmi Kesiapsiagaan"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Laporan Urusetia</span>
            </button>

            {/* Role Menu Selector / Single Admin Access Trigger */}
            <div className="relative">
              {authSession.role === 'MASTER_ADMIN' || authSession.isMasterUnlocked ? (
                <div className="flex items-center bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-0.5">
                  <button
                    id="admin-access-active-btn"
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition active:scale-95"
                    title="Akses Admin Sedang Aktif. Klik untuk menu atau kunci semula."
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3.5" />
                    <span>Akses Admin: AKTIF</span>
                    <ChevronDown className="w-3 h-3 text-emerald-400 ml-0.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="admin-access-trigger-btn"
                  onClick={onOpenMasterPin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold transition shadow-sm"
                  title="Klik untuk membuka Akses Admin (PIN 5313)"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-950" />
                  <span>Buka Akses Admin</span>
                </button>
              )}

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn text-xs">
                  <div className="p-2 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-200">
                        {getPersonDisplayName(authSession.person, 'Pengguna')}
                      </p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Admin Aktif
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Status: Kebenaran Menyunting Dibuka
                    </p>
                  </div>

                  <div className="py-1 space-y-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setActiveTab('master');
                      }}
                      className="w-full text-left p-2 rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-800 transition"
                    >
                      <Layers className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="font-semibold text-slate-200">Panel Master Admin</p>
                        <p className="text-[10px] text-slate-400">Blueprint, Kategori & CSV</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        secretariatStore.lockMasterAdmin();
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left p-2 rounded-lg flex items-center gap-2 text-rose-300 hover:bg-rose-950/30 transition"
                    >
                      <Lock className="w-4 h-4 text-rose-400" />
                      <div>
                        <p className="font-semibold text-rose-300">Kunci Semula Akses Admin</p>
                        <p className="text-[10px] text-slate-400">Kembali ke mod paparan sahaja</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenLeaderLogin();
                      }}
                      className="w-full text-left p-2 rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-800 transition"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="font-semibold text-slate-200">Log Masuk Ketua Unit</p>
                        <p className="text-[10px] text-slate-400">ID Pelajar / IC 4 Digit</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Admin / Master Admin Mode) */}
      {authSession.role !== 'KETUA_UNIT' && (
        <div className="bg-slate-950 border-t border-slate-800 w-full max-w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-none text-xs font-medium w-full">
              {/* 1. 🏆 Acara & Kesediaan */}
              <button
                onClick={() => setActiveTab('readiness')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'readiness'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'readiness' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <Trophy className="w-3.5 h-3.5" />
                <span>Acara & Kesediaan</span>
              </button>

              {/* 2. 👥 Pasukan & Peserta */}
              <button
                onClick={() => setActiveTab('squad')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'squad'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'squad' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <Users className="w-3.5 h-3.5" />
                <span>Pasukan & Peserta</span>
              </button>

              {/* 3. 📅 Jadual & Latihan */}
              <button
                onClick={() => setActiveTab('training')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'training'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'training' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <Calendar className="w-3.5 h-3.5" />
                <span>Jadual & Latihan</span>
              </button>

              {/* 4. 📋 Keperluan & Syarat */}
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'requirements'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'requirements' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Keperluan & Syarat</span>
              </button>

              {/* 5. 🚌 Logistik & Pegawai */}
              <button
                onClick={() => setActiveTab('logistics')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'logistics'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'logistics' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <Bus className="w-3.5 h-3.5" />
                <span>Logistik & Pegawai</span>
              </button>

              {/* 6. 🚨 Bantuan / Isu */}
              <button
                onClick={() => setActiveTab('assistance')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'assistance'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'assistance' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Bantuan & Isu</span>
                {openAssistanceCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-900 text-red-200 font-bold font-mono">
                    {openAssistanceCount}
                  </span>
                )}
              </button>

              {/* Admin Additional Tabs */}
              <button
                onClick={() => setActiveTab('programs')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'programs'
                    ? 'bg-slate-800 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'programs' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <Layers className="w-3.5 h-3.5" />
                <span>Pengurusan Program ({programs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'activity'
                    ? 'bg-slate-800 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'activity' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <FileText className="w-3.5 h-3.5" />
                <span>Log Aktiviti</span>
              </button>

              {authSession.role === 'MASTER_ADMIN' && (
                <button
                  onClick={() => setActiveTab('master_config')}
                  className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 border border-amber-500/50 shrink-0 ${
                    activeTab === 'master_config'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-amber-400 hover:bg-amber-950/40'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Master Config</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
