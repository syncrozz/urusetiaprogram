import React, { useState, useMemo } from 'react';
import {
  Program,
  ProgramUnit,
  Person,
  EventMembership,
  ParticipantProfile,
  CompetitionEventConfig,
  SelectionStatus,
  CompetitionRole,
} from '../../types';
import { secretariatStore } from '../../lib/storage';
import { IconRenderer } from '../common/IconRenderer';
import {
  Users,
  UserPlus,
  Filter,
  Search,
  CheckCircle2,
  Shield,
  Star,
  UserCheck,
  Briefcase,
  Wrench,
  Settings2,
  MoreVertical,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  Tag,
  Clock,
  X,
  Edit2,
  Trash2,
  Check,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface SOARSquadViewProps {
  program: Program;
  people: Person[];
  onInspectUnit?: (unit: ProgramUnit) => void;
  onOpenTrainingTab?: () => void;
  onOpenMasterPin?: () => void;
}

const SELECTION_STATUS_CONFIG: Record<
  SelectionStatus,
  { label: string; bg: string; text: string; border: string; dot: string; next?: SelectionStatus }
> = {
  TALENT_POOL: {
    label: 'Talent Pool',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
    next: 'AUDITION',
  },
  AUDITION: {
    label: 'Saringan / Audisi',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    next: 'SHORTLISTED',
  },
  SHORTLISTED: {
    label: 'Senarai Pendek',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    next: 'SELECTED',
  },
  SELECTED: {
    label: 'Terpilih (Selected)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    next: undefined,
  },
  RESERVE: {
    label: 'Simpanan (Reserve)',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    next: undefined,
  },
  WITHDRAWN: {
    label: 'Tarik Diri / Gugur',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
    next: undefined,
  },
};

const COMPETITION_ROLE_CONFIG: Record<
  CompetitionRole,
  { label: string; badge: string; icon: any }
> = {
  MAIN_PARTICIPANT: {
    label: 'Peserta Utama',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    icon: Star,
  },
  RESERVE_PARTICIPANT: {
    label: 'Peserta Simpanan',
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    icon: Shield,
  },
  COACH: {
    label: 'Jurulatih / Coach',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    icon: Award,
  },
  PIC: {
    label: 'Pengurus / PIC Acara',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    icon: Briefcase,
  },
  CREW: {
    label: 'Krew Sokongan',
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    icon: Wrench,
  },
};

export const SOARSquadView: React.FC<SOARSquadViewProps> = ({
  program,
  people,
  onInspectUnit,
  onOpenTrainingTab,
  onOpenMasterPin,
}) => {
  const storeState = secretariatStore.getState();
  const isAdmin =
    storeState.authSession.isMasterUnlocked === true ||
    storeState.authSession.role === 'MASTER_ADMIN';

  const [activeSubTab, setActiveSubTab] = useState<'by-event' | 'pipeline'>('by-event');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<SelectionStatus | 'ALL'>('ALL');
  const [roleFilter, setRoleFilter] = useState<CompetitionRole | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedEventId, setPreselectedEventId] = useState<string>('');
  const [editingMembership, setEditingMembership] = useState<{
    membership: EventMembership;
    person: Person;
    profile?: ParticipantProfile;
  } | null>(null);
  const [configuringUnit, setConfiguringUnit] = useState<ProgramUnit | null>(null);

  // Available SOAR Event units
  const soarUnits = program.units || [];

  // Current memberships enriched with Person and Profile
  const enrichedMemberships = useMemo(() => {
    const mems = storeState.eventMemberships || [];
    const profiles = storeState.participantProfiles || [];
    const peopleList = storeState.people || [];

    return mems
      .map((m) => {
        const person = peopleList.find((p) => p.id === m.personId);
        const profile = profiles.find((p) => p.personId === m.personId);
        const unit = soarUnits.find((u) => u.id === m.eventId);
        return {
          ...m,
          person,
          profile,
          unit,
        };
      })
      .filter((item) => item.person !== undefined);
  }, [storeState.eventMemberships, storeState.participantProfiles, storeState.people, soarUnits]);

  // Filtered memberships
  const filteredMemberships = useMemo(() => {
    return enrichedMemberships.filter((m) => {
      // Event filter
      if (selectedEventId !== 'ALL' && m.eventId !== selectedEventId) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && m.selectionStatus !== statusFilter) {
        return false;
      }
      // Role filter
      if (roleFilter !== 'ALL' && m.role !== roleFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = m.person?.fullName?.toLowerCase() || '';
        const pId = m.person?.studentId?.toLowerCase() || '';
        const pIc = m.person?.icLast4?.toLowerCase() || '';
        const uName = m.unit?.name?.toLowerCase() || '';
        const skills = (m.profile?.talentSkills || []).join(' ').toLowerCase();
        return pName.includes(q) || pId.includes(q) || pIc.includes(q) || uName.includes(q) || skills.includes(q);
      }
      return true;
    });
  }, [enrichedMemberships, selectedEventId, statusFilter, roleFilter, searchQuery]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = enrichedMemberships.length;
    const main = enrichedMemberships.filter((m) => m.role === 'MAIN_PARTICIPANT').length;
    const reserve = enrichedMemberships.filter((m) => m.role === 'RESERVE_PARTICIPANT').length;
    const selected = enrichedMemberships.filter((m) => m.selectionStatus === 'SELECTED').length;
    const talentPool = enrichedMemberships.filter((m) => m.selectionStatus === 'TALENT_POOL').length;
    const coachOrPic = enrichedMemberships.filter((m) => m.role === 'COACH' || m.role === 'PIC').length;

    return { total, main, reserve, selected, talentPool, coachOrPic };
  }, [enrichedMemberships]);

  const handleOpenAddModal = (eventId?: string) => {
    if (!isAdmin) {
      if (onOpenMasterPin) {
        onOpenMasterPin();
      }
      return;
    }
    setPreselectedEventId(eventId || (soarUnits[0]?.id ?? ''));
    setIsAddModalOpen(true);
  };

  const handleOpenConfiguringUnit = (unit: ProgramUnit) => {
    if (!isAdmin) {
      if (onOpenMasterPin) {
        onOpenMasterPin();
      }
      return;
    }
    setConfiguringUnit(unit);
  };

  const handleOpenEditMembership = (data: {
    membership: EventMembership;
    person: Person;
    profile?: ParticipantProfile;
  }) => {
    if (!isAdmin) {
      if (onOpenMasterPin) {
        onOpenMasterPin();
      }
      return;
    }
    setEditingMembership(data);
  };

  const handleAdvanceStatus = (membershipId: string, currentStatus: SelectionStatus) => {
    if (!isAdmin) {
      if (onOpenMasterPin) {
        onOpenMasterPin();
      }
      return;
    }
    const next = SELECTION_STATUS_CONFIG[currentStatus]?.next;
    if (next) {
      secretariatStore.updateEventMembership(membershipId, { selectionStatus: next });
    }
  };

  const handleDeleteMembership = (membershipId: string, personName: string) => {
    if (!isAdmin) {
      if (onOpenMasterPin) {
        onOpenMasterPin();
      }
      return;
    }
    if (confirm(`Adakah anda pasti ingin mengeluarkan ${personName} daripada acara ini?`)) {
      secretariatStore.removeEventMembership(membershipId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Pengurusan Pasukan & Peserta SOAR 2026
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Pangkalan bakat, saringan pemilihan rasmi, watak utama, pemuzik, penari dan barisan simpanan.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenAddModal()}
              id="btn-register-participant-squad"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-95 ${
                isAdmin
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-400/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title={!isAdmin ? 'Akses Admin Diperlukan (Gunakan butang Akses Admin di Navbar)' : 'Daftar / Tambah Peserta Baru'}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar / Tambah Peserta</span>
              {!isAdmin && <Lock className="w-3.5 h-3.5 opacity-60 ml-0.5" />}
            </button>

            {onOpenTrainingTab && (
              <button
                onClick={onOpenTrainingTab}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Lihat Jadual Latihan</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/80">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jumlah Peserta</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Peserta Utama</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.main}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
            <div className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Peserta Simpanan</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">{stats.reserve}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
            <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Status Terpilih</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">{stats.selected}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Talent Pool / Audisi</div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">{stats.talentPool}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
            <div className="text-xs text-purple-700 dark:text-purple-400 font-medium">Jurulatih & PIC</div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-0.5">{stats.coachOrPic}</div>
          </div>
        </div>

        {/* 3. Sub-Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mt-6 pt-2">
          <button
            onClick={() => setActiveSubTab('by-event')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeSubTab === 'by-event'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Paparan Mengikut Acara (5 Acara)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeSubTab === 'pipeline'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Pipeline Pemilihan & Direktori Peserta</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: BY EVENT VIEW */}
      {activeSubTab === 'by-event' && (
        <div className="space-y-6">
          {/* Event Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedEventId('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedEventId === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Semua Acara ({soarUnits.length})
            </button>
            {soarUnits.map((u) => {
              const count = enrichedMemberships.filter((m) => m.eventId === u.id).length;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedEventId(u.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedEventId === u.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{u.name}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Render event cards / squads */}
          <div className="space-y-6">
            {soarUnits
              .filter((u) => selectedEventId === 'ALL' || u.id === selectedEventId)
              .map((unit) => {
                const unitMems = enrichedMemberships.filter((m) => m.eventId === unit.id);
                const mainMems = unitMems.filter((m) => m.role === 'MAIN_PARTICIPANT');
                const reserveMems = unitMems.filter((m) => m.role === 'RESERVE_PARTICIPANT');
                const leadershipMems = unitMems.filter((m) => m.role === 'COACH' || m.role === 'PIC');
                const crewMems = unitMems.filter((m) => m.role === 'CREW');

                const eventConfig = (storeState.competitionEventConfigs || []).find(
                  (c) => c.programUnitId === unit.id
                );

                const picPerson = unit.leaderId
                  ? storeState.people.find((p) => p.id === unit.leaderId)
                  : eventConfig?.picPersonId
                  ? storeState.people.find((p) => p.id === eventConfig.picPersonId)
                  : null;

                const coachPerson = eventConfig?.coachPersonId
                  ? storeState.people.find((p) => p.id === eventConfig.coachPersonId)
                  : null;

                const quotaMainText = eventConfig?.quotaMain ? `${eventConfig.quotaMain} orang` : 'Belum ditetapkan';
                const quotaReserveText = eventConfig?.quotaReserve ? `${eventConfig.quotaReserve} orang` : 'Belum ditetapkan';

                return (
                  <div
                    key={unit.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    {/* Event Header Banner */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
                            <IconRenderer iconName={unit.icon} className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{unit.name}</h2>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                {unitMems.length} Ahli
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                              {unit.description}
                            </p>
                          </div>
                        </div>

                        {/* Event Config Quick Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleOpenAddModal(unit.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
                              isAdmin
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Tambah Peserta</span>
                          </button>
                          <button
                            onClick={() => handleOpenConfiguringUnit(unit)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
                              isAdmin
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                            title={isAdmin ? '✏️ Konfigurasi Jurulatih, PIC & Kuota Acara (Admin Aktif)' : 'Konfigurasi Jurulatih, PIC & Kuota'}
                          >
                            {isAdmin ? <Edit2 className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
                            <span>{isAdmin ? '✏️ Tetapan Acara & Kuota' : 'Tetapan Acara'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Event Meta Pills (PIC, Coach, Quota) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">PIC:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {picPerson ? picPerson.fullName : 'Belum ditetapkan'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">Coach:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {coachPerson ? coachPerson.fullName : 'Belum ditetapkan'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">Kuota Utama:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {mainMems.length} / {quotaMainText}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">Kuota Simpanan:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {reserveMems.length} / {quotaReserveText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Squad Members List Grouped by Roles */}
                    <div className="p-4 sm:p-5 space-y-5">
                      {unitMems.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                            Belum ada peserta didaftarkan untuk acara {unit.name}.
                          </p>
                          <button
                            onClick={() => handleOpenAddModal(unit.id)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-600 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Daftar Peserta Sekarang</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* 1. Barisan Peserta Utama */}
                          {mainMems.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                  <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                                  <span>Barisan Peserta Utama ({mainMems.length})</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {mainMems.map((m) => (
                                  <SquadMemberCard
                                    key={m.id}
                                    item={m}
                                    isAdmin={isAdmin}
                                    onEdit={() =>
                                      handleOpenEditMembership({
                                        membership: m,
                                        person: m.person!,
                                        profile: m.profile,
                                      })
                                    }
                                    onAdvance={() => handleAdvanceStatus(m.id, m.selectionStatus)}
                                    onDelete={() => handleDeleteMembership(m.id, m.person?.fullName || 'Peserta')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 2. Barisan Peserta Simpanan */}
                          {reserveMems.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Barisan Peserta Simpanan ({reserveMems.length})</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {reserveMems.map((m) => (
                                  <SquadMemberCard
                                    key={m.id}
                                    item={m}
                                    isAdmin={isAdmin}
                                    onEdit={() =>
                                      handleOpenEditMembership({
                                        membership: m,
                                        person: m.person!,
                                        profile: m.profile,
                                      })
                                    }
                                    onAdvance={() => handleAdvanceStatus(m.id, m.selectionStatus)}
                                    onDelete={() => handleDeleteMembership(m.id, m.person?.fullName || 'Peserta')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 3. Jurulatih, PIC & Krew Sokongan */}
                          {(leadershipMems.length > 0 || crewMems.length > 0) && (
                            <div>
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                  <Award className="w-3.5 h-3.5 text-purple-500" />
                                  <span>Pegawai, Jurulatih & Krew ({leadershipMems.length + crewMems.length})</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[...leadershipMems, ...crewMems].map((m) => (
                                  <SquadMemberCard
                                    key={m.id}
                                    item={m}
                                    isAdmin={isAdmin}
                                    onEdit={() =>
                                      handleOpenEditMembership({
                                        membership: m,
                                        person: m.person!,
                                        profile: m.profile,
                                      })
                                    }
                                    onAdvance={() => handleAdvanceStatus(m.id, m.selectionStatus)}
                                    onDelete={() => handleDeleteMembership(m.id, m.person?.fullName || 'Peserta')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PIPELINE & ALL PARTICIPANTS DIRECTORY */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-5">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, ID pelajar, bakat atau acara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Event Filter */}
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">Semua Acara</option>
                {soarUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SelectionStatus | 'ALL')}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">Semua Status Pipeline</option>
                <option value="TALENT_POOL">Talent Pool</option>
                <option value="AUDITION">Saringan / Audisi</option>
                <option value="SHORTLISTED">Senarai Pendek</option>
                <option value="SELECTED">Terpilih (Selected)</option>
                <option value="RESERVE">Simpanan (Reserve)</option>
                <option value="WITHDRAWN">Tarik Diri / Gugur</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as CompetitionRole | 'ALL')}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">Semua Peranan</option>
                <option value="MAIN_PARTICIPANT">Peserta Utama</option>
                <option value="RESERVE_PARTICIPANT">Peserta Simpanan</option>
                <option value="COACH">Jurulatih / Coach</option>
                <option value="PIC">Pengurus / PIC</option>
                <option value="CREW">Krew</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('board')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    viewMode === 'board'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pipeline Board
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Senarai Jadual
                </button>
              </div>
            </div>
          </div>

          {/* PIPELINE BOARD VIEW */}
          {viewMode === 'board' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {(
                ['TALENT_POOL', 'AUDITION', 'SHORTLISTED', 'SELECTED'] as SelectionStatus[]
              ).map((statusKey) => {
                const conf = SELECTION_STATUS_CONFIG[statusKey];
                const stageMems = filteredMemberships.filter((m) => m.selectionStatus === statusKey);

                return (
                  <div
                    key={statusKey}
                    className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col min-h-[350px]"
                  >
                    {/* Stage Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${conf.dot}`} />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {conf.label}
                        </h3>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {stageMems.length}
                      </span>
                    </div>

                    {/* Stage Items */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[580px] pr-0.5">
                      {stageMems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">Tiada calon pada tahap ini</div>
                      ) : (
                        stageMems.map((m) => (
                          <div
                            key={m.id}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs hover:border-amber-500/50 transition-all text-xs group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {m.person?.fullName}
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${
                                  COMPETITION_ROLE_CONFIG[m.role].badge
                                }`}
                              >
                                {COMPETITION_ROLE_CONFIG[m.role].label}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                              <span>{m.person?.studentId || 'Tiada ID'}</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium truncate max-w-[120px]">
                                {m.unit?.name}
                              </span>
                            </div>

                            {/* Skills Tag Pills */}
                            {m.profile?.talentSkills && m.profile.talentSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {m.profile.talentSkills.slice(0, 2).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {m.profile.talentSkills.length > 2 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{m.profile.talentSkills.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Pipeline Quick Action Footer */}
                            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800">
                              <button
                                onClick={() =>
                                  handleOpenEditMembership({
                                    membership: m,
                                    person: m.person!,
                                    profile: m.profile,
                                  })
                                }
                                className={`text-[11px] font-semibold flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                                  isAdmin
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                {isAdmin ? <Edit2 className="w-3 h-3" /> : <Lock className="w-2.5 h-2.5 opacity-60" />}
                                <span>{isAdmin ? '✏️ Sunting' : 'Perincian'}</span>
                              </button>

                              {conf.next && (
                                <button
                                  onClick={() => handleAdvanceStatus(m.id, m.selectionStatus)}
                                  className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                                    isAdmin
                                      ? 'text-amber-700 dark:text-amber-300 bg-amber-500/20 hover:bg-amber-500/30'
                                      : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                                  }`}
                                >
                                  <span>Naik: {SELECTION_STATUS_CONFIG[conf.next].label}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE LIST VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nama Peserta</th>
                      <th className="py-3 px-4">Acara Pertandingan</th>
                      <th className="py-3 px-4">Peranan</th>
                      <th className="py-3 px-4">Status Pemilihan</th>
                      <th className="py-3 px-4">Bakat / Kemahiran</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMemberships.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tiada rekod peserta yang sepadan dengan tapisan.
                        </td>
                      </tr>
                    ) : (
                      filteredMemberships.map((m) => {
                        const statusConf = SELECTION_STATUS_CONFIG[m.selectionStatus];
                        const roleConf = COMPETITION_ROLE_CONFIG[m.role];
                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {m.person?.fullName}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                ID: {m.person?.studentId || '-'} • IC: {m.person?.icLast4 || '-'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                              {m.unit?.name || 'Belum ditetapkan'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConf.badge}`}
                              >
                                {roleConf.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                                {statusConf.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {m.profile?.talentSkills && m.profile.talentSkills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {m.profile.talentSkills.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[11px]"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() =>
                                  handleOpenEditMembership({
                                    membership: m,
                                    person: m.person!,
                                    profile: m.profile,
                                  })
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                  isAdmin
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                                title={isAdmin ? '✏️ Klik untuk ubah / kemaskini peserta (Admin Aktif)' : 'Kemaskini (Akses Admin Diperlukan)'}
                              >
                                {isAdmin ? <Edit2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-slate-400" />}
                                <span>{isAdmin ? '✏️ Sunting' : 'Kemaskini'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD PARTICIPANT MODAL */}
      {isAddModalOpen && (
        <AddParticipantModal
          program={program}
          people={people}
          defaultEventId={preselectedEventId}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* MODAL 2: EDIT MEMBERSHIP MODAL */}
      {editingMembership && (
        <EditMembershipModal
          data={editingMembership}
          units={soarUnits}
          onClose={() => setEditingMembership(null)}
        />
      )}

      {/* MODAL 3: CONFIGURE EVENT MODAL */}
      {configuringUnit && (
        <ConfigureEventModal
          unit={configuringUnit}
          people={people}
          onClose={() => setConfiguringUnit(null)}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENT: SQUAD MEMBER CARD ---
interface SquadMemberCardProps {
  item: {
    id: string;
    person?: Person;
    profile?: ParticipantProfile;
    unit?: ProgramUnit;
    role: CompetitionRole;
    selectionStatus: SelectionStatus;
    remarks?: string;
  };
  isAdmin?: boolean;
  onEdit: () => void;
  onAdvance: () => void;
  onDelete: () => void;
}

const SquadMemberCard: React.FC<SquadMemberCardProps> = ({ item, isAdmin = false, onEdit, onAdvance, onDelete }) => {
  const statusConf = SELECTION_STATUS_CONFIG[item.selectionStatus];
  const roleConf = COMPETITION_ROLE_CONFIG[item.role];

  return (
    <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
      isAdmin 
        ? 'bg-white dark:bg-slate-900 border-amber-500/30 hover:border-amber-500 hover:shadow-md' 
        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
    }`}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 ${
              isAdmin 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {item.person?.fullName?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span>{item.person?.fullName}</span>
                {isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    Sedia Diubah
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ID: {item.person?.studentId || '-'} • IC: {item.person?.icLast4 || '-'}
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
          >
            {statusConf.label}
          </span>
        </div>

        {/* Skills / Notes */}
        {item.profile?.talentSkills && item.profile.talentSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {item.profile.talentSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px]"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {item.remarks && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1 italic">
            "{item.remarks}"
          </p>
        )}
      </div>

      {/* Footer Actions with Active Pencil Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            id={`edit-member-btn-${item.id}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs active:scale-95 ${
              isAdmin
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-1 ring-amber-400/50'
                : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title={isAdmin ? '✏️ Klik untuk ubah & sunting peserta (Admin Aktif)' : '🔒 Akses Admin Diperlukan (PIN)'}
          >
            {isAdmin ? <Edit2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-slate-400" />}
            <span>{isAdmin ? '✏️ Sunting' : 'Sunting'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium transition"
              title="Gugurkan peserta daripada acara ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Gugur</span>
            </button>
          )}
        </div>

        {statusConf.next && (
          <button
            onClick={onAdvance}
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
              isAdmin
                ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
            title={isAdmin ? `Naik status ke ${SELECTION_STATUS_CONFIG[statusConf.next].label}` : 'Akses Admin Diperlukan'}
          >
            <span>{SELECTION_STATUS_CONFIG[statusConf.next].label}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// --- MODAL: ADD PARTICIPANT ---
interface AddParticipantModalProps {
  program: Program;
  people: Person[];
  defaultEventId?: string;
  onClose: () => void;
}

const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  program,
  people,
  defaultEventId,
  onClose,
}) => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [eventId, setEventId] = useState<string>(defaultEventId || (program.units[0]?.id ?? ''));
  const [role, setRole] = useState<CompetitionRole>('MAIN_PARTICIPANT');
  const [selectionStatus, setSelectionStatus] = useState<SelectionStatus>('TALENT_POOL');
  const [skillsInput, setSkillsInput] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // New person fields
  const [newFullName, setNewFullName] = useState<string>('');
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [newIcNumber, setNewIcNumber] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newProgramStudy, setNewProgramStudy] = useState<string>('Diploma Pengurusan Acara');
  const [newSemester, setNewSemester] = useState<string>('Semester 3');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (mode === 'existing') {
      if (!selectedPersonId) {
        alert('Sila pilih individu daripada senarai.');
        return;
      }
      secretariatStore.addParticipantToEvent({
        personId: selectedPersonId,
        eventId,
        role,
        selectionStatus,
        skills,
        remarks,
      });
    } else {
      if (!newFullName.trim() || !newStudentId.trim()) {
        alert('Sila lengkapkan nama penuh dan nombor ID pelajar.');
        return;
      }
      const icClean = newIcNumber.replace(/[^0-9]/g, '');
      const icLast4 = icClean.length >= 4 ? icClean.slice(-4) : '0000';

      secretariatStore.createAndAddParticipant({
        personData: {
          fullName: newFullName.trim(),
          studentId: newStudentId.trim(),
          icNumber: newIcNumber.trim() || undefined,
          icLast4,
          phone: newPhone.trim() || '012-0000000',
          email: newEmail.trim() || `${newStudentId.toLowerCase()}@siswa.kpm.edu.my`,
          programStudy: newProgramStudy,
          semester: newSemester,
          department: 'Kontinjen SOAR 2026',
        },
        eventId,
        role,
        selectionStatus,
        skills,
        remarks,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              Daftar / Tambah Peserta Acara
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {/* Toggle Existing vs New Person */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex-1 py-1.5 font-semibold text-xs rounded-lg transition-colors ${
                mode === 'existing'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Pilih Dari Direktori Pelajar
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-1.5 font-semibold text-xs rounded-lg transition-colors ${
                mode === 'new'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Daftar Pelajar Baharu
            </button>
          </div>

          {/* MODE A: EXISTING PERSON */}
          {mode === 'existing' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Pelajar / Individu
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                required
              >
                <option value="">-- Pilih daripada Direktori --</option>
                {people
                  .filter((p) => p.role !== 'ADMIN')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.studentId} - {p.programStudy || 'Siswa'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* MODE B: NEW PERSON FORM */}
          {mode === 'new' && (
            <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penuh Pelajar *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Muhammad Amirul bin Roslan"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. ID Pelajar / Matrik *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: B032210450"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Kad Pengenalan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 040512-01-5313"
                    value={newIcNumber}
                    onChange={(e) => setNewIcNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Telefon
                  </label>
                  <input
                    type="text"
                    placeholder="012-3456789"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    placeholder="Semester 3"
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Target Event Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Acara SOAR 2026 *
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              required
            >
              {program.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role & Selection Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peranan Dalam Pasukan *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CompetitionRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              >
                <option value="MAIN_PARTICIPANT">Peserta Utama</option>
                <option value="RESERVE_PARTICIPANT">Peserta Simpanan</option>
                <option value="COACH">Jurulatih / Coach</option>
                <option value="PIC">Pengurus / PIC Acara</option>
                <option value="CREW">Krew Sokongan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Pemilihan *
              </label>
              <select
                value={selectionStatus}
                onChange={(e) => setSelectionStatus(e.target.value as SelectionStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              >
                <option value="TALENT_POOL">Talent Pool</option>
                <option value="AUDITION">Saringan / Audisi</option>
                <option value="SHORTLISTED">Senarai Pendek</option>
                <option value="SELECTED">Terpilih (Selected)</option>
                <option value="RESERVE">Simpanan (Reserve)</option>
                <option value="WITHDRAWN">Tarik Diri / Gugur</option>
              </select>
            </div>
          </div>

          {/* Skills / Talents */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bakat / Kemahiran Khusus (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              placeholder="Contoh: Vokal Utama, Gambus, Zapin Tenglu, Monolog"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Ringkas
            </label>
            <textarea
              rows={2}
              placeholder="Pengalaman pentas atau tugasan spesifik..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold shadow-sm transition-all"
            >
              Simpan & Daftar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL: EDIT MEMBERSHIP ---
interface EditMembershipModalProps {
  data: {
    membership: EventMembership;
    person: Person;
    profile?: ParticipantProfile;
  };
  units: ProgramUnit[];
  onClose: () => void;
}

const EditMembershipModal: React.FC<EditMembershipModalProps> = ({ data, units, onClose }) => {
  const [role, setRole] = useState<CompetitionRole>(data.membership.role);
  const [selectionStatus, setSelectionStatus] = useState<SelectionStatus>(data.membership.selectionStatus);
  const [eventId, setEventId] = useState<string>(data.membership.eventId);
  const [skillsInput, setSkillsInput] = useState<string>(
    (data.profile?.talentSkills || []).join(', ')
  );
  const [remarks, setRemarks] = useState<string>(data.membership.remarks || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    secretariatStore.updateEventMembership(data.membership.id, {
      role,
      selectionStatus,
      eventId,
      remarks,
    });

    secretariatStore.updateParticipantProfile(data.person.id, {
      talentSkills: skills,
      experienceNotes: remarks,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              Kemaskini Status Peserta
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{data.person.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Acara Pertandingan
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peranan
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CompetitionRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="MAIN_PARTICIPANT">Peserta Utama</option>
                <option value="RESERVE_PARTICIPANT">Peserta Simpanan</option>
                <option value="COACH">Jurulatih / Coach</option>
                <option value="PIC">Pengurus / PIC</option>
                <option value="CREW">Krew</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Pemilihan
              </label>
              <select
                value={selectionStatus}
                onChange={(e) => setSelectionStatus(e.target.value as SelectionStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="TALENT_POOL">Talent Pool</option>
                <option value="AUDITION">Saringan / Audisi</option>
                <option value="SHORTLISTED">Senarai Pendek</option>
                <option value="SELECTED">Terpilih (Selected)</option>
                <option value="RESERVE">Simpanan (Reserve)</option>
                <option value="WITHDRAWN">Tarik Diri / Gugur</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kemahiran / Bakat
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold shadow-sm transition-all"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL: CONFIGURE EVENT (PIC, COACH, QUOTA) ---
interface ConfigureEventModalProps {
  unit: ProgramUnit;
  people: Person[];
  onClose: () => void;
}

const ConfigureEventModal: React.FC<ConfigureEventModalProps> = ({ unit, people, onClose }) => {
  const storeState = secretariatStore.getState();
  const existingConfig = (storeState.competitionEventConfigs || []).find(
    (c) => c.programUnitId === unit.id
  );

  const [picPersonId, setPicPersonId] = useState<string>(
    unit.leaderId || existingConfig?.picPersonId || ''
  );
  const [coachPersonId, setCoachPersonId] = useState<string>(
    existingConfig?.coachPersonId || ''
  );
  const [quotaMain, setQuotaMain] = useState<number>(existingConfig?.quotaMain || 0);
  const [quotaReserve, setQuotaReserve] = useState<number>(existingConfig?.quotaReserve || 0);
  const [submissionDeadline, setSubmissionDeadline] = useState<string>(
    existingConfig?.submissionDeadline || '2026-09-05'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update unit leader if pic selected
    if (picPersonId) {
      secretariatStore.assignUnitLeader(unit.id, picPersonId);
    }

    // 2. Update competition event config
    secretariatStore.updateCompetitionEventConfig({
      programUnitId: unit.id,
      picPersonId: picPersonId || undefined,
      coachPersonId: coachPersonId || undefined,
      quotaMain: Number(quotaMain) || 0,
      quotaReserve: Number(quotaReserve) || 0,
      submissionDeadline,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              Tetapan Acara: {unit.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Penetapan Pegawai (PIC), Jurulatih & Had Kuota Peserta.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pengurus Acara / PIC
            </label>
            <select
              value={picPersonId}
              onChange={(e) => setPicPersonId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Belum ditetapkan --</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.studentId || p.position || 'Staf/Pelajar'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jurulatih / Coach Acara
            </label>
            <select
              value={coachPersonId}
              onChange={(e) => setCoachPersonId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Belum ditetapkan --</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.studentId || p.position || 'Staf/Pelajar'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kuota Peserta Utama (Orang)
              </label>
              <input
                type="number"
                min="0"
                value={quotaMain}
                onChange={(e) => setQuotaMain(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kuota Simpanan (Orang)
              </label>
              <input
                type="number"
                min="0"
                value={quotaReserve}
                onChange={(e) => setQuotaReserve(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tarikh Akhir Penyerahan Dokumen/Borang
            </label>
            <input
              type="date"
              value={submissionDeadline}
              onChange={(e) => setSubmissionDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold shadow-sm transition-all"
            >
              Simpan Tetapan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
