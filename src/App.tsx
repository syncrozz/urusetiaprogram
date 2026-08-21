import React, { useState, useEffect } from 'react';
import { secretariatStore } from './lib/storage';
import {
  Program,
  ProgramUnit,
  Person,
  MainCategory,
  ProgramTemplate,
  AuthSession,
  ActivityLog,
  UnitUpdate,
} from './types';
import { Navbar } from './components/common/Navbar';
import { MasterPinModal } from './components/master/MasterPinModal';
import { LeaderLoginModal } from './components/leader/LeaderLoginModal';
import { CreateProgramModal } from './components/admin/CreateProgramModal';
import { SecretariatReportModal } from './components/admin/SecretariatReportModal';
import { UnitDetailsModal } from './components/admin/UnitDetailsModal';
import { ProgramReadinessOverview } from './components/admin/ProgramReadinessOverview';
import { SOARCommandDashboard } from './components/soar/SOARCommandDashboard';
import { SOARRequirementsView } from './components/soar/SOARRequirementsView';
import { SOARSquadView } from './components/soar/SOARSquadView';
import { SOARTrainingView } from './components/soar/SOARTrainingView';
import { SOARLogisticsView } from './components/soar/SOARLogisticsView';
import { AssistanceHub } from './components/admin/AssistanceHub';
import { ProgramList } from './components/admin/ProgramList';
import { ProgramTimelineView } from './components/admin/ProgramTimelineView';
import { ActivityLogView } from './components/admin/ActivityLogView';
import { MasterAdminPanel } from './components/master/MasterAdminPanel';
import { KetuaUnitPortal } from './components/leader/KetuaUnitPortal';

