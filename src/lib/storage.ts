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

interface AppState {
  categories: MainCategory[];
  templates: ProgramTemplate[];
  programs: Program[];
  people: Person[];
  updates: UnitUpdate[];
  logs: ActivityLog[];
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
          authSession: {
            role: 'ADMIN',
            person: adminPerson,
            programId: programs[0]?.id || 'prog-theatre-2026',
            isMasterUnlocked: false,
          },
          selectedProgramId: parsed.selectedProgramId || programs[0]?.id || 'prog-theatre-2026',
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
    authSession: {
      role: 'ADMIN',
      person: INITIAL_ADMIN_PROFILE,
      programId: 'prog-theatre-2026',
      isMasterUnlocked: false,
    },
    selectedProgramId: 'prog-theatre-2026',
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
      userName: user?.fullName || 'Sistem Syncrozz',
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

  resetToDefaultSeed() {
    currentState = {
      categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
      templates: JSON.parse(JSON.stringify(INITIAL_TEMPLATES)),
      programs: JSON.parse(JSON.stringify(INITIAL_PROGRAMS)),
      people: [],
      updates: JSON.parse(JSON.stringify(INITIAL_UPDATES)),
      logs: JSON.parse(JSON.stringify(INITIAL_LOGS)),
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
