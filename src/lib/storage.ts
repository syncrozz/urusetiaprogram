import {
  MainCategory,
  ProgramTemplate,
  Program,
  Person,
  ActivityLog,
  UnitUpdate,
  AuthSession,
  ProgramUnit,
  UnitRequirement,
  PriorityLevel,
  RequirementStatus,
  AssistanceStatus,
  UnitEvidence,
  ParticipantProfile,
  EventMembership,
  TrainingSession,
  TrainingAttendanceLog,
  CompetitionEventConfig,
  SelectionStatus,
  CompetitionRole,
  CompetitionReadiness,
  ContingentLogistics,
  ContingentOfficer,
  ContingentVehicle,
  ReadinessLevel,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_TEMPLATES,
  INITIAL_PROGRAMS,
  INITIAL_ADMIN_PROFILE,
  DEMO_PEOPLE,
  INITIAL_UPDATES,
  INITIAL_LOGS,
} from '../data/initialData';
import { calculateUnitProgress, calculateProgramReadiness } from './utils';
import { pushStateToFirebase, fetchStateFromFirebase, subscribeToFirebaseState } from './firebase';

const STORAGE_KEY = 'syncrozz_secretariat_state_v2';
const MASTER_PIN = '5313';

export interface AppState {
  categories: MainCategory[];
  templates: ProgramTemplate[];
  programs: Program[];
  people: Person[];
  updates: UnitUpdate[];
  logs: ActivityLog[];
  participantProfiles: ParticipantProfile[];
  eventMemberships: EventMembership[];
  trainingSessions: TrainingSession[];
  trainingAttendanceLogs: TrainingAttendanceLog[];
  competitionEventConfigs: CompetitionEventConfig[];
  competitionReadiness: CompetitionReadiness[];
  contingentLogistics: ContingentLogistics[];
  authSession: AuthSession;
  selectedProgramId: string;
}

let isSyncingFromRemote = false;
let pushDebounceTimer: any = null;

// Initial state loading
function loadInitialState(): AppState {
  const legacyMockIds = new Set([
    'usr-zara',
    'usr-idi',
    'usr-sharifah',
    'usr-zulaikha-bendahari',
    'usr-dzul',
    'usr-rabi',
    'usr-airra',
    'usr-aya',
    'usr-faqihah',
    'usr-admin-khairi',
  ]);

  try {
    // Check both current and legacy storage keys
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('syncrozz_secretariat_state_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.programs && parsed.templates && parsed.categories) {
        let userPeople = Array.isArray(parsed.people) ? parsed.people : [];
        // Filter out all legacy demo IDs and admins from the student list
        userPeople = userPeople.filter((p: Person) => !legacyMockIds.has(p.id) && p.role !== 'ADMIN');

        // Clean unassigned or mock leaders from units
        const programs = (parsed.programs || INITIAL_PROGRAMS).map((prog: Program) => ({
          ...prog,
          units: (prog.units || []).map((u: ProgramUnit) => {
            if (u.leaderId && legacyMockIds.has(u.leaderId)) {
              return { ...u, leaderId: undefined, leader: undefined };
            }
            return u;
          }),
        }));

        const adminPerson = INITIAL_ADMIN_PROFILE;

        return {
          categories: parsed.categories || INITIAL_CATEGORIES,
          templates: parsed.templates || INITIAL_TEMPLATES,
          programs: programs,
          people: userPeople,
          updates: parsed.updates || INITIAL_UPDATES,
          logs: parsed.logs || INITIAL_LOGS,
          participantProfiles: parsed.participantProfiles || [],
          eventMemberships: parsed.eventMemberships || [],
          trainingSessions: parsed.trainingSessions || [],
          trainingAttendanceLogs: parsed.trainingAttendanceLogs || [],
          competitionEventConfigs: parsed.competitionEventConfigs || [],
          competitionReadiness: parsed.competitionReadiness || [],
          contingentLogistics: parsed.contingentLogistics || [],
          authSession: {
            role: 'ADMIN',
            person: adminPerson,
            programId: programs[0]?.id || 'prog-soar-2026',
            isMasterUnlocked: false,
          },
          selectedProgramId: parsed.selectedProgramId || programs[0]?.id || 'prog-soar-2026',
        };
      }
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }

  return {
    categories: INITIAL_CATEGORIES,
    templates: INITIAL_TEMPLATES,
    programs: INITIAL_PROGRAMS,
    people: [],
    updates: INITIAL_UPDATES,
    logs: INITIAL_LOGS,
    participantProfiles: [],
    eventMemberships: [],
    trainingSessions: [],
    trainingAttendanceLogs: [],
    competitionEventConfigs: [],
    competitionReadiness: [],
    contingentLogistics: [],
    authSession: {
      role: 'ADMIN',
      person: INITIAL_ADMIN_PROFILE,
      programId: 'prog-soar-2026',
      isMasterUnlocked: false,
    },
    selectedProgramId: 'prog-soar-2026',
  };
}

let currentState: AppState = loadInitialState();
const listeners = new Set<(state?: AppState) => void>();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch (e) {
    console.error('Failed to persist state:', e);
  }
  listeners.forEach((listener) => listener(currentState));

  // Sync to Firebase if not currently applying a remote incoming update
  if (!isSyncingFromRemote) {
    if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
    pushDebounceTimer = setTimeout(() => {
      pushStateToFirebase(currentState);
    }, 600);
  }
}

// Initialize Firestore live listener for real-time synchronization across devices
if (typeof window !== 'undefined') {
  try {
    subscribeToFirebaseState((remoteData) => {
      if (remoteData && remoteData.categories && remoteData.programs) {
        isSyncingFromRemote = true;
        currentState.categories = remoteData.categories || currentState.categories;
        currentState.templates = remoteData.templates || currentState.templates;
        currentState.programs = remoteData.programs || currentState.programs;
        currentState.people = (remoteData.people || []).filter((p: Person) => p.role !== 'ADMIN');
        currentState.updates = remoteData.updates || currentState.updates;
        currentState.logs = remoteData.logs || currentState.logs;
        currentState.participantProfiles = remoteData.participantProfiles || currentState.participantProfiles || [];
        currentState.eventMemberships = remoteData.eventMemberships || currentState.eventMemberships || [];
        currentState.trainingSessions = remoteData.trainingSessions || currentState.trainingSessions || [];
        currentState.trainingAttendanceLogs = remoteData.trainingAttendanceLogs || currentState.trainingAttendanceLogs || [];
        currentState.competitionEventConfigs = remoteData.competitionEventConfigs || currentState.competitionEventConfigs || [];
        currentState.competitionReadiness = remoteData.competitionReadiness || currentState.competitionReadiness || [];
        currentState.contingentLogistics = remoteData.contingentLogistics || currentState.contingentLogistics || [];

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
        } catch (e) {
          // ignore
        }
        listeners.forEach((listener) => listener(currentState));
        isSyncingFromRemote = false;
      }
    });

    // Initial check & seed remote if empty
    fetchStateFromFirebase().then((remoteData) => {
      if (!remoteData || !remoteData.programs || remoteData.programs.length === 0) {
        pushStateToFirebase(currentState);
      }
    }).catch(() => {
      // offline fallback
    });
  } catch (err) {
    console.warn('[Firebase Sync] Realtime sync listener initialization error:', err);
  }
}

