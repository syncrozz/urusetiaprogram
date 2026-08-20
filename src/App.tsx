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

  // Count open assistance tickets
  const openAssistanceCount =
    activeProgram?.units.filter((u) => u.assistanceStatus === 'OPEN').length || 0;

  // Handle unit inspection
  const handleInspectUnit = (unit: ProgramUnit) => {
    setInspectedUnit(unit);
  };

  // Find current unit for logged in Ketua Unit
  let ketuaUnitActiveUnit: ProgramUnit | undefined = undefined;
  if (storeState.authSession.role === 'KETUA_UNIT' && storeState.authSession.person) {
    const personId = storeState.authSession.person.id;
    // Find unit across programs or in current program
    ketuaUnitActiveUnit = activeProgram?.units.find((u) => u.leaderId === personId);
    if (!ketuaUnitActiveUnit) {
      // Find in any program
      for (const prog of storeState.programs) {
        const u = prog.units.find((unit) => unit.leaderId === personId);
        if (u) {
          ketuaUnitActiveUnit = u;
          break;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
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
      <main className="flex-1">
        {storeState.authSession.role === 'KETUA_UNIT' &&
        storeState.authSession.person &&
        ketuaUnitActiveUnit &&
        activeProgram ? (
          <KetuaUnitPortal
            program={activeProgram}
            unit={ketuaUnitActiveUnit}
            currentPerson={storeState.authSession.person}
            updates={storeState.unitUpdates}
            onBackToAdmin={() => secretariatStore.loginAsAdmin()}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {activeTab === 'readiness' && activeProgram && (
              <ProgramReadinessOverview
                program={activeProgram}
                people={storeState.people}
                onInspectUnit={handleInspectUnit}
                onOpenAssistanceTab={() => setActiveTab('assistance')}
                onOpenSecretariatReport={() => setIsSecretariatReportOpen(true)}
              />
            )}

            {activeTab === 'units' && activeProgram && (
              <ProgramReadinessOverview
                program={activeProgram}
                people={storeState.people}
                onInspectUnit={handleInspectUnit}
                onOpenAssistanceTab={() => setActiveTab('assistance')}
                onOpenSecretariatReport={() => setIsSecretariatReportOpen(true)}
              />
            )}

            {activeTab === 'assistance' && activeProgram && (
              <AssistanceHub
                program={activeProgram}
                onInspectUnit={handleInspectUnit}
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
              <ActivityLogView logs={storeState.activityLogs} />
            )}

            {activeTab === 'master_config' && (
              <MasterAdminPanel
                categories={storeState.categories}
                templates={storeState.templates}
                onLock={() => {
                  secretariatStore.loginAsAdmin();
                  setActiveTab('readiness');
                }}
              />
            )}
          </div>
        )}
      </main>

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
