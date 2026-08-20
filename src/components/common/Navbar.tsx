import React, { useState } from 'react';
import { Program, AuthSession, Person } from '../../types';
import { secretariatStore } from '../../lib/storage';
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
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner / Program Selector Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 border border-indigo-500/30 flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base sm:text-lg text-white font-mono">
                  SYNCROZZ
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded">
                  SECRETARIAT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                Rancang • Urus • Pantau • Selesai
              </p>
            </div>
          </div>

          {/* Active Program Selector (Centralized) */}
          <div className="relative">
            <button
              onClick={() => setShowProgramDropdown(!showProgramDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-left transition max-w-[180px] sm:max-w-xs md:max-w-sm"
              aria-expanded={showProgramDropdown}
            >
              <div className="truncate min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Program Aktif
                </p>
                <p className="text-xs font-semibold text-white truncate">
                  {activeProgram?.name || 'Pilih Program'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
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
          <div className="flex items-center gap-2">
            {/* Escalation Alert Badge */}
            {openAssistanceCount > 0 && (
              <button
                onClick={() => setActiveTab('assistance')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 text-xs font-bold transition animate-pulse"
                title={`${openAssistanceCount} unit memohon bantuan segera`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">{openAssistanceCount} Bantuan Diperlukan</span>
                <span className="md:hidden">{openAssistanceCount}</span>
              </button>
            )}

            {/* PWA Install Button (When prompt is available) */}
            {isInstallable && (
              <button
                onClick={triggerInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs animate-bounce"
                title="Pasang aplikasi Syncrozz ke skrin utama"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pasang App (PWA)</span>
                <span className="sm:hidden">Pasang</span>
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

            {/* Role Menu Selector */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  authSession.role === 'MASTER_ADMIN'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : authSession.role === 'KETUA_UNIT'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {authSession.role === 'MASTER_ADMIN' && <Lock className="w-3.5 h-3.5 text-emerald-400" />}
                {authSession.role === 'KETUA_UNIT' && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                {authSession.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}

                <span className="hidden sm:inline">
                  {authSession.role === 'MASTER_ADMIN'
                    ? 'Master Admin'
                    : authSession.role === 'KETUA_UNIT'
                    ? authSession.person?.fullName.split(' ')[0] || 'Ketua Unit'
                    : 'Admin Program'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn text-xs">
                  <div className="p-2 border-b border-slate-800">
                    <p className="font-bold text-slate-200">
                      {authSession.person?.fullName || 'Pengguna'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Peranan: {authSession.role}
                    </p>
                  </div>

                  <div className="py-1 space-y-1">
                    <button
                      onClick={handleSwitchToAdmin}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition ${
                        authSession.role === 'ADMIN' ? 'bg-indigo-600/30 text-indigo-200 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="font-semibold">Mod Admin Urusetia</p>
                        <p className="text-[10px] text-slate-400">Pantau semua unit & program</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenLeaderLogin();
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition ${
                        authSession.role === 'KETUA_UNIT' ? 'bg-emerald-600/30 text-emerald-200 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-semibold">Log Masuk Ketua Unit</p>
                        <p className="text-[10px] text-slate-400">ID Pelajar / 4 Digit IC</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenMasterPin();
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition ${
                        authSession.role === 'MASTER_ADMIN' ? 'bg-amber-600/30 text-amber-200 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="font-semibold">Konfigurasi Master Admin</p>
                        <p className="text-[10px] text-slate-400">PIN Keselamatan Diperlukan</p>
                      </div>
                    </button>
                  </div>

                  {authSession.role !== 'ADMIN' && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left p-2 text-red-300 hover:bg-red-950/40 rounded-lg flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Kembali ke Admin Utama</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Admin / Master Admin Mode) */}
      {authSession.role !== 'KETUA_UNIT' && (
        <div className="bg-slate-950 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-none text-xs font-medium">
              <button
                onClick={() => setActiveTab('readiness')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'readiness'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'readiness' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Kesediaan Program</span>
              </button>

              <button
                onClick={() => setActiveTab('units')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'units'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'units' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <Layers className="w-3.5 h-3.5" />
                <span>Unit & Ketua ({activeProgram?.units.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('assistance')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
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

              <button
                onClick={() => setActiveTab('programs')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'programs'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'programs' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <span>Semua Program ({programs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'timeline' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <span>Garis Masa & Fasa</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'activity'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {activeTab === 'activity' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5" />}
                <span>Log Aktiviti</span>
              </button>

              {authSession.role === 'MASTER_ADMIN' && (
                <button
                  onClick={() => setActiveTab('master_config')}
                  className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 border border-amber-500/50 ${
                    activeTab === 'master_config'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-amber-400 hover:bg-amber-950/40'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Master Config & Template</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
