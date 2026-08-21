// Status Pemilihan Bakat / Pipeline
export type SelectionStatus =
  | 'TALENT_POOL'
  | 'AUDITION'
  | 'SHORTLISTED'
  | 'SELECTED'
  | 'RESERVE'
  | 'WITHDRAWN';

// Peranan Dalam Skuad Pertandingan (Event / Squad Level)
export type CompetitionRole =
  | 'MAIN_PARTICIPANT'
  | 'RESERVE_PARTICIPANT'
  | 'COACH'
  | 'PIC'
  | 'CREW';

// Status Kesediaan Tiga Tahap Asas (Simple by Default)
export type ReadinessLevel = 'READY' | 'NEAR_READY' | 'NOT_READY';

// Profil Penyertaan Peserta (Terpisah daripada Person asas)
export interface ParticipantProfile {
  id: string;
  personId: string; // Hubungan 1-ke-1 ke Person.id
  talentSkills: string[];
  experienceNotes?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

// Keanggotaan Peserta Dalam Acara / Pasukan
export interface EventMembership {
  id: string;
  participantProfileId: string; // Hubungan ke ParticipantProfile.id
  personId: string;             // Hubungan terus ke Person.id untuk kemudahan carian
  eventId: string;              // Hubungan ke ProgramUnit.id (Acara)
  role: CompetitionRole;
  selectionStatus: SelectionStatus;
  joinedAt: string;
  remarks?: string;
}

// Sesi Latihan Pasukan Acara
export interface TrainingSession {
  id: string;
  programId: string;            // Hubungan ke Program.id
  eventId: string;              // Hubungan ke ProgramUnit.id (Acara)
  date: string;                 // Format YYYY-MM-DD
  startTime: string;            // Format HH:mm
  endTime: string;              // Format HH:mm
  venue: string;
  focusArea: string;
  coachNotes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

// Log Kehadiran Latihan Individu
export interface TrainingAttendanceLog {
  id: string;
  trainingSessionId: string;    // Hubungan ke TrainingSession.id
  eventMembershipId: string;    // Hubungan ke EventMembership.id
  personId: string;             // Hubungan ke Person.id
  isPresent: boolean;
  remarks?: string;
}

// Konfigurasi Acara Pertandingan (Generic, extensible)
export interface CompetitionEventConfig {
  id: string;
  programUnitId: string;        // Hubungan ke ProgramUnit.id
  categoryName?: string;
  quotaMain: number;
  quotaReserve: number;
  coachPersonId?: string;
  picPersonId?: string;
  competitionDate?: string;
  submissionDeadline?: string;
  rulesDocUrl?: string;
}

// Status Kesediaan 5 Dimensi Acara (Tiada Weighting Rumit)
export interface CompetitionReadiness {
  id: string;
  eventId: string;              // Hubungan ke ProgramUnit.id (Acara)
  participants: ReadinessLevel;
  training: ReadinessLevel;
  performance: ReadinessLevel;
  technical: ReadinessLevel;
  compliance: ReadinessLevel;
  overall: ReadinessLevel;
  notes?: string;
  updatedAt: string;
}

// Perjawatan & Pegawai Kontinjen
export interface ContingentOfficer {
  id: string;
  personId?: string;
  name: string;
  roleTitle: string; // 'Ketua Kontinjen' | 'Timbalan Ketua Kontinjen' | 'Pegawai Pengiring' | 'Pegawai Kebajikan' | 'Pegawai Media'
  phone: string;
  icOrStaffNo?: string;
}

// Kenderaan & Pengangkutan Kontinjen
export interface ContingentVehicle {
  id: string;
  type: 'BUS' | 'VAN' | 'CAR' | 'LORRY';
  plateNumber: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  allocatedFor?: string;
  status: 'CONFIRMED' | 'PENDING' | 'ARRANGED';
}

// Butiran Perjalanan
export interface TravelDetails {
  departureDate?: string;
  departureTime?: string;
  departureLocation?: string;
  destinationVenue?: string;
  returnDate?: string;
  returnTime?: string;
  assemblyPoint?: string;
}

// Butiran Penginapan
export interface AccommodationDetails {
  hotelName?: string;
  address?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomAllocationNotes?: string;
}

// Kebajikan & Kesihatan Kontinjen
export interface ContingentWelfare {
  mealArrangements?: string;
  firstAidOfficer?: string;
  medicalKitReady: boolean;
  specialDietNotes?: string;
  emergencyHospital?: string;
}

// Entiti Lengkap Logistik Kontinjen
export interface ContingentLogistics {
  id: string;
  programId: string;
  headOfContingent?: ContingentOfficer;
  deputyHead?: ContingentOfficer;
  officers: ContingentOfficer[];
  vehicles: ContingentVehicle[];
  travel: TravelDetails;
  accommodation: AccommodationDetails;
  welfare: ContingentWelfare;
  equipmentCargoNotes?: string;
  updatedAt: string;
}