export default function App() {
  const [storeState, setStoreState] = useState(secretariatStore.getState());
  const [activeTab, setActiveTab] = useState('readiness');

  // Modals state
  const [isMasterPinOpen, setIsMasterPinOpen] = useState(false);
  const [isLeaderLoginOpen, setIsLeaderLoginOpen] = useState(false);
  const [isCreateProgramOpen, setIsCreateProgramOpen] = useState(false);
  const [isSecretariatReportOpen, setIsSecretariatReportOpen] = useState(false);
  const [inspectedUnit, setInspectedUnit] = useState<ProgramUnit | null>(null);

  // Subscribe to storage updates
  useEffect(() => {
    const unsubscribe = secretariatStore.subscribe((newState) => {
      if (newState) {
        setStoreState({ ...newState });
      } else {
        setStoreState({ ...secretariatStore.getState() });
      }
    });
    return () => unsubscribe();
  }, []);

  const activeProgram =
    storeState.programs.find((p) => p.id === storeState.selectedProgramId) ||
    storeState.programs[0];

  // Count open assistance tickets safely
  const openAssistanceCount =
    activeProgram?.units && Array.isArray(activeProgram.units)
      ? activeProgram.units.filter((u) => u.assistanceStatus === 'OPEN').length
      : 0;

  // Handle unit inspection
  const handleInspectUnit = (unit: ProgramUnit) => {
    setInspectedUnit(unit);
  };

  // Find current unit for logged in Ketua Unit
  let ketuaUnitActiveUnit: ProgramUnit | undefined = undefined;
  if (storeState.authSession.role === 'KETUA_UNIT' && storeState.authSession.person) {
    const personId = storeState.authSession.person.id;
    // Find unit across programs or in current program
    ketuaUnitActiveUnit = activeProgram?.units?.find((u) => u.leaderId === personId);
    if (!ketuaUnitActiveUnit) {
      // Find in any program
      for (const prog of storeState.programs || []) {
        const u = prog.units?.find((unit) => unit.leaderId === personId);
        if (u) {
          ketuaUnitActiveUnit = u;
          break;
        }
      }
    }
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Universal Navbar */}
      <Navbar
        programs={storeState.programs}
        activeProgram={activeProgram}
        authSession={storeState.authSession}
        onOpenCreateProgram={() => setIsCreateProgramOpen(true)}
        onOpenMasterPin={() => setIsMasterPinOpen(true)}
        onOpenLeaderLogin={() => setIsLeaderLoginOpen(true)}
        onOpenSecretariatReport={() => setIsSecretariatReportOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAssistanceCount={openAssistanceCount}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {storeState.authSession.role === 'KETUA_UNIT' &&
        storeState.authSession.person &&
        ketuaUnitActiveUnit &&
        activeProgram ? (
          <KetuaUnitPortal
            program={activeProgram}
            unit={ketuaUnitActiveUnit}
            currentPerson={storeState.authSession.person}
            updates={storeState.updates || []}
            onBackToAdmin={() => secretariatStore.loginAsAdmin()}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 w-full min-w-0">
            {/* 1. 🏆 Tab: Acara & Kesediaan (Command Dashboard) */}
            {activeTab === 'readiness' && activeProgram && (
              <SOARCommandDashboard
                program={activeProgram}
                people={storeState.people}
                onInspectUnit={handleInspectUnit}
                onOpenAssistanceTab={() => setActiveTab('assistance')}
                onOpenRequirementsTab={() => setActiveTab('requirements')}
              />
            )}

            {/* 2. 👥 Tab: Pasukan & Peserta */}
            {activeTab === 'squad' && activeProgram && (
              <SOARSquadView
                program={activeProgram}
                people={storeState.people}
                onInspectUnit={handleInspectUnit}
                onOpenTrainingTab={() => setActiveTab('training')}
                onOpenMasterPin={() => setIsMasterPinOpen(true)}
              />
            )}

            {/* 3. 📅 Tab: Jadual & Latihan */}
            {activeTab === 'training' && activeProgram && (
              <SOARTrainingView
                program={activeProgram}
                people={storeState.people}
                onOpenSquadTab={() => setActiveTab('squad')}
                onOpenMasterPin={() => setIsMasterPinOpen(true)}
              />
            )}

            {/* 4. 📋 Tab: Keperluan & Syarat */}
            {activeTab === 'requirements' && activeProgram && (
              <SOARRequirementsView
                program={activeProgram}
                onInspectUnit={handleInspectUnit}
              />
            )}

            {/* 5. 🚌 Tab: Logistik & Pegawai */}
            {activeTab === 'logistics' && activeProgram && (
              <SOARLogisticsView
                program={activeProgram}
                people={storeState.people}
                onBackToDashboard={() => setActiveTab('readiness')}
              />
            )}

            {/* 6. 🚨 Tab: Bantuan & Isu */}
            {activeTab === 'assistance' && activeProgram && (
              <AssistanceHub
                program={activeProgram}
                onInspectUnit={handleInspectUnit}
              />
            )}

            {/* Admin Extra Tabs */}
            {activeTab === 'units' && activeProgram && (
              <ProgramReadinessOverview
                program={activeProgram}
                people={storeState.people}
                onInspectUnit={handleInspectUnit}
                onOpenAssistanceTab={() => setActiveTab('assistance')}
                onOpenSecretariatReport={() => setIsSecretariatReportOpen(true)}
              />
            )}

            {activeTab === 'programs' && (
              <ProgramList
                programs={storeState.programs}
                categories={storeState.categories}
                activeProgramId={activeProgram?.id}
                onSelectProgram={(id) => {
                  secretariatStore.setSelectedProgramId(id);
                  setActiveTab('readiness');
                }}
                onOpenCreateProgram={() => setIsCreateProgramOpen(true)}
              />
            )}

            {activeTab === 'timeline' && activeProgram && (
              <ProgramTimelineView program={activeProgram} />
            )}

            {activeTab === 'activity' && (
              <ActivityLogView logs={storeState.logs || []} />
            )}

            {activeTab === 'master_config' && (
              <MasterAdminPanel
                categories={storeState.categories}
                templates={storeState.templates}
                people={storeState.people}
                activeProgram={activeProgram}
                onLock={() => {
                  secretariatStore.loginAsAdmin();
                  setActiveTab('readiness');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Platform Footer — Kekalkan identiti Syncrozz pada bahagian footer sahaja */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              SOAR 2026 • Kolej Profesional MARA Bandar Penawar
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pusat Kawalan Kesiapsiagaan & Pengurusan 5 Acara Kontinjen
            </p>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
            <span>Dikuasakan oleh</span>
            <span className="font-bold tracking-widest font-mono text-indigo-600 dark:text-indigo-400 text-xs">
              SYNCROZZ
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <MasterPinModal
        isOpen={isMasterPinOpen}
        onClose={() => setIsMasterPinOpen(false)}
        onSuccess={() => setActiveTab('master_config')}
      />

      <LeaderLoginModal
        isOpen={isLeaderLoginOpen}
        onClose={() => setIsLeaderLoginOpen(false)}
        onSuccess={() => {}}
        people={storeState.people}
      />

      <CreateProgramModal
        isOpen={isCreateProgramOpen}
        onClose={() => setIsCreateProgramOpen(false)}
        categories={storeState.categories}
        templates={storeState.templates}
        people={storeState.people}
        onProgramCreated={(progId) => {
          secretariatStore.setSelectedProgramId(progId);
          setActiveTab('readiness');
        }}
      />

      {activeProgram && isSecretariatReportOpen && (
        <SecretariatReportModal
          isOpen={isSecretariatReportOpen}
          onClose={() => setIsSecretariatReportOpen(false)}
          program={activeProgram}
        />
      )}

      {activeProgram && inspectedUnit && (
        <UnitDetailsModal
          isOpen={!!inspectedUnit}
          onClose={() => setInspectedUnit(null)}
          program={activeProgram}
          unit={inspectedUnit}
          people={storeState.people}
        />
      )}
    </div>
  );
}