export const secretariatStore = {
  getState(): AppState {
    return currentState;
  },

  subscribe(listener: (state?: AppState) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setSelectedProgramId(id: string) {
    currentState.selectedProgramId = id;
    saveState();
  },

  // Auth Operations
  setSession(session: AuthSession) {
    currentState.authSession = session;
    saveState();
  },

  loginAsLeader(studentIdOrIcOrEmail: string): { success: boolean; message: string; person?: Person; unit?: ProgramUnit; program?: Program } {
    const rawInput = studentIdOrIcOrEmail.trim();
    const cleanInput = rawInput.toLowerCase();
    const alphaNumInput = cleanInput.replace(/[^a-z0-9]/g, '');
    
    // Find matching person
    const foundPerson = currentState.people.find((p) => {
      const pId = (p.studentId || '').toLowerCase();
      const pIdAlpha = pId.replace(/[^a-z0-9]/g, '');
      const pLast4 = (p.icLast4 || '').toLowerCase();
      const pGmail = (p.gmail || '').toLowerCase();
      const pEmail = (p.email || '').toLowerCase();
      const pIC = (p.icNumber || '').toLowerCase();
      const pICAlpha = pIC.replace(/[^a-z0-9]/g, '');

      return (
        pId === cleanInput ||
        pIdAlpha === alphaNumInput ||
        pLast4 === cleanInput ||
        pGmail === cleanInput ||
        pEmail === cleanInput ||
        pIC === cleanInput ||
        pICAlpha === alphaNumInput ||
        (cleanInput.length >= 4 && pLast4 === cleanInput.slice(-4))
      );
    });

    if (!foundPerson) {
      return { success: false, message: 'ID Pelajar, 4 Digit IC, atau Gmail tidak ditemui dalam rekod lantikan Ketua Unit.' };
    }

    // Find assigned unit across active programs
    let assignedProgram: Program | undefined;
    let assignedUnit: ProgramUnit | undefined;

    for (const prog of currentState.programs) {
      const u = prog.units.find((unit) => unit.leaderId === foundPerson.id);
      if (u) {
        assignedProgram = prog;
        assignedUnit = u;
        break;
      }
    }

    if (!assignedUnit || !assignedProgram) {
      // Fallback: If person exists but unit not linked, check if any unit matches default
      const defaultProg = currentState.programs[0];
      const defaultUnit = defaultProg?.units[0];
      if (defaultProg && defaultUnit) {
        assignedProgram = defaultProg;
        assignedUnit = defaultUnit;
      }
    }

    currentState.authSession = {
      role: 'KETUA_UNIT',
      person: foundPerson,
      programId: assignedProgram?.id,
      unitId: assignedUnit?.id,
      isMasterUnlocked: false,
    };

    if (assignedProgram) {
      currentState.selectedProgramId = assignedProgram.id;
    }

    // Log Activity
    this.addActivityLog({
      action: 'Akses Portal Ketua Unit',
      entityType: 'AUTH',
      entityId: assignedUnit?.id || foundPerson.id,
      entityName: `${foundPerson.fullName} (${assignedUnit?.name || 'Unit'})`,
      details: `Ketua Unit [${foundPerson.fullName}] (${foundPerson.studentId}) berjaya log masuk untuk program ${assignedProgram?.name || 'Program'}.`,
    });

    saveState();
    return { success: true, message: 'Akses berjaya disahkan.', person: foundPerson, unit: assignedUnit, program: assignedProgram };
  },

  loginAsAdmin(adminPersonId?: string) {
    const admin = currentState.people.find((p) => p.id === adminPersonId && p.role === 'ADMIN') ||
      currentState.people.find((p) => p.role === 'ADMIN') ||
      DEMO_PEOPLE[5];

    currentState.authSession = {
      role: 'ADMIN',
      person: admin,
      programId: currentState.selectedProgramId,
      isMasterUnlocked: currentState.authSession.isMasterUnlocked || false,
    };
    saveState();
  },

  verifyMasterPin(enteredPin: string): boolean {
    if (enteredPin.trim() === MASTER_PIN) {
      currentState.authSession = {
        ...currentState.authSession,
        role: 'MASTER_ADMIN',
        isMasterUnlocked: true,
      };
      
      this.addActivityLog({
        action: 'Buka Kunci Konfigurasi Master Admin',
        entityType: 'AUTH',
        entityId: 'master-config',
        entityName: 'Master Admin Access',
        details: 'Akses konfigurasi Master Admin berjaya dibuka dengan PIN keselamatan.',
      });

      saveState();
      return true;
    }
    return false;
  },

  lockMasterAdmin() {
    currentState.authSession = {
      ...currentState.authSession,
      role: 'ADMIN',
      isMasterUnlocked: false,
    };
    saveState();
  },

  // Program Management
  createProgram(params: {
    name: string;
    categoryId: string;
    templateId?: string;
    code: string;
    description: string;
    startDate: string;
    endDate: string;
    deadlineDate: string;
    venue: string;
    targetAudience?: string;
    expectedAttendance?: number;
    budgetAllocated?: number;
    selectedTemplateUnits?: { templateUnitId: string; leaderId?: string }[];
  }): Program {
    const template = currentState.templates.find((t) => t.id === params.templateId) ||
      currentState.templates.find((t) => t.categoryId === params.categoryId) ||
      currentState.templates[0];

    const newProgramId = `prog-${Date.now()}`;
    
    // Auto-generate isolated units & requirements from the template
    const generatedUnits: ProgramUnit[] = [];

    if (template && template.units) {
      template.units.forEach((tu) => {
        // Check if selected by admin
        const selection = params.selectedTemplateUnits?.find((su) => su.templateUnitId === tu.id);
        if (params.selectedTemplateUnits && !selection) {
          // Admin chose to omit this unit
          return;
        }

        const newUnitId = `pu-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const assignedLeaderId = selection?.leaderId || undefined;
        const leader = assignedLeaderId ? currentState.people.find((p) => p.id === assignedLeaderId) : undefined;

        const clonedRequirements: UnitRequirement[] = (tu.requirements || []).map((tr, idx) => ({
          id: `pur-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          programUnitId: newUnitId,
          templateRequirementId: tr.id,
          title: tr.title,
          description: tr.description,
          priority: tr.priority,
          required: tr.required,
          status: 'ACTION_REQUIRED',
          progress: 0,
          dueDate: params.deadlineDate,
          notes: '',
        }));

        generatedUnits.push({
          id: newUnitId,
          programId: newProgramId,
          templateUnitId: tu.id,
          name: tu.name,
          description: tu.description,
          icon: tu.icon,
          leaderId: assignedLeaderId,
          leader: leader,
          priority: tu.priority,
          progress: 0,
          status: 'ACTION_REQUIRED',
          membersCount: 4,
          assistanceStatus: 'NONE',
          lastUpdated: new Date().toISOString(),
          requirements: clonedRequirements,
        });
      });
    }

    const newProgram: Program = {
      id: newProgramId,
      categoryId: params.categoryId,
      templateId: template?.id,
      name: params.name,
      description: params.description,
      code: params.code || `PRG-${Math.floor(1000 + Math.random() * 9000)}`,
      startDate: params.startDate,
      endDate: params.endDate,
      deadlineDate: params.deadlineDate,
      venue: params.venue,
      status: 'PLANNING',
      targetAudience: params.targetAudience || 'Peserta & Komuniti',
      expectedAttendance: params.expectedAttendance || 200,
      budgetAllocated: params.budgetAllocated || 5000,
      overallProgress: 0,
      units: generatedUnits,
      milestones: [
        { id: `m-${Date.now()}-1`, programId: newProgramId, title: 'Kelulusan & Penubuhan Urusetia', targetDate: params.startDate, status: 'IN_PROGRESS', phase: 'PLANNING' },
        { id: `m-${Date.now()}-2`, programId: newProgramId, title: 'Semakan Kesiagaan Unit', targetDate: params.deadlineDate, status: 'PENDING', phase: 'TECHNICAL_CHECK' },
        { id: `m-${Date.now()}-3`, programId: newProgramId, title: 'Hari Program Berlangsung', targetDate: params.startDate, status: 'PENDING', phase: 'EVENT_DAY' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentState.programs.unshift(newProgram);
    currentState.selectedProgramId = newProgramId;

    this.addActivityLog({
      action: 'Mencipta Program Baru',
      entityType: 'PROGRAM',
      entityId: newProgramId,
      entityName: newProgram.name,
      details: `Program dijana daripada template [${template?.name || 'Standard'}] dengan ${generatedUnits.length} unit urusetia.`,
    });

    saveState();
    return newProgram;
  },

  updateProgramDetails(programId: string, updates: Partial<Program>) {
    const prog = currentState.programs.find((p) => p.id === programId);
    if (!prog) return;

    Object.assign(prog, updates, { updatedAt: new Date().toISOString() });
    
    // Recalculate readiness
    const readiness = calculateProgramReadiness(prog.units);
    prog.overallProgress = readiness.overallPercentage;

    this.addActivityLog({
      action: 'Kemaskini Maklumat Program',
      entityType: 'PROGRAM',
      entityId: programId,
      entityName: prog.name,
      details: 'Maklumat asas program dikemaskini oleh Urusetia.',
    });

    saveState();
  },

  deleteProgram(programId: string) {
    const target = currentState.programs.find((p) => p.id === programId);
    currentState.programs = currentState.programs.filter((p) => p.id !== programId);
    if (currentState.selectedProgramId === programId) {
      currentState.selectedProgramId = currentState.programs[0]?.id || '';
    }

    if (target) {
      this.addActivityLog({
        action: 'Memadam Program',
        entityType: 'PROGRAM',
        entityId: programId,
        entityName: target.name,
        details: 'Program telah dipadam daripada senarai aktif.',
      });
    }

    saveState();
  },

  // Unit & Requirement Operations
  updateRequirement(params: {
    programId: string;
    unitId: string;
    requirementId: string;
    status: RequirementStatus;
    progress?: number;
    notes?: string;
    completedAt?: string;
  }) {
    const prog = currentState.programs.find((p) => p.id === params.programId);
    if (!prog) return;

    const unit = prog.units.find((u) => u.id === params.unitId);
    if (!unit) return;

    const req = unit.requirements.find((r) => r.id === params.requirementId);
    if (!req) return;

    const oldStatus = req.status;
    req.status = params.status;
    
    if (params.status === 'COMPLETED') {
      req.progress = 100;
      req.completedAt = params.completedAt || new Date().toISOString();
    } else if (params.status === 'ACTION_REQUIRED') {
      req.progress = 0;
      req.completedAt = undefined;
    } else if (params.progress !== undefined) {
      req.progress = params.progress;
      if (params.progress === 100) req.status = 'COMPLETED';
    } else if (params.status === 'IN_PROGRESS' && (!req.progress || req.progress === 0)) {
      req.progress = 50;
    }

    if (params.notes !== undefined) {
      req.notes = params.notes;
    }

    req.updatedAt = new Date().toISOString();
    req.updatedBy = currentState.authSession.person?.fullName || 'Ketua Unit';

    // Recalculate Unit progress
    unit.progress = calculateUnitProgress(unit.requirements);
    if (unit.progress >= 100) {
      unit.status = 'COMPLETED';
    } else if (unit.progress > 0) {
      unit.status = 'IN_PROGRESS';
    } else {
      unit.status = 'ACTION_REQUIRED';
    }
    unit.lastUpdated = new Date().toISOString();

    // Recalculate Overall Program Readiness
    const readiness = calculateProgramReadiness(prog.units);
    prog.overallProgress = readiness.overallPercentage;
    prog.updatedAt = new Date().toISOString();

    // Add log
    if (oldStatus !== params.status) {
      this.addActivityLog({
        action: 'Kemaskini Status Requirement',
        entityType: 'REQUIREMENT',
        entityId: req.id,
        entityName: req.title,
        details: `${unit.name}: Status ditukar kepada ${params.status} (${req.progress}%).`,
      });

      // Add unit update entry
      this.addUnitUpdate({
        unitId: unit.id,
        programId: prog.id,
        message: `Requirement [${req.title}] dikemaskini kepada status ${params.status} (${req.progress}%).`,
        type: 'STATUS_CHANGE',
      });
    }

    saveState();
  },

  addEvidenceToRequirement(params: {
    programId: string;
    unitId: string;
    requirementId: string;
    title: string;
    mediaType: 'image' | 'pdf' | 'link' | 'document';
    mediaUrl: string;
  }) {
    const prog = currentState.programs.find((p) => p.id === params.programId);
    if (!prog) return;
    const unit = prog.units.find((u) => u.id === params.unitId);
    if (!unit) return;
    const req = unit.requirements.find((r) => r.id === params.requirementId);
    if (!req) return;

    if (!req.evidences) req.evidences = [];

    const newEvidence: UnitEvidence = {
      id: `ev-${Date.now()}`,
      requirementId: req.id,
      title: params.title,
      mediaType: params.mediaType,
      mediaUrl: params.mediaUrl,
      uploadedBy: currentState.authSession.person?.id || 'usr-anon',
      uploadedByName: currentState.authSession.person?.fullName || 'Ketua Unit',
      createdAt: new Date().toISOString(),
    };

    req.evidences.push(newEvidence);
    unit.lastUpdated = new Date().toISOString();

    this.addActivityLog({
      action: 'Muat Naik Bukti (Evidence)',
      entityType: 'REQUIREMENT',
      entityId: req.id,
      entityName: req.title,
      details: `Bukti '${params.title}' dimuat naik oleh ${newEvidence.uploadedByName}.`,
    });

    this.addUnitUpdate({
      unitId: unit.id,
      programId: prog.id,
      message: `📎 Bukti dimuat naik untuk [${req.title}]: ${params.title}`,
      type: 'EVIDENCE',
    });

    saveState();
  },

  submitEscalation(params: {
    programId: string;
    unitId: string;
    reason: string;
    request: string;
  }) {
    const prog = currentState.programs.find((p) => p.id === params.programId);
    if (!prog) return;
    const unit = prog.units.find((u) => u.id === params.unitId);
    if (!unit) return;

    unit.assistanceStatus = 'OPEN';
    unit.assistanceReason = params.reason;
    unit.assistanceRequest = params.request;
    unit.assistanceCreatedAt = new Date().toISOString();
    unit.lastUpdated = new Date().toISOString();

    this.addActivityLog({
      action: 'Eskalasi: Mohon Bantuan Admin',
      entityType: 'ESCALATION',
      entityId: unit.id,
      entityName: unit.name,
      details: `Ketua Unit ${unit.name} mohon bantuan segera: "${params.reason}"`,
    });

    this.addUnitUpdate({
      unitId: unit.id,
      programId: prog.id,
      message: `⚠️ PERLU BANTUAN ADMIN: ${params.reason} | Keperluan: ${params.request}`,
      type: 'ESCALATION',
    });

    saveState();
  },

  resolveEscalation(params: {
    programId: string;
    unitId: string;
    adminNote: string;
    newStatus: AssistanceStatus;
  }) {
    const prog = currentState.programs.find((p) => p.id === params.programId);
    if (!prog) return;
    const unit = prog.units.find((u) => u.id === params.unitId);
    if (!unit) return;

    unit.assistanceStatus = params.newStatus;
    unit.assistanceAdminNote = params.adminNote;
    if (params.newStatus === 'RESOLVED') {
      unit.assistanceResolvedAt = new Date().toISOString();
    }
    unit.lastUpdated = new Date().toISOString();

    this.addActivityLog({
      action: 'Tindakan Bantuan Admin',
      entityType: 'ESCALATION',
      entityId: unit.id,
      entityName: unit.name,
      details: `Status bantuan ditukar ke [${params.newStatus}]. Nota: ${params.adminNote}`,
    });

    this.addUnitUpdate({
      unitId: unit.id,
      programId: prog.id,
      message: `✅ Tindakan Admin [${params.newStatus}]: ${params.adminNote}`,
      type: 'NOTE',
    });

    saveState();
  },

  assignLeaderToUnit(programId: string, unitId: string, personId?: string) {
    const prog = currentState.programs.find((p) => p.id === programId);
    if (!prog) return;
    const unit = prog.units.find((u) => u.id === unitId);
    if (!unit) return;

    const person = personId ? currentState.people.find((p) => p.id === personId) : undefined;
    unit.leaderId = personId;
    unit.leader = person;
    unit.lastUpdated = new Date().toISOString();

    this.addActivityLog({
      action: 'Lantikan Ketua Unit',
      entityType: 'UNIT',
      entityId: unit.id,
      entityName: unit.name,
      details: person ? `${person.fullName} (${person.studentId}) dilantik sebagai Ketua Unit.` : 'Lantikan Ketua Unit dikosongkan.',
    });

    saveState();
  },

  addCustomRequirement(params: {
    programId: string;
    unitId: string;
    title: string;
    description?: string;
    priority: PriorityLevel;
    required: boolean;
    dueDate?: string;
  }) {
    const prog = currentState.programs.find((p) => p.id === params.programId);
    if (!prog) return;
    const unit = prog.units.find((u) => u.id === params.unitId);
    if (!unit) return;

    const newReq: UnitRequirement = {
      id: `pur-custom-${Date.now()}`,
      programUnitId: unit.id,
      title: params.title,
      description: params.description || '',
      priority: params.priority,
      required: params.required,
      status: 'ACTION_REQUIRED',
      progress: 0,
      dueDate: params.dueDate || prog.deadlineDate,
      notes: 'Keperluan khusus program (Custom Requirement).',
    };

    unit.requirements.push(newReq);
    unit.progress = calculateUnitProgress(unit.requirements);
    unit.lastUpdated = new Date().toISOString();

    // Recalculate program readiness
    prog.overallProgress = calculateProgramReadiness(prog.units).overallPercentage;

    this.addActivityLog({
      action: 'Tambah Keperluan Khusus Program',
      entityType: 'REQUIREMENT',
      entityId: newReq.id,
      entityName: newReq.title,
      details: `Keperluan khas ditambah ke ${unit.name} tanpa mengubah Master Template.`,
    });

    saveState();
  },

  addCustomUnit(params: {
    programId: string;
    name: string;
    description: string;
    icon: string;
    priority: PriorityLevel;
    leaderId?: string;
  }) {
    const prog = currentState.programs.find((p) => p.id === params.programId);
    if (!prog) return;

    const leader = params.leaderId ? currentState.people.find((p) => p.id === params.leaderId) : undefined;
    const newUnit: ProgramUnit = {
      id: `pu-custom-${Date.now()}`,
      programId: prog.id,
      name: params.name,
      description: params.description,
      icon: params.icon || 'Boxes',
      priority: params.priority,
      leaderId: params.leaderId,
      leader: leader,
      progress: 0,
      status: 'ACTION_REQUIRED',
      membersCount: 2,
      assistanceStatus: 'NONE',
      lastUpdated: new Date().toISOString(),
      requirements: [
        {
          id: `pur-init-${Date.now()}`,
          programUnitId: `pu-custom-${Date.now()}`,
          title: `Penyediaan Pelan Kerja ${params.name}`,
          description: 'Penyusunan senarai semak dan agihan tugas anggota unit.',
          priority: 'HIGH',
          required: true,
          status: 'ACTION_REQUIRED',
          progress: 0,
          dueDate: prog.deadlineDate,
        },
      ],
    };

    prog.units.push(newUnit);
    prog.overallProgress = calculateProgramReadiness(prog.units).overallPercentage;

    this.addActivityLog({
      action: 'Tambah Unit Khusus',
      entityType: 'UNIT',
      entityId: newUnit.id,
      entityName: newUnit.name,
      details: `Unit baharu [${newUnit.name}] ditambah khas untuk program ini.`,
    });

    saveState();
  },

  addUnitUpdate(params: {
    unitId: string;
    programId: string;
    message: string;
    type: 'PROGRESS' | 'STATUS_CHANGE' | 'ESCALATION' | 'EVIDENCE' | 'NOTE';
  }) {
    const author = currentState.authSession.person;
    const newUpdate: UnitUpdate = {
      id: `upd-${Date.now()}`,
      unitId: params.unitId,
      programId: params.programId,
      authorId: author?.id || 'usr-anon',
      authorName: author?.fullName || 'Pengguna Urusetia',
      authorRole: currentState.authSession.role,
      message: params.message,
      type: params.type,
      createdAt: new Date().toISOString(),
    };

    currentState.updates.unshift(newUpdate);
    saveState();
  },

  addActivityLog(params: {
    action: string;
    entityType: 'PROGRAM' | 'UNIT' | 'REQUIREMENT' | 'TEMPLATE' | 'CATEGORY' | 'ESCALATION' | 'AUTH';
    entityId: string;
    entityName?: string;
    details?: string;
  }) {
    const user = currentState.authSession.person;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.id || 'usr-system',
      userName: user?.fullName || 'Sistem Urusetia',
      userRole: currentState.authSession.role,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      details: params.details,
      createdAt: new Date().toISOString(),
    };

    currentState.logs.unshift(newLog);
    // Keep max 200 logs
    if (currentState.logs.length > 200) {
      currentState.logs = currentState.logs.slice(0, 200);
    }
  },

  // Master Admin Configuration
  saveCategory(cat: MainCategory) {
    const existingIndex = currentState.categories.findIndex((c) => c.id === cat.id);
    if (existingIndex >= 0) {
      currentState.categories[existingIndex] = cat;
    } else {
      currentState.categories.push(cat);
    }

    this.addActivityLog({
      action: 'Kemaskini Master Category',
      entityType: 'CATEGORY',
      entityId: cat.id,
      entityName: cat.name,
      details: `Kategori utama [${cat.name}] disimpan dalam Master Configuration.`,
    });

    saveState();
  },

  deleteCategory(categoryId: string): boolean {
    const cat = currentState.categories.find((c) => c.id === categoryId);
    if (!cat) return false;

    // Remove category
    currentState.categories = currentState.categories.filter((c) => c.id !== categoryId);

    this.addActivityLog({
      action: 'Padam Master Category',
      entityType: 'CATEGORY',
      entityId: categoryId,
      entityName: cat.name,
      details: `Kategori utama [${cat.name}] telah dipadam daripada Master Configuration.`,
    });

    saveState();
    return true;
  },

  saveTemplate(template: ProgramTemplate) {
    const existingIndex = currentState.templates.findIndex((t) => t.id === template.id);
    if (existingIndex >= 0) {
      currentState.templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      currentState.templates.push({
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Update category template count
    const cat = currentState.categories.find((c) => c.id === template.categoryId);
    if (cat) {
      cat.templatesCount = currentState.templates.filter((t) => t.categoryId === cat.id).length;
    }

    this.addActivityLog({
      action: 'Kemaskini Program Template',
      entityType: 'TEMPLATE',
      entityId: template.id,
      entityName: template.name,
      details: `Master Template [${template.name}] dikemaskini dengan ${template.units.length} unit cadangan.`,
    });

    saveState();
  },

  deleteTemplate(templateId: string) {
    const tpl = currentState.templates.find((t) => t.id === templateId);
    currentState.templates = currentState.templates.filter((t) => t.id !== templateId);

    if (tpl) {
      this.addActivityLog({
        action: 'Padam Template',
        entityType: 'TEMPLATE',
        entityId: templateId,
        entityName: tpl.name,
        details: 'Template dipadam daripada Master Configuration.',
      });
    }

    saveState();
  },

  addNewPerson(person: Omit<Person, 'id'>): Person {
    const newPerson: Person = {
      ...person,
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    currentState.people.push(newPerson);

    this.addActivityLog({
      action: 'Daftar Maklumat Pelajar/Ketua Unit',
      entityType: 'AUTH',
      entityId: newPerson.id,
      entityName: newPerson.fullName,
      details: `Pelajar ${newPerson.fullName} (${newPerson.studentId}) berjaya didaftarkan.`,
    });

    saveState();
    return newPerson;
  },

  updatePerson(personId: string, updated: Partial<Person>): boolean {
    const idx = currentState.people.findIndex((p) => p.id === personId);
    if (idx === -1) return false;

    currentState.people[idx] = {
      ...currentState.people[idx],
      ...updated,
    };

    // Update references in program units
    currentState.programs.forEach((prog) => {
      prog.units.forEach((unit) => {
        if (unit.leaderId === personId) {
          unit.leader = currentState.people[idx];
        }
      });
    });

    this.addActivityLog({
      action: 'Kemaskini Profil Pelajar',
      entityType: 'AUTH',
      entityId: personId,
      entityName: currentState.people[idx].fullName,
      details: `Profil ${currentState.people[idx].fullName} dikemaskini.`,
    });

    saveState();
    return true;
  },

  deletePerson(personId: string): boolean {
    const person = currentState.people.find((p) => p.id === personId);
    if (!person) return false;

    currentState.people = currentState.people.filter((p) => p.id !== personId);

    // Detach from units
    currentState.programs.forEach((prog) => {
      prog.units.forEach((unit) => {
        if (unit.leaderId === personId) {
          unit.leaderId = undefined;
          unit.leader = undefined;
        }
      });
    });

    this.addActivityLog({
      action: 'Padam Rekod Pelajar',
      entityType: 'AUTH',
      entityId: personId,
      entityName: person.fullName,
      details: `Rekod pelajar ${person.fullName} telah dipadam.`,
    });

    saveState();
    return true;
  },

  importPeople(newPeople: Person[], mode: 'APPEND' | 'REPLACE' = 'APPEND'): number {
    if (mode === 'REPLACE') {
      const adminPerson = currentState.people.find((p) => p.role === 'ADMIN') || DEMO_PEOPLE[DEMO_PEOPLE.length - 1];
      const hasAdminInNew = newPeople.some((p) => p.role === 'ADMIN');
      currentState.people = hasAdminInNew ? newPeople : [...newPeople, adminPerson];
    } else {
      // Append / Merge by studentId or icLast4
      for (const np of newPeople) {
        const existingIdx = currentState.people.findIndex(
          (p) =>
            p.studentId.toLowerCase() === np.studentId.toLowerCase() ||
            (p.icLast4 && np.icLast4 && p.icLast4 === np.icLast4 && p.fullName.toLowerCase() === np.fullName.toLowerCase())
        );
        if (existingIdx >= 0) {
          currentState.people[existingIdx] = {
            ...currentState.people[existingIdx],
            ...np,
            id: currentState.people[existingIdx].id, // keep original ID
          };
        } else {
          currentState.people.push(np);
        }
      }
    }

    this.addActivityLog({
      action: 'Import Data Pelajar CSV',
      entityType: 'AUTH',
      entityId: `import-${Date.now()}`,
      entityName: 'CSV Pelajar',
      details: `Sebanyak ${newPeople.length} rekod pelajar berjaya diimport (${mode === 'REPLACE' ? 'Gantian Penuh' : 'Gabungan/Kemaskini'}).`,
    });

    saveState();
    return currentState.people.length;
  },

  clearAllStudents() {
    currentState.people = [];

    // Unassign all leaders from program units
    currentState.programs.forEach((prog) => {
      prog.units.forEach((unit) => {
        unit.leaderId = undefined;
        unit.leader = undefined;
      });
    });

    this.addActivityLog({
      action: 'Kosongkan Direktori Pelajar',
      entityType: 'AUTH',
      entityId: 'clear-all-students',
      entityName: 'Direktori Pelajar',
      details: 'Semua rekod pelajar dipadam. Senarai sedia menerima data baharu.',
    });

    saveState();
  },

  // --- PHASE 3: COMPETITION & SQUAD METHODS ---
  assignUnitLeader(unitId: string, leaderId: string) {
    for (const prog of currentState.programs) {
      const unit = prog.units.find((u) => u.id === unitId);
      if (unit) {
        unit.leaderId = leaderId;
        unit.leader = currentState.people.find((p) => p.id === leaderId);
        unit.lastUpdated = new Date().toISOString();
        break;
      }
    }
    saveState();
  },

  getParticipantProfiles(): ParticipantProfile[] {
    return currentState.participantProfiles || [];
  },

  getEventMemberships(eventId?: string): EventMembership[] {
    const list = currentState.eventMemberships || [];
    if (!eventId) return list;
    return list.filter((m) => m.eventId === eventId);
  },

  getTrainingSessions(programId?: string, eventId?: string): TrainingSession[] {
    let list = currentState.trainingSessions || [];
    if (programId) {
      list = list.filter((s) => s.programId === programId);
    }
    if (eventId) {
      list = list.filter((s) => s.eventId === eventId);
    }
    // Sort by date and startTime ascending
    return list.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  },

  getTrainingAttendanceLogs(sessionId?: string): TrainingAttendanceLog[] {
    const list = currentState.trainingAttendanceLogs || [];
    if (!sessionId) return list;
    return list.filter((l) => l.trainingSessionId === sessionId);
  },

  getCompetitionEventConfigs(programUnitId?: string): CompetitionEventConfig[] {
    const list = currentState.competitionEventConfigs || [];
    if (!programUnitId) return list;
    return list.filter((c) => c.programUnitId === programUnitId);
  },

  addParticipantToEvent(params: {
    personId: string;
    eventId: string;
    role: CompetitionRole;
    selectionStatus?: SelectionStatus;
    skills?: string[];
    remarks?: string;
  }): { success: boolean; membership?: EventMembership; message: string } {
    const person = currentState.people.find((p) => p.id === params.personId);
    if (!person) {
      return { success: false, message: 'Maklumat individu tidak dijumpai.' };
    }

    // Check if membership already exists in this event
    const existing = (currentState.eventMemberships || []).find(
      (m) => m.personId === params.personId && m.eventId === params.eventId
    );
    if (existing) {
      // Update role/status instead of duplicating
      existing.role = params.role;
      if (params.selectionStatus) existing.selectionStatus = params.selectionStatus;
      if (params.remarks !== undefined) existing.remarks = params.remarks;
      saveState();
      return { success: true, membership: existing, message: 'Keahlian peserta dalam acara dikemaskini.' };
    }

    // Ensure ParticipantProfile exists
    let profile = (currentState.participantProfiles || []).find((p) => p.personId === params.personId);
    const now = new Date().toISOString();
    if (!profile) {
      profile = {
        id: `pp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        personId: params.personId,
        talentSkills: params.skills || [],
        experienceNotes: params.remarks,
        createdAt: now,
        updatedAt: now,
      };
      if (!currentState.participantProfiles) currentState.participantProfiles = [];
      currentState.participantProfiles.push(profile);
    } else if (params.skills && params.skills.length > 0) {
      profile.talentSkills = Array.from(new Set([...profile.talentSkills, ...params.skills]));
      profile.updatedAt = now;
    }

    const newMembership: EventMembership = {
      id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      participantProfileId: profile.id,
      personId: params.personId,
      eventId: params.eventId,
      role: params.role,
      selectionStatus: params.selectionStatus || 'TALENT_POOL',
      joinedAt: now,
      remarks: params.remarks,
    };

    if (!currentState.eventMemberships) currentState.eventMemberships = [];
    currentState.eventMemberships.push(newMembership);

    this.addActivityLog({
      action: 'Penambahan Peserta Acara',
      entityType: 'UNIT',
      entityId: params.eventId,
      entityName: person.fullName,
      details: `Peserta [${person.fullName}] didaftarkan ke dalam acara dengan peranan [${params.role}] dan status pemilihan [${newMembership.selectionStatus}].`,
    });

    saveState();
    return { success: true, membership: newMembership, message: 'Peserta berjaya didaftarkan ke dalam pasukan acara.' };
  },

  createAndAddParticipant(params: {
    personData: Omit<Person, 'id' | 'role'>;
    eventId: string;
    role: CompetitionRole;
    selectionStatus?: SelectionStatus;
    skills?: string[];
    remarks?: string;
  }): { success: boolean; membership?: EventMembership; person?: Person; message: string } {
    // 1. Create or find existing Person
    const existing = currentState.people.find(
      (p) =>
        p.studentId.trim().toLowerCase() === params.personData.studentId.trim().toLowerCase() ||
        (p.icLast4 && params.personData.icLast4 && p.icLast4 === params.personData.icLast4)
    );

    let targetPerson: Person;
    if (existing) {
      targetPerson = existing;
    } else {
      targetPerson = {
        ...params.personData,
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: 'AJK',
      };
      currentState.people.push(targetPerson);
    }

    // 2. Add to event
    const res = this.addParticipantToEvent({
      personId: targetPerson.id,
      eventId: params.eventId,
      role: params.role,
      selectionStatus: params.selectionStatus,
      skills: params.skills,
      remarks: params.remarks,
    });

    return {
      success: res.success,
      membership: res.membership,
      person: targetPerson,
      message: res.message,
    };
  },

  updateEventMembership(
    membershipId: string,
    updates: Partial<Pick<EventMembership, 'role' | 'selectionStatus' | 'remarks' | 'eventId'>>
  ): boolean {
    const mem = (currentState.eventMemberships || []).find((m) => m.id === membershipId);
    if (!mem) return false;

    if (updates.role) mem.role = updates.role;
    if (updates.selectionStatus) mem.selectionStatus = updates.selectionStatus;
    if (updates.remarks !== undefined) mem.remarks = updates.remarks;
    if (updates.eventId) mem.eventId = updates.eventId;

    const person = currentState.people.find((p) => p.id === mem.personId);
    this.addActivityLog({
      action: 'Kemaskini Status Peserta',
      entityType: 'UNIT',
      entityId: mem.eventId,
      entityName: person ? person.fullName : 'Peserta',
      details: `Status keahlian dikemaskini: Peranan [${mem.role}], Status Pemilihan [${mem.selectionStatus}].`,
    });

    saveState();
    return true;
  },

  updateParticipantProfile(
    personId: string,
    updates: Partial<Pick<ParticipantProfile, 'talentSkills' | 'experienceNotes' | 'emergencyContact'>>
  ): boolean {
    let profile = (currentState.participantProfiles || []).find((p) => p.personId === personId);
    const now = new Date().toISOString();

    if (!profile) {
      profile = {
        id: `pp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        personId,
        talentSkills: updates.talentSkills || [],
        experienceNotes: updates.experienceNotes,
        emergencyContact: updates.emergencyContact,
        createdAt: now,
        updatedAt: now,
      };
      if (!currentState.participantProfiles) currentState.participantProfiles = [];
      currentState.participantProfiles.push(profile);
    } else {
      if (updates.talentSkills !== undefined) profile.talentSkills = updates.talentSkills;
      if (updates.experienceNotes !== undefined) profile.experienceNotes = updates.experienceNotes;
      if (updates.emergencyContact !== undefined) profile.emergencyContact = updates.emergencyContact;
      profile.updatedAt = now;
    }

    saveState();
    return true;
  },

  removeEventMembership(membershipId: string): boolean {
    const idx = (currentState.eventMemberships || []).findIndex((m) => m.id === membershipId);
    if (idx === -1) return false;

    const [removed] = currentState.eventMemberships.splice(idx, 1);
    // Also remove any attendance records linked to this membership
    if (currentState.trainingAttendanceLogs) {
      currentState.trainingAttendanceLogs = currentState.trainingAttendanceLogs.filter(
        (l) => l.eventMembershipId !== membershipId
      );
    }

    const person = currentState.people.find((p) => p.id === removed.personId);
    this.addActivityLog({
      action: 'Gugur Peserta Acara',
      entityType: 'UNIT',
      entityId: removed.eventId,
      entityName: person ? person.fullName : 'Peserta',
      details: `Penyertaan peserta dikeluarkan daripada acara.`,
    });

    saveState();
    return true;
  },

  createTrainingSession(session: Omit<TrainingSession, 'id' | 'createdAt'>): TrainingSession {
    const newSession: TrainingSession = {
      ...session,
      id: `ts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    if (!currentState.trainingSessions) currentState.trainingSessions = [];
    currentState.trainingSessions.push(newSession);

    this.addActivityLog({
      action: 'Cipta Sesi Latihan',
      entityType: 'UNIT',
      entityId: session.eventId,
      entityName: session.focusArea,
      details: `Sesi latihan [${session.focusArea}] dijadualkan pada ${session.date} (${session.startTime} - ${session.endTime}) di ${session.venue}.`,
    });

    saveState();
    return newSession;
  },

  updateTrainingSession(sessionId: string, updates: Partial<Omit<TrainingSession, 'id' | 'createdAt'>>): boolean {
    const session = (currentState.trainingSessions || []).find((s) => s.id === sessionId);
    if (!session) return false;

    Object.assign(session, updates);

    this.addActivityLog({
      action: 'Kemaskini Sesi Latihan',
      entityType: 'UNIT',
      entityId: session.eventId,
      entityName: session.focusArea,
      details: `Maklumat sesi latihan [${session.focusArea}] dikemaskini (Status: ${session.status}).`,
    });

    saveState();
    return true;
  },

  deleteTrainingSession(sessionId: string): boolean {
    const idx = (currentState.trainingSessions || []).findIndex((s) => s.id === sessionId);
    if (idx === -1) return false;

    const [removed] = currentState.trainingSessions.splice(idx, 1);
    if (currentState.trainingAttendanceLogs) {
      currentState.trainingAttendanceLogs = currentState.trainingAttendanceLogs.filter(
        (l) => l.trainingSessionId !== sessionId
      );
    }

    this.addActivityLog({
      action: 'Padam Sesi Latihan',
      entityType: 'UNIT',
      entityId: removed.eventId,
      entityName: removed.focusArea,
      details: `Sesi latihan [${removed.focusArea}] pada ${removed.date} dipadam.`,
    });

    saveState();
    return true;
  },

  recordTrainingAttendance(
    sessionId: string,
    logs: { eventMembershipId: string; personId: string; isPresent: boolean; remarks?: string }[]
  ): boolean {
    if (!currentState.trainingAttendanceLogs) currentState.trainingAttendanceLogs = [];

    // Remove existing logs for this session
    currentState.trainingAttendanceLogs = currentState.trainingAttendanceLogs.filter(
      (l) => l.trainingSessionId !== sessionId
    );

    // Add new logs
    logs.forEach((log) => {
      currentState.trainingAttendanceLogs.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trainingSessionId: sessionId,
        eventMembershipId: log.eventMembershipId,
        personId: log.personId,
        isPresent: log.isPresent,
        remarks: log.remarks,
      });
    });

    // Automatically mark session as COMPLETED if not already
    const session = (currentState.trainingSessions || []).find((s) => s.id === sessionId);
    if (session && session.status === 'SCHEDULED') {
      session.status = 'COMPLETED';
    }

    saveState();
    return true;
  },

  updateTrainingCoachNotes(sessionId: string, coachNotes: string): boolean {
    const session = (currentState.trainingSessions || []).find((s) => s.id === sessionId);
    if (!session) return false;

    session.coachNotes = coachNotes;
    saveState();
    return true;
  },

  updateCompetitionEventConfig(config: Partial<CompetitionEventConfig> & { programUnitId: string }): CompetitionEventConfig {
    if (!currentState.competitionEventConfigs) currentState.competitionEventConfigs = [];
    let existing = currentState.competitionEventConfigs.find((c) => c.programUnitId === config.programUnitId);

    if (existing) {
      Object.assign(existing, config);
    } else {
      existing = {
        id: `cec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        programUnitId: config.programUnitId,
        quotaMain: config.quotaMain ?? 0,
        quotaReserve: config.quotaReserve ?? 0,
        coachPersonId: config.coachPersonId,
        picPersonId: config.picPersonId,
        competitionDate: config.competitionDate,
        submissionDeadline: config.submissionDeadline,
        rulesDocUrl: config.rulesDocUrl,
        categoryName: config.categoryName,
      };
      currentState.competitionEventConfigs.push(existing);
    }

    saveState();
    return existing;
  },

  // --- PHASE 4: LOGISTICS & 5-DIMENSION READINESS METHODS ---
  getContingentLogistics(programId: string): ContingentLogistics {
    if (!currentState.contingentLogistics) currentState.contingentLogistics = [];
    let log = currentState.contingentLogistics.find((l) => l.programId === programId);
    if (!log) {
      log = {
        id: `clog-${programId}`,
        programId,
        headOfContingent: undefined,
        deputyHead: undefined,
        officers: [],
        vehicles: [],
        travel: {
          departureDate: '2026-09-15',
          departureTime: '08:00',
          departureLocation: 'Pusat Islam KPM Bandar Penawar',
          destinationVenue: 'Belum ditetapkan',
          returnDate: '2026-09-18',
          returnTime: '17:00',
          assemblyPoint: 'Dataran Perdana KPMBP',
        },
        accommodation: {
          hotelName: 'Belum ditetapkan',
          address: 'Belum ditetapkan',
          checkInDate: '2026-09-15',
          checkOutDate: '2026-09-18',
          roomAllocationNotes: 'Pengasingan bilik kontinjen mengikut jantina dan senarai rasmi.',
        },
        welfare: {
          mealArrangements: 'Sarapan dan Makan Malam di Hotel; Makan Tengahari di Venue Pertandingan',
          firstAidOfficer: 'Belum ditetapkan',
          medicalKitReady: false,
          specialDietNotes: '',
          emergencyHospital: 'Belum ditetapkan',
        },
        equipmentCargoNotes: 'Peralatan muzik, prop pentas dan busana dikumpulkan 1 hari sebelum bertolak.',
        updatedAt: new Date().toISOString(),
      };
      currentState.contingentLogistics.push(log);
      saveState();
    }
    return log;
  },

  updateContingentLogistics(programId: string, updates: Partial<ContingentLogistics>): ContingentLogistics {
    const current = this.getContingentLogistics(programId);
    if (updates.headOfContingent !== undefined) current.headOfContingent = updates.headOfContingent;
    if (updates.deputyHead !== undefined) current.deputyHead = updates.deputyHead;
    if (updates.officers !== undefined) current.officers = updates.officers;
    if (updates.vehicles !== undefined) current.vehicles = updates.vehicles;
    if (updates.travel !== undefined) current.travel = { ...current.travel, ...updates.travel };
    if (updates.accommodation !== undefined) current.accommodation = { ...current.accommodation, ...updates.accommodation };
    if (updates.welfare !== undefined) current.welfare = { ...current.welfare, ...updates.welfare };
    if (updates.equipmentCargoNotes !== undefined) current.equipmentCargoNotes = updates.equipmentCargoNotes;
    current.updatedAt = new Date().toISOString();

    this.addActivityLog({
      action: 'Kemaskini Logistik Kontinjen',
      entityType: 'PROGRAM',
      entityId: programId,
      entityName: 'Logistik & Pegawai',
      details: 'Maklumat logistik, kenderaan dan pegawai kontinjen dikemaskini.',
    });

    saveState();
    return current;
  },

  get5DReadiness(eventId: string): CompetitionReadiness {
    if (!currentState.competitionReadiness) currentState.competitionReadiness = [];
    const manualOverride = currentState.competitionReadiness.find((r) => r.eventId === eventId);

    // Calculate dynamic base from real data
    let targetUnit: ProgramUnit | undefined = undefined;
    for (const p of currentState.programs) {
      const u = p.units?.find((unit) => unit.id === eventId);
      if (u) {
        targetUnit = u;
        break;
      }
    }

    const memberships = (currentState.eventMemberships || []).filter((m) => m.eventId === eventId);
    const sessions = (currentState.trainingSessions || []).filter((s) => s.eventId === eventId);
    const eventConfig = (currentState.competitionEventConfigs || []).find((c) => c.programUnitId === eventId);

    // 1. Dimension: Participants
    const selectedCount = memberships.filter(
      (m) => m.selectionStatus === 'SELECTED' || m.role === 'MAIN_PARTICIPANT'
    ).length;
    const quotaMain = eventConfig?.quotaMain || 1;
    let participantsLevel: ReadinessLevel = 'NOT_READY';
    if (selectedCount >= quotaMain && (targetUnit?.leaderId || eventConfig?.picPersonId)) {
      participantsLevel = 'READY';
    } else if (memberships.length > 0) {
      participantsLevel = 'NEAR_READY';
    }

    // 2. Dimension: Training
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    let trainingLevel: ReadinessLevel = 'NOT_READY';
    if (completedSessions >= 2 || sessions.length >= 3) {
      trainingLevel = 'READY';
    } else if (sessions.length >= 1) {
      trainingLevel = 'NEAR_READY';
    }

    // 3. Dimension: Performance
    const progress = targetUnit?.progress || 0;
    let performanceLevel: ReadinessLevel = 'NOT_READY';
    if (progress >= 80) {
      performanceLevel = 'READY';
    } else if (progress >= 45) {
      performanceLevel = 'NEAR_READY';
    }

    // 4. Dimension: Technical
    const reqs = targetUnit?.requirements || [];
    const techReqs = reqs.filter(
      (r) =>
        r.title.toLowerCase().includes('audio') ||
        r.title.toLowerCase().includes('props') ||
        r.title.toLowerCase().includes('teknikal') ||
        r.title.toLowerCase().includes('kostum') ||
        r.title.toLowerCase().includes('skrip') ||
        r.title.toLowerCase().includes('arrangement')
    );
    const completedTech = techReqs.filter((r) => r.status === 'COMPLETED').length;
    let technicalLevel: ReadinessLevel = 'NOT_READY';
    if (techReqs.length > 0 && completedTech === techReqs.length) {
      technicalLevel = 'READY';
    } else if (progress >= 60 || completedTech >= 1) {
      technicalLevel = 'NEAR_READY';
    }

    // 5. Dimension: Compliance
    const hasOpenAssistance = targetUnit?.assistanceStatus === 'OPEN';
    const hasActionRequired = reqs.some((r) => r.status === 'ACTION_REQUIRED');
    let complianceLevel: ReadinessLevel = 'READY';
    if (hasOpenAssistance || hasActionRequired) {
      complianceLevel = 'NOT_READY';
    } else if (progress < 50) {
      complianceLevel = 'NEAR_READY';
    }

    // Overall Calculation (Simple by default)
    const levels = [
      manualOverride?.participants || participantsLevel,
      manualOverride?.training || trainingLevel,
      manualOverride?.performance || performanceLevel,
      manualOverride?.technical || technicalLevel,
      manualOverride?.compliance || complianceLevel,
    ];
    const readyCount = levels.filter((l) => l === 'READY').length;
    const notReadyCount = levels.filter((l) => l === 'NOT_READY').length;

    let overallLevel: ReadinessLevel = 'NEAR_READY';
    if (readyCount >= 4 && notReadyCount === 0) {
      overallLevel = 'READY';
    } else if (notReadyCount >= 2) {
      overallLevel = 'NOT_READY';
    }

    return {
      id: manualOverride?.id || `cr-${eventId}`,
      eventId,
      participants: manualOverride?.participants || participantsLevel,
      training: manualOverride?.training || trainingLevel,
      performance: manualOverride?.performance || performanceLevel,
      technical: manualOverride?.technical || technicalLevel,
      compliance: manualOverride?.compliance || complianceLevel,
      overall: manualOverride?.overall || overallLevel,
      notes: manualOverride?.notes || '',
      updatedAt: manualOverride?.updatedAt || new Date().toISOString(),
    };
  },

  update5DReadiness(eventId: string, updates: Partial<CompetitionReadiness>): CompetitionReadiness {
    if (!currentState.competitionReadiness) currentState.competitionReadiness = [];
    let existing = currentState.competitionReadiness.find((r) => r.eventId === eventId);
    const now = new Date().toISOString();

    if (existing) {
      Object.assign(existing, updates);
      existing.updatedAt = now;
    } else {
      const currentDynamic = this.get5DReadiness(eventId);
      existing = {
        ...currentDynamic,
        ...updates,
        id: `cr-${eventId}`,
        eventId,
        updatedAt: now,
      };
      currentState.competitionReadiness.push(existing);
    }

    this.addActivityLog({
      action: 'Kemaskini 5D Readiness',
      entityType: 'UNIT',
      entityId: eventId,
      entityName: 'Penilaian Kesiapsiagaan',
      details: `Penilaian 5 dimensi dikemaskini. Overall: [${existing.overall}].`,
    });

    saveState();
    return existing;
  },

  getContingentOverall5D(programId: string): {
    overall: ReadinessLevel;
    participants: ReadinessLevel;
    training: ReadinessLevel;
    performance: ReadinessLevel;
    technical: ReadinessLevel;
    compliance: ReadinessLevel;
    readyEventsCount: number;
    totalEventsCount: number;
  } {
    const prog = currentState.programs.find((p) => p.id === programId) || currentState.programs[0];
    const units = prog?.units || [];

    if (units.length === 0) {
      return {
        overall: 'NOT_READY',
        participants: 'NOT_READY',
        training: 'NOT_READY',
        performance: 'NOT_READY',
        technical: 'NOT_READY',
        compliance: 'NOT_READY',
        readyEventsCount: 0,
        totalEventsCount: 0,
      };
    }

    const event5DList = units.map((u) => this.get5DReadiness(u.id));
    const countLevel = (dim: keyof Pick<CompetitionReadiness, 'participants' | 'training' | 'performance' | 'technical' | 'compliance' | 'overall'>) => {
      const readies = event5DList.filter((e) => e[dim] === 'READY').length;
      const notReadies = event5DList.filter((e) => e[dim] === 'NOT_READY').length;
      if (readies >= Math.ceil(units.length * 0.7) && notReadies === 0) return 'READY';
      if (notReadies >= 2) return 'NOT_READY';
      return 'NEAR_READY';
    };

    const readyEvents = event5DList.filter((e) => e.overall === 'READY').length;
    const notReadyEvents = event5DList.filter((e) => e.overall === 'NOT_READY').length;

    let overall: ReadinessLevel = 'NEAR_READY';
    if (readyEvents === units.length) overall = 'READY';
    else if (notReadyEvents >= 2) overall = 'NOT_READY';

    return {
      overall,
      participants: countLevel('participants'),
      training: countLevel('training'),
      performance: countLevel('performance'),
      technical: countLevel('technical'),
      compliance: countLevel('compliance'),
      readyEventsCount: readyEvents,
      totalEventsCount: units.length,
    };
  },

  resetToDefaultSeed() {
    currentState = {
      categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
      templates: JSON.parse(JSON.stringify(INITIAL_TEMPLATES)),
      programs: JSON.parse(JSON.stringify(INITIAL_PROGRAMS)),
      people: [],
      updates: JSON.parse(JSON.stringify(INITIAL_UPDATES)),
      logs: JSON.parse(JSON.stringify(INITIAL_LOGS)),
      participantProfiles: [],
      eventMemberships: [],
      trainingSessions: [],
      trainingAttendanceLogs: [],
      competitionEventConfigs: [],
      competitionReadiness: [],
      contingentLogistics: [],
      authSession: {
        role: 'ADMIN',
        person: INITIAL_ADMIN_PROFILE,
        programId: 'prog-theatre-2026',
        isMasterUnlocked: false,
      },
      selectedProgramId: 'prog-theatre-2026',
    };
    saveState();
  },

  resetToInitialSeed() {
    this.resetToDefaultSeed();
  },

  exportJSONBackup(): string {
    return JSON.stringify(currentState, null, 2);
  },

  importJSONBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.categories && parsed.templates && parsed.programs) {
        const peopleList = (parsed.people || []).filter((p: Person) => p.role !== 'ADMIN');

        currentState = {
          categories: parsed.categories,
          templates: parsed.templates,
          programs: parsed.programs,
          people: peopleList,
          updates: parsed.updates || [],
          logs: parsed.logs || [],
          participantProfiles: parsed.participantProfiles || [],
          eventMemberships: parsed.eventMemberships || [],
          trainingSessions: parsed.trainingSessions || [],
          trainingAttendanceLogs: parsed.trainingAttendanceLogs || [],
          competitionEventConfigs: parsed.competitionEventConfigs || [],
          competitionReadiness: parsed.competitionReadiness || [],
          contingentLogistics: parsed.contingentLogistics || [],
          authSession: {
            role: 'ADMIN',
            person: INITIAL_ADMIN_PROFILE,
            programId: parsed.programs[0]?.id || 'prog-theatre-2026',
            isMasterUnlocked: false,
          },
          selectedProgramId: parsed.selectedProgramId || parsed.programs[0]?.id || 'prog-theatre-2026',
        };
        saveState();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },
};
