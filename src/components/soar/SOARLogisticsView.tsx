import React, { useState } from 'react';
import {
  Program,
  Person,
  ContingentLogistics,
  ContingentOfficer,
  ContingentVehicle,
} from '../../types';
import { secretariatStore } from '../../lib/storage';
import { formatDate } from '../../lib/utils';
import {
  Bus,
  UserCheck,
  MapPin,
  Calendar,
  Clock,
  HeartPulse,
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Shield,
  Home,
  Truck,
  FileText,
  Utensils,
  Car,
} from 'lucide-react';

interface SOARLogisticsViewProps {
  program: Program;
  people: Person[];
  onBackToDashboard?: () => void;
}

export const SOARLogisticsView: React.FC<SOARLogisticsViewProps> = ({
  program,
  people,
  onBackToDashboard,
}) => {
  const logistics = secretariatStore.getContingentLogistics(program.id);

  // Modals / Edit states
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<{
    target: 'HEAD' | 'DEPUTY' | 'LIST';
    officer?: ContingentOfficer;
    index?: number;
  } | null>(null);

  const [officerForm, setOfficerForm] = useState<{
    name: string;
    roleTitle: string;
    phone: string;
    icOrStaffNo: string;
  }>({
    name: '',
    roleTitle: 'Pegawai Pengiring',
    phone: '',
    icOrStaffNo: '',
  });

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Omit<ContingentVehicle, 'id'>>({
    type: 'BUS',
    plateNumber: '',
    capacity: 44,
    driverName: '',
    driverPhone: '',
    allocatedFor: 'Semua Peserta & Pegawai Kontinjen',
    status: 'CONFIRMED',
  });

  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  const [travelForm, setTravelForm] = useState(logistics.travel);

  const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
  const [accommodationForm, setAccommodationForm] = useState(logistics.accommodation);

  const [isWelfareModalOpen, setIsWelfareModalOpen] = useState(false);
  const [welfareForm, setWelfareForm] = useState(logistics.welfare);

  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [cargoNotes, setCargoNotes] = useState(logistics.equipmentCargoNotes || '');

  // --- Handlers for Officers ---
  const handleOpenAddOfficer = (target: 'HEAD' | 'DEPUTY' | 'LIST', existing?: ContingentOfficer, index?: number) => {
    setEditingOfficer({ target, officer: existing, index });
    if (existing) {
      setOfficerForm({
        name: existing.name,
        roleTitle: existing.roleTitle,
        phone: existing.phone,
        icOrStaffNo: existing.icOrStaffNo || '',
      });
    } else {
      setOfficerForm({
        name: '',
        roleTitle:
          target === 'HEAD'
            ? 'Ketua Kontinjen'
            : target === 'DEPUTY'
            ? 'Timbalan Ketua Kontinjen'
            : 'Pegawai Pengiring',
        phone: '',
        icOrStaffNo: '',
      });
    }
    setIsOfficerModalOpen(true);
  };

  const handleSaveOfficer = () => {
    if (!officerForm.name.trim()) return;

    const newOfficer: ContingentOfficer = {
      id: editingOfficer?.officer?.id || `off-${Date.now()}`,
      name: officerForm.name.trim(),
      roleTitle: officerForm.roleTitle.trim(),
      phone: officerForm.phone.trim(),
      icOrStaffNo: officerForm.icOrStaffNo.trim(),
    };

    if (editingOfficer?.target === 'HEAD') {
      secretariatStore.updateContingentLogistics(program.id, {
        headOfContingent: newOfficer,
      });
    } else if (editingOfficer?.target === 'DEPUTY') {
      secretariatStore.updateContingentLogistics(program.id, {
        deputyHead: newOfficer,
      });
    } else {
      const list = [...(logistics.officers || [])];
      if (editingOfficer?.index !== undefined && editingOfficer.index >= 0) {
        list[editingOfficer.index] = newOfficer;
      } else {
        list.push(newOfficer);
      }
      secretariatStore.updateContingentLogistics(program.id, {
        officers: list,
      });
    }

    setIsOfficerModalOpen(false);
    setEditingOfficer(null);
  };

  const handleDeleteOfficer = (index: number) => {
    const list = [...(logistics.officers || [])];
    list.splice(index, 1);
    secretariatStore.updateContingentLogistics(program.id, {
      officers: list,
    });
  };

  // --- Handlers for Vehicles ---
  const handleOpenAddVehicle = (existing?: ContingentVehicle, index?: number) => {
    if (existing && index !== undefined) {
      setEditingVehicleIndex(index);
      setVehicleForm({
        type: existing.type,
        plateNumber: existing.plateNumber,
        capacity: existing.capacity,
        driverName: existing.driverName || '',
        driverPhone: existing.driverPhone || '',
        allocatedFor: existing.allocatedFor || '',
        status: existing.status,
      });
    } else {
      setEditingVehicleIndex(null);
      setVehicleForm({
        type: 'BUS',
        plateNumber: '',
        capacity: 44,
        driverName: '',
        driverPhone: '',
        allocatedFor: 'Kontinjen Utama',
        status: 'CONFIRMED',
      });
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = () => {
    if (!vehicleForm.plateNumber.trim() && !vehicleForm.driverName?.trim()) return;

    const list = [...(logistics.vehicles || [])];
    const newVehicle: ContingentVehicle = {
      ...vehicleForm,
      id: editingVehicleIndex !== null ? list[editingVehicleIndex].id : `veh-${Date.now()}`,
    };

    if (editingVehicleIndex !== null) {
      list[editingVehicleIndex] = newVehicle;
    } else {
      list.push(newVehicle);
    }

    secretariatStore.updateContingentLogistics(program.id, { vehicles: list });
    setIsVehicleModalOpen(false);
  };

  const handleDeleteVehicle = (index: number) => {
    const list = [...(logistics.vehicles || [])];
    list.splice(index, 1);
    secretariatStore.updateContingentLogistics(program.id, { vehicles: list });
  };

  // --- Handlers for Travel, Accommodation, Welfare, Cargo ---
  const handleSaveTravel = () => {
    secretariatStore.updateContingentLogistics(program.id, { travel: travelForm });
    setIsTravelModalOpen(false);
  };

  const handleSaveAccommodation = () => {
    secretariatStore.updateContingentLogistics(program.id, {
      accommodation: accommodationForm,
    });
    setIsAccommodationModalOpen(false);
  };

  const handleSaveWelfare = () => {
    secretariatStore.updateContingentLogistics(program.id, { welfare: welfareForm });
    setIsWelfareModalOpen(false);
  };

  const handleSaveCargo = () => {
    secretariatStore.updateContingentLogistics(program.id, {
      equipmentCargoNotes: cargoNotes,
    });
    setIsCargoModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full min-w-0">
      {/* 🚌 Header Panel */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-widest font-mono">
                {program.code}
              </span>
              <span className="text-xs text-slate-400">
                Pusat Pengurusan Kontinjen
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Bus className="w-6 h-6 text-indigo-400" />
              <span>Logistik & Pegawai Kontinjen</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Pengurusan pegawai pengiring, kenderaan, perjalanan, penginapan, dan kebajikan bagi Kontinjen SOAR 2026 KPMBP.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 shrink-0">
            <div className="text-center px-2 border-r border-slate-700">
              <span className="block text-base sm:text-lg font-bold text-emerald-400 font-mono">
                {(logistics.headOfContingent ? 1 : 0) +
                  (logistics.deputyHead ? 1 : 0) +
                  (logistics.officers?.length || 0)}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Pegawai
              </span>
            </div>
            <div className="text-center px-2 border-r border-slate-700">
              <span className="block text-base sm:text-lg font-bold text-indigo-400 font-mono">
                {logistics.vehicles?.length || 0}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Kenderaan
              </span>
            </div>
            <div className="text-center px-2">
              <span className="block text-base sm:text-lg font-bold text-amber-400 font-mono">
                {logistics.welfare?.medicalKitReady ? 'SIAP' : 'SEMAKAN'}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Kit Kesihatan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Pegawai & Kepimpinan Kontinjen */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pegawai & Kepimpinan Kontinjen
            </h2>
          </div>
          <button
            onClick={() => handleOpenAddOfficer('LIST')}
            className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pegawai Pengiring</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. Ketua Kontinjen */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider">
                  Ketua Kontinjen
                </span>
                <button
                  onClick={() => handleOpenAddOfficer('HEAD', logistics.headOfContingent)}
                  className="p-1 rounded text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                  title="Kemaskini Ketua Kontinjen"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                {logistics.headOfContingent?.name || 'Belum ditetapkan'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{logistics.headOfContingent?.phone || 'Belum ditetapkan'}</span>
              </p>
              {logistics.headOfContingent?.icOrStaffNo && (
                <p className="text-[10px] text-slate-500 font-mono">
                  No. Staf/IC: {logistics.headOfContingent.icOrStaffNo}
                </p>
              )}
            </div>
          </div>

          {/* 2. Timbalan Ketua Kontinjen */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider">
                  Timbalan Ketua Kontinjen
                </span>
                <button
                  onClick={() => handleOpenAddOfficer('DEPUTY', logistics.deputyHead)}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Kemaskini Timbalan"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                {logistics.deputyHead?.name || 'Belum ditetapkan'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{logistics.deputyHead?.phone || 'Belum ditetapkan'}</span>
              </p>
              {logistics.deputyHead?.icOrStaffNo && (
                <p className="text-[10px] text-slate-500 font-mono">
                  No. Staf/IC: {logistics.deputyHead.icOrStaffNo}
                </p>
              )}
            </div>
          </div>

          {/* 3. Senarai Pegawai Pengiring / Lain-lain */}
          {(logistics.officers || []).map((officer, idx) => (
            <div
              key={officer.id || idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider">
                    {officer.roleTitle || 'Pegawai Pengiring'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAddOfficer('LIST', officer, idx)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Kemaskini"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOfficer(idx)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Padam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                  {officer.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{officer.phone || 'Belum ditetapkan'}</span>
                </p>
                {officer.icOrStaffNo && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    No. Staf/IC: {officer.icOrStaffNo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Pengangkutan & Kenderaan */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pengangkutan, Kenderaan & Pemandu
            </h2>
          </div>
          <button
            onClick={() => handleOpenAddVehicle()}
            className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kenderaan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(logistics.vehicles || []).map((veh, idx) => (
            <div
              key={veh.id || idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold uppercase font-mono">
                      {veh.type} • {veh.capacity} Penumpang
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        veh.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {veh.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAddVehicle(veh, idx)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Kemaskini Kenderaan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(idx)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Padam Kenderaan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-mono">
                    {veh.plateNumber || 'Belum ditetapkan'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kegunaan: {veh.allocatedFor || 'Kontinjen'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 text-[11px]">Pemandu:</span>
                    <span className="font-semibold">{veh.driverName || 'Belum ditetapkan'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 text-[11px]">No. Telefon:</span>
                    <span className="font-mono">{veh.driverPhone || 'Belum ditetapkan'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!logistics.vehicles || logistics.vehicles.length === 0) && (
            <div className="col-span-full p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <Bus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Tiada kenderaan berdaftar. Klik &quot;Tambah Kenderaan&quot; untuk memasukkan maklumat bas, van atau kereta rasmi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: 2 Kolum (Perjalanan & Penginapan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolum 1: Maklumat Perjalanan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Maklumat Perjalanan & Pergerakan
              </h3>
            </div>
            <button
              onClick={() => {
                setTravelForm(logistics.travel);
                setIsTravelModalOpen(true);
              }}
              className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              title="Kemaskini Perjalanan"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Tarikh & Masa Bertolak:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {logistics.travel?.departureDate ? formatDate(logistics.travel.departureDate) : 'Belum ditetapkan'}{' '}
                {logistics.travel?.departureTime && `(${logistics.travel.departureTime})`}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Lokasi Bertolak:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {logistics.travel?.departureLocation || 'Belum ditetapkan'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Titik Berkumpul:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {logistics.travel?.assemblyPoint || 'Belum ditetapkan'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Destinasi / Venue:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {logistics.travel?.destinationVenue || program.venue || 'Belum ditetapkan'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Tarikh & Masa Pulang:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {logistics.travel?.returnDate ? formatDate(logistics.travel.returnDate) : 'Belum ditetapkan'}{' '}
                {logistics.travel?.returnTime && `(${logistics.travel.returnTime})`}
              </span>
            </div>
          </div>
        </div>

        {/* Kolum 2: Maklumat Penginapan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Penginapan Kontinjen
              </h3>
            </div>
            <button
              onClick={() => {
                setAccommodationForm(logistics.accommodation);
                setIsAccommodationModalOpen(true);
              }}
              className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              title="Kemaskini Penginapan"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Nama Hotel / Asrama:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {logistics.accommodation?.hotelName || 'Belum ditetapkan'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Alamat:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-xs truncate">
                {logistics.accommodation?.address || 'Belum ditetapkan'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Tempoh Penginapan:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {logistics.accommodation?.checkInDate
                  ? formatDate(logistics.accommodation.checkInDate)
                  : 'Belum ditetapkan'}{' '}
                -{' '}
                {logistics.accommodation?.checkOutDate
                  ? formatDate(logistics.accommodation.checkOutDate)
                  : 'Belum ditetapkan'}
              </span>
            </div>

            <div className="py-1">
              <span className="text-slate-400 block mb-1">Catatan & Agihan Bilik:</span>
              <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                {logistics.accommodation?.roomAllocationNotes || 'Belum ditetapkan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Kolum (Kebajikan/Kesihatan & Catatan Kargo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kebajikan & Kesihatan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Kebajikan, Makanan & Kesihatan
              </h3>
            </div>
            <button
              onClick={() => {
                setWelfareForm(logistics.welfare);
                setIsWelfareModalOpen(true);
              }}
              className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              title="Kemaskini Kebajikan"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Penyediaan Sajian Makanan:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {logistics.welfare?.mealArrangements || 'Belum ditetapkan'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Pegawai First Aid:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {logistics.welfare?.firstAidOfficer || 'Belum ditetapkan'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Status Kit Perubatan:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  logistics.welfare?.medicalKitReady ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {logistics.welfare?.medicalKitReady ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lengkap & Sedia</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Belum Lengkap</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Hospital / Klinik Rujukan:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {logistics.welfare?.emergencyHospital || 'Belum ditetapkan'}
              </span>
            </div>
          </div>
        </div>

        {/* Catatan Kargo & Props */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Kargo Alatan, Props & Busana
              </h3>
            </div>
            <button
              onClick={() => {
                setCargoNotes(logistics.equipmentCargoNotes || '');
                setIsCargoModalOpen(true);
              }}
              className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              title="Kemaskini Catatan Kargo"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs space-y-2">
            <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg leading-relaxed min-h-[80px]">
              {logistics.equipmentCargoNotes || 'Belum ada catatan kargo atau susun atur peralatan khas.'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Dikemaskini: {formatDate(logistics.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Modal: Edit Pegawai */}
      {isOfficerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingOfficer?.target === 'HEAD'
                  ? 'Ketua Kontinjen'
                  : editingOfficer?.target === 'DEPUTY'
                  ? 'Timbalan Ketua Kontinjen'
                  : 'Maklumat Pegawai Pengiring'}
              </h3>
              <button
                onClick={() => setIsOfficerModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penuh
                </label>
                <input
                  type="text"
                  value={officerForm.name}
                  onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  placeholder="cth: Ustaz Ahmad bin Ismail"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jawatan / Gelaran
                </label>
                <input
                  type="text"
                  value={officerForm.roleTitle}
                  onChange={(e) => setOfficerForm({ ...officerForm, roleTitle: e.target.value })}
                  placeholder="cth: Pegawai Pengiring / Guru Penasihat"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Telefon / WhatsApp
                </label>
                <input
                  type="text"
                  value={officerForm.phone}
                  onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })}
                  placeholder="cth: 019-8765432"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Staf / No. Kad Pengenalan
                </label>
                <input
                  type="text"
                  value={officerForm.icOrStaffNo}
                  onChange={(e) => setOfficerForm({ ...officerForm, icOrStaffNo: e.target.value })}
                  placeholder="cth: STF-1029 / 820101-01-1234"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsOfficerModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveOfficer}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Simpan Pegawai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Kenderaan */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingVehicleIndex !== null ? 'Kemaskini Kenderaan' : 'Daftar Kenderaan Kontinjen'}
              </h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kenderaan
                  </label>
                  <select
                    value={vehicleForm.type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="BUS">Bas Kontinjen (44 Seat)</option>
                    <option value="VAN">Van / Coaster (14-18 Seat)</option>
                    <option value="CAR">Kereta Rasmi</option>
                    <option value="LORRY">Lori / Kargo Props</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kapasiti Penumpang
                  </label>
                  <input
                    type="number"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombor Pendaftaran Plat
                </label>
                <input
                  type="text"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                  placeholder="cth: JRA 8892"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pemandu
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.driverName}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                    placeholder="cth: Encik Ramli"
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Telefon Pemandu
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.driverPhone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                    placeholder="cth: 012-3456789"
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peruntukan Khas
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.allocatedFor}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, allocatedFor: e.target.value })}
                    placeholder="cth: Pasukan Teater & Zapin"
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kenderaan
                  </label>
                  <select
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="CONFIRMED">CONFIRMED (Disahkan)</option>
                    <option value="ARRANGED">ARRANGED (Dalam Susunan)</option>
                    <option value="PENDING">PENDING (Menunggu Kelulusan)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveVehicle}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Simpan Kenderaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Perjalanan */}
      {isTravelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Kemaskini Maklumat Perjalanan
              </h3>
              <button
                onClick={() => setIsTravelModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh Bertolak
                  </label>
                  <input
                    type="date"
                    value={travelForm.departureDate || ''}
                    onChange={(e) => setTravelForm({ ...travelForm, departureDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Masa Bertolak
                  </label>
                  <input
                    type="time"
                    value={travelForm.departureTime || ''}
                    onChange={(e) => setTravelForm({ ...travelForm, departureTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lokasi Bertolak
                </label>
                <input
                  type="text"
                  value={travelForm.departureLocation || ''}
                  onChange={(e) => setTravelForm({ ...travelForm, departureLocation: e.target.value })}
                  placeholder="cth: Pusat Islam KPM Bandar Penawar"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Titik Berkumpul (Assembly Point)
                </label>
                <input
                  type="text"
                  value={travelForm.assemblyPoint || ''}
                  onChange={(e) => setTravelForm({ ...travelForm, assemblyPoint: e.target.value })}
                  placeholder="cth: Dataran Perdana KPMBP"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destinasi / Venue Pertandingan
                </label>
                <input
                  type="text"
                  value={travelForm.destinationVenue || ''}
                  onChange={(e) => setTravelForm({ ...travelForm, destinationVenue: e.target.value })}
                  placeholder="cth: Dewan Canselor / Kompleks Sukan & Kesenian"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh Pulang
                  </label>
                  <input
                    type="date"
                    value={travelForm.returnDate || ''}
                    onChange={(e) => setTravelForm({ ...travelForm, returnDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Masa Pulang
                  </label>
                  <input
                    type="time"
                    value={travelForm.returnTime || ''}
                    onChange={(e) => setTravelForm({ ...travelForm, returnTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsTravelModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTravel}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Simpan Perjalanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Penginapan */}
      {isAccommodationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Kemaskini Penginapan Kontinjen
              </h3>
              <button
                onClick={() => setIsAccommodationModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Hotel / Asrama
                </label>
                <input
                  type="text"
                  value={accommodationForm.hotelName || ''}
                  onChange={(e) => setAccommodationForm({ ...accommodationForm, hotelName: e.target.value })}
                  placeholder="cth: Hotel Seri Malaysia / Kolej Kediaman"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Penuh
                </label>
                <textarea
                  rows={2}
                  value={accommodationForm.address || ''}
                  onChange={(e) => setAccommodationForm({ ...accommodationForm, address: e.target.value })}
                  placeholder="Alamat hotel / lokasi penginapan rasmi"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh Check-in
                  </label>
                  <input
                    type="date"
                    value={accommodationForm.checkInDate || ''}
                    onChange={(e) => setAccommodationForm({ ...accommodationForm, checkInDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh Check-out
                  </label>
                  <input
                    type="date"
                    value={accommodationForm.checkOutDate || ''}
                    onChange={(e) => setAccommodationForm({ ...accommodationForm, checkOutDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan & Agihan Bilik
                </label>
                <textarea
                  rows={3}
                  value={accommodationForm.roomAllocationNotes || ''}
                  onChange={(e) =>
                    setAccommodationForm({ ...accommodationForm, roomAllocationNotes: e.target.value })
                  }
                  placeholder="cth: Bilik Aras 2 (Lelaki), Bilik Aras 3 (Perempuan), Bilik Jurulatih/Pegawai..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsAccommodationModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAccommodation}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Simpan Penginapan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Kebajikan & Kesihatan */}
      {isWelfareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Kebajikan, Makanan & Kesihatan
              </h3>
              <button
                onClick={() => setIsWelfareModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Penyediaan Makanan & Minuman
                </label>
                <input
                  type="text"
                  value={welfareForm.mealArrangements || ''}
                  onChange={(e) => setWelfareForm({ ...welfareForm, mealArrangements: e.target.value })}
                  placeholder="cth: Sarapan Hotel; Makan Tengahari di Venue Pertandingan"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pegawai First Aid Bertugas
                </label>
                <input
                  type="text"
                  value={welfareForm.firstAidOfficer || ''}
                  onChange={(e) => setWelfareForm({ ...welfareForm, firstAidOfficer: e.target.value })}
                  placeholder="cth: Ustazah Fatimah / Pegawai Kesihatan KPMBP"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Kit Perubatan Cemas Lengkap?
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Mempunyai ubat asas, plaster, pembalut, spray otot dsb.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={welfareForm.medicalKitReady}
                  onChange={(e) => setWelfareForm({ ...welfareForm, medicalKitReady: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hospital / Pusat Kesihatan Kecemasan
                </label>
                <input
                  type="text"
                  value={welfareForm.emergencyHospital || ''}
                  onChange={(e) => setWelfareForm({ ...welfareForm, emergencyHospital: e.target.value })}
                  placeholder="cth: Hospital Kota Tinggi / Klinik Kesihatan Penawar"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsWelfareModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveWelfare}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Simpan Kebajikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Catatan Kargo */}
      {isCargoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Catatan Kargo, Props & Busana
              </h3>
              <button
                onClick={() => setIsCargoModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Arahan Pengangkutan Alatan Muzik / Props
                </label>
                <textarea
                  rows={5}
                  value={cargoNotes}
                  onChange={(e) => setCargoNotes(e.target.value)}
                  placeholder="Senaraikan instrumen (drum, amp, keyboard, props teater) yang perlu dimasukkan ke van logistik..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsCargoModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCargo}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
