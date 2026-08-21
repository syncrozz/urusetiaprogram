import React, { useState, useMemo } from 'react';
import {
  Program,
  ProgramUnit,
  Person,
  TrainingSession,
  TrainingAttendanceLog,
  EventMembership,
} from '../../types';
import { secretariatStore } from '../../lib/storage';
import { formatDate } from '../../lib/utils';
import { IconRenderer } from '../common/IconRenderer';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Users,
  Award,
  BookOpen,
  Edit2,
  Trash2,
  ChevronRight,
  Check,
  X,
  FileText,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  Lock,
  KeyRound,
} from 'lucide-react';

interface SOARTrainingViewProps {
  program: Program;
  people: Person[];
  onOpenSquadTab?: () => void;
  onOpenMasterPin?: () => void;
}

const SESSION_STATUS_CONFIG = {
  SCHEDULED: {
    label: 'Terjadual (Scheduled)',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Clock,
  },
  COMPLETED: {
    label: 'Selesai (Completed)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Dibatalkan (Cancelled)',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
};

export const SOARTrainingView: React.FC<SOARTrainingViewProps> = ({
  program,
  people,
  onOpenSquadTab,
  onOpenMasterPin,
}) => {
  const storeState = secretariatStore.getState();
  const isAdmin =
    storeState.authSession.isMasterUnlocked === true ||
    storeState.authSession.role === 'MASTER_ADMIN';

  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [activeAttendanceSession, setActiveAttendanceSession] = useState<TrainingSession | null>(null);

  const soarUnits = program.units || [];
  const trainingSessions = storeState.trainingSessions || [];
  const attendanceLogs = storeState.trainingAttendanceLogs || [];
  const eventMemberships = storeState.eventMemberships || [];
  const competitionConfigs = storeState.competitionEventConfigs || [];

  // Filtered Training Sessions
  const filteredSessions = useMemo(() => {
    return trainingSessions
      .filter((s) => {
        if (s.programId && s.programId !== program.id) return false;
        if (selectedEventId !== 'ALL' && s.eventId !== selectedEventId) return false;
        if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const uName = soarUnits.find((u) => u.id === s.eventId)?.name.toLowerCase() || '';
          return (
            s.focusArea.toLowerCase().includes(q) ||
            s.venue.toLowerCase().includes(q) ||
            uName.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  }, [trainingSessions, program.id, selectedEventId, statusFilter, searchQuery, soarUnits]);

  // High-level statistics
  const stats = useMemo(() => {
    const total = trainingSessions.length;
    const completed = trainingSessions.filter((s) => s.status === 'COMPLETED').length;
    const scheduled = trainingSessions.filter((s) => s.status === 'SCHEDULED').length;
    const totalLogs = attendanceLogs.length;
    const presentLogs = attendanceLogs.filter((l) => l.isPresent).length;
    const attendanceRate = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0;

    return { total, completed, scheduled, attendanceRate, totalLogs, presentLogs };
  }, [trainingSessions, attendanceLogs]);

  const handleOpenCreateModal = () => {
    if (!isAdmin) {
      if (onOpenMasterPin) onOpenMasterPin();
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleOpenEditSession = (session: TrainingSession) => {
    if (!isAdmin) {
      if (onOpenMasterPin) onOpenMasterPin();
      return;
    }
    setEditingSession(session);
  };

  const handleOpenAttendance = (session: TrainingSession) => {
    if (!isAdmin) {
      if (onOpenMasterPin) onOpenMasterPin();
      return;
    }
    setActiveAttendanceSession(session);
  };

  const handleDeleteSession = (session: TrainingSession) => {
    if (!isAdmin) {
      if (onOpenMasterPin) onOpenMasterPin();
      return;
    }
    if (confirm(`Adakah anda pasti ingin memadam sesi latihan "${session.focusArea}" pada ${session.date}?`)) {
      secretariatStore.deleteTrainingSession(session.id);
    }
  };

  const handleQuickStatusChange = (session: TrainingSession, newStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
    if (!isAdmin) {
      if (onOpenMasterPin) onOpenMasterPin();
      return;
    }
    secretariatStore.updateTrainingSession(session.id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Jadual Latihan & Kehadiran SOAR 2026
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Perancangan sesi latihan berjadual, semakan kehadiran ahli kontinjen dan log catatan jurulatih.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              id="btn-schedule-training-top"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-95 ${
                isAdmin
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-400/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title={!isAdmin ? 'Akses Admin Diperlukan' : 'Jadualkan Sesi Latihan'}
            >
              <Plus className="w-4 h-4" />
              <span>Jadualkan Sesi Latihan</span>
              {!isAdmin && <Lock className="w-3.5 h-3.5 opacity-60 ml-0.5" />}
            </button>

            {onOpenSquadTab && (
              <button
                onClick={onOpenSquadTab}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
              >
                <Users className="w-4 h-4 text-amber-500" />
                <span>Senarai Peserta & Pasukan</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/80">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jumlah Sesi Dijadual</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Sesi Selesai</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.completed}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
            <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Sesi Akan Datang</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">{stats.scheduled}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Kadar Kehadiran</div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
              {stats.totalLogs > 0 ? `${stats.attendanceRate}%` : 'Belum direkod'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari fokus latihan, lokasi atau acara..."
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

        {/* Filters */}
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
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Status Sesi</option>
            <option value="SCHEDULED">Terjadual (Scheduled)</option>
            <option value="COMPLETED">Selesai (Completed)</option>
            <option value="CANCELLED">Dibatalkan (Cancelled)</option>
          </select>
        </div>
      </div>

      {/* 4. Training Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Tiada Sesi Latihan Dijumpai
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Belum ada jadual sesi latihan direkodkan untuk kriteria tapisan ini.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jadualkan Sesi Pertama</span>
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const unit = soarUnits.find((u) => u.id === session.eventId);
            const statusConf = SESSION_STATUS_CONFIG[session.status];
            const StatusIcon = statusConf.icon;

            const unitMembers = eventMemberships.filter((m) => m.eventId === session.eventId);
            const sessionLogs = attendanceLogs.filter((l) => l.trainingSessionId === session.id);
            const presentCount = sessionLogs.filter((l) => l.isPresent).length;

            const eventConfig = competitionConfigs.find((c) => c.programUnitId === session.eventId);
            const coachPerson = eventConfig?.coachPersonId
              ? people.find((p) => p.id === eventConfig.coachPersonId)
              : null;

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Date & Core Details */}
                <div className="flex items-start gap-4">
                  {/* Date Badge Box */}
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex flex-col items-center justify-center flex-shrink-0 font-bold">
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {new Date(session.date).toLocaleDateString('ms-MY', { month: 'short' })}
                    </span>
                    <span className="text-lg leading-tight font-extrabold">
                      {new Date(session.date).getDate()}
                    </span>
                  </div>

                  <div>
                    {/* Event & Status Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {unit?.icon && <IconRenderer iconName={unit.icon} className="w-3.5 h-3.5" />}
                        <span>{unit?.name || 'Acara'}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusConf.label}</span>
                      </span>
                    </div>

                    {/* Focus Area Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {session.focusArea}
                    </h3>

                    {/* Meta info (Time, Venue, Coach) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{session.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-500" />
                        <span>Jurulatih: {coachPerson ? coachPerson.fullName : 'Belum ditetapkan'}</span>
                      </div>
                    </div>

                    {/* Coach Notes Preview if exists */}
                    {session.coachNotes && (
                      <div className="mt-2.5 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-300 italic flex items-start gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">Catatan Coach: {session.coachNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Attendance Summary & Action Buttons */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Attendance Stats Badge */}
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kehadiran Pasukan</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {sessionLogs.length > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {presentCount} / {sessionLogs.length} Hadir (
                          {Math.round((presentCount / sessionLogs.length) * 100)}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum diambil ({unitMembers.length} ahli)</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAttendance(session)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs shadow-xs transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{sessionLogs.length > 0 ? 'Kemaskini Kehadiran' : 'Ambil Kehadiran'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditSession(session)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        isAdmin
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                      title={isAdmin ? '✏️ Klik untuk sunting sesi latihan (Admin Aktif)' : 'Sunting Sesi Latihan (Akses Admin Diperlukan)'}
                    >
                      {isAdmin ? <Edit2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{isAdmin ? '✏️ Sunting' : 'Sunting'}</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteSession(session)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-600 text-xs transition-colors active:scale-95"
                        title="Padam Sesi Latihan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CREATE TRAINING SESSION */}
      {isCreateModalOpen && (
        <TrainingSessionFormModal
          program={program}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* MODAL 2: EDIT TRAINING SESSION */}
      {editingSession && (
        <TrainingSessionFormModal
          program={program}
          session={editingSession}
          onClose={() => setEditingSession(null)}
        />
      )}

      {/* MODAL 3: ATTENDANCE & COACH NOTES MODAL */}
      {activeAttendanceSession && (
        <AttendanceModal
          session={activeAttendanceSession}
          program={program}
          people={people}
          onClose={() => setActiveAttendanceSession(null)}
        />
      )}
    </div>
  );
};

// --- MODAL: CREATE / EDIT TRAINING SESSION FORM ---
interface TrainingSessionFormModalProps {
  program: Program;
  session?: TrainingSession;
  onClose: () => void;
}

const TrainingSessionFormModal: React.FC<TrainingSessionFormModalProps> = ({
  program,
  session,
  onClose,
}) => {
  const isEditing = !!session;
  const [eventId, setEventId] = useState<string>(session?.eventId || program.units[0]?.id || '');
  const [date, setDate] = useState<string>(session?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>(session?.startTime || '20:00');
  const [endTime, setEndTime] = useState<string>(session?.endTime || '22:30');
  const [venue, setVenue] = useState<string>(session?.venue || 'Dewan Seri Mutiara');
  const [focusArea, setFocusArea] = useState<string>(session?.focusArea || '');
  const [status, setStatus] = useState<'SCHEDULED' | 'COMPLETED' | 'CANCELLED'>(
    session?.status || 'SCHEDULED'
  );
  const [coachNotes, setCoachNotes] = useState<string>(session?.coachNotes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusArea.trim() || !venue.trim()) {
      alert('Sila lengkapkan fokus latihan dan lokasi.');
      return;
    }

    if (isEditing && session) {
      secretariatStore.updateTrainingSession(session.id, {
        eventId,
        date,
        startTime,
        endTime,
        venue: venue.trim(),
        focusArea: focusArea.trim(),
        status,
        coachNotes: coachNotes.trim() || undefined,
      });
    } else {
      secretariatStore.createTrainingSession({
        programId: program.id,
        eventId,
        date,
        startTime,
        endTime,
        venue: venue.trim(),
        focusArea: focusArea.trim(),
        status,
        coachNotes: coachNotes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              {isEditing ? 'Kemaskini Sesi Latihan' : 'Jadualkan Sesi Latihan Baharu'}
            </h3>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fokus Latihan / Pengisian Sesi *
            </label>
            <input
              type="text"
              placeholder="Contoh: Latihan Vokal Harmoni, Blocking Babak 2, Tempo & Rentak"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tarikh Latihan *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Masa Mula *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Masa Tamat *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lokasi / Tempat Latihan *
            </label>
            <input
              type="text"
              placeholder="Contoh: Dewan Seri Mutiara / Studio Kesenian 1"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              required
            />
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Sesi Latihan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="SCHEDULED">Terjadual (Scheduled)</option>
                <option value="COMPLETED">Selesai (Completed)</option>
                <option value="CANCELLED">Dibatalkan (Cancelled)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Coach Awal (Pilihan)
            </label>
            <textarea
              rows={2}
              placeholder="Fokus utama atau persediaan props yang perlu dibawa..."
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
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
              {isEditing ? 'Simpan Kemaskini' : 'Jadualkan Sesi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL: ATTENDANCE & COACH NOTES ---
interface AttendanceModalProps {
  session: TrainingSession;
  program: Program;
  people: Person[];
  onClose: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, program, people, onClose }) => {
  const storeState = secretariatStore.getState();
  const unit = program.units.find((u) => u.id === session.eventId);

  // Squad members for this event
  const squadMemberships = useMemo(() => {
    return (storeState.eventMemberships || [])
      .filter((m) => m.eventId === session.eventId)
      .map((m) => {
        const person = people.find((p) => p.id === m.personId);
        return {
          ...m,
          person,
        };
      })
      .filter((m) => m.person !== undefined);
  }, [storeState.eventMemberships, session.eventId, people]);

  // Existing attendance logs for this session
  const existingLogs = useMemo(() => {
    return (storeState.trainingAttendanceLogs || []).filter(
      (l) => l.trainingSessionId === session.id
    );
  }, [storeState.trainingAttendanceLogs, session.id]);

  // Attendance state mapping membershipId -> { isPresent: boolean, remarks: string }
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { isPresent: boolean; remarks: string }>
  >(() => {
    const map: Record<string, { isPresent: boolean; remarks: string }> = {};
    squadMemberships.forEach((m) => {
      const existing = existingLogs.find((l) => l.eventMembershipId === m.id);
      map[m.id] = {
        isPresent: existing ? existing.isPresent : true, // Default to true on fresh intake
        remarks: existing?.remarks || '',
      };
    });
    return map;
  });

  const [coachNotes, setCoachNotes] = useState<string>(session.coachNotes || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const toggleAttendance = (membershipId: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [membershipId]: {
        ...prev[membershipId],
        isPresent: !prev[membershipId]?.isPresent,
      },
    }));
  };

  const updateRemark = (membershipId: string, remark: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [membershipId]: {
        ...prev[membershipId],
        remarks: remark,
      },
    }));
  };

  const markAll = (present: boolean) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id].isPresent = present;
      });
      return updated;
    });
  };

  const handleSave = () => {
    const logsToSave = squadMemberships.map((m) => ({
      eventMembershipId: m.id,
      personId: m.personId,
      isPresent: attendanceMap[m.id]?.isPresent ?? true,
      remarks: attendanceMap[m.id]?.remarks || undefined,
    }));

    secretariatStore.recordTrainingAttendance(session.id, logsToSave);
    secretariatStore.updateTrainingCoachNotes(session.id, coachNotes.trim());

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const presentCount = (Object.values(attendanceMap) as { isPresent: boolean; remarks: string }[]).filter(
    (v) => v.isPresent
  ).length;
  const totalCount = squadMemberships.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Rekod Kehadiran & Catatan Latihan
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {unit?.name} • {session.focusArea} ({formatDate(session.date)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Quick Actions & Attendance Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Status Kehadiran Sesi:</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                <span className="text-emerald-600 dark:text-emerald-400">{presentCount} Hadir</span> /{' '}
                <span className="text-rose-600 dark:text-rose-400">{totalCount - presentCount} Tidak Hadir</span>{' '}
                <span className="text-xs text-slate-400 font-normal">({totalCount} Ahli Berdaftar)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAll(true)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors"
              >
                Semua Hadir
              </button>
              <button
                type="button"
                onClick={() => markAll(false)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors"
              >
                Semua Tidak Hadir
              </button>
            </div>
          </div>

          {/* Members Attendance List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
              Senarai Ahli Pasukan ({squadMemberships.length})
            </h4>

            {squadMemberships.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                Belum ada ahli didaftarkan dalam pasukan {unit?.name}. Sila daftarkan peserta dalam tab Pasukan & Peserta.
              </div>
            ) : (
              <div className="space-y-2">
                {squadMemberships.map((m) => {
                  const isPresent = attendanceMap[m.id]?.isPresent ?? true;
                  const remark = attendanceMap[m.id]?.remarks || '';

                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isPresent
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/30'
                          : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/60 dark:border-rose-900/30'
                      }`}
                    >
                      {/* Person Details */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                            isPresent
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {m.person?.fullName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {m.person?.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            ID: {m.person?.studentId || '-'} • Peranan: {m.role}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Attendance Toggle + Remark Input */}
                      <div className="flex items-center gap-2 flex-1 sm:justify-end">
                        <input
                          type="text"
                          placeholder="Catatan individu (cth: lewat / sakit)..."
                          value={remark}
                          onChange={(e) => updateRemark(m.id, e.target.value)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-full sm:max-w-[200px]"
                        />

                        <button
                          type="button"
                          onClick={() => toggleAttendance(m.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs'
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Hadir</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>Tidak Hadir</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Coach Notes */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Catatan Jurulatih / Coach Notes
              </label>
            </div>
            <textarea
              rows={3}
              placeholder="Catatan kemajuan naskhah, penguasaan tempo, blocking pentas, teguran jurulatih atau sasaran sesi berikutnya..."
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Kehadiran berjaya disimpan!</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Rekod Kehadiran & Catatan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
